import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { saveAIAnalysisResults, AIAnalysisData } from '@/services/dbService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface AISaveResultsProps {
  projectId: string;
  cityName: string;
  aiData: {
    parameterAnalysis?: string;
    interpretation?: string;
    smartGoals?: string[];
    recommendations?: string[];
    keyInsights?: string[];
    risks?: string[];
    opportunities?: string[];
  };
  onSaveComplete?: (id: number) => void;
  buttonText?: string;
}

/**
 * Component for saving AI-generated analysis results to database
 */
export function AISaveResults({ 
  projectId, 
  cityName,
  aiData, 
  onSaveComplete,
  buttonText = "Save AI Results" 
}: AISaveResultsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Check Supabase session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      console.log('Current Supabase session:', data?.session ? 'Active' : 'None');
    };
    checkSession();
  }, []);

  const handleSaveResults = async () => {
    // Double-check authentication with Supabase directly
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!user || !sessionData?.session) {
      console.log('Auth state:', { userFromHook: !!user, activeSession: !!sessionData?.session });
      
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        toast({
          title: "Authentication Required",
          description: "Your session has expired. Please log in again.",
          variant: "destructive"
        });
        return;
      }
    }

    if (!projectId) {
      toast({
        title: "Project Required",
        description: "You must have an active project to save results",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);

      // Format the data for the database
      const formattedData: AIAnalysisData = {
        parameter_analysis: aiData.parameterAnalysis,
        interpretation: aiData.interpretation,
        smart_goals: aiData.smartGoals,
        recommendations: aiData.recommendations,
        key_insights: aiData.keyInsights,
        risks: aiData.risks,
        opportunities: aiData.opportunities
      };

      // Save to database
      const savedId = await saveAIAnalysisResults(
        projectId,
        cityName || 'AI Analysis',
        formattedData
      );

      toast({
        title: "Success",
        description: "AI analysis results saved successfully",
      });

      // Call the callback if provided
      if (onSaveComplete) {
        onSaveComplete(savedId);
      }

    } catch (error: any) {
      console.error('Error saving AI results:', error);
      toast({
        title: "Save Error",
        description: error?.message || "Failed to save AI results",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button
      onClick={handleSaveResults}
      disabled={isSaving}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
    >
      <Save className="h-4 w-4" />
      {isSaving ? "Saving..." : buttonText}
    </Button>
  );
}
