
import { supabase } from './supabase';
import type { SavedDimension } from '../types';

const DIMENSIONS_TABLE = 'dimensions';

export const fetchDimensionsFromDB = async (userId: string): Promise<SavedDimension[]> => {
  const { data, error } = await supabase
    .from(DIMENSIONS_TABLE)
    .select('*')
    .eq('userId', userId);
  return error ? [] : data as SavedDimension[];
};

export const saveDimensionToDB = async (dimension: SavedDimension): Promise<SavedDimension> => {
  const { data, error } = await supabase
    .from(DIMENSIONS_TABLE)
    .insert([{
      name: dimension.name,
      width: dimension.width,
      height: dimension.height,
      description: dimension.description,
      userId: dimension.userId,
      isActive: dimension.isActive,
      isSystem: dimension.isSystem,
      originalId: dimension.originalId,
      createdAt: Date.now()
    }])
    .select();
  if (error) throw error;
  return data[0] as SavedDimension;
};

export const updateDimensionInDB = async (dimension: SavedDimension): Promise<SavedDimension> => {
    const { data, error } = await supabase
        .from(DIMENSIONS_TABLE)
        .update({
            name: dimension.name,
            width: dimension.width,
            height: dimension.height,
            description: dimension.description,
            isActive: dimension.isActive
        })
        .eq('id', dimension.id)
        .select();
    if (error) throw error;
    return data[0] as SavedDimension;
};

export const deleteDimensionFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from(DIMENSIONS_TABLE).delete().eq('id', id);
  if (error) throw error;
};

export const setActiveSystemDimension = async (userId: string, dimension: SavedDimension): Promise<void> => {
    // Deactivate all for user first
    await supabase.from(DIMENSIONS_TABLE).update({ isActive: false }).eq('userId', userId);
    
    // Check if system placeholder exists
    const { data: existing } = await supabase
        .from(DIMENSIONS_TABLE)
        .select('id')
        .eq('userId', userId)
        .eq('isSystem', true)
        .single();

    const systemData = {
        name: dimension.name,
        width: dimension.width,
        height: dimension.height,
        description: dimension.description,
        userId,
        isActive: true,
        isSystem: true,
        originalId: dimension.id
    };

    if (existing) {
        await supabase.from(DIMENSIONS_TABLE).update(systemData).eq('id', existing.id);
    } else {
        await supabase.from(DIMENSIONS_TABLE).insert([systemData]);
    }
};
