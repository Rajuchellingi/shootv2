
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { ProjectTemplate } from "../types";

// Define the tool that Gemini can call
const shootTool: FunctionDeclaration = {
  name: 'executeShootFromTemplate',
  description: 'Triggers a photoshoot generation using a specific saved project template for ALL products in the uploaded folder structure. MUST process ALL view angles (front, back, fabric, reference) and ALL poses defined in the template sequence. Can apply custom styling instructions.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      templateId: {
        type: Type.STRING,
        description: 'The unique ID of the template to be used.',
      },
      templateName: {
        type: Type.STRING,
        description: 'The friendly name of the template the user mentioned.',
      },
      processAllProducts: {
        type: Type.BOOLEAN,
        description: 'Always true - indicates that ALL products in the folder structure should be processed',
      },
      generateAllPoses: {
        type: Type.BOOLEAN,
        description: 'Always true - indicates that ALL poses in the sequence must be generated for each product',
      },
      customInstructions: {
        type: Type.STRING,
        description: 'Optional custom styling instructions like "Tuck In", "Smile", "Serious expression", "Hands in pockets", "Casual stance", etc.',
      }
    },
    required: ['templateId', 'templateName', 'processAllProducts', 'generateAllPoses'],
  },
};

export interface ChatAssistantResponse {
    text: string;
    triggerTemplateId?: string;
    processAllProducts?: boolean;
    generateAllPoses?: boolean;
    customInstructions?: string;
}

export const processAssistantMessage = async (
    message: string, 
    imageUri: string | null, 
    templates: ProjectTemplate[],
    totalProductsCount: number = 0
): Promise<ChatAssistantResponse> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const templateList = templates.map(t => `- "${t.name}" (ID: ${t.id}) [Background: ${t.background || 'Studio'}, Lighting: ${t.lighting || 'Dramatic'}]`).join('\n');
    
    const systemInstruction = `
        You are the Studio.AI Orchestrator. Your primary goal is to help users execute COMPLETE professional photoshoots for ENTIRE product catalogs.

        STUDIO.AI PLATFORM KNOWLEDGE:
        - Generation: Main workflow for uploading products and generating image sets.
        - Shoot Setup: Templates bundle ALL settings: Model, Sequence, Dimensions, Branding, Background, and Lighting.
        - Custom Instructions: Extraction of styling preferences (e.g., "Tuck In", "Smiling").

        CRITICAL REFERENCE IMAGE STANDARDS (PROFESSIONAL VISUAL SIZING):
        When a "reference" image is provided in a product folder, your system uses it as the ABSOLUTE authority for fit and length landmarks.
        
        1. **Product Segmentation**: Detect if it's a top, bottom, dress, or co-ord.
        2. **Visual Length Classification (Body Landmarks)**:
           - Top Lengths: cropped, waist length, hip length, mid-hip, upper thigh, mid-thigh, knee length.
           - Bottom Lengths: above ankle, ankle length, full length, floor length.
        3. **Fit & Silhouette Standards**:
           - Fit: slim, straight, relaxed, oversized.
           - Silhouette: A-line, straight, flared, wide-leg, palazzo.

        MANDATORY COMPLETE GENERATION RULES:
        1. **PROCESS ALL PRODUCTS**: Never skip any product in the folder structure.
        2. **GENERATE ALL POSES**: Each product MUST have ALL poses from the template sequence generated.
        3. **APPLY CATALOG STANDARDS**: Use reference images to lock visual landmarks for fit and length.
        4. **USE ALL VIEW ANGLES**: Process front, back, fabric, and reference images.

        BEHAVIOR RULES:
        1. FOLDER DETECTION: Acknowledge product count: "I've detected ${totalProductsCount} products ready for COMPLETE processing."
        2. SIZING AUTHORITY: Inform the user that reference images will be used to lock visual length landmarks (body landmarks).
        3. PHOTOSHOOT REQUESTS: CALL 'executeShootFromTemplate'.
        4. TONE: High-end production assistant. Efficient, thorough, and technically expert.

        YOUR SAVED TEMPLATES:
        ${templates.length > 0 ? templateList : "User has no templates saved yet. Suggest they create one in 'Shoot Setup > Templates'."}
    `.trim();

    const parts: any[] = [{ text: message }];
    
    if (imageUri) {
        parts.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: imageUri.split(',')[1]
            }
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts },
            config: {
                systemInstruction,
                tools: [{ functionDeclarations: [shootTool] }],
            },
        });

        const text = response.text || "I'm ready to help with your complete photoshoot. I will analyze reference images for professional body-landmark sizing.";
        
        if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            if (call.name === 'executeShootFromTemplate') {
                const matchedTemplate = templates.find(t => t.id === call.args.templateId);
                const bgInfo = matchedTemplate?.background ? ` using the ${matchedTemplate.background} background` : "";
                const lightInfo = matchedTemplate?.lighting ? ` and ${matchedTemplate.lighting} lighting` : "";
                const customInst = call.args.customInstructions ? ` with custom styling: ${call.args.customInstructions}` : "";
                
                return {
                    text: `Understood. Processing ALL ${totalProductsCount} products with COMPLETE pose sequence and Visual Landmark Analysis from reference images. Using "${call.args.templateName}" template${bgInfo}${lightInfo}${customInst}.`,
                    triggerTemplateId: call.args.templateId as string,
                    processAllProducts: true,
                    generateAllPoses: true,
                    customInstructions: call.args.customInstructions as string | undefined
                };
            }
        }

        return { text };
    } catch (error) {
        console.error("Chat Assistant Error:", error);
        throw error;
    }
};
