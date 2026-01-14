import React from 'react';

export enum ModelType {
  Male = 'Male Model',
  Female = 'Female Model',
  Influencer = 'Influencer Style',
  Fashion = 'High Fashion',
  Unisex = 'Unisex / Androgynous',
}

export enum Background {
  Studio = 'Clean Studio',
  Outdoor = 'Natural Outdoor',
  Urban = 'Urban Cityscape',
  Minimalist = 'Minimalist Abstract',
  Luxury = 'Luxury Interior',
}

export enum ShotType {
  Standard = 'Standard Set',
  CloseUp = 'Close-up Set',
  OutdoorCloseUp = 'Outdoor Close-up Set',
}

export enum Pose {
    FrontViewFull = 'POSE:FRONT_FULL - Full body frontal standing, arms relaxed at sides, feet shoulder-width apart, neutral expression',
    FrontRelaxed = 'POSE:FRONT_RELAXED - Full body frontal, relaxed stance with weight on one leg, casual posture',
    FrontConfident = 'POSE:FRONT_CONFIDENT - Full body frontal, confident stance with chest out, shoulders back',
    FrontHandsPockets = 'POSE:FRONT_HANDS_POCKETS - Full body frontal, both hands in pockets, casual confident stance',
    FrontOneHandPocket = 'POSE:FRONT_ONE_POCKET - Full body frontal, one hand in pocket, other arm relaxed',
    FrontHandsHips = 'POSE:FRONT_HANDS_HIPS - Full body frontal, hands on hips, elbows out, assertive pole',
    FrontOneHandHip = 'POSE:FRONT_ONE_HIP - Full body frontal, one hand on hip, other relaxed',
    FrontArmsCrossed = 'POSE:FRONT_ARMS_CROSSED - Full body frontal, arms crossed across chest, confident stance',
    FrontArmsRelaxed = 'POSE:FRONT_ARMS_RELAXED - Full body frontal, arms hanging naturally, relaxed fingers',
    FrontHandsBehind = 'POSE:FRONT_HANDS_BEHIND - Full body frontal, hands clasped behind back, upright posture',
    FrontLookingDown = 'POSE:FRONT_LOOKING_DOWN - Full body frontal, model looking downward at 45°, contemplative mood',
    FrontLookingUp = 'POSE:FRONT_LOOKING_UP - Full body frontal, chin slightly up',
    FrontHeadTilt = 'POSE:FRONT_HEAD_TILT - Full body frontal, head gently tilted to one side, friendly approachable',
    FrontThreeQuarter = 'POSE:FRONT_THREE_QUARTER - Full body, body angled 45° from camera, head facing camera',
    FrontThreeQuarterWalking = 'POSE:FRONT_THREE_QUARTER_WALKING - Full body, angled 45°, mid-stride walking',
    FrontWalking = 'POSE:FRONT_WALKING - Full body frontal, mid-stride walking toward camera, natural movement',
    FrontDynamic = 'POSE:FRONT_DYNAMIC - Full body frontal, weight shifted to one leg, hip popped, S-curve silhouette',
    BackViewFull = 'POSE:BACK_FULL - Full body rear view, facing 180° away, straight posture, arms at sides',
    BackRelaxed = 'POSE:BACK_RELAXED - Full body rear view, relaxed stance, weight on one leg',
    BackConfident = 'POSE:BACK_CONFIDENT - Full body rear view, confident upright posture',
    BackHandsPockets = 'POSE:BACK_HANDS_POCKETS - Full body rear view, hands in back pockets, casual stance',
    BackOneHandPocket = 'POSE:BACK_ONE_POCKET - Full body rear view, one hand in pocket, casual',
    BackArmsCrossed = 'POSE:BACK_ARMS_CROSSED - Full body rear view, arms crossed behind back',
    BackHandsHips = 'POSE:BACK_HANDS_HIPS - Full body rear view, hands on hips from behind',
    BackLookingOver = 'POSE:BACK_LOOKING_OVER - Full body rear view, looking over shoulder at camera, face partially visible',
    BackLookingOverLeft = 'POSE:BACK_LOOKING_LEFT - Full body rear view, looking over left shoulder',
    BackLookingOverRight = 'POSE:BACK_LOOKING_RIGHT - Full body rear view, looking over right shoulder',
    BackThreeQuarter = 'POSE:BACK_THREE_QUARTER - Full body, body at 135° showing back and side, head facing away',
    BackWalking = 'POSE:BACK_WALKING - Full body rear view, walking away from camera',
    SideProfile = 'POSE:SIDE_PROFILE - Full body perfect 90° side profile, arms at sides, head facing forward',
    SideRelaxed = 'POSE:SIDE_RELAXED - Full body side profile, relaxed stance, weight on back leg',
    SideConfident = 'POSE:SIDE_CONFIDENT - Full body side profile, upright confident posture',
    SideHandsPockets = 'POSE:SIDE_HANDS_POCKETS - Full body side profile, hands in pockets',
    SideOneHandPocket = 'POSE:SIDE_ONE_POCKET - Full body side profile, one hand in pocket',
    SideArmsCrossed = 'POSE:SIDE_ARMS_CROSSED - Full body side profile, arms crossed across chest',
    SideOneHandHip = 'POSE:SIDE_ONE_HIP - Full body side profile, near-camera hand on hip',
    SideLookingCamera = 'POSE:SIDE_LOOKING_CAMERA - Full body side profile, head turned to look at camera',
    SideLookingForward = 'POSE:SIDE_LOOKING_FORWARD - Full body side profile, head facing straight ahead',
    SideWalking = 'POSE:SIDE_WALKING - Full body side profile, mid-stride walking across frame',
    SideThreeQuarterAngle = 'POSE:SIDE_THREE_QUARTER_ANGLE - Side angle at 45°, arms visible, showing profile and front at angle',
    WaistUp = 'POSE:WAIST_UP - Waist-up frontal, arms relaxed at sides from elbows up',
    WaistUpRelaxed = 'POSE:WAIST_UP_RELALAXED - Waist-up frontal, relaxed casual posture',
    WaistUpConfident = 'POSE:WAIST_UP_CONFIDENT - Waist-up frontal, confident upright posture',
    WaistUpHandsPockets = 'POSE:WAIST_UP_HANDS_POCKETS - Waist-up frontal, hands in pockets',
    WaistUpOneHandPocket = 'POSE:WAIST_UP_ONE_POCKET - Waist-up frontal, one hand in pocket',
    WaistUpArmsCrossed = 'POSE:WAIST_UP_ARMS_CROSSED - Waist-up frontal, arms crossed across chest',
    WaistUpHandsHips = 'POSE:WAIST_UP_HANDS_HIPS - Waist-up frontal, hands on hips',
    WaistUpOneHandNeck = 'POSE:WAIST_UP_HAND_NECK - Waist-up frontal, one hand near neck/collar',
    WaistUpAdjustingCollar = 'POSE:WAIST_UP_ADJUSTING - Waist-up frontal, hand adjusting collar or cuff',
    WaistUpLookingDown = 'POSE:WAIST_UP_LOOKING_DOWN - Waist-up frontal, looking downward',
    WaistUpThreeQuarter = 'POSE:WAIST_UP_THREE_QUARTER - Waist-up, body angled 45°, head facing camera',
    WaistUpBack = 'POSE:WAIST_UP_BACK - Waist-up rear view from waist to head',
    CloseUp = 'POSE:CLOSE_UP - Chest to head close-up, frontal view, focus on upper garment details',
    CloseUpStraight = 'POSE:CLOSE_UP_STRAIGHT - Chest to head close-up, perfectly centered frontal',
    CloseUpRelaxed = 'POSE:CLOSE_UP_RELAXED - Chest to head close-up, relaxed natural expression',
    CloseUpLookingDown = 'POSE:CLOSE_UP_LOOKING_DOWN - Chest to head close-up, looking downward showing collar/neckline',
    CloseUpLookingUp = 'POSE:CLOSE_UP_LOOKING_UP - Chest to head close-up, chin slightly up',
    CloseUpHeadTilt = 'POSE:CLOSE_UP_HEAD_TILT - Chest to head close-up, head tilted gently',
    CloseUpThreeQuarter = 'POSE:CLOSE_UP_THREE_QUARTER - Chest to head close-up, body angled 45°',
    CloseUpSideAngle = 'POSE:CLOSE_UP_SIDE - Chest to head close-up from 90° side angle',
    WalkingFront = 'POSE:WALKING_FRONT - Full body walking toward camera, mid-stride',
    WalkingAway = 'POSE:WALKING_AWAY - Full body walking away from camera',
    WalkingSide = 'POSE:WALKING_SIDE - Full body walking across frame in profile',
    TurningAround = 'POSE:TURNING - Full body mid-turn motion, dynamic movement',
    StridingForward = 'POSE:STRIDING - Full body long confident stride forward',
    CasualStanding = 'POSE:CASUAL_STANDING - Full body casual natural standing pole',
    CasualLeaning = 'POSE:CASUAL_LEANING - Full body leaning against invisible wall/surface',
    OutdoorCasual = 'POSE:OUTDOOR_CASUAL - Full body natural outdoor casual pose',
    OutdoorWalking = 'POSE:OUTDOOR_WALKING - Full body casual walking in natural environment',
    OutdoorStanding = 'POSE:OUTDOOR_STANDING - Full body standing in outdoor setting',
    HighAngleFront = 'POSE:HIGH_ANGLE_FRONT - Full body frontal, camera angle from above looking down',
    LowAngleFront = 'POSE:LOW_ANGLE_FRONT - Full body frontal, camera angle from below looking up',
    DiagonalRight = 'POSE:DIAGONAL_RIGHT - Full body, model angled with right shoulder forward',
    DiagonalLeft = 'POSE:DIAGONAL_LEFT - Full body, model angled with left shoulder forward',
    CasualSitting = 'POSE:CASUAL_SITTING - Model sitting casually, focus on upper body and garment drape',
    EdgeSitting = 'POSE:EDGE_SITTING - Model sitting on edge of surface, feet on ground',
    SittingOnStool = 'POSE:SITTING_ON_STOOL - Sitting on stool with elbows resting on thighs, casual relaxed pose',
    DramaticPose = 'POSE:DRAMATIC - Full body dramatic fashion pose, high fashion editorial style',
    PowerPose = 'POSE:POWER_POSE - Full body confident power stance, commanding presence',
    
