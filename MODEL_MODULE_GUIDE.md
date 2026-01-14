# Module 4: Model Persona Engine Documentation

This document explains the technical inner workings of the Model Persona Engine in Studio.AI.

## 1. Overview
The Model Persona Engine ensures visual consistency by defining the "identity" of the human model before any photoshoot begins. It prevents facial and body variations across different camera angles.

## 2. The Three Creation Workflows

### A. Prebuilt AI Models
- **Source:** Curated studio database.
- **Logic:** High-fidelity image anchors.
- **Use Case:** Fastest professional results using industry-standard models.

### B. Attribute-Based Creation (The "Attribute Assembler")
- **Source:** 12-point physical attribute menu.
- **Logic:** The "Attribute Assembler" logic template.
- **Process:** 
    1. User selects traits (Ethnicity, Age, Hair, etc.).
    2. Logic template compiles these into a 150-word "Identity String".
    3. Identity String is used as the primary anchor for the AI Generation Engine.
- **Attributes Tracked:**
    - Gender, Age Range, Ethnicity, Skin Tone.
    - Body Type, Eye Color.
    - Hair Length, Hair Type, Hair Color.
    - Wardrobe Fallbacks (Clothing for non-product areas).

### C. Custom Reference (Face-Locking)
- **Source:** User-uploaded photo.
- **Logic:** Spatial Identity Mapping.
- **Use Case:** Using specific real-world people or brand ambassadors as the AI model.

---

## 3. Attribute Assembler Logic
The "Attribute Assembler" is the only AI prompt within this module. It turns menu selections into a professional model specification:

**Technical Spec Example:**
> "TASK: Generate a Persona Identity.
> IDENTITY: {Gender}, {Age}, {Ethnicity}.
> FEATURES: {Skin Tone} skin, {Body Type} build, {Eye Color} eyes.
> HAIR: {Length}, {Type}, {Color}.
> WARDROBE: Ensure model wears {ClothingTop} and {ClothingBottom} as fallback context.
> QUALITY: Photorealistic skin shaders, consistent anatomical proportions."

---

## 4. Integration Logic (Persona Injection)
Once a model is defined, its data is "Injected" into the Master Generation Engine:

1. **Identity Injection:** The persona string is placed at the top of the Generation Prompt.
2. **Skin Tone Persistence:** Strict skin tone keywords are used to prevent color shifting in different lighting.
3. **Wardrobe Synchronization:** The Model Persona ensures the model's outfit (trousers/shoes) remains the same even when the main product (e.g., a shirt) is the focus.

## 5. Summary Table

| Method | Prompt Count | Primary Logic |
| :--- | :---: | :--- |
| **Prebuilt** | 0 | Reference Image |
| **Attribute** | 1 | Attribute Assembler (Logic Template) |
| **Custom** | 0 | Spatial Reference Mapping |
| **TOTAL** | **1** | |
