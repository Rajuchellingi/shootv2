# Module 1: Generation Engine - Deep Dive

The Generation Engine is the "Master Orchestrator" of the platform. It uses **Prompt Chaining** to combine rigid architectural rules with flexible user data.

---

## 1. The Fixed Logic (The "Constitution")
This part of the prompt never changes. It is hard-coded into the `geminiService.ts` to ensure commercial-grade results.

### **Logic Pillar A: Product Preservation**
- **Geometry Locking:** "If Image 1 has NO pocket, the output MUST have NO pocket."
- **Feature Matching:** Collar types, button counts, and seam lines are strictly mapped 1:1.
- **Texture Cloning:** Fabric weave (linen, silk, denim) is treated as a "Source of Truth" to prevent AI-generated "smooth" textures.

### **Logic Pillar B: Physics & Lighting**
- **Material Interaction:** Instructions for the fabric to react to the shadows and highlights of the specific background chosen.
- **Warping Strategy:** Command to "Warp" the product onto the human model's anatomy rather than generating a new garment.

---

## 2. The Dynamic User Input (The "Variables")
These are the inputs you provide through the Studio.AI interface:

| Input Component | Source | Description |
| :--- | :--- | :--- |
| **Primary Asset** | Image 1 Upload | The high-res photo of your actual product. |
| **Secondary Assets** | Back/Fabric Uploads | Optional views to guide the AI on backside and texture details. |
| **Scene Context** | UI Text Box | Your manual description (e.g., "In a rainy London street"). |
| **Identity Anchor** | Model Module | The persona created (e.g., "Middle-aged Italian male"). |
| **Camera Angle** | Position Module | The chosen framing (e.g., "Three-quarter side profile"). |
| **Aspect Ratio** | Dimensions Module | The final shape (9:16, 1:1, etc.). |

---

## 3. The Final Compiled Prompt Structure
When you click **"Generate Set"**, the engine compiles the logic and input into this final string sent to the Gemini API:

```text
[SYSTEM LOGIC]
TASK: Perform a high-fidelity virtual try-on.
RULES: 100% Geometry preservation. No phantom pockets. 1:1 Color match.
TEXTURE: Use Image 1 and Image 3 (Fabric) as the absolute material reference.

[USER INPUT INJECTION]
MODEL IDENTITY: {Input from Model Module Persona String}
SCENE CONTEXT: {Input from UI Description Box}
CAMERA SETTINGS: {Input from Position Module Preset}
WARDROBE CONTEXT: {Input from Model Module Wardrobe Fallbacks}

[EXECUTION COMMAND]
Retain all branding and logos from Image 1. 
Render in 4K photorealistic quality. 
Ensure the model's skin tone matches the reference exactly.
```

---

## 4. How the "Input" is Taken
1. **Visual Input:** Taken as raw base64 data via the `uploadedFile` state.
2. **Text Input:** Taken as a string via the `prompt` state.
3. **Preset Input:** Taken as pre-written technical descriptions from the `STANDARD_POSITIONS` array.
4. **Logic Assembly:** The `buildEditPrompt` function in `geminiService.ts` acts as the "Assembler" that stitches these four inputs into the final logic string.