    // DETAILED SHOTS - ON MODEL (not table-top)
    ChestDetailOnModel = 'POSE:CHEST_DETAIL_ON_MODEL - Extreme close-up of chest/pocket area while worn, model visible but blurred in background, focus on embroidery/logo/design on chest',
    SleeveDetailOnModel = 'POSE:SLEEVE_DETAIL_ON_MODEL - Extreme close-up of sleeve detail while worn, model arm visible, focus on patch/embroidery/design on sleeve',
    CollarDetailOnModel = 'POSE:COLLAR_DETAIL_ON_MODEL - Extreme close-up of collar/neckline while worn, model neck/chin visible, focus on collar construction/buttons/design',
    PocketDetailOnModel = 'POSE:POCKET_DETAIL_ON_MODEL - Extreme close-up of pocket detail while worn, focus on pocket embroidery/stitching/design',
    HemDetailOnModel = 'POSE:HEM_DETAIL_ON_MODEL - Extreme close-up of hem/bottom detail while worn, focus on side split/stitching/construction',
    BackDetailOnModel = 'POSE:BACK_DETAIL_ON_MODEL - Extreme focus on back logo while worn',
    ButtonPlacketDetail = 'POSE:BUTTON_PLACKET_DETAIL - Extreme close-up of button placket while worn, focus on button quality and stitching'
}

