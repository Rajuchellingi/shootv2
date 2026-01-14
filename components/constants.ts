
import { ModelType, Background, Lighting, ShotType } from '../types';

export const MODEL_OPTIONS: ModelType[] = [
  ModelType.Female,
  ModelType.Male,
  ModelType.Influencer,
  ModelType.Fashion,
  ModelType.Unisex,
];

export const BACKGROUND_OPTIONS: Background[] = [
  Background.Studio,
  Background.Outdoor,
  Background.Urban,
  Background.Minimalist,
  Background.Luxury,
];

export const LIGHTING_OPTIONS: Lighting[] = [
  Lighting.Studio,
  Lighting.GoldenHour,
  Lighting.Dramatic,
  Lighting.Neon,
  Lighting.Soft,
];

export const SHOT_TYPE_OPTIONS: ShotType[] = [
  ShotType.Standard,
  ShotType.CloseUp,
  ShotType.OutdoorCloseUp,
];
