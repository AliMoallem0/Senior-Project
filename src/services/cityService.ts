import { supabase } from '@/lib/supabase';

export interface City {
  id: string;
  name: string;
  country: string;
  population: number;
  description: string;
  image_url: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface SimulationProject {
  id: string;
  user_id: string;
  city_id: string;
  name: string;
  type: string;
  description: string;
  location: string;
  goals: string;
  created_at: string;
  parameters: {
    roads: number;
    population: number;
    housing: number;
    public_transport: number;
  };
}

export interface SimulationResult {
  id: string;
  project_id: string;
  congestion: number;
  satisfaction: number;
  emissions: number;
  transitUsage: number;
  created_at: string;
}

export interface CityParameters {
  roads: number;
  population: number;
  housing: number;
  public_transport: number;
}

// City functions
export const getCities = async (): Promise<City[]> => {
  const { data, error } = await supabase
    .from('cities')
    .select('*');
  
  if (error) throw error;
  return data;
};

export const getCityById = async (id: string): Promise<City | null> => {
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Simulation project functions
export const getProjects = async (userId: string): Promise<SimulationProject[]> => {
  const { data, error } = await supabase
    .from('simulation_projects')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data;
};

export const createProject = async (project: Omit<SimulationProject, 'id' | 'created_at'>): Promise<SimulationProject> => {
  const { data, error } = await supabase
    .from('simulation_projects')
    .insert(project)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateProject = async (id: string, updates: Partial<SimulationProject>): Promise<SimulationProject> => {
  const { data, error } = await supabase
    .from('simulation_projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteProject = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('simulation_projects')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Simulation results functions
export const saveSimulationResult = async (result: Omit<SimulationResult, 'id' | 'created_at'>): Promise<SimulationResult> => {
  const { data, error } = await supabase
    .from('simulation_results')
    .insert(result)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getSimulationResults = async (projectId: string): Promise<SimulationResult[]> => {
  const { data, error } = await supabase
    .from('simulation_results')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};
