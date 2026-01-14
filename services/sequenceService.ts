
import { supabase } from './supabase';
import type { Sequence, Position } from '../types';
import { STANDARD_POSITIONS } from '../components/PositionView';
import { LayersIcon } from '../components/Icons';

const SEQUENCES_TABLE = 'sequences';

const hydrateSequence = (data: any): Sequence => {
    const hydratedShots = (data.shots || []).map((shot: any) => {
        const std = STANDARD_POSITIONS.find(s => s.code === shot.code);
        return {
            ...shot,
            icon: std ? std.icon : LayersIcon
        } as Position;
    });
    return { ...data, shots: hydratedShots } as Sequence;
};

export const fetchSequencesFromDB = async (userId: string): Promise<Sequence[]> => {
  const { data, error } = await supabase
    .from(SEQUENCES_TABLE)
    .select('*')
    .eq('userId', userId);

  if (error) {
    console.error("Error fetching sequences:", error);
    return [];
  }
  return data.map(hydrateSequence);
};

export const saveSequenceToDB = async (sequence: Sequence): Promise<Sequence> => {
  const { data, error } = await supabase
    .from(SEQUENCES_TABLE)
    .insert([{
      name: sequence.name,
      shots: sequence.shots.map(s => ({ id: s.id, code: s.code, name: s.name, description: s.description, prompt: s.prompt })),
      isActive: sequence.isActive,
      userId: sequence.userId,
      createdAt: Date.now()
    }])
    .select();

  if (error) throw error;
  return hydrateSequence(data[0]);
};

export const updateSequenceInDB = async (sequence: Sequence): Promise<Sequence> => {
  const { data, error } = await supabase
    .from(SEQUENCES_TABLE)
    .update({
      name: sequence.name,
      shots: sequence.shots.map(s => ({ id: s.id, code: s.code, name: s.name, description: s.description, prompt: s.prompt })),
      isActive: sequence.isActive
    })
    .eq('id', sequence.id)
    .select();

  if (error) throw error;
  return hydrateSequence(data[0]);
};

export const deleteSequenceFromDB = async (sequenceId: string): Promise<void> => {
  const { error } = await supabase
    .from(SEQUENCES_TABLE)
    .delete()
    .eq('id', sequenceId);
  if (error) throw error;
};
