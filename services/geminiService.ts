import { GoogleGenAI, Modality } from '@google/genai';
import { type GenerationOptions, type GeneratedImage, Pose, ShotType, Background, Lighting, LogoConfiguration, TextConfiguration, ProductCategory, ModelAttributes, CatalogAnalysis } from '../types';

const MAX_IMAGE_DIMENSION = 1536;

const ALLOWED_ASPECT_RATIOS = [
    '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'
];

const getClosestAspectRatio = (inputRatio: string | undefined | null): string => {
    if (!inputRatio) return '1:1';
    if (ALLOWED_ASPECT_RATIOS.includes(inputRatio)) return inputRatio;
    const parts = inputRatio.split(':').map(Number);
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1]) || parts[1] === 0) return '1:1';
    const targetDecimal = parts[0] / parts[1];
    let closestRatio = '1:1';
    let minDiff = Number.MAX_VALUE;
    for (const ratioStr of ALLOWED_ASPECT_RATIOS) {
        const [w, h] = ratioStr.split(':').map(Number);
        const currentDecimal = w / h;
        const diff = Math.abs(targetDecimal - currentDecimal);
        if (diff < minDiff) {
            closestRatio = ratioStr;
            minDiff = diff;
        }
    }
    return closestRatio;
};

const processImageToJpeg = (imageSource: string): Promise<{ mimeType: string; data: string }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
                if (width > height) {
                    height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
                    width = MAX_IMAGE_DIMENSION;
                } else {
                    width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
                    height = MAX_IMAGE_DIMENSION;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error("Canvas context creation failed")); return; }
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            const [header, data] = dataUrl.split(',');
            const mimeType = header?.match(/:(.*?);/)?.[1] || 'image/jpeg';
            resolve({ mimeType, data });
        };
        img.onerror = () => reject(new Error("Failed to load image for processing."));
        img.src = imageSource;
    });
};

const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      try {
          const processed = await processImageToJpeg(result);
          resolve(processed);
      } catch (e) { reject(e); }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const urlToBase64 = async (url: string): Promise<{ mimeType: string; data: string } | null> => {
    if (!url) return null;
    if (url.startsWith('data:')) {
        try { return await processImageToJpeg(url); } catch (e) { return null; }
    }
    try {
        const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        const blob = await response.blob();
        const readerPromise = new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        const base64Data = await readerPromise;
        return await processImageToJpeg(base64Data);
    } catch (e) {
        try { return await processImageToJpeg(url); } catch (fallbackError) { return null; }
    }
};

const applyLogoOverlay = async (base64Image: string, logoConfig: LogoConfiguration): Promise<string> => {
    if (!logoConfig || !logoConfig.imageUrl) return base64Image;
    try {
        const mainImage = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load image."));
            img.src = base64Image;
        });
        const logoImage = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load logo."));
            img.src = logoConfig.imageUrl;
        });
        const canvas = document.createElement('canvas');
        canvas.width = mainImage.width;
        canvas.height = mainImage.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return base64Image;
        ctx.drawImage(mainImage, 0, 0);
        const scale = (logoConfig.scale || 20) / 100;
        const logoTargetWidth = canvas.width * scale;
        const logoAspectRatio = logoImage.height / logoImage.width;
        const logoTargetHeight = logoTargetWidth * logoAspectRatio;
        const padding = canvas.width * 0.05; 
        let x = 0, y = 0;
        switch (logoConfig.position) {
            case 'Top Left': x = padding; y = padding; break;
            case 'Top Right': x = canvas.width - logoTargetWidth - padding; y = padding; break;
            case 'Bottom Left': x = padding; y = canvas.height - logoTargetHeight - padding; break;
            case 'Bottom Right': x = canvas.width - logoTargetWidth - padding; y = padding; break;
            case 'Center': x = (canvas.width - logoTargetWidth) / 2; y = (canvas.height - logoTargetHeight) / 2; break;
        }
        ctx.globalAlpha = (logoConfig.opacity || 100) / 100;
        ctx.drawImage(logoImage, x, y, logoTargetWidth, logoTargetHeight);
        return canvas.toDataURL('image/jpeg', 0.95);
    } catch (e) { return base64Image; }
};

