
import { supabase } from './supabase';
import type { SavedModel } from '../types';

const MODELS_TABLE = 'models';

const processModelImageToBase64 = (source: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_DIM = 1024;
            if (width > MAX_DIM || height > MAX_DIM) {
                if (width > height) {
                    height = (height / width) * MAX_DIM;
                    width = MAX_DIM;
                } else {
                    width = (width / height) * MAX_DIM;
                    height = MAX_DIM;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            } else {
                reject(new Error("Failed to get canvas context"));
            }
        };
        img.onerror = () => reject(new Error("Failed to load image for processing"));
        img.src = source;
    });
};

export const fetchModelsFromDB = async (userId: string): Promise<SavedModel[]> => {
  const { data, error } = await supabase
    .from(MODELS_TABLE)
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error("Error fetching models:", error);
    return [];
  }
  return data as SavedModel[];
};

export const saveModelToDB = async (model: SavedModel): Promise<SavedModel> => {
  let finalImageSrc = model.imageSrc;
  if (model.imageSrc.startsWith('data:')) {
    finalImageSrc = await processModelImageToBase64(model.imageSrc);
  }

  const { data, error } = await supabase
    .from(MODELS_TABLE)
    .insert([{
      userId: model.userId,
      name: model.name,
      type: model.type,
      modelType: model.modelType,
      imageSrc: finalImageSrc,
      description: model.description,
      isActive: model.isActive,
      attributes: model.attributes,
      createdAt: Date.now()
    }])
    .select();

  if (error) throw error;
  return data[0] as SavedModel;
};

export const updateModelInDB = async (model: SavedModel): Promise<SavedModel> => {
  let finalImageSrc = model.imageSrc;
  if (model.imageSrc.startsWith('data:')) {
    finalImageSrc = await processModelImageToBase64(model.imageSrc);
  }

  const { data, error } = await supabase
    .from(MODELS_TABLE)
    .update({
      name: model.name,
      type: model.type,
      modelType: model.modelType,
      imageSrc: finalImageSrc,
      description: model.description,
      isActive: model.isActive,
      attributes: model.attributes
    })
    .eq('id', model.id)
    .select();

  if (error) throw error;
  return data[0] as SavedModel;
};

export const deleteModelFromDB = async (modelId: string): Promise<void> => {
  const { error } = await supabase
    .from(MODELS_TABLE)
    .delete()
    .eq('id', modelId);
  if (error) throw error;
};
