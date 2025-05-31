import { SimulationHistory, OptimizationResult, saveOptimizationResult } from './simulationHistoryService';

/**
 * Optimization algorithm for urban planning simulations
 * Uses a genetic algorithm approach to find optimal parameter configurations
 */

interface OptimizationConfig {
  targetMetric: 'congestion' | 'satisfaction' | 'emissions' | 'transit_usage' | 'balanced';
  iterations?: number;
  populationSize?: number;
  mutationRate?: number;
  elitismRate?: number;
}

interface ParameterRange {
  min: number;
  max: number;
  step: number;
}

const DEFAULT_PARAMETER_RANGES = {
  roads: { min: 10, max: 100, step: 5 },
  population: { min: 10, max: 100, step: 5 },
  housing: { min: 10, max: 100, step: 5 },
  public_transport: { min: 10, max: 100, step: 5 }
};

/**
 * Evaluates a set of parameters based on the target optimization metric
 */
const evaluateParameters = (
  parameters: { [key: string]: number },
  targetMetric: OptimizationConfig['targetMetric']
): { 
  results: { [key: string]: number },
  fitnessScore: number 
} => {
  // Calculate simulation results using the same formula as in SimulationPanel
  const congestion = Math.max(0, 100 - (parameters.roads * 0.8) - (parameters.public_transport * 0.5) + (parameters.population * 0.7));
  const satisfaction = (parameters.housing * 0.4) + (parameters.roads * 0.2) + (parameters.public_transport * 0.4) - (congestion * 0.5);
  const emissions = (parameters.population * 0.6) - (parameters.public_transport * 0.4) + (congestion * 0.3);
  const transit_usage = (parameters.public_transport * 0.7) + (congestion * 0.3);
  
  // Normalize results to 0-100 range
  const results = {
    congestion: Math.min(100, Math.max(0, congestion)),
    satisfaction: Math.min(100, Math.max(0, satisfaction)),
    emissions: Math.min(100, Math.max(0, emissions)),
    transit_usage: Math.min(100, Math.max(0, transit_usage))
  };
  
  // Calculate fitness score based on target metric
  let fitnessScore = 0;
  
  switch (targetMetric) {
    case 'congestion':
      // Lower congestion is better
      fitnessScore = 100 - results.congestion;
      break;
    case 'satisfaction':
      // Higher satisfaction is better
      fitnessScore = results.satisfaction;
      break;
    case 'emissions':
      // Lower emissions is better
      fitnessScore = 100 - results.emissions;
      break;
    case 'transit_usage':
      // Higher transit usage is better
      fitnessScore = results.transit_usage;
      break;
    case 'balanced':
      // Balanced approach - all metrics are weighted equally
      fitnessScore = (
        (100 - results.congestion) + 
        results.satisfaction + 
        (100 - results.emissions) + 
        results.transit_usage
      ) / 4;
      break;
  }
  
  return { results, fitnessScore };
};

/**
 * Generates a random set of parameters within the specified ranges
 */
const generateRandomParameters = (
  parameterRanges: { [key: string]: ParameterRange } = DEFAULT_PARAMETER_RANGES
): { [key: string]: number } => {
  const parameters: { [key: string]: number } = {};
  
  for (const [key, range] of Object.entries(parameterRanges)) {
    const steps = Math.floor((range.max - range.min) / range.step);
    const randomSteps = Math.floor(Math.random() * steps);
    parameters[key] = range.min + (randomSteps * range.step);
  }
  
  return parameters;
};

/**
 * Mutates parameters with a chance defined by the mutation rate
 */
const mutateParameters = (
  parameters: { [key: string]: number },
  mutationRate: number,
  parameterRanges: { [key: string]: ParameterRange } = DEFAULT_PARAMETER_RANGES
): { [key: string]: number } => {
  const mutatedParameters = { ...parameters };
  
  for (const [key, range] of Object.entries(parameterRanges)) {
    if (Math.random() < mutationRate) {
      const steps = Math.floor((range.max - range.min) / range.step);
      const randomSteps = Math.floor(Math.random() * steps);
      mutatedParameters[key] = range.min + (randomSteps * range.step);
    }
  }
  
  return mutatedParameters;
};

/**
 * Crosses over two parameter sets to create a new one
 */
