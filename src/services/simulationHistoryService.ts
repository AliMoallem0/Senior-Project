import { supabase } from '@/lib/supabase';
import { toast } from "@/components/ui/use-toast";

// Interfaces for the new simulation history features

export interface SimulationHistory {
  id?: string;
  user_id: string;
  project_id: string;
  city_id: string;
  name: string;
  description?: string;
  parameters: {
    roads: number;
    population: number;
    housing: number;
    public_transport: number;
    [key: string]: number; // Allow for additional parameters
  };
  results: {
    congestion: number;
    satisfaction: number;
    emissions: number;
    transit_usage: number;
    [key: string]: number; // Allow for additional metrics
  };
  metadata?: {
    duration_ms?: number;
    version?: string;
    environment?: string;
    tags?: string[];
    [key: string]: any;
  };
  created_at?: string;
}

export interface OptimizationResult {
  id?: string;
  simulation_history_id: string;
  user_id: string;
  project_id: string;
  name: string;
  description?: string;
  optimization_type: 'congestion' | 'satisfaction' | 'emissions' | 'transit_usage' | 'balanced' | string;
  optimal_parameters: {
    roads: number;
    population: number;
    housing: number;
    public_transport: number;
    [key: string]: number;
  };
  predicted_results: {
    congestion: number;
    satisfaction: number;
    emissions: number;
    transit_usage: number;
    [key: string]: number;
  };
  improvement_percentage: number;
  confidence_score: number;
  metadata?: {
    algorithm?: string;
    iterations?: number;
    convergence_threshold?: number;
    execution_time_ms?: number;
    [key: string]: any;
  };
  created_at?: string;
}

export interface ComparisonMetric {
  id?: string;
  user_id: string;
  project_id: string;
  name: string;
  description?: string;
  baseline_simulation_id: string;
  compared_simulation_ids: string[];
  metrics: {
    [key: string]: {
      baseline_value: number;
      compared_values: number[];
      percentage_differences: number[];
      absolute_differences: number[];
    };
  };
  summary?: {
    key_findings: string[];
    recommendations: string[];
    [key: string]: any;
  };
  created_at?: string;
}

// Functions for SimulationHistory

