# Module 2: Dimension Module - Spatial Architecture

The Dimension Module controls the frame size and aspect ratio of the generated assets, ensuring compatibility across web, social media, and print platforms.

---

## 1. Overview
This module acts as the "Canvas Definition" for the Generation Engine. It manages two primary data streams: Standard System Ratios (Presets) and User-Defined Custom Resolutions.

---

## 2. The Resolution Logic (The "How")
Since AI models (like Gemini) often require specific aspect ratio enums, the Dimension Module uses a **Mapping Algorithm** to ensure reliability:

### **The Mapping Algorithm**
1. **Raw Input:** The user selects a preset (e.g., "Portrait") or enters manual dimensions (e.g., 1080x1350).
2. **Ratio Calculation:** The system calculates the decimal ratio (e.g., 1080/1350 = 0.8).
3. **Enum Matching:** The engine compares this to a list of allowed AI enums (`1:1`, `4:5`, `9:16`, etc.) and selects the mathematically closest match to prevent "Black Bar" padding or unwanted stretching.

---

## 3. Input Types

| Input Category | Component | Technical Output |
| :--- | :--- | :--- |
| **Standard Presets** | 9:16 (Story), 1:1 (Post), etc. | Static Enums (Stored as System Records). |
| **Custom Input** | Width (W) + Height (H) | Dynamic Pixel Map + Calculated Aspect Ratio. |

---

## 4. Technical Logic vs. User Input

| Category | Item | Description |
| :--- | :--- | :--- |
| **Fixed Logic** | `getClosestAspectRatio` | The service logic that snaps custom sizes to supported AI aspect ratios. |
| **Fixed Logic** | Canvas Preview | The 2D scaling logic that renders the shape representation in the UI. |
| **User Input** | Preset Selection | Choosing from the 5 standard e-commerce/social formats. |
| **User Input** | Custom Pixel Set | Entering specific Width/Height values (e.g., for specific ad banners). |

---

## 5. Integration: The "Canvas Injection"
During the final generation call, the Dimension Module provides the **spatial constraints**:

> *System Configuration:*
> - `model`: gemini-2.5-flash-image
> - `config`: { 
>     `aspectRatio`: "{Calculated_Ratio}",
>     `resolution`: "4K_High_Fidelity"
>   }

---

## 6. Persistence Strategy (The "System Placeholder")
To save space in the database (Firebase), the module uses a "System Placeholder" logic:
- Selecting a standard ratio (e.g., 9:16) updates a single record labeled `isSystem: true`.
- This ensures the app remembers your last choice across sessions without creating thousands of duplicate records.