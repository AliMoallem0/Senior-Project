import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  History, 
  TrendingUp, 
  BarChart2, 
  Play, 
  Download, 
  Upload, 
  FileText,
  Layers,
  RefreshCw
} from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import SimulationHistoryComponent from './SimulationHistory';
import { 
  SimulationHistory, 
  getSimulationHistory, 
  saveSimulationHistory 
} from '@/services/simulationHistoryService';
import { 
  optimizeParameters, 
  runComprehensiveOptimization 
} from '@/services/optimizationService';
import { 
  compareSimulations, 
  compareAllSimulations 
} from '@/services/comparisonService';

interface SimulationIntegrationProps {
  projectId: string;
  cityId: string;
  cityName: string;
  currentParameters: {
    roads: number;
    population: number;
    housing: number;
    public_transport: number;
    [key: string]: number;
  };
  currentResults: {
    congestion: number;
    satisfaction: number;
    emissions: number;
    transit_usage: number;
    [key: string]: number;
  } | null;
  onApplyOptimizedParameters: (parameters: {
    roads: number;
    population: number;
    housing: number;
    public_transport: number;
    [key: string]: number;
  }) => void;
}

const SimulationIntegration = ({
  projectId,
  cityId,
  cityName,
  currentParameters,
  currentResults,
  onApplyOptimizedParameters
}: SimulationIntegrationProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('history');
  const [simulations, setSimulations] = useState<SimulationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [selectedSimulations, setSelectedSimulations] = useState<string[]>([]);

  // Load simulation history when component mounts
  useEffect(() => {
    if (projectId) {
      loadSimulationHistory();
    }
  }, [projectId]);

  // Load simulation history from the database
  const loadSimulationHistory = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const history = await getSimulationHistory(projectId);
      setSimulations(history);
    } catch (error) {
      console.error('Error loading simulation history:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load simulation history."
      });
    } finally {
      setLoading(false);
    }
  };

  // Save current simulation to history
  const saveCurrentSimulation = async () => {
    if (!user?.id || !projectId || !currentResults) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot save simulation: missing user, project, or results."
      });
      return;
    }

    setLoading(true);
    try {
      const simulationData: SimulationHistory = {
        user_id: user.id,
        project_id: projectId,
        city_id: cityId,
        name: `${cityName} Simulation ${new Date().toLocaleString()}`,
        parameters: { ...currentParameters },
        results: { ...currentResults },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      };

      const savedSimulation = await saveSimulationHistory(simulationData);
      
      toast({
        title: "Success",
        description: "Simulation saved to history."
      });
      
      // Refresh the simulation history
      loadSimulationHistory();
      
      return savedSimulation;
    } catch (error) {
      console.error('Error saving simulation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save simulation."
      });
    } finally {
      setLoading(false);
    }
  };

  // Run optimization on the current simulation
  const runOptimization = async (targetMetric: 'congestion' | 'satisfaction' | 'emissions' | 'transit_usage' | 'balanced') => {
    if (!user?.id || !projectId || !currentResults) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot optimize: missing user, project, or results."
      });
      return;
    }

    setOptimizing(true);
    try {
      // First save the current simulation to use as baseline
      const baselineSimulation = await saveCurrentSimulation();
      
      if (!baselineSimulation) {
        throw new Error('Failed to save baseline simulation');
      }
      
      toast({
        title: "Optimizing",
        description: `Running ${targetMetric} optimization...`
      });
      
      // Run the optimization
      const result = await optimizeParameters(
        baselineSimulation,
        { targetMetric },
        user.id,
        projectId
      );
      
      toast({
        title: "Optimization Complete",
        description: `Found parameters that improve ${targetMetric} by ${result.improvement_percentage.toFixed(1)}%`
      });
      
      // Refresh the simulation history
      loadSimulationHistory();
      
      return result;
    } catch (error) {
      console.error('Error running optimization:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to run optimization."
      });
    } finally {
      setOptimizing(false);
    }
  };

  // Run comprehensive optimization (all metrics)
  const runFullOptimization = async () => {
    if (!user?.id || !projectId || !currentResults) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot optimize: missing user, project, or results."
      });
      return;
    }

    setOptimizing(true);
    try {
      // First save the current simulation to use as baseline
      const baselineSimulation = await saveCurrentSimulation();
      
      if (!baselineSimulation) {
        throw new Error('Failed to save baseline simulation');
      }
      
      toast({
        title: "Comprehensive Optimization",
        description: "Running optimization for all metrics..."
      });
      
      // Run the comprehensive optimization
      const results = await runComprehensiveOptimization(
        baselineSimulation,
        user.id,
        projectId
      );
      
      toast({
        title: "Optimization Complete",
        description: `Generated ${results.length} optimization scenarios`
      });
      
      // Refresh the simulation history
      loadSimulationHistory();
      
      return results;
    } catch (error) {
      console.error('Error running comprehensive optimization:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to run comprehensive optimization."
      });
    } finally {
      setOptimizing(false);
    }
  };

  // Run comparison between selected simulations
  const runComparison = async () => {
    if (!user?.id || !projectId || selectedSimulations.length < 2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least 2 simulations to compare."
      });
      return;
    }

    setComparing(true);
    try {
      // Get the selected simulations
      const selectedSims = simulations.filter(sim => 
        selectedSimulations.includes(sim.id || '')
      );
      
      if (selectedSims.length < 2) {
        throw new Error('Not enough valid simulations selected');
      }
      
      toast({
        title: "Comparing Simulations",
        description: `Analyzing ${selectedSims.length} simulations...`
      });
      
      // Use the first selected simulation as baseline
      const baselineSim = selectedSims[0];
      const comparedSims = selectedSims.slice(1);
      
      // Run the comparison
      const result = await compareSimulations(
        baselineSim,
        comparedSims,
        {
          name: `Comparison ${new Date().toLocaleString()}`,
          description: `Comparison between ${baselineSim.name} and ${comparedSims.length} other simulation(s)`,
          generateRecommendations: true
        },
        user.id,
        projectId
      );
      
      toast({
        title: "Comparison Complete",
        description: `Generated comparison with ${result.summary?.key_findings.length || 0} key findings`
      });
      
      // Clear selection and refresh
      setSelectedSimulations([]);
      loadSimulationHistory();
      
      return result;
    } catch (error) {
      console.error('Error running comparison:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to run comparison."
      });
    } finally {
      setComparing(false);
    }
  };

  // Apply optimized parameters to the simulation
  const applyOptimizedParameters = (parameters: {
    roads: number;
    population: number;
    housing: number;
    public_transport: number;
    [key: string]: number;
  }) => {
    onApplyOptimizedParameters(parameters);
    
    toast({
      title: "Parameters Applied",
      description: "Optimized parameters have been applied to the simulation."
    });
  };

  // Toggle simulation selection for comparison
  const toggleSimulationSelection = (simulationId: string) => {
    setSelectedSimulations(prev => {
      if (prev.includes(simulationId)) {
        return prev.filter(id => id !== simulationId);
      } else {
        return [...prev, simulationId];
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Simulation Tools</h2>
          <p className="text-muted-foreground">
            Save, optimize, and compare your simulations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={saveCurrentSimulation} 
            disabled={loading || !currentResults}
            className="flex items-center"
          >
            <FileText className="mr-2 h-4 w-4" />
            Save Current Simulation
          </Button>
          <Button 
            onClick={loadSimulationHistory} 
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Optimization Tools</CardTitle>
          <CardDescription>
            Optimize your simulation parameters for different goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => runOptimization('congestion')} 
              disabled={optimizing || !currentResults}
              className="flex items-center justify-center h-24"
              variant="outline"
            >
              <div className="flex flex-col items-center">
                <TrendingUp className="h-8 w-8 mb-2 text-red-500" />
                <span>Optimize for Low Congestion</span>
              </div>
            </Button>
            <Button 
              onClick={() => runOptimization('satisfaction')} 
              disabled={optimizing || !currentResults}
              className="flex items-center justify-center h-24"
              variant="outline"
            >
              <div className="flex flex-col items-center">
                <TrendingUp className="h-8 w-8 mb-2 text-green-500" />
                <span>Optimize for High Satisfaction</span>
              </div>
            </Button>
            <Button 
              onClick={() => runOptimization('emissions')} 
              disabled={optimizing || !currentResults}
              className="flex items-center justify-center h-24"
              variant="outline"
            >
              <div className="flex flex-col items-center">
                <TrendingUp className="h-8 w-8 mb-2 text-blue-500" />
                <span>Optimize for Low Emissions</span>
              </div>
            </Button>
            <Button 
              onClick={() => runOptimization('transit_usage')} 
              disabled={optimizing || !currentResults}
              className="flex items-center justify-center h-24"
              variant="outline"
            >
              <div className="flex flex-col items-center">
                <TrendingUp className="h-8 w-8 mb-2 text-purple-500" />
                <span>Optimize for High Transit Usage</span>
              </div>
            </Button>
            <Button 
              onClick={() => runOptimization('balanced')} 
              disabled={optimizing || !currentResults}
              className="flex items-center justify-center h-24"
              variant="outline"
            >
              <div className="flex flex-col items-center">
                <TrendingUp className="h-8 w-8 mb-2 text-orange-500" />
                <span>Optimize for Balance</span>
              </div>
            </Button>
            <Button 
              onClick={runFullOptimization} 
              disabled={optimizing || !currentResults}
              className="flex items-center justify-center h-24"
            >
              <div className="flex flex-col items-center">
                <Play className="h-8 w-8 mb-2" />
                <span>Run Comprehensive Optimization</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparison Tools</CardTitle>
          <CardDescription>
            Compare different simulations to identify trends and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedSimulations.length === 0 
                  ? "Select simulations to compare" 
                  : `${selectedSimulations.length} simulation(s) selected`}
              </p>
              <Button 
                onClick={runComparison} 
                disabled={comparing || selectedSimulations.length < 2}
                className="flex items-center"
              >
                <BarChart2 className="mr-2 h-4 w-4" />
                Compare Selected Simulations
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Include the SimulationHistory component */}
      <SimulationHistoryComponent />
    </div>
  );
};

export default SimulationIntegration;
