
import { supabase } from './supabase';
import { LogoConfiguration } from '../types';

const LOGOS_TABLE = 'logos';

const resizeImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_DIM = 800;
                if (width > height) {
                    if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
                } else {
                    if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/png')); }
                else reject(new Error("Canvas failure"));
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};

export const fetchLogos = async (userId: string): Promise<LogoConfiguration[]> => {
    const { data, error } = await supabase
        .from(LOGOS_TABLE)
        .select('*')
        .eq('userId', userId)
        .order('updatedAt', { ascending: false });
    return error ? [] : data as LogoConfiguration[];
};

export const saveLogo = async (userId: string, logo: LogoConfiguration, file?: File): Promise<LogoConfiguration> => {
    let finalImageUrl = logo.imageUrl;
    if (file) finalImageUrl = await resizeImageToBase64(file);

    const logoData = {
        name: logo.name,
        imageUrl: finalImageUrl,
        position: logo.position,
        opacity: logo.opacity,
        scale: logo.scale,
        userId,
        isActive: logo.isActive,
        updatedAt: Date.now()
    };

    let result;
    if (logo.id && logo.id.length > 5) {
        result = await supabase.from(LOGOS_TABLE).update(logoData).eq('id', logo.id).select();
    } else {
        result = await supabase.from(LOGOS_TABLE).insert([logoData]).select();
    }

    if (result.error) throw result.error;
    return result.data[0] as LogoConfiguration;
};

export const updateLogoInDB = async (logo: Partial<LogoConfiguration> & { id: string }): Promise<void> => {
    const { error } = await supabase.from(LOGOS_TABLE).update(logo).eq('id', logo.id);
    if (error) throw error;
};

export const deleteLogo = async (logoId: string): Promise<void> => {
    const { error } = await supabase.from(LOGOS_TABLE).delete().eq('id', logoId);
    if (error) throw error;
};