const applyTextOverlay = async (base64Image: string, textConfig: TextConfiguration): Promise<string> => {
    if (!textConfig || !textConfig.textContent) return base64Image;
    try {
        const mainImage = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load image."));
            img.src = base64Image;
        });
        const canvas = document.createElement('canvas');
        canvas.width = mainImage.width;
        canvas.height = mainImage.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return base64Image;
        ctx.drawImage(mainImage, 0, 0);
        const fontSize = Math.max(12, (canvas.height * (textConfig.fontSize || 5)) / 100);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = textConfig.color || '#ffffff';
        ctx.globalAlpha = (textConfig.opacity || 100) / 100;
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)"; ctx.shadowBlur = 4; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
        const padding = canvas.width * 0.05;
        let x = 0, y = 0;
        ctx.textBaseline = 'top';
        switch (textConfig.position) {
            case 'Top Left': x = padding; y = padding; ctx.textAlign = 'left'; break;
            case 'Top Right': x = canvas.width - padding; y = padding; ctx.textAlign = 'right'; break;
            case 'Top Center': x = canvas.width / 2; y = padding; ctx.textAlign = 'center'; break;
            case 'Bottom Left': x = padding; y = canvas.height - padding - fontSize; ctx.textAlign = 'left'; break;
            case 'Bottom Right': x = canvas.width - padding; y = canvas.height - padding - fontSize; ctx.textAlign = 'right'; break;
            case 'Bottom Center': x = canvas.width / 2; y = canvas.height - padding - fontSize; ctx.textAlign = 'center'; break;
            case 'Center': x = canvas.width / 2; y = (canvas.height - fontSize) / 2; ctx.textAlign = 'center'; break;
        }
        ctx.fillText(textConfig.textContent, x, y);
        return canvas.toDataURL('image/jpeg', 0.95);
    } catch (e) { return base64Image; }
};

const hexToColorName = (hex: string): string => {
  const colorMap: { [key: string]: string } = {
    '#FFFFFF': 'white', '#000000': 'black', '#808080': 'gray', '#D3D3D3': 'light gray',
    '#001F3F': 'navy blue', '#0074D9': 'royal blue', '#7FDBFF': 'light blue', '#87CEEB': 'sky blue',
    '#FF4136': 'red', '#85144B': 'maroon', '#FFC0CB': 'pink', '#FF69B4': 'hot pink',
    '#2ECC40': 'green', '#3D9970': 'olive', '#01FF70': 'lime', '#FFDC00': 'yellow',
    '#FF851B': 'orange', '#8B4513': 'brown', '#D2B48C': 'tan', '#F5F5DC': 'beige',
    '#FFFDD0': 'cream', '#B10DC9': 'purple', '#E6E6FA': 'lavender', '#800020': 'burgundy',
    '#C3B091': 'khaki', '#1560BD': 'denim blue'
  };
  return colorMap[hex.toUpperCase()] || hex;
};

const buildModelDescription = (attributes?: ModelAttributes): string => {
  if (!attributes) return "";
  const parts = [];
  if (attributes.ageRange) parts.push(`${attributes.ageRange} age range`);
  if (attributes.ethnicity) parts.push(attributes.ethnicity);
  if (attributes.bodyType) parts.push(`${attributes.bodyType} build`);
  if (attributes.skinTone) parts.push(`${attributes.skinTone} skin tone`);
  if (attributes.hairColor && attributes.hairStyle) {
    parts.push(`${attributes.hairColor} hair in ${attributes.hairStyle} style`);
  }
  if (attributes.facialHair && attributes.facialHair !== 'Clean Shaven') {
    parts.push(`with ${attributes.facialHair}`);
  }
  if (attributes.makeup && attributes.makeup !== 'No Makeup') {
    parts.push(`${attributes.makeup} makeup`);
  }
  return parts.join(', ');
};

