import { createClient } from '@supabase/supabase-js';
import { toast } from "@/components/ui/use-toast";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface User {
  id?: number;
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  created_at?: Date;
  updated_at?: Date;
  last_login?: Date;
  banned_until?: string | null; // For ban support
}

export const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from insert');

    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : 'Failed to create user',
      variant: "destructive"
    });
    throw error;
  }
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
};

export const updateUserLastLogin = async (userId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date() })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
};

export interface SimulationResult {
  id?: number;
  project_id: string;
  user_id: string;
  city_name: string;
  parameters: {
    roads: number;
    population: number;
    housing: number;
    public_transport: number;
  };
  results: {
    congestion: number;
    satisfaction: number;
    emissions: number;
    transit_usage: number;
  };
  ai_analysis?: {
    parameter_analysis?: string;
    risks?: string[];
    opportunities?: string[];
    suggestions?: string[];
    interpretation?: string;
    key_insights?: string[];
    suggested_improvements?: string[];
    comparisons?: string[];
  };
  created_at?: Date;
}

// Check if the user has proper permissions before saving
export const checkUserPermissions = async (): Promise<boolean> => {
  try {
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Error",
        description: "Your session has expired. Please log in again.",
        variant: "destructive"
      });
      return false;
    }

    // Verify the user has a valid access token
    if (!session.access_token) {
      toast({
        title: "Authentication Error",
        description: "Invalid authentication token. Please log in again.",
        variant: "destructive"
      });
      return false;
    }
    
    // Log user info for debugging
    console.log('User authenticated:', session.user.id);
    return true;
  } catch (error) {
    console.error('Error checking user permissions:', error);
    toast({
      title: "Permission Error",
      description: "Could not verify your permissions. Please try again or log out and log back in.",
      variant: "destructive"
    });
    return false;
  }
};

// LOCAL STORAGE UTILITIES FOR SIMULATION RESULTS
// These functions provide a fallback when database operations fail due to permissions

/**
 * Saves a simulation result to localStorage
 */
export const saveSimulationResultToLocalStorage = (result: SimulationResult): number => {
  try {
    // Generate a unique ID for this simulation result if not provided
    const resultId = result.id || Date.now();
    result.id = resultId;
    result.created_at = result.created_at || new Date();
    
    // Get existing saved results or initialize empty array
    const existingResultsString = localStorage.getItem(`simulation_results_${result.project_id}`);
    const existingResults = existingResultsString ? JSON.parse(existingResultsString) : [];
    
    // Add new result to the beginning of the array
    existingResults.unshift(result);
    
    // Save back to localStorage
    localStorage.setItem(`simulation_results_${result.project_id}`, JSON.stringify(existingResults));
    console.log('Saved simulation result to localStorage with ID:', resultId);
    
    return resultId;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    throw error;
  }
};

/**
 * Gets simulation results from localStorage
 */
export const getSimulationResultsFromLocalStorage = (projectId: string): SimulationResult[] => {
  try {
    const resultsString = localStorage.getItem(`simulation_results_${projectId}`);
    if (!resultsString) return [];
    
    const results = JSON.parse(resultsString);
    console.log('Retrieved simulation results from localStorage:', results);
    return results;
  } catch (error) {
    console.error('Error retrieving from localStorage:', error);
    return [];
  }
};

// Save to Supabase database with proper handling of RLS policies
export const saveSimulationResult = async (result: SimulationResult): Promise<number> => {
  try {
    // Log the data being saved for debugging
    console.log('Saving simulation result to Supabase...');
    console.log('Original data:', result);
    
    // Get the current user session to ensure we have the latest auth context
    const { data } = await supabase.auth.getSession();
    if (!data?.session) {
      console.warn('No active session found - trying with localStorage instead');
      
      // Fall back to localStorage if no session
      const localId = saveSimulationResultToLocalStorage(result);
      console.log('Saved to localStorage with ID:', localId, result);
      return localId;
    }
    
    // Ensure user_id is set to the current authenticated user
    const userAuthId = data.session.user.id;
    result.user_id = userAuthId;
    
    // IMPORTANT: Check database connection directly
    const { data: pingData, error: pingError } = await supabase
      .from('simulation_results')
      .select('count(*)', { count: 'exact', head: true });
    
    if (pingError) {
      console.error('Database connection issue:', pingError);
      throw new Error(`Database connection failed: ${pingError.message}`);
    }
    
    console.log('Database connection success, rows count:', pingData);
    
    // CRITICAL FIX: Properly format the data to match the database schema
    // This is likely why the RLS policy was failing
    const formattedResult = {
      project_id: result.project_id,
      user_id: userAuthId,
      city_name: result.city_name || '',
      congestion: result.results?.congestion || 0,
      satisfaction: result.results?.satisfaction || 0,
      emissions: result.results?.emissions || 0,
      transit_usage: result.results?.transit_usage || 0,
      // Store parameters and results as JSON strings if needed
      parameters: JSON.stringify(result.parameters),
      // Store AI analysis as a JSON string
      ai_analysis: result.ai_analysis ? JSON.stringify(result.ai_analysis) : null
    };
    
    console.log('Formatted data for Supabase:', {
      project_id: formattedResult.project_id,
      user_id: formattedResult.user_id,
      ai_analysis_size: formattedResult.ai_analysis ? formattedResult.ai_analysis.length : 0
    });
    
    // Try to save to the database with the properly formatted data
    const { data: insertData, error: insertError } = await supabase
      .from('simulation_results')
      .insert([formattedResult])
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      
      // If we still get an error, save to localStorage as a backup
      console.warn('Falling back to localStorage due to database error');
      const localId = saveSimulationResultToLocalStorage(result);
      return localId;
    }
    
    if (!insertData) throw new Error('No data returned from insert');
    
    console.log('Successfully saved to Supabase with ID:', insertData.id);
    
    // Also save to localStorage as a backup
    saveSimulationResultToLocalStorage(result);
    
    return insertData.id;
  } catch (error: any) {
    console.error('Error saving simulation result:', error);
    
    // Provide more detailed error message
    let errorMessage = 'Failed to save simulation results';
    if (error?.message) {
      errorMessage += `: ${error.message}`;
    }
    if (error?.details) {
      errorMessage += ` (${error.details})`;
    }
    
    toast({
      title: "Save Error",
      description: errorMessage,
      variant: "destructive"
    });
    throw error;
  }
};

