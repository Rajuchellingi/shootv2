# Module 5: Logo Setup - Brand Identity Compositing

The Logo Setup module is the "Final Polish" layer of the Studio.AI workflow. Unlike other modules that influence AI generation, this module uses deterministic post-processing to ensure brand marks are 100% accurate.

---

## 1. Overview: Compositing vs. Generation
A critical technical distinction of Studio.AI is that logos are **not** part of the AI prompt. 
- **The Problem:** Asking an AI to "generate a logo" often results in distorted text or blurry graphics.
- **The Solution:** Studio.AI generates the photorealistic scene first, then uses a **HTML5 Canvas Compositing Engine** to layer the original high-resolution logo asset on top. This ensures zero distortion and perfect color fidelity.

---

## 2. The Compositing Logic (The "How")
The module utilizes the `applyLogoOverlay` function in `geminiService.ts`, which follows these steps:

1.  **Asset Conversion:** The logo is converted to a high-resolution PNG with transparency preservation.
2.  **Spatial Calculation:** The system calculates the target coordinates based on the generated image's final resolution (e.g., 1536px) and the user's chosen **Position Preset**.
3.  **Dynamic Scaling:** The logo is scaled relative to the canvas width (e.g., a "20% scale" means the logo will always occupy 1/5th of the frame, regardless of aspect ratio).
4.  **Alpha Blending:** The `globalAlpha` property is adjusted based on the **Opacity Slider** before the final "Draw" command is executed.

---

## 3. Input Types & Presets

| Component | Type | Technical Value |
| :--- | :--- | :--- |
| **Branding Asset** | User Input | Base64 PNG (Transparent). |
| **Placement** | Content Preset | 5 Anchor Points (Top L/R, Bottom L/R, Center). |
| **Scale Factor** | User Input | 5% to 50% relative to frame. |
| **Transparency** | User Input | 10% to 100% alpha blending. |

---

## 4. Fixed Logic vs. User Input

| Category | Item | Description |
| :--- | :--- | :--- |
| **Fixed Logic** | `applyLogoOverlay` | The Canvas-based merger that prevents AI distortion of brand assets. |
| **Fixed Logic** | Padding Algorithm | Ensures logos never touch the absolute edge of the frame (5% safety margin). |
| **User Input** | Asset Upload | The specific logo file provided by the brand. |
| **User Input** | Style Settings | Opacity and Scale preferences for different campaigns. |

---

## 5. Integration: The "Post-Generation Chain"
The Logo Module is the final link in the chain:
1.  **AI Engine:** Generates the raw scene (Product + Model + BG).
2.  **Dimension Module:** Crops/resizes to the final canvas.
3.  **Logo Module:** Injects the watermark at the exact coordinates defined by the user.
4.  **Final Output:** A single, flattened JPEG ready for the e-commerce catalog.

---

## 6. Storage Strategy
To bypass CORS (Cross-Origin Resource Sharing) issues that often break logo overlays, the system:
- Resizes the logo to 800px max.
- Stores the processed version as a **Base64 string** directly in the Firestore document.
- This allows the canvas to "read" the logo immediately without needing to fetch from a separate server, ensuring 100% reliability in the browser.