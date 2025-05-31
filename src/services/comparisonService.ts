import { SimulationHistory, ComparisonMetric, saveComparisonMetric } from './simulationHistoryService';

/**
 * Service for comparing multiple simulation results and generating insights
 */

interface ComparisonConfig {
  name: string;
  description?: string;
  metrics?: string[];
  generateRecommendations?: boolean;
}

/**
 * Calculates percentage difference between two values
 */
const calculatePercentageDifference = (baseline: number, comparison: number): number => {
  if (baseline === 0) return comparison === 0 ? 0 : 100;
  return ((comparison - baseline) / Math.abs(baseline)) * 100;
};

/**
 * Calculates absolute difference between two values
 */
const calculateAbsoluteDifference = (baseline: number, comparison: number): number => {
  return comparison - baseline;
};

/**
 * Generates key findings based on comparison results
 */
const generateKeyFindings = (
  metrics: ComparisonMetric['metrics'],
  baselineSimulation: SimulationHistory,
  comparedSimulations: SimulationHistory[]
): string[] => {
  const findings: string[] = [];
  
  // Analyze each metric
  for (const [metricName, metricData] of Object.entries(metrics)) {
    // Find the best and worst values
    const percentages = metricData.percentage_differences;
    const maxImprovement = Math.max(...percentages);
    const maxDecline = Math.min(...percentages);
    const bestIndex = percentages.indexOf(maxImprovement);
    const worstIndex = percentages.indexOf(maxDecline);
    
    // Add findings based on the metric
    if (metricName === 'congestion' || metricName === 'emissions') {
      // For these metrics, lower is better
      if (maxDecline < -5) {
        findings.push(`Simulation ${comparedSimulations[worstIndex].name} shows a significant ${Math.abs(maxDecline).toFixed(1)}% reduction in ${metricName}.`);
      }
      if (maxImprovement > 5) {
        findings.push(`Warning: Simulation ${comparedSimulations[bestIndex].name} increases ${metricName} by ${maxImprovement.toFixed(1)}%.`);
      }
    } else {
      // For satisfaction and transit_usage, higher is better
      if (maxImprovement > 5) {
        findings.push(`Simulation ${comparedSimulations[bestIndex].name} improves ${metricName} by ${maxImprovement.toFixed(1)}%.`);
      }
      if (maxDecline < -5) {
        findings.push(`Warning: Simulation ${comparedSimulations[worstIndex].name} decreases ${metricName} by ${Math.abs(maxDecline).toFixed(1)}%.`);
      }
    }
  }
  
  // Add overall assessment
  if (findings.length === 0) {
    findings.push("No significant differences found between the simulations.");
  } else if (findings.length > 4) {
    findings.unshift("Multiple significant differences found between simulations.");
  }
  
  // Add parameter-based findings
  const parameterDifferences = comparedSimulations.map(sim => {
    const diffs: {[key: string]: number} = {};
    for (const [key, value] of Object.entries(sim.parameters)) {
      diffs[key] = calculatePercentageDifference(
        baselineSimulation.parameters[key as keyof typeof baselineSimulation.parameters],
        value
      );
    }
    return { name: sim.name, diffs };
  });
  
  // Find the most impactful parameter changes
  const parameterImpacts: {[key: string]: {change: number, impact: string}} = {};
  
  for (const param of ['roads', 'population', 'housing', 'public_transport']) {
    const changes = parameterDifferences.map(pd => pd.diffs[param]);
    const maxChange = Math.max(...changes.map(Math.abs));
    
    if (maxChange > 15) {
      const simIndex = changes.findIndex(c => Math.abs(c) === maxChange);
      const simName = parameterDifferences[simIndex].name;
      const direction = changes[simIndex] > 0 ? 'increase' : 'decrease';
      
      parameterImpacts[param] = {
        change: changes[simIndex],
        impact: `${simName}'s ${Math.abs(changes[simIndex]).toFixed(1)}% ${direction} in ${param}`
      };
    }
  }
  
  // Add parameter impact findings
  if (Object.keys(parameterImpacts).length > 0) {
    findings.push("Key parameter changes with significant impact:");
    for (const [param, data] of Object.entries(parameterImpacts)) {
      findings.push(`- ${data.impact}`);
    }
  }
  
  return findings;
};

/**
 * Generates recommendations based on comparison results
 */