/**
 * Gets simulation results from both Supabase and localStorage, combining the results
 */
export const getSimulationResults = async (projectId: string): Promise<SimulationResult[]> => {
  try {
    console.log('Fetching simulation results for project:', projectId);
    
    // Try to get results from Supabase first
    let supabaseResults: SimulationResult[] = [];
    try {
      const { data, error } = await supabase
        .from('simulation_results')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching from Supabase:', error);
      } else if (data) {
        console.log('Retrieved results from Supabase:', data);
        
        // Parse the JSON strings back to objects if needed
        supabaseResults = data.map(item => {
          // Parse AI analysis if it exists and is a string
          let aiAnalysis = null;
          if (item.ai_analysis) {
            try {
              if (typeof item.ai_analysis === 'string') {
                aiAnalysis = JSON.parse(item.ai_analysis);
              } else {
                aiAnalysis = item.ai_analysis;
              }
            } catch (e) {
              console.warn('Error parsing AI analysis:', e);
            }
          }
          
          // Parse parameters if needed
          let parameters = {};
          if (item.parameters) {
            try {
              if (typeof item.parameters === 'string') {
                parameters = JSON.parse(item.parameters);
              } else {
                parameters = item.parameters;
              }
            } catch (e) {
              console.warn('Error parsing parameters:', e);
            }
          }
          
          // Return the formatted result
          return {
            ...item,
            parameters,
            ai_analysis: aiAnalysis,
            // Format results if they're stored as individual fields
            results: {
              congestion: item.congestion || 0,
              satisfaction: item.satisfaction || 0,
              emissions: item.emissions || 0,
              transit_usage: item.transit_usage || 0
            }
          };
        });
      }
    } catch (dbError) {
      console.error('Failed to fetch from Supabase:', dbError);
    }
    
    // Also get results from localStorage as a backup
    const localResults = getSimulationResultsFromLocalStorage(projectId);
    
    // Combine results, removing duplicates based on ID
    const allResults = [...supabaseResults];
    
    // Add local results that aren't already in the Supabase results
    localResults.forEach(localResult => {
      if (!allResults.some(result => result.id === localResult.id)) {
        allResults.push(localResult);
      }
    });
    
    // Sort by created_at date, newest first
    allResults.sort((a, b) => {
      // Handle potentially undefined created_at values
      const dateAValue = a.created_at || new Date();
      const dateBValue = b.created_at || new Date();
      
      // Convert to Date objects if they aren't already
      const dateA = dateAValue instanceof Date ? dateAValue : new Date(dateAValue);
      const dateB = dateBValue instanceof Date ? dateBValue : new Date(dateBValue);
      
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log('Combined results:', allResults);
    return allResults;
  } catch (error) {
    console.error('Error fetching simulation results:', error);
    
    // If all else fails, try to get results from localStorage
    return getSimulationResultsFromLocalStorage(projectId);
  }
};

export const closeConnection = async (): Promise<boolean> => {
  try {
    // No need to close connection for API-based implementation
    return true;
  } catch (error) {
    console.error('Error closing database connection:', error);
    return false;
  }
};

/**
 * Test database connection and permissions directly
 * This function bypasses most of the complexity to directly test Supabase connectivity
 */
export const testDatabaseConnection = async (): Promise<{
  connected: boolean;
  authenticated: boolean;
  canReadTable: boolean;
  canWriteTable: boolean;
  error?: string;
}> => {
  const result = {
    connected: false,
    authenticated: false,
    canReadTable: false,
    canWriteTable: false,
    error: undefined as string | undefined
  };
  
  try {
    // 1. Test basic connection
    const { data, error } = await supabase.from('simulation_results').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      result.error = `Connection error: ${error.message}`;
      return result;
    }
    
    result.connected = true;
    console.log('Basic connection successful');
    
    // 2. Test authentication
    const { data: authData } = await supabase.auth.getSession();
    if (authData?.session) {
      result.authenticated = true;
      console.log('Authentication successful, user:', authData.session.user.email);
    } else {
      result.error = 'Not authenticated with Supabase';
      return result;
    }
    
    // 3. Test read permission
    const { data: readData, error: readError } = await supabase
      .from('simulation_results')
      .select('*')
      .limit(1);
      
    if (readError) {
      result.error = `Read permission error: ${readError.message}`;
    } else {
      result.canReadTable = true;
      console.log('Read permission confirmed');
    }
    
    // 4. Test write permission with a minimal test record
    const testRecord = {
      project_id: 'test-' + Date.now(),
      user_id: authData.session.user.id,
      city_name: 'Test City',
      parameters: JSON.stringify({test: true}),
      congestion: 1,
      satisfaction: 1,
      emissions: 1,
      transit_usage: 1
    };
    
    const { data: writeData, error: writeError } = await supabase
      .from('simulation_results')
      .insert([testRecord]);
      
    if (writeError) {
      result.error = `Write permission error: ${writeError.message}`;
      console.error('Write test failed:', writeError);
    } else {
      result.canWriteTable = true;
      console.log('Write permission confirmed');
      
      // Delete the test record
      await supabase
        .from('simulation_results')
        .delete()
        .eq('project_id', testRecord.project_id);
    }
    
    return result;
  } catch (error: any) {
    result.error = `Unexpected error: ${error.message}`;
    console.error('Database test error:', error);
    return result;
  }
};

