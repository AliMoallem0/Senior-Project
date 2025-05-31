import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface AIAnalysis {
  impact: string;
  risks: string[];
  opportunities: string[];
  suggestions: string[];
}

interface AIParameterAnalysisProps {
  parameters: {
    roads: number;
    population: number;
    housing: number;
    public_transport: number;
  };
  projectType: string;
  location: string;
  apiKey: string;
}

export function AIParameterAnalysis({
  parameters,
  projectType,
  location,
  apiKey
}: AIParameterAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getAnalysis = async () => {
    setIsLoading(true);
    try {
      const prompt = `As an urban planning expert, analyze these parameters for ${projectType} project in ${location}:
      Roads: ${parameters.roads}%
      Population: ${parameters.population}%
      Housing: ${parameters.housing}%
      Public Transport: ${parameters.public_transport}%
      
      Format your response as a JSON object with these exact keys:
      {
        "impact": "A clear description of overall impact",
        "risks": ["Risk 1", "Risk 2"],
        "opportunities": ["Opportunity 1", "Opportunity 2"],
        "suggestions": ["Suggestion 1", "Suggestion 2"]
      }`;

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
      // Find the JSON object in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const analysisResult = JSON.parse(jsonMatch[0]);
      setAnalysis(analysisResult);
    } catch (error) {
      console.error('Error getting parameter analysis:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze parameters. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (Object.values(parameters).some(value => value > 0)) {
      getAnalysis();
    }
  }, [parameters]);

  return (
    <div data-component="AIParameterAnalysis" className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold">Parameter Analysis</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={getAnalysis}
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
      ) : analysis && (
        <Card>
          <CardContent className="pt-6">
            <p className="impact-text text-sm mb-4">{analysis.impact}</p>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Risks</h4>
                <ul className="risks-list list-disc list-inside text-sm text-gray-600">
                  {analysis.risks.map((risk, index) => (
                    <li key={index}>{risk}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Opportunities</h4>
                <ul className="opportunities-list list-disc list-inside text-sm text-gray-600">
                  {analysis.opportunities.map((opp, index) => (
                    <li key={index}>{opp}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Suggestions</h4>
                <ul className="suggestions-list list-disc list-inside text-sm text-gray-600">
                  {analysis.suggestions.map((sug, index) => (
                    <li key={index}>{sug}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 