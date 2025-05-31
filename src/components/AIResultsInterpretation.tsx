import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface AIInterpretation {
  summary: string;
  insights: string[];
  improvements: string[];
  comparisons: string[];
}

interface AIResultsInterpretationProps {
  results: {
    congestion: number;
    satisfaction: number;
    emissions: number;
    transit_usage: number;
  };
  projectType: string;
  location: string;
  apiKey: string;
}

export function AIResultsInterpretation({
  results,
  projectType,
  location,
  apiKey
}: AIResultsInterpretationProps) {
  const [interpretation, setInterpretation] = useState<AIInterpretation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getInterpretation = async () => {
    setIsLoading(true);
    try {
      const prompt = `As an urban planning expert, interpret these simulation results for a ${projectType} project in ${location}:
      Congestion: ${results.congestion}%
      Satisfaction: ${results.satisfaction}%
      Emissions: ${results.emissions}%
      Transit Usage: ${results.transit_usage}%
      
      Format your response as a JSON object with these exact keys:
      {
        "summary": "A clear summary of the results",
        "insights": ["Key insight 1", "Key insight 2"],
        "improvements": ["Improvement 1", "Improvement 2"],
        "comparisons": ["Comparison 1", "Comparison 2"]
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
      
      const interpretationResult = JSON.parse(jsonMatch[0]);
      setInterpretation(interpretationResult);
    } catch (error) {
      console.error('Error getting results interpretation:', error);
      toast({
        title: "Interpretation Error",
        description: "Failed to interpret results. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (results) {
      getInterpretation();
    }
  }, [results]);

  return (
    <div data-component="AIResultsInterpretation" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">AI Interpretation</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={getInterpretation}
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
      ) : interpretation && (
        <Card>
          <CardContent className="pt-6">
            <p className="summary-text text-sm mb-4">{interpretation.summary}</p>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Key Insights</h4>
                <ul className="insights-list list-disc list-inside text-sm text-gray-600">
                  {interpretation.insights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Suggested Improvements</h4>
                <ul className="improvements-list list-disc list-inside text-sm text-gray-600">
                  {interpretation.improvements.map((imp, index) => (
                    <li key={index}>{imp}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Comparisons</h4>
                <ul className="comparisons-list list-disc list-inside text-sm text-gray-600">
                  {interpretation.comparisons.map((comp, index) => (
                    <li key={index}>{comp}</li>
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