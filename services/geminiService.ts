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
  // SECTION 1: MODEL IDENTITY LOCK - ULTRA STRICT FOR CO-ORD SET
  // ============================================================================
  let identityLock = "";
  if (hasModelReference) {
      identityLock = `
╔═══════════════════════════════════════════════════════════════════╗
║  🔒 LEVEL 1 PRIORITY: BIOMETRIC IDENTITY LOCK - IMAGE ${indices.model}        ║
╚═══════════════════════════════════════════════════════════════════╝

⚠️⚠️⚠️ CRITICAL WARNING: DO NOT CREATE A NEW PERSON ⚠️⚠️⚠️

IMAGE ${indices.model} shows the EXACT person who must appear in the output.
This is NOT a style reference. This is the ACTUAL HUMAN BEING.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY BIOMETRIC CLONING FROM IMAGE ${indices.model}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ FACE CLONING:
   - Copy the EXACT face from IMAGE ${indices.model}
   - Same eye shape, eye color, eyebrows
   - Same nose shape and size
   - Same mouth shape and lips
   - Same jawline and chin
   - Same facial bone structure
   - Same facial expression
   - ⚠️ DO NOT generate a different face

2️⃣ HAIR CLONING:
   - Copy the EXACT hair from IMAGE ${indices.model}
   - Same hair color (do not lighten or darken)
   - Same hairstyle (do not change cut, length, or styling)
   - Same hair texture and volume
   - Same hair parting
   - ⚠️ DO NOT change the hairstyle

3️⃣ FOOTWEAR CLONING:
   - Copy the EXACT footwear from IMAGE ${indices.model}
   - Same shoe type (heels/flats/sandals/boots/sneakers)
   - Same shoe color
   - Same shoe style
   - Keep footwear visible in full-body shots
   - ⚠️ DO NOT change the shoes

4️⃣ SKIN TONE CLONING:
   - Copy the EXACT skin tone from IMAGE ${indices.model}
   - Same skin color and undertones
   - Same skin texture
   - ⚠️ DO NOT change skin tone

5️⃣ BODY PROPORTIONS:
   - Same height proportions as IMAGE ${indices.model}
   - Same body frame as IMAGE ${indices.model}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 ABSOLUTE PROHIBITIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ DO NOT create a new model
✗ DO NOT change the face
✗ DO NOT change the hair
✗ DO NOT change the footwear
✗ DO NOT change the skin tone
✗ This is the SAME person in a different outfit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  } else {
      identityLock = `
╔═══════════════════════════════════════════════════════════════════╗
║  ⭐ PERSONA SPECIFICATION                                         ║
╚═══════════════════════════════════════════════════════════════════╝
- IDENTITY: ${buildModelDescription(options.modelAttributes) || 'Professional fashion model'}.
- CONSISTENCY: Same face, same hair, same footwear in ALL shots.
`;
  }

  // ============================================================================
  // SECTION 2: CO-ORD SET STRUCTURE - ULTRA STRICT
  // ============================================================================
  let coordSetStructure = "";
  if (isCoordSet) {
      coordSetStructure = `
╔═══════════════════════════════════════════════════════════════════╗
║  🔥 LEVEL 2 PRIORITY: CO-ORD SET STRUCTURE                        ║
╚═══════════════════════════════════════════════════════════════════╝

⚠️⚠️⚠️ THIS IS A CO-ORD SET = TWO SEPARATE PIECES ⚠️⚠️⚠️

A CO-ORD SET consists of:
1. TOP piece (worn on upper body)
2. BOTTOM piece (worn on lower body)

BOTH pieces MUST be present in the final output.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY OUTPUT REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Model MUST wear a TOP garment on upper body
✓ Model MUST wear a BOTTOM garment on lower body
✓ BOTH pieces must be visible in the shot
✓ Generate the COMPLETE outfit (not just top, not just bottom)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚫 PROHIBITED:
✗ DO NOT generate only the top piece
✗ DO NOT generate only the bottom piece  
✗ DO NOT skip the bottom
✗ DO NOT make the model wear just a top without a bottom
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  // ============================================================================
  // SECTION 3: COLOR & DESIGN SOURCE - WHERE TO GET COLORS FROM
  // ============================================================================
  let designAuthority = "";
  const productSources = [];
  if (indices.main > 0) productSources.push(`IMAGE ${indices.main}`);
  if (indices.top > 0) productSources.push(`IMAGE ${indices.top}`);
  if (indices.bottom > 0) productSources.push(`IMAGE ${indices.bottom}`);
  
  if (isCoordSet) {
      designAuthority = `
╔═══════════════════════════════════════════════════════════════════╗
║  🎨 LEVEL 3 PRIORITY: COLOR & DESIGN SOURCE                       ║
╚═══════════════════════════════════════════════════════════════════╝

WHERE TO GET COLORS AND DESIGNS FROM:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔝 TOP PIECE - COLOR & DESIGN SOURCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOURCE: IMAGE ${indices.top > 0 ? indices.top : indices.main}

WHAT TO COPY FROM IMAGE ${indices.top > 0 ? indices.top : indices.main}:
✓ Exact color/shade of the top garment
✓ Exact print/pattern on the top
✓ Exact fabric texture
✓ Exact embroidery or embellishments on the top
✓ Exact design details (buttons, collars, sleeves style, etc.)
✓ All visual styling of the top

APPLY TO: Upper body garment on the model

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👖 BOTTOM PIECE - COLOR & DESIGN SOURCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOURCE: IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main}

WHAT TO COPY FROM IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main}:
✓ Exact color/shade of the bottom garment
✓ Exact print/pattern on the bottom
✓ Exact fabric texture
✓ Exact embroidery or embellishments on the bottom
✓ Exact design details (pockets, pleats, leg style, etc.)
✓ All visual styling of the bottom

APPLY TO: Lower body garment on the model

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  } else {
      designAuthority = `
╔═══════════════════════════════════════════════════════════════════╗
║  🎨 COLOR & DESIGN SOURCE                                         ║
╚═══════════════════════════════════════════════════════════════════╝
SOURCE: IMAGE ${indices.main}
- Copy exact color, print, and design from IMAGE ${indices.main}
`;
  }

  // ============================================================================
  // SECTION 4: LENGTH REFERENCE - WHERE TO GET LENGTHS FROM
  // ============================================================================
  let lengthReference = "";
  if (hasLengthReference && isCoordSet) {
      lengthReference = `
╔═══════════════════════════════════════════════════════════════════╗
║  📐 LEVEL 4 PRIORITY: LENGTH REFERENCE - IMAGE ${indices.length}              ║
╚═══════════════════════════════════════════════════════════════════╝

⚠️⚠️⚠️ CRITICAL: IMAGE ${indices.length} IS FOR LENGTH ONLY ⚠️⚠️⚠️

IMAGE ${indices.length} shows a co-ord set outfit. Use it ONLY to measure lengths.
DO NOT copy colors or designs from IMAGE ${indices.length}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔝 TOP PIECE - LENGTH MEASUREMENT FROM IMAGE ${indices.length}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: ANALYZE TOP in IMAGE ${indices.length}
Look at the top garment in IMAGE ${indices.length} and measure:
   • Where does the TOP HEM end? (at waist? at hip? at thigh?)
   • How long are the sleeves? (full-length? 3/4? short? sleeveless?)
   • What is the neckline depth?

STEP 2: EXTRACT LENGTH ONLY
   ✓ Extract: Hem position (waist-length / hip-length / thigh-length)
   ✓ Extract: Sleeve length measurement
   ✓ Extract: Overall top proportions

STEP 3: DO NOT EXTRACT COLORS/DESIGNS
   ✗ DO NOT copy the color of IMAGE ${indices.length} top
   ✗ DO NOT copy the print/pattern of IMAGE ${indices.length} top
   ✗ DO NOT copy any design details from IMAGE ${indices.length} top
   ✗ IGNORE all visual styling of IMAGE ${indices.length} top

STEP 4: APPLY LENGTH
   → Take COLOR & DESIGN from IMAGE ${indices.top > 0 ? indices.top : indices.main}
   → Apply LENGTH measurements from IMAGE ${indices.length} top
   → Result: Top with color from IMAGE ${indices.top > 0 ? indices.top : indices.main} but length from IMAGE ${indices.length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👖 BOTTOM PIECE - LENGTH MEASUREMENT FROM IMAGE ${indices.length}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: ANALYZE BOTTOM in IMAGE ${indices.length}
Look at the bottom garment in IMAGE ${indices.length} and measure:
   • Where does the BOTTOM HEM end? (at ankle? at calf? at knee?)
   • What is the waist position? (high-waist? mid-rise? low-rise?)
   • What is the leg width? (wide-leg? straight? fitted?)

STEP 2: EXTRACT LENGTH ONLY
   ✓ Extract: Hem position (full-length / ankle-length / calf-length / knee-length)
   ✓ Extract: Waist position measurement
   ✓ Extract: Leg width/silhouette
   ✓ Extract: Overall bottom proportions

STEP 3: DO NOT EXTRACT COLORS/DESIGNS
   ✗ DO NOT copy the color of IMAGE ${indices.length} bottom
   ✗ DO NOT copy the print/pattern of IMAGE ${indices.length} bottom
   ✗ DO NOT copy any design details from IMAGE ${indices.length} bottom
   ✗ IGNORE all visual styling of IMAGE ${indices.length} bottom

STEP 4: APPLY LENGTH
   → Take COLOR & DESIGN from IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main}
   → Apply LENGTH measurements from IMAGE ${indices.length} bottom
   → Result: Bottom with color from IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main} but length from IMAGE ${indices.length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY OF LENGTH REFERENCE USAGE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGE ${indices.length} = Length ruler ONLY
IMAGE ${indices.top > 0 ? indices.top : indices.main} = Top color & design source
IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main} = Bottom color & design source
IMAGE ${indices.model} = Model identity (face, hair, footwear)

FINAL OUTPUT = Model from IMAGE ${indices.model} wearing:
   - TOP with color from IMAGE ${indices.top > 0 ? indices.top : indices.main} and length from IMAGE ${indices.length}
   - BOTTOM with color from IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main} and length from IMAGE ${indices.length}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  } else if (hasLengthReference && !isCoordSet) {
      lengthReference = `
╔═══════════════════════════════════════════════════════════════════╗
║  📐 LENGTH REFERENCE - IMAGE ${indices.length}                            ║
╚═══════════════════════════════════════════════════════════════════╝
✗ DO NOT copy colors or designs from IMAGE ${indices.length}
✓ USE ONLY to measure where the garment hem ends
✓ Apply this length to the product from IMAGE ${indices.main}
`;
  }

  // ============================================================================
  // SECTION 5: CAMERA & POSE
  // ============================================================================
  const poseLower = pose.toLowerCase();
  let cameraDirective = "Eye-level professional photography.";
  let orientationDirective = "Model facing forward.";

  if (poseLower.includes('full') || poseLower.includes('front_full') || poseLower.includes('back_full')) {
      orientationDirective = poseLower.includes('back') 
          ? "🎥 180° REAR VIEW: Model facing away from camera. Show back design."
          : "🎥 0° FRONTAL VIEW: Model facing directly at camera.";
      cameraDirective = `
📸 FULL BODY FRAMING:
- Show model from head to toe (complete body visible)
- Show footwear clearly
- Camera at navel height
- No cropping of head or feet`;
  }

  const styling = options.customInstructions ? `\n💅 ADDITIONAL STYLING: ${options.customInstructions}\n` : "";

  // ============================================================================
  // SECTION 6: FINAL VALIDATION CHECKLIST
  // ============================================================================
  let validation = "";
  if (isCoordSet) {
      validation = `
╔═══════════════════════════════════════════════════════════════════╗
║  ✅ PRE-GENERATION VALIDATION CHECKLIST                           ║
╚═══════════════════════════════════════════════════════════════════╝

Before generating the image, verify ALL of these:

□ 1. Model's face matches IMAGE ${indices.model}? (MUST BE YES)
□ 2. Model's hair matches IMAGE ${indices.model}? (MUST BE YES)
□ 3. Model's footwear matches IMAGE ${indices.model}? (MUST BE YES)
□ 4. TOP piece is present on upper body? (MUST BE YES)
□ 5. BOTTOM piece is present on lower body? (MUST BE YES)
□ 6. TOP color matches IMAGE ${indices.top > 0 ? indices.top : indices.main}? (MUST BE YES)
□ 7. BOTTOM color matches IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main}? (MUST BE YES)
${hasLengthReference ? `□ 8. TOP length matches IMAGE ${indices.length}? (MUST BE YES)` : ''}
${hasLengthReference ? `□ 9. BOTTOM length matches IMAGE ${indices.length}? (MUST BE YES)` : ''}
${hasLengthReference ? `□ 10. NO colors copied from IMAGE ${indices.length}? (MUST BE YES)` : ''}

⛔ IF ANY ANSWER IS "NO": STOP AND FIX BEFORE GENERATING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  return `
[TASK]: E-COMMERCE CO-ORD SET PHOTOSHOOT

${identityLock}
${coordSetStructure}
${designAuthority}
${lengthReference}

╔═══════════════════════════════════════════════════════════════════╗
║  📸 CAMERA & POSE CONFIGURATION                                   ║
╚═══════════════════════════════════════════════════════════════════╝
POSE: ${pose}
${orientationDirective}
${cameraDirective}

╔═══════════════════════════════════════════════════════════════════╗
║  ⚙️ ENVIRONMENT                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
- BACKGROUND: ${backgroundSpec}
- LIGHTING: ${options.lighting}
${styling}

${validation}

╔═══════════════════════════════════════════════════════════════════╗
║  🎯 FINAL OUTPUT REQUIREMENTS                                     ║
╚═══════════════════════════════════════════════════════════════════╝
✓ Same model identity (face, hair, footwear from IMAGE ${indices.model})
✓ Complete co-ord set (BOTH top and bottom visible)
✓ Colors from product images (IMAGE ${indices.top > 0 ? indices.top : indices.main} & IMAGE ${indices.bottom > 0 ? indices.bottom : indices.main})
${hasLengthReference ? `✓ Lengths from reference image (IMAGE ${indices.length})` : ''}
✓ Professional e-commerce quality
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