export interface ModelAttributes {
  gender: 'male' | 'female';
  ethnicity?: string;
  age?: string;
  ageRange?: string;
  bodyType?: string;
  skinTone?: string;
  hairColor?: string;
  hairStyle?: string;
  hairLength?: string;
  hairType?: string;
  eyeColor?: string;
  facialHair?: string;
  makeup?: string;
  nailColor?: string;
  topColor?: string;
  topStyle?: string;
  bottomColor?: string;
  bottomStyle?: string;
  shoesColor?: string;
  shoesStyle?: string;
  accessories?: string[];
  clothingTop?: string;
  clothingBottom?: string;
  footwear?: string;
}

export interface PoseVariation {
    code: string;
    name: string;
    description: string;
}

export interface PoseCategory {
    id: string;
    name: string;
    icon: string;
    poses: PoseVariation[];
}

export enum Lighting {
  Studio = 'Bright Studio Light',
  GoldenHour = 'Golden Hour Sunlight',
  Dramatic = 'Dramatic Shadows',
  Neon = 'Neon / Cyberpunk',
  Soft = 'Soft & Diffused',
}

export enum ProductCategory {
    Top = 'Top',
    Bottom = 'Bottom',
    FullBody = 'Full Body',
    CoordSet = 'Co-ord Set',
    Accessory = 'Accessory',
    Innerwear = 'Innerwear',
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | string;

export interface SavedDimension {
    id: string;
    name: string;
    width: number;
    height: number;
    description?: string;
    userId?: string;
    isActive?: boolean;
    isSystem?: boolean; 
    originalId?: string;
    createdAt?: number;
}

export interface Position {
    id: string;
    code: number | string;
    name: string;
    description: string;
    prompt: string;
    icon?: React.FC<{ className?: string }> | any;
}

export interface Sequence {
    id: string;
    name: string;
    shots: Position[];
    isActive: boolean;
    userId?: string;
}

export interface LogoConfiguration {
    id: string;
    name: string;
    imageUrl: string;
    position: 'Top Left' | 'Top Right' | 'Bottom Left' | 'Bottom Right' | 'Center';
    opacity: number;
    scale: number;
    userId?: string;
    updatedAt?: number;
    isActive: boolean;
}

export interface TextConfiguration {
    id: string;
    name: string;
    textContent: string;
    position: 'Top Left' | 'Top Right' | 'Bottom Left' | 'Bottom Right' | 'Center' | 'Top Center' | 'Bottom Center';
    color: string;
    fontSize: number;
    opacity: number;
    userId?: string;
    updatedAt?: number;
    isActive: boolean;
}

export interface ProjectTemplate {
    id: string;
    name: string;
    userId: string;
    modelId: string;
    sequenceId: string;
    dimensionId: string;
    logoId?: string;
    textId?: string;
    background?: Background;
    backgroundColorHex?: string;
    lighting?: Lighting;
    createdAt: number;
}

export interface GenerationOptions {
  prompt: string;
  customInstructions?: string; 
  modelType: ModelType;
  background: Background;
  backgroundColorHex?: string;
  lighting: Lighting;
  shotType: ShotType;
  uploadedFile?: File | null;
  uploadedFileBack?: File | null; 
  uploadedFileFabric?: File | null; 
  uploadedFileRef?: File | null;
  uploadedFileStyleRef?: File | null; // NEW: Style Reference for drapes/pleats
  uploadedFileTop?: File | null;
  uploadedFileBottom?: File | null;
  productCategory: ProductCategory;
  aspectRatio: AspectRatio;
  modelImageSrc?: string;
  modelDescription?: string;
  modelAttributes?: ModelAttributes; 
  sequenceShots?: string[];
  logoConfig?: LogoConfiguration;
  textConfig?: TextConfiguration;
  folderName?: string; // Track source folder for ZIP organization

