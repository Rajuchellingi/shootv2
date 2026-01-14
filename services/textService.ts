
import { supabase } from './supabase';
import { TextConfiguration } from '../types';

const TEXTS_TABLE = 'texts';

export const fetchTexts = async (userId: string): Promise<TextConfiguration[]> => {
    const { data, error } = await supabase
        .from(TEXTS_TABLE)
        .select('*')
        .eq('userId', userId)
        .order('updatedAt', { ascending: false });
    return error ? [] : data as TextConfiguration[];
};

export const saveText = async (userId: string, textConfig: TextConfiguration): Promise<TextConfiguration> => {
    const textData = {
        name: textConfig.name,
        textContent: textConfig.textContent,
        position: textConfig.position,
        color: textConfig.color,
        fontSize: textConfig.fontSize,
        opacity: textConfig.opacity,
        userId,
        isActive: textConfig.isActive,
        updatedAt: Date.now()
    };

    let result;
    if (textConfig.id && textConfig.id.length > 5) {
        result = await supabase.from(TEXTS_TABLE).update(textData).eq('id', textConfig.id).select();
    } else {
        result = await supabase.from(TEXTS_TABLE).insert([textData]).select();
    }

    if (result.error) throw result.error;
    return result.data[0] as TextConfiguration;
};

export const updateTextInDB = async (textConfig: Partial<TextConfiguration> & { id: string }): Promise<void> => {
    const { error } = await supabase.from(TEXTS_TABLE).update(textConfig).eq('id', textConfig.id);
    if (error) throw error;
};

export const deleteText = async (textId: string): Promise<void> => {
    const { error } = await supabase.from(TEXTS_TABLE).delete().eq('id', textId);
    if (error) throw error;
};
