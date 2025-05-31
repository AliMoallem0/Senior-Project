import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface AIGoal {
  description: string;
  metric: 'congestion' | 'satisfaction' | 'emissions' | 'transit_usage';
  target: number;
  timeframe: string;
  steps: string[];
}

interface GeneratedGoal {
  description: string;
  metric: 'congestion' | 'satisfaction' | 'emissions' | 'transit_usage';
  target: number;
  timeframe: string;
  steps: string[];
}

interface AISmartGoalsProps {
  projectType: string;
  location: string;
  description: string;
  currentGoals: string;
  apiKey: string;
  onAddGoal: (goal: { metric: AIGoal['metric']; target: number }) => void;
}

export function AISmartGoals({
  projectType,
  location,
  description,
  currentGoals,
  apiKey,
  onAddGoal
}: AISmartGoalsProps) {
  const [goals, setGoals] = useState<AIGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateGoals = async () => {
    setIsLoading(true);
    try {
      const prompt = `As an urban planning expert, generate SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goals for this project:
      Project type: ${projectType}
      Location: ${location}
      Description: ${description}
      Current goals: ${currentGoals}
      
      Format your response as a JSON array with these exact keys for each goal:
      [
        {
          "description": "A specific SMART goal description",
          "metric": "congestion",
          "target": 75,
          "timeframe": "6 months",
          "steps": ["Implementation step 1", "Implementation step 2"]
        }
      ]
      
      Note: metric must be one of: congestion, satisfaction, emissions, transit_usage
      target should be a number between 0-100`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            role: "user", 
            parts: [{ text: prompt }] 
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from AI');
      }

      const text = data.candidates[0].content.parts[0].text.trim();
      // Find the JSON array in the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const generatedGoals = JSON.parse(jsonMatch[0]);
      
      // Validate the goals format
      const validMetrics = ['congestion', 'satisfaction', 'emissions', 'transit_usage'] as const;
      const validatedGoals = generatedGoals.filter((goal: GeneratedGoal) => 
        validMetrics.includes(goal.metric) && 
        typeof goal.target === 'number' &&
        goal.target >= 0 &&
        goal.target <= 100
      );

      if (validatedGoals.length === 0) {
        throw new Error('No valid goals generated');
      }

      setGoals(validatedGoals);
    } catch (error) {
      console.error('Error generating SMART goals:', error);
      toast({
        title: "Goals Generation Error",
        description: "Failed to generate SMART goals. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-component="AISmartGoals" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">Generate SMART Goals</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={generateGoals}
          disabled={isLoading}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Generate
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-sm">{goal.description}</CardTitle>
                <CardDescription>
                  Target: {goal.target}% {goal.metric} within {goal.timeframe}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Implementation Steps:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {goal.steps.map((step, stepIndex) => (
                      <li key={stepIndex}>{step}</li>
                    ))}
                  </ul>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => onAddGoal({ metric: goal.metric, target: goal.target })}
                >
                  Add to Project Goals
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 