  // Edit mode fields for Model Preservation / Outfit Swap
  modelLockImage?: string; 
  isEditMode?: boolean; 
}

export interface GeneratedImage {
  id: string;
  src: string;
  prompt: string;
  folderName?: string; // ZIP organization
  usage?: {
    totalTokens: number;
  };
}

export interface AssistantMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    image?: string;
    resultImages?: GeneratedImage[];
    isGenerating?: boolean;
    isBatch?: boolean;
    batchCount?: number;
    productFolderName?: string; // Track which product folder these results belong to
}

export type ModelSourceType = 'Prebuilt' | 'Attribute' | 'Custom';

export interface SavedModel {
  id: string;
  userId: string;
  name: string;
  type: ModelSourceType;
  modelType: ModelType;
  imageSrc: string;
  description: string;
  isActive: boolean;
  createdAt?: number;
  attributes: ModelAttributes;
}

export type ModelCreationTab = 'prebuilt' | 'attribute' | 'custom';

export const SKIN_TONES = ['Fair', 'Light', 'Medium', 'Tan', 'Deep', 'Rich Deep'];
export const HAIR_COLORS = ['Black', 'Dark Brown', 'Brown', 'Light Brown', 'Blonde', 'Platinum Blonde', 'Red', 'Auburn', 'Grey', 'White'];
export const AGE_RANGES = ['Child', 'Teen', 'Young Adult', 'Adult', 'Middle Aged', 'Senior'];
export const ETHNICITIES = ['Caucasian', 'African', 'East Asian', 'South Asian', 'Hispanic/Latino', 'Middle Eastern', 'Mixed Heritage'];

