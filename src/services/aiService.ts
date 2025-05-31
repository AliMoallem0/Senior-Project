import { SimulationProject } from './cityService';

// Interface for simulation parameters
export interface Parameters {
  roads: number;
  population: number;
  housing: number;
  public_transport: number;
}

// Interface for simulation results
export interface SimulationResults {
  congestion: number;
  satisfaction: number;
  emissions: number;
  transitUsage: number;
}

// Ollama API endpoint (running locally)
const OLLAMA_API_ENDPOINT = 'http://localhost:11434/api/generate';

// Interface for chat messages
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const runAISimulation = async (params: any, projectDetails: any) => {
  try {
    // Construct the prompt for Ollama
    const prompt = `Analyze the following urban development scenario and provide detailed predictions:

Project Details:
Name: ${projectDetails.name}
Type: ${projectDetails.type}
Location: ${projectDetails.location}
Description: ${projectDetails.description}
Goals: ${projectDetails.goals}

Parameters:
- Road Infrastructure: ${params.roads}/100
- Population Density: ${params.population}/100
- Housing Development: ${params.housing}/100
- Public Transportation: ${params.public_transport}/100

Please provide specific predictions for:
1. Traffic congestion levels (0-100)
2. Resident satisfaction (0-100)
3. Environmental impact (0-100)
4. Public transit usage (0-100)

Format the response as a JSON object with these exact keys: congestion, satisfaction, emissions, transitUsage.
Each value should be a number between 0 and 100.`;

    // Call Ollama API
    const response = await fetch(OLLAMA_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama2",
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1000
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get response from Ollama API');
    }

    const data = await response.json();
    
    try {
      // Parse the AI response to extract predictions
      const aiResponse = JSON.parse(data.response);
      
      // Ensure all required fields are present and are numbers
      const requiredFields = ['congestion', 'satisfaction', 'emissions', 'transitUsage'];
      for (const field of requiredFields) {
        if (typeof aiResponse[field] !== 'number') {
          throw new Error(`Invalid response format: ${field} must be a number`);
        }
      }
      
      return {
        congestion: Math.min(100, Math.max(0, aiResponse.congestion)),
        satisfaction: Math.min(100, Math.max(0, aiResponse.satisfaction)),
        emissions: Math.min(100, Math.max(0, aiResponse.emissions)),
        transitUsage: Math.min(100, Math.max(0, aiResponse.transitUsage))
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse AI response. The response format was invalid.');
    }
  } catch (error) {
    console.error('AI simulation error:', error);
    throw error;
  }
};

// Fallback calculation function
const calculateFallbackResults = (params: any) => {
  const congestion = Math.max(0, 100 - (params.roads * 0.8) - (params.public_transport * 0.5) + (params.population * 0.7));
  const satisfaction = (params.housing * 0.4) + (params.roads * 0.2) + (params.public_transport * 0.4) - (congestion * 0.5);
  const emissions = (params.population * 0.6) - (params.public_transport * 0.4) + (congestion * 0.3);
  const transit_usage = (params.public_transport * 0.7) + (congestion * 0.3);

  return {
    congestion: Math.min(100, Math.max(0, congestion)),
    satisfaction: Math.min(100, Math.max(0, satisfaction)),
    emissions: Math.min(100, Math.max(0, emissions)),
    transitUsage: Math.min(100, Math.max(0, transit_usage))
  };
};

export const chatWithAI = async (
  message: string,
  params: any,
  projectDetails: any,
  previousMessages: ChatMessage[] = []
) => {
  try {
    // Create system context with project details and parameters
    const systemContext = `You are an expert urban planning AI assistant analyzing this project:

Project Details:
- Name: ${projectDetails.name}
- Type: ${projectDetails.type}
- Location: ${projectDetails.location}
- Description: ${projectDetails.description}
- Goals: ${projectDetails.goals}

Current Parameters:
- Road Infrastructure: ${params.roads}/100
- Population Density: ${params.population}/100
- Housing Development: ${params.housing}/100
- Public Transportation: ${params.public_transport}/100

Provide expert analysis and recommendations based on this context.`;

    // Prepare messages array
    const messages = [
      { role: 'system', content: systemContext },
      ...previousMessages,
      { role: 'user', content: message }
    ];

    // Format messages for Ollama
    const formattedPrompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

    // Call Ollama API
    const response = await fetch(OLLAMA_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama2",
        prompt: formattedPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1000
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get response from Ollama API');
    }

    const data = await response.json();
    return {
      role: 'assistant',
      content: data.response
    };
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
}; 