/**
 * Save AI analysis results to the database
 * @param projectId - The ID of the project this analysis belongs to
 * @param aiData - Object containing AI-generated analysis and recommendations
 */
export interface AIAnalysisData {
  parameter_analysis?: string;
  interpretation?: string; 
  smart_goals?: string[];
  recommendations?: string[];
  key_insights?: string[];
  risks?: string[];
  opportunities?: string[];
}

export const saveAIAnalysisResults = async (
  projectId: string,
  cityName: string,
  aiData: AIAnalysisData
): Promise<number> => {
  try {
    console.log('Saving AI analysis results to Supabase...');
    
    // Get the current user session to ensure we have the latest auth context
    const { data } = await supabase.auth.getSession();
    
    // Log authentication state for debugging
    console.log('Auth state when saving:', { 
      hasSession: !!data?.session,
      userId: data?.session?.user?.id,
      aud: data?.session?.user?.aud,
      projectId
    });
    
    // Try to refresh session if expired
    if (!data?.session) {
      console.log('Attempting to refresh session...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.warn('Session refresh failed:', refreshError?.message);
        
        // Save to localStorage as fallback
        const localResult: SimulationResult = {
          project_id: projectId,
          user_id: 'anonymous',
          city_name: cityName || 'AI Analysis',
          parameters: { roads: 0, population: 0, housing: 0, public_transport: 0 },
          results: { congestion: 0, satisfaction: 0, emissions: 0, transit_usage: 0 },
          ai_analysis: aiData
        };
        
        const localId = saveSimulationResultToLocalStorage(localResult);
        console.log('Saved to localStorage instead with ID:', localId);
        return localId;
      }
      
      // Use the refreshed session
      console.log('Session refreshed successfully');
      var session = refreshData.session;
    } else {
      var session = data.session;
    }
    
    // Create a minimal simulation result object focused on the AI analysis
    const result: SimulationResult = {
      project_id: projectId,
      user_id: session.user.id,
      city_name: cityName || 'AI Analysis',
      parameters: { roads: 0, population: 0, housing: 0, public_transport: 0 },
      results: { congestion: 0, satisfaction: 0, emissions: 0, transit_usage: 0 },
      ai_analysis: {
        parameter_analysis: aiData.parameter_analysis,
        interpretation: aiData.interpretation,
        suggested_improvements: aiData.recommendations,
        key_insights: aiData.key_insights,
        risks: aiData.risks,
        opportunities: aiData.opportunities,
      }
    };
    
    // Save using the existing save function to handle fallbacks and formatting
    const savedId = await saveSimulationResult(result);
    
    toast({
      title: "Success",
      description: "AI analysis results saved successfully",
      variant: "default"
    });
    
    return savedId;
  } catch (error: any) {
    console.error('Error saving AI analysis results:', error);
    
    toast({
      title: "Save Error",
      description: error?.message || 'Failed to save AI analysis results',
      variant: "destructive"
    });
    
    throw error;
  }
}; 