export const MALE_BODY_TYPES = ['Lean', 'Average', 'Athletic', 'Muscular', 'Stocky', 'Plus Size'];
export const MALE_HAIR_STYLES = ['Short Cropped', 'Buzz Cut', 'Fade', 'Pompadour', 'Side Part', 'Man Bun', 'Long Wavy', 'Bald'];
export const FACIAL_HAIR_STYLES = ['Clean Shaven', 'Stubble', 'Short Beard', 'Full Beard', 'Goatee', 'Mustache'];
export const MALE_TOP_STYLES = ['T-Shirt', 'Polo Shirt', 'Button-down Shirt', 'Hoodie', 'Sweater', 'Blazer'];
export const MALE_BOTTOM_STYLES = ['Slim Fit Jeans', 'Regular Fit Jeans', 'Chinos', 'Cargo Pants', 'Shorts', 'Dress Pants'];
export const MALE_SHOE_STYLES = ['White Sneakers', 'Black Sneakers', 'Loafers', 'Boots', 'Dress Shoes'];

export const FEMALE_BODY_TYPES = ['Slim/Petite', 'Average', 'Athletic', 'Curvy', 'Plus Size'];
export const FEMALE_HAIR_STYLES = ['Straight Long', 'Wavy Long', 'Curly Long', 'Straight Bob', 'Pixie Cut', 'High Ponytail', 'Braid', 'Bald'];
export const MAKEUP_STYLES = ['Natural/Minimal', 'Clean Beauty', 'Glamorous', 'Smokey Eye', 'Bold Lip', 'No Makeup'];
export const FEMALE_TOP_STYLES = ['T-Shirt', 'Blouse', 'Crop Top', 'Tank Top', 'Sweater', 'Hoodie'];
export const FEMALE_BOTTOM_STYLES = ['Skinny Jeans', 'Leggings', 'Mini Skirt', 'Midi Skirt', 'Wide Leg Pants', 'Shorts'];
export const FEMALE_SHOE_STYLES = ['White Sneakers', 'High Heels', 'Ankle Boots', 'Sandals', 'Flats'];

export type VideoResolution = '1:1' | '16:9' | '9:16';
export type VideoStyle = 'Studio Pan & Zoom' | 'Zoom Focus' | 'Dynamic Pan' | '360° Turn';
export type VideoDuration = '2s' | '4s' | '6s' | '8s' | '10s' | '12s';

export interface CatalogAnalysis {
    catalog_use: "photoshoot";
    product_type: "top" | "bottom" | "dress" | "co-ord set" | "accessory";
    top?: {
        visual_length: string;
        visual_length_category?: string;
        sleeve_length: "sleeveless" | "short" | "half" | "3/4" | "full";
        fit: "slim" | "straight" | "relaxed" | "oversized";
        fit_description?: string;
        neck_type: string;
        closure: string;
    };
    bottom?: {
        visual_length: string;
        visual_length_category?: string;
        rise: "low" | "mid" | "high";
        rise_description?: string;
        fit: "slim" | "straight" | "relaxed" | "wide-leg";
        fit_description?: string;
        style: "straight" | "flared" | "wide-leg" | "palazzo" | "tapered";
        
        // Dhoti/Style specific
        drape_style?: string;           // "dhoti", "palazzo", "churidar"
        pleating_pattern?: string;      // "center pleat", "side pleat", "gathered"
        bottom_finish?: string;         // "cuffed", "gathered at ankle", "floor length"
        fall_pattern?: string;          // "loose fall", "tight gather", "draped"
    };
    critical_measurements?: {
        top_hem_landmark: string;
        bottom_hem_landmark: string;
        confidence: string;
    };
    style_details?: {
        drape_type: string;
        pleating_style: string;
        gather_position: string;
        fall_description: string;
    };
}
