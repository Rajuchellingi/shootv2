# Module 7: Background Changer - AI Environment Mapping

The Background Changer is a high-precision generative tool designed to swap product environments while maintaining subject integrity and realistic lighting interaction.

---

## 1. Overview: Generative Replacement
Unlike traditional "Background Removal" (which simply cuts out a subject), the Studio.AI Background Changer uses **Generative Filling**.
- **The Process:** The AI identifies the subject, segments it from the existing scene, and then "re-renders" the environment based on a specific color or lighting request.
- **The Benefit:** It preserves complex edges like hair and translucent fabric while adding a "Contact Shadow" to ground the object in the new space, preventing a floating "sticker" look.

---

## 2. The Replacement Logic (The "How")
The `replaceBackgroundImage` function in `geminiService.ts` utilizes a specialized prompt structure:

1.  **Segmentation Instructions:** Commands the model to cut out the subject with "pixel-perfect precision" focusing on hair and fur.
2.  **Contact Shadows:** A specific rule to retain or create a subtle shadow under the feet/base of the product to ensure physical realism.
3.  **Color Injection:** The user-provided Hex code is injected directly into the prompt as the "Target Color."

---

## 3. Special Case: Pure White (#FFFFFF)
E-commerce platforms (Amazon, eBay, Shopify) require "Pure White" backgrounds. The module includes a hard-coded logic branch:
- **Condition:** If the user selects `#FFFFFF` or `#FFF`.
- **Constraint:** The prompt switches to a "Strict Pure White" mode, instructing the AI to output exactly RGB (255, 255, 255) with zero gradients or vignettes. This bypasses the AI's natural tendency to create "Studio White" (light gray).

---

## 4. Input Types

| Component | Type | Description |
| :--- | :--- | :--- |
| **Source Image** | User Input | Any image containing a product or model. |
| **Hex Color** | User Input | The target background color (Visualized via color picker). |
| **Shadow Toggle** | Fixed Logic | Automatic application of grounding shadows. |

---

## 5. Technical Logic vs. User Input

| Category | Item | Description |
| :--- | :--- | :--- |
| **Fixed Logic** | `Segmentation` | Automated subject detection and masking. |
| **Fixed Logic** | `Shadow Mapping` | Generates a 2D drop shadow relative to the existing light source on the subject. |
| **User Input** | Source Asset | The image requiring environment modification. |
| **User Input** | Hex Selection | The specific aesthetic color choice. |

---

## 6. Integration: The "Quick Tool" Chain
The Background Changer functions as a standalone utility:
1.  **Subject Detection:** The AI identifies the core product.
2.  **Scene Erasure:** The background is removed while freezing the subject pixels.
3.  **Generative Filling:** The new color is rendered *behind* the subject.
4.  **Edge Smoothing:** The AI anti-aliases the subject edges against the new color to ensure a seamless blend.

---

## 7. Performance Note
To maintain speed, the Background Changer uses the `gemini-2.5-flash-image` model. This provides the optimal balance between high-quality edge detection and near-instant processing times (typically 3-5 seconds).