export const analyzeProductLengthReference = async (imageBase64: string, productCategory: ProductCategory): Promise<CatalogAnalysis | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 } };
        
        const analysisPrompt = `Precision mapping: Identify EXACT vertical hem termination landmarks on human anatomy. 
        IGNORE COLOR AND DESIGN. Focus strictly on the Y-coordinate of the clothing bottom relative to joints (waist, hip, knee, ankle).`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [imagePart, { text: analysisPrompt }] }
        });

        if (!response.text) return null;
        let cleanedJson = response.text.trim();
        if (cleanedJson.includes('```')) {
            cleanedJson = cleanedJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
        try {
            return JSON.parse(cleanedJson) as CatalogAnalysis;
        } catch (e) {
            return { top: { visual_length: cleanedJson } } as any;
        }
    } catch (e) {
        return null;
    }
};

const buildEditPrompt = (
    options: GenerationOptions, 
    pose: string, 
    hasLengthReference: boolean,
    hasStyleReference: boolean,
    lengthAnalysis: CatalogAnalysis | null = null,
    hasModelReference: boolean = false,
    indices: { model: number; top: number; bottom: number; main: number; length: number; back: number; fabric: number }
): string => {
  
  let backgroundSpec = "";
  if (options.background === Background.Studio) {
    const bgColor = options.backgroundColorHex || '#FFFFFF';
    backgroundSpec = `Solid ${hexToColorName(bgColor)} studio background`;
  } else {
    backgroundSpec = options.background;
  }

  const isCoordSet = options.productCategory === ProductCategory.CoordSet || options.productCategory === ProductCategory.FullBody;

  // ============================================================================
  // ULTIMATE MODEL LOCK - CANNOT BE OVERRIDDEN
  // ============================================================================
  let modelLock = "";
  if (hasModelReference) {
      modelLock = `
╔═══════════════════════════════════════════════════════════════════╗
║           🚨 ABSOLUTE RULE #1: MODEL IDENTITY IS FROZEN           ║
╚═══════════════════════════════════════════════════════════════════╝

IMAGE ${indices.model} = THE ONLY MODEL ALLOWED

⛔⛔⛔ UNDER NO CIRCUMSTANCES CREATE A DIFFERENT PERSON ⛔⛔⛔

This is NOT a reference. This is NOT inspiration. This IS the actual person.
You are dressing THIS EXACT person in new clothes. Not creating a new model.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLONE THESE EXACTLY FROM IMAGE ${indices.model}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 FACE (100% COPY):
   → Same face shape, bone structure, features
   → Same eyes (shape, color, size, distance)
   → Same nose (shape, size, bridge)
   → Same mouth (lips shape, size)
   → Same chin and jawline
   → Same cheekbones
   → Same eyebrows (shape, thickness, position)
   → Same facial proportions
   ⛔ NEVER generate a different face

💇 HAIR (100% COPY):
   → Same hair color (EXACT shade - do not lighten/darken)
   → Same hairstyle (EXACT cut and length)
   → Same hair texture (straight/wavy/curly)
   → Same hair volume and density
   → Same hair parting
   → Same hairline
   ⛔ NEVER change the hairstyle or color

👠 FOOTWEAR (100% COPY):
   → Same shoe type visible in IMAGE ${indices.model}
   → Same shoe color
   → Same shoe style
   → Keep shoes visible in full-body shots
   ⛔ NEVER change the footwear

🎨 SKIN (100% COPY):
   → Same skin tone (EXACT color)
   → Same skin undertones (warm/cool/neutral)
   → Same complexion
   ⛔ NEVER alter skin tone

📏 BODY (100% COPY):
   → Same height and body proportions as IMAGE ${indices.model}
   → Same body frame
   → Same posture style

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION BEFORE GENERATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ask yourself: "Does this person look IDENTICAL to IMAGE ${indices.model}?"
If answer is NO → STOP → Fix it → Try again
If you cannot match IMAGE ${indices.model} exactly → DO NOT GENERATE

⚠️ This is the SAME human being wearing different clothes.
⚠️ Only the outfit changes. The person stays 100% identical.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  } else {
      modelLock = `
╔═══════════════════════════════════════════════════════════════════╗
║  ⭐ PERSONA SPECIFICATION                                         ║
╚═══════════════════════════════════════════════════════════════════╝
- IDENTITY: ${buildModelDescription(options.modelAttributes) || 'Professional fashion model'}.
- CONSISTENCY: Same face, same hair, same footwear in ALL shots.
`;
  }

  // ============================================================================
  // CO-ORD SET STRUCTURE IF APPLICABLE
  // ============================================================================
  let coordStructure = "";
  if (isCoordSet) {
      coordStructure = `
╔═══════════════════════════════════════════════════════════════════╗
║        🚨 ABSOLUTE RULE #2: GENERATE BOTH TOP AND BOTTOM          ║
╚═══════════════════════════════════════════════════════════════════╝

A CO-ORD SET = TWO PIECES (NOT ONE PIECE)

The model MUST wear:
1️⃣ A TOP garment on the upper body
2️⃣ A BOTTOM garment on the lower body

⛔⛔⛔ DO NOT GENERATE ONLY THE TOP ⛔⛔⛔
⛔⛔⛔ DO NOT SKIP THE BOTTOM ⛔⛔⛔
⛔⛔⛔ BOTH PIECES MUST BE VISIBLE ⛔⛔⛔

VERIFICATION: Can you see both top AND bottom in the output?
If NO → STOP → Add the missing piece → Try again
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  // ============================================================================
  // LENGTH REFERENCE FIREWALL - ULTRA STRICT
  // ============================================================================
  let lengthFirewall = "";
  if (hasLengthReference && isCoordSet) {
      lengthFirewall = `
╔═══════════════════════════════════════════════════════════════════╗
║   🚨 ABSOLUTE RULE #3: LENGTH REFERENCE FIREWALL - IMAGE ${indices.length}    ║
╚═══════════════════════════════════════════════════════════════════╝

⛔⛔⛔ IMAGE ${indices.length} IS A MEASURING TAPE - NOT A PRODUCT ⛔⛔⛔

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT IMAGE ${indices.length} IS FOR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Measuring where the TOP hem ends (hip? waist? thigh?)
✅ Measuring where the BOTTOM hem ends (ankle? knee? calf?)
✅ Measuring sleeve length (full? 3/4? short?)
✅ Measuring pant leg width (wide? straight? fitted?)
✅ Understanding garment proportions and fit

That's ALL. Nothing else from IMAGE ${indices.length} should be used.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔⛔⛔ ABSOLUTE PROHIBITIONS FOR IMAGE ${indices.length}: ⛔⛔⛔
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ NEVER copy colors from IMAGE ${indices.length}
✗ NEVER copy prints/patterns from IMAGE ${indices.length}
✗ NEVER copy designs from IMAGE ${indices.length}
✗ NEVER copy fabric textures from IMAGE ${indices.length}
✗ NEVER copy embroidery from IMAGE ${indices.length}
✗ NEVER copy embellishments from IMAGE ${indices.length}
✗ NEVER copy collar/neckline designs from IMAGE ${indices.length}
✗ NEVER copy button styles from IMAGE ${indices.length}
✗ NEVER copy any visual element from IMAGE ${indices.length}

⚠️ Pretend IMAGE ${indices.length} is BLACK AND WHITE with no details.
⚠️ You can only see WHERE garments END, not what they look like.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP-BY-STEP PROCESS:

STEP 1️⃣: ANALYZE LENGTH IN IMAGE ${indices.length}
   Look at IMAGE ${indices.length} and answer these questions ONLY:
   
   For TOP piece:
   • Where does the top end? (waist / hip / thigh level?)
   • How long are sleeves? (full / 3-quarter / short / none?)
   • What's the overall fit? (fitted / loose / oversized?)
   
   For BOTTOM piece:
   • Where does the bottom end? (ankle / calf / knee / thigh?)
   • What's the leg width? (wide / straight / fitted / flared?)
   • Where's the waist? (high-waist / mid-rise / low-rise?)

STEP 2️⃣: FORGET EVERYTHING ELSE ABOUT IMAGE ${indices.length}
   Now STOP looking at IMAGE ${indices.length}.
   Do NOT think about its colors.
   Do NOT think about its patterns.
   Do NOT think about its design.
   
   You have extracted measurements. That's all you need from IMAGE ${indices.length}.

STEP 3️⃣: GET COLORS FROM PRODUCT IMAGES
   Now look at the PRODUCT images for colors and designs:
   
   TOP colors/design → IMAGE ${indices.top > 0 ? indices.top : indices.main}
   BOTTOM colors/design → IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main}

STEP 4️⃣: COMBINE LENGTH + COLOR
   Create garments where:
   • TOP has COLOR from IMAGE ${indices.top > 0 ? indices.top : indices.main} + LENGTH from IMAGE ${indices.length}
   • BOTTOM has COLOR from IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main} + LENGTH from IMAGE ${indices.length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before generating, ask:
1. Did I copy ANY color from IMAGE ${indices.length}? → MUST BE NO
2. Did I copy ANY pattern from IMAGE ${indices.length}? → MUST BE NO
3. Did I copy ANY design from IMAGE ${indices.length}? → MUST BE NO
4. Did I use IMAGE ${indices.length} ONLY for measurements? → MUST BE YES
5. Do colors match IMAGE ${indices.top > 0 ? indices.top : indices.main} and IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main}? → MUST BE YES

If any answer is wrong → STOP → Fix → Try again
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  } else if (hasLengthReference && !isCoordSet) {
      lengthFirewall = `
╔═══════════════════════════════════════════════════════════════════╗
║        LENGTH REFERENCE FIREWALL - IMAGE ${indices.length}                ║
╚════════════════════════════════════════════════════════════════════╝
⛔ IMAGE ${indices.length} = LENGTH RULER ONLY
✗ NEVER copy colors from IMAGE ${indices.length}
✗ NEVER copy designs from IMAGE ${indices.length}
✓ ONLY measure where garment hem ends
✓ Apply this length to product from IMAGE ${indices.main}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  // ============================================================================
  // COLOR SOURCE DEFINITION
  // ============================================================================
  let colorSource = "";
  if (isCoordSet) {
      colorSource = `
╔═══════════════════════════════════════════════════════════════════╗
║         🚨 ABSOLUTE RULE #4: COLOR SOURCE DEFINITION              ║
╚═══════════════════════════════════════════════════════════════════╝

WHERE TO GET COLORS AND DESIGNS FROM:

🔝 TOP PIECE:
   SOURCE: IMAGE ${indices.top > 0 ? indices.top : indices.main}
   
   COPY THESE FROM IMAGE ${indices.top > 0 ? indices.top : indices.main}:
   ✓ Exact color/shade
   ✓ Exact print/pattern
   ✓ Exact fabric texture
   ✓ Exact embroidery/embellishments
   ✓ Exact design details (collar, buttons, etc.)
   ✓ All visual elements

👖 BOTTOM PIECE:
   SOURCE: IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main}
   
   COPY THESE FROM IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main}:
   ✓ Exact color/shade
   ✓ Exact print/pattern
   ✓ Exact fabric texture
   ✓ Exact embroidery/embellishments
   ✓ Exact design details (pockets, pleats, etc.)
   ✓ All visual elements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ These are the ONLY sources for colors and designs.
⚠️ IMAGE ${indices.length} should NOT influence colors at all.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  } else {
      colorSource = `
╔═══════════════════════════════════════════════════════════════════╗
║              COLOR SOURCE DEFINITION                              ║
╚═══════════════════════════════════════════════════════════════════╝
SOURCE: IMAGE ${indices.main}
Copy exact color, print, and design from IMAGE ${indices.main}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  // ============================================================================
  // CAMERA & POSE
  // ============================================================================
  const poseLower = pose.toLowerCase();
  let cameraSetup = "";
  
  if (poseLower.includes('full') || poseLower.includes('front_full') || poseLower.includes('back_full')) {
      const direction = poseLower.includes('back') ? 'Model facing AWAY from camera (back view)' : 'Model facing DIRECTLY at camera (front view)';
      cameraSetup = `
╔═══════════════════════════════════════════════════════════════════╗
║                    CAMERA & POSE SETUP                            ║
╚═══════════════════════════════════════════════════════════════════╝
POSE: ${pose}
DIRECTION: ${direction}
FRAMING: Full body (head to toe visible)
CAMERA HEIGHT: Navel level
FOCUS: Sharp detail on garments and model identity
FOOTWEAR: Clearly visible
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  } else {
      cameraSetup = `
╔═══════════════════════════════════════════════════════════════════╗
║                    CAMERA & POSE SETUP                            ║
╚═══════════════════════════════════════════════════════════════════╝
POSE: ${pose}
CAMERA: Eye-level professional photography
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  // ============================================================================
  // FINAL VALIDATION CHECKLIST
  // ============================================================================
  let finalValidation = "";
  if (isCoordSet && hasLengthReference) {
      finalValidation = `
╔═══════════════════════════════════════════════════════════════════╗
║              ✅ MANDATORY PRE-GENERATION CHECKLIST                ║
╚═══════════════════════════════════════════════════════════════════╝

DO NOT GENERATE until ALL these are TRUE:

□ Model face = IMAGE ${indices.model} face (100% match)
□ Model hair = IMAGE ${indices.model} hair (100% match)
□ Model footwear = IMAGE ${indices.model} footwear (100% match)
□ Model skin tone = IMAGE ${indices.model} skin tone (100% match)
□ TOP piece is present and visible
□ BOTTOM piece is present and visible
□ TOP color from IMAGE ${indices.top > 0 ? indices.top : indices.main} (NOT from IMAGE ${indices.length})
□ BOTTOM color from IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main} (NOT from IMAGE ${indices.length})
□ TOP length from IMAGE ${indices.length} measurement
□ BOTTOM length from IMAGE ${indices.length} measurement
□ ZERO colors copied from IMAGE ${indices.length}
□ ZERO designs copied from IMAGE ${indices.length}

⛔ If ANY checkbox is unchecked → DO NOT GENERATE
⛔ Fix the issue first, then try again

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  } else if (isCoordSet) {
      finalValidation = `
╔═══════════════════════════════════════════════════════════════════╗
║              ✅ MANDATORY PRE-GENERATION CHECKLIST                ║
╚═══════════════════════════════════════════════════════════════════╝

□ Model identity matches IMAGE ${indices.model} (face, hair, footwear)
□ TOP piece is present
□ BOTTOM piece is present
□ Both pieces visible in output

⛔ If ANY checkbox is unchecked → DO NOT GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  const styling = options.customInstructions ? `\nADDITIONAL NOTES: ${options.customInstructions}` : "";

  return `
[GENERATION TASK]: E-COMMERCE PRODUCT PHOTOSHOOT

${modelLock}
${coordStructure}
${lengthFirewall}
${colorSource}
${cameraSetup}

ENVIRONMENT:
- Background: ${backgroundSpec}
- Lighting: ${options.lighting}
${styling}

${finalValidation}

╔═══════════════════════════════════════════════════════════════════╗
║                      FINAL OUTPUT MUST HAVE                       ║
╚═══════════════════════════════════════════════════════════════════╝
✓ Same person as IMAGE ${indices.model} (face, hair, footwear identical)
${isCoordSet ? '✓ Complete co-ord set (both top and bottom visible)' : ''}
✓ Professional e-commerce quality photograph
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
};

export const editGeneratedImage = async (base64Image: string, editInstruction: string): Promise<GeneratedImage> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] || base64Image } };
        const promptPart = { text: `Apply Edit Instruction: "${editInstruction}". Maintain high photorealism and subject consistency.` };
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, promptPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        if (!response.candidates?.[0]) throw new Error("No image generated.");
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return { id: crypto.randomUUID(), src: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, prompt: `Edit: ${editInstruction}` };
            }
        }
        throw new Error("No valid image data.");
    } catch (error: any) { throw new Error(`Edit failed: ${error.message}`); }
};

export const replaceBackgroundImage = async (base64Image: string, colorHex: string): Promise<string> => {
    try {
         const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
         const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] || base64Image } };
         const promptPart = { text: `Action: Replace background with SOLID COLOR ${colorHex}. Preserve subject shadows.` };
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, promptPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        if (!response.candidates?.[0]) throw new Error("Processing failed.");
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        throw new Error("No data.");
    } catch (error: any) { throw new Error(`BG Swap failed: ${error.message}`); }
};

export const generateProductImage = async (options: GenerationOptions): Promise<GeneratedImage[]> => {
    const hasProduct = options.uploadedFile || options.uploadedFileTop || options.uploadedFileBottom;
    if (!hasProduct) throw new Error("Product image required.");
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const baseParts: any[] = [];
        
        let hasModelReference = false;
        let indices = { model: -1, top: -1, bottom: -1, main: -1, length: -1, back: -1, fabric: -1 };
        
        // 1. BIOMETRIC AUTHORITY (IMAGE 1) - THE ANCHOR
        if (!options.isEditMode && options.modelImageSrc) {
            const modelData = await urlToBase64(options.modelImageSrc);
            if (modelData) {
                baseParts.push({ inlineData: modelData });
                hasModelReference = true;
                indices.model = baseParts.length;
            }
        } else if (options.isEditMode && options.modelLockImage) {
            const modelData = await urlToBase64(options.modelLockImage);
            if (modelData) {
                baseParts.push({ inlineData: modelData });
                hasModelReference = true;
                indices.model = baseParts.length;
            }
        }

        // 2. DESIGN & CHROMATIC AUTHORITY (PRODUCT IMAGES)
        if (options.productCategory === ProductCategory.CoordSet || options.productCategory === ProductCategory.FullBody) {
            if (options.uploadedFileTop) {
                const { mimeType, data } = await fileToBase64(options.uploadedFileTop);
                baseParts.push({ inlineData: { mimeType, data } });
                indices.top = baseParts.length;
            }
            if (options.uploadedFileBottom) {
                const { mimeType, data } = await fileToBase64(options.uploadedFileBottom);
                baseParts.push({ inlineData: { mimeType, data } });
                indices.bottom = baseParts.length;
            }
            // Fallback for co-ord if individual top/bottom not provided
            if (!options.uploadedFileTop && !options.uploadedFileBottom && options.uploadedFile) {
                const { mimeType, data } = await fileToBase64(options.uploadedFile);
                baseParts.push({ inlineData: { mimeType, data } });
                indices.main = baseParts.length;
            }
        } else {
            const mainFile = options.uploadedFile || options.uploadedFileTop || options.uploadedFileBottom;
            if (mainFile) {
                const { mimeType, data } = await fileToBase64(mainFile);
                baseParts.push({ inlineData: { mimeType, data } });
                indices.main = baseParts.length;
            }
        }
        
        if (options.uploadedFileBack) {
            const { mimeType, data } = await fileToBase64(options.uploadedFileBack);
            baseParts.push({ inlineData: { mimeType, data } });
            indices.back = baseParts.length;
        }
        if (options.uploadedFileFabric) {
            const { mimeType, data } = await fileToBase64(options.uploadedFileFabric);
            baseParts.push({ inlineData: { mimeType, data } });
            indices.fabric = baseParts.length;
        }

        // 3. MEASUREMENT AUTHORITY (LAST IMAGE - GHOST RULER)
        let lengthRefPart: any = null;
        let lengthAnalysis: CatalogAnalysis | null = null;
        if (options.uploadedFileRef) {
            const { mimeType, data } = await fileToBase64(options.uploadedFileRef);
            lengthRefPart = { inlineData: { mimeType, data } };
            lengthAnalysis = await analyzeProductLengthReference(data, options.productCategory);
        }

        let styleRefPart: any = null;
        if (options.uploadedFileStyleRef) {
            const { mimeType, data } = await fileToBase64(options.uploadedFileStyleRef);
            styleRefPart = { inlineData: { mimeType, data } };
        }

        let posesToGenerate = options.sequenceShots?.length 
            ? options.sequenceShots 
            : [Pose.FrontViewFull, Pose.BackViewFull, Pose.WaistUp, Pose.CloseUp];
            
        const successfullyGeneratedImages: GeneratedImage[] = [];
        
        for (let i = 0; i < posesToGenerate.length; i++) {
            const pose = posesToGenerate[i];
            if (i > 0) await new Promise(r => setTimeout(r, 2000));
            
            let currentParts = [...baseParts];
            
            if (lengthRefPart) {
                currentParts.push(lengthRefPart);
                indices.length = currentParts.length;
            }
            if (styleRefPart) currentParts.push(styleRefPart);

            const fullPrompt = buildEditPrompt(
                options, pose, !!lengthRefPart, !!styleRefPart,
                lengthAnalysis, hasModelReference, indices
            );
            
            // ADD THIS BEFORE THE API CALL
            console.log('🔍 DEBUG INFO:');
            console.log('Indices:', indices);
            console.log('Has Model Reference:', hasModelReference);
            console.log('Has Length Reference:', !!lengthRefPart);
            console.log('Product Category:', options.productCategory);
            console.log('Prompt Preview:', fullPrompt.substring(0, 500));

            currentParts.push({ text: fullPrompt });
            
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image', 
                    contents: { parts: currentParts },
                    config: { 
                        responseModalities: [Modality.IMAGE], 
                        imageConfig: { aspectRatio: getClosestAspectRatio(options.aspectRatio) },
                        temperature: 0.4, 
                    },
                });
                
                if (!response?.candidates?.[0]) continue; 
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        let finalImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        if (options.logoConfig) finalImage = await applyLogoOverlay(finalImage, options.logoConfig);
                        if (options.textConfig) finalImage = await applyTextOverlay(finalImage, options.textConfig);
                        successfullyGeneratedImages.push({ 
                            id: crypto.randomUUID(), 
                            src: finalImage, 
                            prompt: pose, 
                            usage: response.usageMetadata ? { totalTokens: response.usageMetadata.totalTokenCount || 0 } : undefined 
                        });
                        break; 
                    }
                }
            } catch (e) { console.error(`Pose ${pose} failed`, e); }
        }
        if (!successfullyGeneratedImages.length) throw new Error("Generation failed.");
        return successfullyGeneratedImages;
    } catch (error: any) { throw new Error(`Process error: ${error.message}`); }
};

export const generateModelPreview = async (prompt: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        if (!response.candidates?.[0]) throw new Error("Failed.");
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        throw new Error("No data.");
    } catch (error) { throw error; }
};

export const extractModelAttributes = async (imageBase64: string): Promise<ModelAttributes> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 } };
        const extractionPrompt = `Extract model attributes: gender, ethnicity, ageRange, bodyType, skinTone, hairColor, hairStyle. Output as JSON.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [imagePart, { text: extractionPrompt }] }
        });
        let cleanedJson = response.text.trim();
        if (cleanedJson.includes('```')) cleanedJson = cleanedJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        return JSON.parse(cleanedJson);
    } catch (error: any) {
        return { gender: 'female', skinTone: 'Medium' } as ModelAttributes;
    }
};

export const estimateTokenCount = async (options: GenerationOptions): Promise<number> => {
  return 2500;
};

export const generateVideo = async (imageFile: File, prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const { mimeType, data } = await fileToBase64(imageFile);
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: { imageBytes: data, mimeType: mimeType },
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio }
        });
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);
    } catch (error: any) { throw error; }
};