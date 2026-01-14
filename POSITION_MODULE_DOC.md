# Module 3: Position Module - The Virtual Photographer

The Position Module acts as the "Director" of the photoshoot, standardizing framing and camera placement to ensure professional, catalog-ready results.

---

## 1. Overview
The module uses 9 pre-defined "Content Presets" that translate standard photography terms into technical instructions for the AI. This ensures that a "Side Profile" always looks like a side profile, regardless of the product or model chosen.

---

## 2. The 9 Standard Positions (Content Presets)
Each selection in the UI triggers a specific technical string injected into the Generation Engine:

1.  **Front View:** Direct 0° orientation. Focuses on the primary silhouette and front-facing branding.
2.  **Back View:** 180° orientation. Switches the "Source of Truth" to the Back Product Image if uploaded.
3.  **Three-Quarter (Left/Right):** 45° orientation. Provides depth and shows the transition between the front and side of the garment.
4.  **Side Profile:** 90° orientation. Focuses on the sleeve fit and the lateral silhouette.
5.  **Waist-Up (Medium):** Changes the focal length to a "Medium Shot." Essential for showing torso fit without distracting with legs/feet.
6.  **Full Body:** Changes the framing to include the model from head to toe, showing how the product interacts with the ground and footwear.
7.  **Detail Shot (Macro):** A high-priority "Close-up" instruction that forces the AI to focus on fabric weave, stitching, and micro-textures.
8.  **Top View (Flat Lay):** A bird's-eye perspective (90° downward), typically used for accessories or un-modeled items.

---

## 3. Sequence Logic (The Workflow)
The Position Module introduces the concept of **Shots Sequencing**:

- **Logic:** The app doesn't just generate one image; it iterates through a list of IDs.
- **User Input:** You "Assemble" a sequence by picking angles and dragging them into a specific order (e.g., 1. Front -> 2. Side -> 3. Detail).
- **Execution:** When you click "Generate," the engine runs a loop, swapping the [POSITION] variable in the Master Prompt for each item in your sequence.

---

## 4. Technical Logic vs. User Input

| Category | Component | Description |
| :--- | :--- | :--- |
| **Fixed Logic** | Camera Presets | Technical descriptions of lighting and lens height for each angle (e.g., "Eye-level shot, no crop"). |
| **Fixed Logic** | FOV Mapping | Standardizing the field of view so "Detail Shots" have a consistent zoom level. |
| **User Input** | Angle Selection | The specific preset(s) chosen by the user. |
| **User Input** | Custom Positions | A free-form text box for unique angles (e.g., "Low angle looking up, dramatic hero shot"). |

---

## 5. Integration: The "Photographer Injection"
In the final prompt assembly, the Position Module provides the **spatial context**:

> *"CAMERA SETTING: Generate a {Position_Preset_Name}. The frame must be {Description_of_Framing}. Distance: {Zoom_Level}. Elevation: {Lens_Height}."*

This prevents the AI from choosing its own "creative" angles and ensures your entire product line has a consistent look across the website grid.