export const saveSimulationHistory = async (history: SimulationHistory): Promise<SimulationHistory> => {
  try {
    console.log('Saving simulation history:', history);
    
    const { data, error } = await supabase
      .from('simulation_history')
      .insert([history])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving simulation history:', error);
      toast({
        title: "Save Error",
        description: `Failed to save simulation history: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
    
    console.log('Successfully saved simulation history with ID:', data.id);
    return data;
  } catch (error: any) {
    console.error('Exception saving simulation history:', error);
    throw error;
  }
};

export const getSimulationHistory = async (projectId: string): Promise<SimulationHistory[]> => {
  try {
    const { data, error } = await supabase
      .from('simulation_history')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching simulation history:', error);
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Exception fetching simulation history:', error);
    throw error;
  }
};

export const getSimulationHistoryById = async (id: string): Promise<SimulationHistory | null> => {
  try {
    const { data, error } = await supabase
      .from('simulation_history')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching simulation history by ID:', error);
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error('Exception fetching simulation history by ID:', error);
    throw error;
  }
};

// Functions for OptimizationResult

export const saveOptimizationResult = async (result: OptimizationResult): Promise<OptimizationResult> => {
  try {
    console.log('Saving optimization result:', result);
    
    const { data, error } = await supabase
      .from('optimization_results')
      .insert([result])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving optimization result:', error);
      toast({
        title: "Save Error",
        description: `Failed to save optimization result: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
    
    console.log('Successfully saved optimization result with ID:', data.id);
    return data;
  } catch (error: any) {
    console.error('Exception saving optimization result:', error);
    throw error;
  }
};

export const getOptimizationResults = async (projectId: string): Promise<OptimizationResult[]> => {
  try {
    const { data, error } = await supabase
      .from('optimization_results')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching optimization results:', error);
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Exception fetching optimization results:', error);
    throw error;
  }
};

export const getOptimizationResultById = async (id: string): Promise<OptimizationResult | null> => {
  try {
    const { data, error } = await supabase
      .from('optimization_results')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching optimization result by ID:', error);
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error('Exception fetching optimization result by ID:', error);
    throw error;
  }
};

// Functions for ComparisonMetric

export const saveComparisonMetric = async (metric: ComparisonMetric): Promise<ComparisonMetric> => {
  try {
    console.log('Saving comparison metric:', metric);
    
    const { data, error } = await supabase
      .from('comparison_metrics')
      .insert([metric])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving comparison metric:', error);
      toast({
        title: "Save Error",
        description: `Failed to save comparison metric: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
    
    console.log('Successfully saved comparison metric with ID:', data.id);
    return data;
  } catch (error: any) {
    console.error('Exception saving comparison metric:', error);
    throw error;
  }
};

export const getComparisonMetrics = async (projectId: string): Promise<ComparisonMetric[]> => {
  try {
    const { data, error } = await supabase
      .from('comparison_metrics')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching comparison metrics:', error);
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Exception fetching comparison metrics:', error);
    throw error;
  }
};

export const getComparisonMetricById = async (id: string): Promise<ComparisonMetric | null> => {
  try {
    const { data, error } = await supabase
      .from('comparison_metrics')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching comparison metric by ID:', error);
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error('Exception fetching comparison metric by ID:', error);
    throw error;
  }
};

// Helper function to generate SQL for creating these tables
export const getTableCreationSQL = (): string => {
  return `
-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if cities table exists and create it if not
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  population INTEGER NOT NULL,
  description TEXT,
  image_url TEXT,
  coordinates JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if simulation_projects table exists and create it if not
CREATE TABLE IF NOT EXISTS simulation_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  city_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  location TEXT,
  goals TEXT,
  parameters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing detailed simulation history
CREATE TABLE IF NOT EXISTS simulation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  city_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parameters JSONB NOT NULL,
  results JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_simulation_history_project ON simulation_history(project_id);
CREATE INDEX IF NOT EXISTS idx_simulation_history_user ON simulation_history(user_id);

-- Table for storing optimization results
CREATE TABLE IF NOT EXISTS optimization_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_history_id UUID,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  optimization_type TEXT NOT NULL,
  optimal_parameters JSONB NOT NULL,
  predicted_results JSONB NOT NULL,
  improvement_percentage NUMERIC NOT NULL,
  confidence_score NUMERIC NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_simulation_history FOREIGN KEY (simulation_history_id) REFERENCES simulation_history(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES simulation_projects(id)
);
CREATE INDEX idx_optimization_results_project ON optimization_results(project_id);
CREATE INDEX idx_optimization_results_user ON optimization_results(user_id);

-- Table for storing comparison metrics between different simulations
CREATE TABLE comparison_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID NOT NULL REFERENCES simulation_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  baseline_simulation_id UUID NOT NULL REFERENCES simulation_history(id),
  compared_simulation_ids UUID[] NOT NULL,
  metrics JSONB NOT NULL,
  summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES simulation_projects(id),
  CONSTRAINT fk_baseline_simulation FOREIGN KEY (baseline_simulation_id) REFERENCES simulation_history(id)
);
CREATE INDEX idx_comparison_metrics_project ON comparison_metrics(project_id);
CREATE INDEX idx_comparison_metrics_user ON comparison_metrics(user_id);

-- Row Level Security Policies
ALTER TABLE simulation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for simulation_history
CREATE POLICY "Users can view their own simulation history"
  ON simulation_history FOR SELECT
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own simulation history"
  ON simulation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own simulation history"
  ON simulation_history FOR UPDATE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own simulation history"
  ON simulation_history FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for optimization_results
CREATE POLICY "Users can view their own optimization results"
  ON optimization_results FOR SELECT
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own optimization results"
  ON optimization_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own optimization results"
  ON optimization_results FOR UPDATE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own optimization results"
  ON optimization_results FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for comparison_metrics
CREATE POLICY "Users can view their own comparison metrics"
  ON comparison_metrics FOR SELECT
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own comparison metrics"
  ON comparison_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own comparison metrics"
  ON comparison_metrics FOR UPDATE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete their own comparison metrics"
  ON comparison_metrics FOR DELETE
  USING (auth.uid() = user_id);
`;
};