const crossoverParameters = (
  parent1: { [key: string]: number },
  parent2: { [key: string]: number }
): { [key: string]: number } => {
  const child: { [key: string]: number } = {};
  
  for (const key of Object.keys(parent1)) {
    // 50% chance to inherit from each parent
    child[key] = Math.random() < 0.5 ? parent1[key] : parent2[key];
  }
  
  return child;
};

/**
 * Runs the optimization algorithm to find optimal parameters
 */
export const optimizeParameters = async (
  baselineSimulation: SimulationHistory,
  config: OptimizationConfig,
  userId: string,
  projectId: string
): Promise<OptimizationResult> => {
  const startTime = Date.now();
  
  // Set default values if not provided
  const iterations = config.iterations || 50;
  const populationSize = config.populationSize || 20;
  const mutationRate = config.mutationRate || 0.1;
  const elitismRate = config.elitismRate || 0.2;
  
  // Initialize population with random parameters
  let population = Array(populationSize).fill(null).map(() => generateRandomParameters());
  
  // Add the baseline parameters to the initial population
  population[0] = { ...baselineSimulation.parameters };
  
  // Track the best solution across all iterations
  let bestSolution = {
    parameters: { ...baselineSimulation.parameters },
    results: { ...baselineSimulation.results },
    fitnessScore: 0
  };
  
  // Evaluate the baseline parameters
  const baselineEvaluation = evaluateParameters(baselineSimulation.parameters, config.targetMetric);
  bestSolution.fitnessScore = baselineEvaluation.fitnessScore;
  
  // Run the genetic algorithm for the specified number of iterations
  for (let i = 0; i < iterations; i++) {
    // Define the type for our evaluated population items
    type EvaluatedSolution = {
      parameters: {
        [key: string]: number;
        roads: number;
        population: number;
        housing: number;
        public_transport: number;
      };
      results: {
        [key: string]: number;
        congestion: number;
        satisfaction: number;
        emissions: number;
        transit_usage: number;
      };
      fitnessScore: number;
    };

    // Evaluate each set of parameters
    const evaluatedPopulation = population.map(parameters => {
      const evaluation = evaluateParameters(parameters, config.targetMetric);
      
      // Initialize the parameters object with default values
      const paramsCopy: Record<string, number> = {
        roads: DEFAULT_PARAMETER_RANGES.roads.min,
        population: DEFAULT_PARAMETER_RANGES.population.min,
        housing: DEFAULT_PARAMETER_RANGES.housing.min,
        public_transport: DEFAULT_PARAMETER_RANGES.public_transport.min
      };
      
      // Copy over any existing values from the parameters
      Object.entries(parameters).forEach(([key, value]) => {
        paramsCopy[key] = value;
      });
      
      // Cast to the required type
      const typedParams = paramsCopy as {
        [key: string]: number;
        roads: number;
        population: number;
        housing: number;
        public_transport: number;
      };
      
      // Initialize the results object with default values
      const resultsCopy: Record<string, number> = {
        congestion: 0,
        satisfaction: 0,
        emissions: 0,
        transit_usage: 0
      };
      
      // Copy over any existing values from the evaluation results
      Object.entries(evaluation.results).forEach(([key, value]) => {
        resultsCopy[key] = value;
      });
      
      // Cast to the required type
      const typedResults = resultsCopy as {
        [key: string]: number;
        congestion: number;
        satisfaction: number;
        emissions: number;
        transit_usage: number;
      };
      
      return {
        parameters: typedParams,
        results: typedResults,
        fitnessScore: evaluation.fitnessScore
      } as EvaluatedSolution;
    });
    
    // Sort by fitness score (descending)
    evaluatedPopulation.sort((a, b) => b.fitnessScore - a.fitnessScore);
    
    // Update best solution if we found a better one
    if (evaluatedPopulation[0].fitnessScore > bestSolution.fitnessScore) {
      bestSolution = evaluatedPopulation[0];
    }
    
    // Create the next generation
    const eliteCount = Math.floor(populationSize * elitismRate);
    const elite = evaluatedPopulation.slice(0, eliteCount).map(solution => {
      // Ensure all required parameters are present
      const parameters: {
        [key: string]: number;
        roads: number;
        population: number;
        housing: number;
        public_transport: number;
      } = {
        ...solution.parameters,
        roads: solution.parameters.roads ?? DEFAULT_PARAMETER_RANGES.roads.min,
        population: solution.parameters.population ?? DEFAULT_PARAMETER_RANGES.population.min,
        housing: solution.parameters.housing ?? DEFAULT_PARAMETER_RANGES.housing.min,
        public_transport: solution.parameters.public_transport ?? DEFAULT_PARAMETER_RANGES.public_transport.min
      };
      return parameters;
    });
    
    // Create offspring through selection, crossover, and mutation
    const offspring = [];
    
    while (offspring.length < populationSize - eliteCount) {
      // Tournament selection
      const parent1Index = Math.floor(Math.random() * evaluatedPopulation.length / 2);
      const parent2Index = Math.floor(Math.random() * evaluatedPopulation.length / 2);
      
      const parent1 = evaluatedPopulation[parent1Index].parameters;
      const parent2 = evaluatedPopulation[parent2Index].parameters;
      
      // Crossover
      const child = crossoverParameters(parent1, parent2);
      
      // Mutation
      const mutatedChild = mutateParameters(child, mutationRate);
      
      offspring.push(mutatedChild);
    }
    
    // Form the new population from elite and offspring
    population = [...elite, ...offspring];
  }
  
  // Calculate improvement percentage compared to baseline
  const baselineFitness = evaluateParameters(baselineSimulation.parameters, config.targetMetric).fitnessScore;
  const improvementPercentage = ((bestSolution.fitnessScore - baselineFitness) / baselineFitness) * 100;
  
  // Initialize the results object with default values and then add any existing values
  const resultsCopy: Record<string, number> = {
    congestion: 0,
    satisfaction: 0,
    emissions: 0,
    transit_usage: 0
  };
  
  // Copy over any existing values from the best solution results
  if (bestSolution.results) {
    Object.entries(bestSolution.results).forEach(([key, value]) => {
      resultsCopy[key] = value;
    });
  }
  
  // Cast to the required type
  const typedResults = resultsCopy as {
    [key: string]: number;
    congestion: number;
    satisfaction: number;
    emissions: number;
    transit_usage: number;
  };

  // Initialize the parameters object with default values
  const paramsCopy: Record<string, number> = {
    roads: DEFAULT_PARAMETER_RANGES.roads.min,
    population: DEFAULT_PARAMETER_RANGES.population.min,
    housing: DEFAULT_PARAMETER_RANGES.housing.min,
    public_transport: DEFAULT_PARAMETER_RANGES.public_transport.min
  };
  
  // Copy over any existing values from the best solution parameters
  if (bestSolution.parameters) {
    Object.entries(bestSolution.parameters).forEach(([key, value]) => {
      paramsCopy[key] = value;
    });
  }
  
  // Cast to the required type
  const typedParameters = paramsCopy as {
    [key: string]: number;
    roads: number;
    population: number;
    housing: number;
    public_transport: number;
  };

  // Create the optimization result
  const optimizationResult: OptimizationResult = {
    simulation_history_id: baselineSimulation.id || '',
    user_id: userId,
    project_id: projectId,
    name: `${config.targetMetric.charAt(0).toUpperCase() + config.targetMetric.slice(1)} Optimization`,
    description: `Optimized parameters for ${config.targetMetric} based on simulation ${baselineSimulation.name}`,
    optimization_type: config.targetMetric,
    optimal_parameters: typedParameters,
    predicted_results: typedResults,
    improvement_percentage: improvementPercentage,
    confidence_score: 0.85, // This could be calculated based on variance in the final population
    metadata: {
      algorithm: 'genetic',
      iterations,
      population_size: populationSize,
      mutation_rate: mutationRate,
      elitism_rate: elitismRate,
      execution_time_ms: Date.now() - startTime
    }
  };
  
  // Save the optimization result to the database
  try {
    const savedResult = await saveOptimizationResult(optimizationResult);
    return savedResult;
  } catch (error) {
    console.error('Error saving optimization result:', error);
    return optimizationResult;
  }
};

/**
 * Runs multiple optimizations with different target metrics
 */
export const runComprehensiveOptimization = async (
  baselineSimulation: SimulationHistory,
  userId: string,
  projectId: string
): Promise<OptimizationResult[]> => {
  const targetMetrics: OptimizationConfig['targetMetric'][] = [
    'congestion',
    'satisfaction',
    'emissions',
    'transit_usage',
    'balanced'
  ];
  
  const results: OptimizationResult[] = [];
  
  for (const metric of targetMetrics) {
    const result = await optimizeParameters(
      baselineSimulation,
      { targetMetric: metric },
      userId,
      projectId
    );
    
    results.push(result);
  }
  
  return results;
};
