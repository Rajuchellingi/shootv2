# Module 8: Image Editor - Generative Inpainting & Modification

The Image Editor is a flexible generative tool designed for non-destructive, instruction-based modifications of existing images.

---

## 1. Overview: Instruction-Based Editing
Unlike traditional pixel-pushing editors (like Photoshop's manual tools), the Studio.AI Image Editor uses **Generative Inpainting**. 
- **The Process:** The AI interprets a natural language request (e.g., "Add a watch," "Change hair to blonde") and re-renders only the relevant sections of the image while locking the rest of the composition.
- **The Advantage:** It maintains the lighting, shadows, and perspective of the original shot, ensuring that any added or modified elements look like they were part of the original photograph.

---

## 2. The Editing Logic (The "How")
The `editGeneratedImage` function in `geminiService.ts` wraps the user's request in a sophisticated **JSON-structured prompt**:

1.  **Request Typing:** Explicitly labeled as `GENERATIVE_EDIT`.
2.  **Pixel Freezing:** Commands the model to "Apply changes ONLY to the targeted area while freezing the rest of the image."
3.  **Physical Grounding:** Specifically instructs the model to ensure new objects "interact realistically with existing shadows and reflections."
4.  **Quality Enforcement:** Hard-coded requirement for "4K photorealistic quality" to match the rest of the catalog assets.

---

## 3. Capabilities & Use Cases

| Capability | Example Request | Technical Result |
| :--- | :--- | :--- |
| **Object Addition** | "Add a silver necklace" | The AI generates the item and calculates shadows on the model's skin. |
| **Attribute Swap** | "Change the eyes to blue" | Selective color and texture replacement within the iris boundaries. |
| **Scene Extension** | "Add more clouds to the sky" | Pattern continuation based on existing cloud styles in the frame. |
| **Material Shift** | "Make the fabric look like satin" | Re-rendering of highlights and reflections while keeping garment shape. |

---

## 4. Technical Logic vs. User Input

| Category | Item | Description |
| :--- | :--- | :--- |
| **Fixed Logic** | `Targeted Inpainting` | The prompt logic that prevents the AI from changing the entire image. |
| **Fixed Logic** | `Context Locking` | Ensures the model's identity and product SKU details aren't lost during the edit. |
| **User Input** | Source Asset | The base image selected from the gallery or uploaded manually. |
| **User Input** | Edit Instruction | The specific, free-form text command for the modification. |

---

## 5. Integration: The "Correction Loop"
The Image Editor serves as the primary "Fix-it" tool in the workflow:
1.  **Generation Result:** A user sees a perfect shot, but wants a different hair style.
2.  **Edit Request:** "Change hair to a sleek ponytail."
3.  **Re-Process:** The engine runs the Edit logic on the generated frame.
4.  **Final Asset:** The updated image is added to the gallery as a new iteration.

---

## 6. Performance & Limitations
- **Model:** Powered by `gemini-2.5-flash-image` for high-speed creative iteration.
- **Resolution:** The output is optimized for e-commerce grid standards (up to 1536px).
- **Instruction Clarity:** The success of the edit is directly proportional to the specificity of the instruction. "Add a watch" is good; "Add a silver minimalist watch with a black leather strap" is professional.