const generateRecommendations = (
  metrics: ComparisonMetric['metrics'],
  baselineSimulation: SimulationHistory,
  comparedSimulations: SimulationHistory[]
): string[] => {
  const recommendations: string[] = [];
  
  // Analyze which parameters led to the best outcomes
  const metricImprovements: {[key: string]: number[]} = {};
  
  // For each metric, track which simulation had the best improvement
  for (const [metricName, metricData] of Object.entries(metrics)) {
    const percentages = metricData.percentage_differences;
    
    // For congestion and emissions, lower is better (negative percentage is good)
    // For satisfaction and transit_usage, higher is better (positive percentage is good)
    const isBetterWhenLower = metricName === 'congestion' || metricName === 'emissions';
    
    let bestIndex: number;
    if (isBetterWhenLower) {
      bestIndex = percentages.indexOf(Math.min(...percentages));
    } else {
      bestIndex = percentages.indexOf(Math.max(...percentages));
    }
    
    // Track which simulation was best for this metric
    metricImprovements[metricName] = bestIndex >= 0 ? [bestIndex] : [];
  }
  
  // Find the most effective parameter changes
  const effectiveChanges: {[key: string]: {direction: 'increase' | 'decrease', metrics: string[]}} = {};
  
  for (const [metricName, bestIndices] of Object.entries(metricImprovements)) {
    if (bestIndices.length === 0) continue;
    
    const bestSimulation = comparedSimulations[bestIndices[0]];
    
    // Compare parameters with baseline
    for (const [paramName, value] of Object.entries(bestSimulation.parameters)) {
      const baselineValue = baselineSimulation.parameters[paramName as keyof typeof baselineSimulation.parameters];
      const percentChange = calculatePercentageDifference(baselineValue, value);
      
      // Only consider significant changes
      if (Math.abs(percentChange) < 10) continue;
      
      const direction = percentChange > 0 ? 'increase' : 'decrease';
      
      if (!effectiveChanges[paramName]) {
        effectiveChanges[paramName] = { direction, metrics: [metricName] };
      } else if (effectiveChanges[paramName].direction === direction) {
        effectiveChanges[paramName].metrics.push(metricName);
      }
    }
  }
  
  // Generate recommendations based on effective changes
  for (const [paramName, data] of Object.entries(effectiveChanges)) {
    if (data.metrics.length > 1) {
      recommendations.push(
        `Consider ${data.direction === 'increase' ? 'increasing' : 'decreasing'} ${paramName} to improve ${data.metrics.join(' and ')}.`
      );
    }
  }
  
  // Add general recommendations
  if (recommendations.length === 0) {
    recommendations.push("No clear parameter adjustments identified for significant improvements.");
    recommendations.push("Consider running more simulations with wider parameter variations.");
  } else if (recommendations.length === 1) {
    recommendations.push("Run additional simulations to validate these findings.");
  }
  
  // Add balanced approach recommendation if we have conflicting recommendations
  const conflictingParams = Object.keys(effectiveChanges).filter(param => {
    return Object.entries(effectiveChanges).some(([otherParam, data]) => {
      return param !== otherParam && 
             data.metrics.some(metric => effectiveChanges[param].metrics.includes(metric)) &&
             data.direction !== effectiveChanges[param].direction;
    });
  });
  
  if (conflictingParams.length > 0) {
    recommendations.push("Note: Some parameters have conflicting effects on different metrics. Consider a balanced approach.");
  }
  
  return recommendations;
};

/**
 * Compares multiple simulations and generates a comparison metric
 */
export const compareSimulations = async (
  baselineSimulation: SimulationHistory,
  comparedSimulations: SimulationHistory[],
  config: ComparisonConfig,
  userId: string,
  projectId: string
): Promise<ComparisonMetric> => {
  // Define which metrics to compare
  const metricsToCompare = config.metrics || ['congestion', 'satisfaction', 'emissions', 'transit_usage'];
  
  // Initialize the metrics object
  const metrics: ComparisonMetric['metrics'] = {};
  
  // For each metric, calculate differences
  for (const metricName of metricsToCompare) {
    // Get baseline value
    const baselineValue = baselineSimulation.results[metricName as keyof typeof baselineSimulation.results];
    
    // Get compared values
    const comparedValues = comparedSimulations.map(sim => 
      sim.results[metricName as keyof typeof sim.results]
    );
    
    // Calculate percentage differences
    const percentageDifferences = comparedValues.map(value => 
      calculatePercentageDifference(baselineValue, value)
    );
    
    // Calculate absolute differences
    const absoluteDifferences = comparedValues.map(value => 
      calculateAbsoluteDifference(baselineValue, value)
    );
    
    // Add to metrics object
    metrics[metricName] = {
      baseline_value: baselineValue,
      compared_values: comparedValues,
      percentage_differences: percentageDifferences,
      absolute_differences: absoluteDifferences
    };
  }
  
  // Generate key findings and recommendations
  const keyFindings = generateKeyFindings(metrics, baselineSimulation, comparedSimulations);
  const recommendations = config.generateRecommendations !== false ? 
    generateRecommendations(metrics, baselineSimulation, comparedSimulations) : [];
  
  // Create the comparison metric
  const comparisonMetric: ComparisonMetric = {
    user_id: userId,
    project_id: projectId,
    name: config.name,
    description: config.description || `Comparison between ${baselineSimulation.name} and ${comparedSimulations.length} other simulation(s)`,
    baseline_simulation_id: baselineSimulation.id || '',
    compared_simulation_ids: comparedSimulations.map(sim => sim.id || ''),
    metrics,
    summary: {
      key_findings: keyFindings,
      recommendations
    }
  };
  
  // Save the comparison metric to the database
  try {
    const savedMetric = await saveComparisonMetric(comparisonMetric);
    return savedMetric;
  } catch (error) {
    console.error('Error saving comparison metric:', error);
    return comparisonMetric;
  }
};

/**
 * Compares all simulations for a project
 */
export const compareAllSimulations = async (
  simulations: SimulationHistory[],
  userId: string,
  projectId: string
): Promise<ComparisonMetric | null> => {
  if (simulations.length < 2) {
    console.error('Need at least 2 simulations to compare');
    return null;
  }
  
  // Use the most recent simulation as baseline
  const sortedSimulations = [...simulations].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
  
  const baselineSimulation = sortedSimulations[0];
  const comparedSimulations = sortedSimulations.slice(1);
  
  return await compareSimulations(
    baselineSimulation,
    comparedSimulations,
    {
      name: 'Comprehensive Simulation Comparison',
      description: 'Comparing all simulations for this project',
      generateRecommendations: true
    },
    userId,
    projectId
  );
};
