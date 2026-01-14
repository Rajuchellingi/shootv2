
import { supabase } from './supabase';
import type { ProjectTemplate } from '../types';

const TEMPLATES_TABLE = 'templates';

export const fetchTemplates = async (userId: string): Promise<ProjectTemplate[]> => {
  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false });
  return error ? [] : data as ProjectTemplate[];
};

export const saveTemplate = async (template: Omit<ProjectTemplate, 'id'>): Promise<ProjectTemplate> => {
  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .insert([template])
    .select();
  if (error) throw error;
  return data[0] as ProjectTemplate;
};

export const updateTemplate = async (template: ProjectTemplate): Promise<ProjectTemplate> => {
  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .update(template)
    .eq('id', template.id)
    .select();
  if (error) throw error;
  return data[0] as ProjectTemplate;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TEMPLATES_TABLE).delete().eq('id', id);
  if (error) throw error;
};
