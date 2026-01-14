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

  // 1. BIOMETRIC CONSTANT LOCK (IMAGE IS THE IDENTITY AUTHORITY)
  let identityLock = "";
  if (hasModelReference) {
      identityLock = `
╔══════════════════════════════════════════════════════════════╗
║ ⭐ CRITICAL: BIOMETRIC IDENTITY LOCK - IMAGE ${indices.model}      ║
╚══════════════════════════════════════════════════════════════╝

🔒 ABSOLUTE REQUIREMENTS - NO EXCEPTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. FACIAL GEOMETRY: Copy EXACT face structure from IMAGE ${indices.model}
   - Same bone structure, nose shape, lips, eyes, eyebrows
   - Same facial proportions and features
   - Same expression style

2. HAIR AUTHORITY: 100% match to IMAGE ${indices.model}
   - EXACT hair color (RGB match required)
   - EXACT hairstyle (length, cut, parting)
   - EXACT hair texture and volume
   - NO variations, NO creative interpretation

3. SKIN TONE: Exact pigmentation from IMAGE ${indices.model}
   - Match RGB values of skin
   - Same undertones

4. IDENTITY PRESERVATION:
   - This is the SAME human across all poses
   - DO NOT randomize or alter any facial features
   - DO NOT change hairstyle between shots
   - Maintain complete biometric consistency
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  // 2. SOVEREIGN DESIGN AUTHORITY (COLORS & PATTERNS ONLY FROM PRODUCT IMAGES)
  let designAuthority = "";
  const productSourceIndices = [];
  const productImageList = [];
  
  if (indices.main > 0) {
      productSourceIndices.push(`IMAGE ${indices.main}`);
      productImageList.push(indices.main);
  }
  if (indices.top > 0) {
      productSourceIndices.push(`IMAGE ${indices.top}`);
      productImageList.push(indices.top);
  }
  if (indices.bottom > 0) {
      productSourceIndices.push(`IMAGE ${indices.bottom}`);
      productImageList.push(indices.bottom);
  }
  if (indices.back > 0) {
      productSourceIndices.push(`IMAGE ${indices.back}`);
      productImageList.push(indices.back);
  }
  if (indices.fabric > 0) {
      productSourceIndices.push(`IMAGE ${indices.fabric}`);
      productImageList.push(indices.fabric);
  }

  if (options.productCategory === ProductCategory.CoordSet) {
      designAuthority = `
╔══════════════════════════════════════════════════════════════╗
║ 🛡️ CRITICAL: COLOR & DESIGN AUTHORITY - CO-ORD SET          ║
╚══════════════════════════════════════════════════════════════╝

🎨 ABSOLUTE COLOR SOURCE: ${productSourceIndices.join(' AND ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES - NO EXCEPTIONS:

1. TOP GARMENT SOURCE: IMAGE ${indices.top > 0 ? indices.top : indices.main}
   ✓ Take EXACT RGB color values
   ✓ Copy precise patterns, prints, textures
   ✓ Match buttons, collars, sleeves, seams 1:1
   ✓ Replicate fabric type and finish

2. BOTTOM GARMENT SOURCE: IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main}
   ✓ Take EXACT RGB color values
   ✓ Copy precise patterns, prints, textures
   ✓ Match pockets, seams, waistband, hem 1:1
   ✓ Replicate fabric type and finish

${indices.back > 0 ? `3. BACK VIEW REFERENCE: IMAGE ${indices.back}
   ✓ Use for back design details only
   ✓ Color authority remains with front product images` : ''}

${indices.fabric > 0 ? `4. FABRIC DETAIL REFERENCE: IMAGE ${indices.fabric}
   ✓ Use for texture and material quality
   ✓ Color authority remains with main product images` : ''}

⚠️ STRICT PROHIBITIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ DO NOT take colors from IMAGE ${indices.length} (length reference)
✗ DO NOT take colors from IMAGE ${indices.model} (model reference)
✗ DO NOT invent or modify colors
✗ DO NOT blend or average colors from multiple sources
✗ ONLY use colors from: ${productImageList.join(', ')}

RESULT REQUIREMENT: Generated outfit must be PIXEL-PERFECT match to 
product images ${productImageList.join(' and ')} in terms of color and design.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  } else if (options.productCategory === ProductCategory.FullBody) {
      designAuthority = `
╔══════════════════════════════════════════════════════════════╗
║ 🛡️ CRITICAL: COLOR & DESIGN AUTHORITY - FULL OUTFIT         ║
╚══════════════════════════════════════════════════════════════╝

🎨 ABSOLUTE COLOR SOURCE: ${productSourceIndices.join(' AND ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES - NO EXCEPTIONS:

1. COMPLETE OUTFIT SOURCE: ${productSourceIndices.join(', ')}
   ✓ Take EXACT RGB color values for ALL garments
   ✓ Copy precise patterns, prints, textures
   ✓ Match ALL design details 1:1
   ✓ Replicate fabric types and finishes

${indices.back > 0 ? `2. BACK VIEW REFERENCE: IMAGE ${indices.back}
   ✓ Use for back design details only
   ✓ Color authority remains with front product images` : ''}

${indices.fabric > 0 ? `3. FABRIC DETAIL REFERENCE: IMAGE ${indices.fabric}
   ✓ Use for texture and material quality
   ✓ Color authority remains with main product images` : ''}

⚠️ STRICT PROHIBITIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ DO NOT take colors from IMAGE ${indices.length} (length reference)
✗ DO NOT take colors from IMAGE ${indices.model} (model reference)
✗ DO NOT invent or modify colors
✗ DO NOT blend or average colors from multiple sources
✗ ONLY use colors from: ${productImageList.join(', ')}

RESULT REQUIREMENT: Generated outfit must be PIXEL-PERFECT match to 
product images in terms of color and design.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  } else {
      designAuthority = `
╔══════════════════════════════════════════════════════════════╗
║ 🛡️ CRITICAL: COLOR & DESIGN AUTHORITY - SINGLE PRODUCT      ║
╚══════════════════════════════════════════════════════════════╝

🎨 ABSOLUTE COLOR SOURCE: IMAGE ${indices.main}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES - NO EXCEPTIONS:

1. PRODUCT SOURCE: IMAGE ${indices.main}
   ✓ Take EXACT RGB color values
   ✓ Copy precise patterns, prints, textures 1:1
   ✓ Match ALL buttons, seams, stitching, details
   ✓ Replicate fabric type and finish exactly

${indices.back > 0 ? `2. BACK VIEW REFERENCE: IMAGE ${indices.back}
   ✓ Use ONLY for back design structure
   ✓ Colors MUST match IMAGE ${indices.main}, not IMAGE ${indices.back}` : ''}

${indices.fabric > 0 ? `3. FABRIC DETAIL REFERENCE: IMAGE ${indices.fabric}
   ✓ Use ONLY for texture and weave details
   ✓ Colors MUST match IMAGE ${indices.main}, not IMAGE ${indices.fabric}` : ''}

⚠️ STRICT PROHIBITIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ DO NOT take colors from IMAGE ${indices.length} (length reference)
✗ DO NOT take colors from IMAGE ${indices.model} (model reference)
✗ DO NOT take colors from IMAGE ${indices.back || indices.fabric} 
✗ DO NOT invent or modify colors
✗ ONLY use IMAGE ${indices.main} for ALL color data

RESULT REQUIREMENT: Generated garment must be PIXEL-PERFECT match to 
IMAGE ${indices.main} in terms of color and design.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  // 3. CHROMATIC FIREWALL (LENGTH REF IS A GHOST RULER)
  let measurementLock = "";
  if (hasLengthReference) {
      measurementLock = `
╔══════════════════════════════════════════════════════════════╗
║ 📐 CRITICAL: LENGTH REFERENCE - IMAGE ${indices.length} IS RULER ONLY  ║
╚══════════════════════════════════════════════════════════════╝

⚠️ EXTREME WARNING - ZERO COLOR TRANSFER ALLOWED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGE ${indices.length} IS A MEASUREMENT TOOL ONLY - NOT A COLOR SOURCE

🚫 ABSOLUTE PROHIBITIONS FOR IMAGE ${indices.length}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ DO NOT copy ANY colors from IMAGE ${indices.length}
✗ DO NOT use whites, blacks, or any hues from IMAGE ${indices.length}
✗ DO NOT take pattern/print inspiration from IMAGE ${indices.length}
✗ DO NOT reference fabric appearance from IMAGE ${indices.length}
✗ IGNORE all visual styling in IMAGE ${indices.length}

✓ ONLY PERMITTED USE OF IMAGE ${indices.length}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. VERTICAL MEASUREMENTS ONLY:
   - Where does the garment hemline terminate on the body?
   - Hip level? Knee level? Mid-thigh? Ankle?
   - Use ONLY for Y-axis positioning

2. LENGTH MAPPING:
   - Map the TERMINATION POINT to the model's anatomy
   - Apply this length to the PRODUCT from ${productImageList.join('/')}
   - Keep product colors, apply reference length

EXAMPLE CORRECT INTERPRETATION:
- IMAGE ${indices.length} shows hem at mid-thigh
- Product IMAGE ${productImageList[0]} is blue dress
- RESULT: Blue dress (from product) ending at mid-thigh (from length ref)

EXAMPLE WRONG INTERPRETATION:
- Taking the white/black color from length reference ❌
- Mixing colors between images ❌
- Using length ref for anything except vertical measurement ❌

🔥 FINAL RULE: Treat IMAGE ${indices.length} as a TRANSPARENT RULER
with ONLY vertical measurement data. All visual data is INVISIBLE.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  // 4. HARDENED CAMERA CONSTITUTION
  const poseLower = pose.toLowerCase();
  let cameraDirective = "Eye-level professional photography.";
  let orientationDirective = "Model facing forward.";

  if (poseLower.includes('full') || poseLower.includes('front_full') || poseLower.includes('back_full')) {
      orientationDirective = poseLower.includes('back') 
          ? `
🎥 CAMERA ORIENTATION: 180° REAR VIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Subject facing COMPLETELY AWAY from camera
- Show full back of head, shoulders, torso, legs
- Focus on back design details
- Model looking away, not turning head`
          : `
🎥 CAMERA ORIENTATION: 0° FRONTAL VIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Subject facing DIRECTLY at camera
- Perfect bilateral symmetry
- Focus on front design details
- Eye contact with camera`;

      cameraDirective = `
📸 FRAMING SPECIFICATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- FULL BODY: Head to toe completely visible
- NO CROPPING: Entire person must fit in frame
- LENS HEIGHT: Positioned at model's navel level
- DISTANCE: Appropriate to show complete figure
- FOCUS: Sharp, high-definition rendering
- DEPTH: Slight depth of field, subject in focus`;
  }

  const styling = options.customInstructions ? `
╔══════════════════════════════════════════════════════════════╗
║ 💅 STYLING DIRECTIVE                                         ║
╚══════════════════════════════════════════════════════════════╝
${options.customInstructions}
` : "";

  return `
╔══════════════════════════════════════════════════════════════╗
║ 🎯 PRECISION E-COMMERCE CATALOG GENERATION                   ║
╚══════════════════════════════════════════════════════════════╝

${identityLock}
${designAuthority}
${measurementLock}

╔══════════════════════════════════════════════════════════════╗
║ 📸 CAMERA & POSE CONFIGURATION                               ║
╚══════════════════════════════════════════════════════════════╝

POSE INSTRUCTION: ${pose}
${orientationDirective}
${cameraDirective}

╔══════════════════════════════════════════════════════════════╗
║ ⚙️ PRODUCTION SPECIFICATIONS                                 ║
╚══════════════════════════════════════════════════════════════╝

ENVIRONMENT:
- Background: ${backgroundSpec}
- Lighting: ${options.lighting}
- Quality: Professional e-commerce standard
- Resolution: High-definition, sharp focus

FABRIC RENDERING:
- Match texture from product images ${productImageList.join('/')}
- Show fabric drape and fall naturally
- Maintain material characteristics
${styling}

╔══════════════════════════════════════════════════════════════╗
║ ✅ FINAL VALIDATION CHECKLIST                                ║
╚══════════════════════════════════════════════════════════════╝

Before generating, verify:
☑ Model face/hair matches IMAGE ${indices.model} exactly
☑ Product colors match ONLY images ${productImageList.join('/')}
☑ NO color leakage from length reference IMAGE ${indices.length}
☑ Length/fit uses measurement from IMAGE ${indices.length}
☑ Pose and camera angle match specification
☑ Background and lighting are correct
☑ Professional e-commerce quality achieved

GENERATE NOW with 100% adherence to above specifications.
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
        
        // 1. BIOMETRIC AUTHORITY (IMAGE 1)
        if (!options.isEditMode && options.modelImageSrc) {
            const modelData = await urlToBase64(options.modelImageSrc);
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
            // If user only uploaded one file for a full body or co-ord
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