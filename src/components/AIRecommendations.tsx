import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface AIRecommendation {
  title: string;
  description: string;
  confidence: number;
  parameters?: {
    roads: number;
    population: number;
    housing: number;
    public_transport: number;
  };
}

interface AIRecommendationsProps {
  projectType: string;
  location: string;
  description: string;
  goals: string;
  onApplyParameters?: (params: AIRecommendation['parameters']) => void;
  apiKey: string;
}

export function AIRecommendations({
  projectType,
  location,
  description,
  goals,
  onApplyParameters,
  apiKey
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getRecommendations = async () => {
    if (!projectType || !location) return;
    
    setIsLoading(true);
    try {
      const prompt = `As an urban planning expert, provide recommendations for a ${projectType} project in ${location}.
      Project description: ${description}
      Goals: ${goals}
      
      Format your response as a JSON array with these exact keys for each recommendation:
      [
        {
          "title": "Clear recommendation title",
          "description": "Detailed explanation",
          "confidence": 85,
          "parameters": {
            "roads": 70,
            "population": 60,
            "housing": 80,
            "public_transport": 75
          }
        }
      ]`;

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
      
      const recommendations = JSON.parse(jsonMatch[0]);
      setRecommendations(recommendations);
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      toast({
        title: "AI Recommendations Error",
        description: "Failed to get recommendations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectType && location) {
      getRecommendations();
    }
  }, [projectType, location]);

  return (
    <div data-component="AIRecommendations" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">AI Recommendations</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={getRecommendations}
          disabled={isLoading}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  {rec.title}
                  <span className="text-xs text-gray-500">
                    {rec.confidence}% confidence
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{rec.description}</p>
                {rec.parameters && onApplyParameters && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => onApplyParameters(rec.parameters)}
                  >
                    Apply Parameters
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 