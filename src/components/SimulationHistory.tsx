import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  History, 
  TrendingUp, 
  BarChart2, 
  Download, 
  Calendar, 
  Clock, 
  Info, 
  Award, 
  Zap, 
  Layers 
} from 'lucide-react';
import { 
  SimulationHistory, 
  OptimizationResult, 
  ComparisonMetric,
  getSimulationHistory,
  getOptimizationResults,
  getComparisonMetrics
} from '@/services/simulationHistoryService';
import { format } from 'date-fns';

const SimulationHistoryComponent = () => {
  const { cityId } = useParams<{ cityId: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("history");
  const [loading, setLoading] = useState(true);
  const [simulationHistory, setSimulationHistory] = useState<SimulationHistory[]>([]);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [comparisonMetrics, setComparisonMetrics] = useState<ComparisonMetric[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (user && cityId) {
      loadData();
    }
  }, [user, cityId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // We're using cityId as the project ID for simplicity
      const projectId = cityId || '';
      
      if (activeTab === "history" || activeTab === "all") {
        const history = await getSimulationHistory(projectId);
        setSimulationHistory(history);
      }
      
      if (activeTab === "optimization" || activeTab === "all") {
        const optimizations = await getOptimizationResults(projectId);
        setOptimizationResults(optimizations);
      }
      
      if (activeTab === "comparison" || activeTab === "all") {
        const comparisons = await getComparisonMetrics(projectId);
        setComparisonMetrics(comparisons);
      }
    } catch (error) {
      console.error("Error loading simulation data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  const exportToJson = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Render simulation history table
  const renderHistoryTable = () => (
    <Table>
      <TableCaption>A list of your simulation runs</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Parameters</TableHead>
          <TableHead>Results</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {simulationHistory.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.created_at ? formatDate(item.created_at) : 'N/A'}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {Object.entries(item.parameters).map(([key, value]) => (
                  <Badge key={key} variant="outline">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {Object.entries(item.results).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="bg-blue-50">
                    {key}: {value.toFixed(2)}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewDetails(item)}
                >
                  <Info className="h-4 w-4 mr-1" />
                  Details
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToJson(item, `simulation-${item.id}.json`)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {simulationHistory.length === 0 && !loading && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
              No simulation history found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  // Render optimization results table
  const renderOptimizationTable = () => (
    <Table>
      <TableCaption>A list of your optimization results</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Improvement</TableHead>
          <TableHead>Confidence</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {optimizationResults.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">
                {item.optimization_type}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={item.improvement_percentage > 10 ? "secondary" : "default"}>
                {item.improvement_percentage.toFixed(2)}%
              </Badge>
            </TableCell>
            <TableCell>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${item.confidence_score * 100}%` }}
                ></div>
              </div>
              <span className="text-xs">{(item.confidence_score * 100).toFixed(0)}%</span>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewDetails(item)}
                >
                  <Info className="h-4 w-4 mr-1" />
                  Details
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToJson(item, `optimization-${item.id}.json`)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {optimizationResults.length === 0 && !loading && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
              No optimization results found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  // Render comparison metrics table
  const renderComparisonTable = () => (
    <Table>
      <TableCaption>A list of your comparison metrics</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Baseline</TableHead>
          <TableHead>Comparisons</TableHead>
          <TableHead>Key Metrics</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {comparisonMetrics.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>
              <Badge variant="outline">
                {item.baseline_simulation_id.substring(0, 8)}...
              </Badge>
            </TableCell>
            <TableCell>
              {item.compared_simulation_ids.length} simulations
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {Object.keys(item.metrics).slice(0, 2).map((key) => (
                  <Badge key={key} variant="outline">
                    {key}
                  </Badge>
                ))}
                {Object.keys(item.metrics).length > 2 && (
                  <Badge variant="outline">+{Object.keys(item.metrics).length - 2} more</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewDetails(item)}
                >
                  <Info className="h-4 w-4 mr-1" />
                  Details
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToJson(item, `comparison-${item.id}.json`)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {comparisonMetrics.length === 0 && !loading && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
              No comparison metrics found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  // Render loading skeletons
  const renderSkeletons = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Simulation Data</h2>
          <p className="text-muted-foreground">
            View and analyze your simulation history, optimizations, and comparisons
          </p>
        </div>
        <Button onClick={loadData}>
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="history" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history" className="flex items-center">
            <History className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            Optimizations
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center">
            <BarChart2 className="mr-2 h-4 w-4" />
            Comparisons
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Simulation History</CardTitle>
              <CardDescription>
                View all your previous simulation runs with detailed parameters and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? renderSkeletons() : renderHistoryTable()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="optimization" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Results</CardTitle>
              <CardDescription>
                View optimal configurations generated for your simulation scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? renderSkeletons() : renderOptimizationTable()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparison" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparison Metrics</CardTitle>
              <CardDescription>
                Compare performance metrics across different urban planning models
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? renderSkeletons() : renderComparisonTable()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name || 'Details'}</DialogTitle>
            <DialogDescription>
              {selectedItem?.description || 'Detailed information about this item'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6 py-4">
              {/* Common metadata */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {selectedItem.created_at && (
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatDate(selectedItem.created_at)}
                  </div>
                )}
                {selectedItem.metadata?.duration_ms && (
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {(selectedItem.metadata.duration_ms / 1000).toFixed(2)}s
                  </div>
                )}
              </div>
              
              {/* Parameters section */}
              {(selectedItem.parameters || selectedItem.optimal_parameters) && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Parameters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(selectedItem.parameters || selectedItem.optimal_parameters || {}).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-sm text-muted-foreground">{key}</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Results section */}
              {(selectedItem.results || selectedItem.predicted_results) && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(selectedItem.results || selectedItem.predicted_results || {}).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-sm text-muted-foreground">{key}</span>
                          <span className="font-medium">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Results chart */}
                    <div className="mt-6 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(selectedItem.results || selectedItem.predicted_results || {}).map(([key, value]) => ({
                            name: key,
                            value: value
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Optimization specific section */}
              {selectedItem.improvement_percentage && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Optimization Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col items-center p-4 border rounded-lg">
                        <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                        <span className="text-sm text-muted-foreground">Improvement</span>
                        <span className="text-2xl font-bold">{selectedItem.improvement_percentage.toFixed(2)}%</span>
                      </div>
                      <div className="flex flex-col items-center p-4 border rounded-lg">
                        <Award className="h-8 w-8 text-blue-500 mb-2" />
                        <span className="text-sm text-muted-foreground">Confidence</span>
                        <span className="text-2xl font-bold">{(selectedItem.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex flex-col items-center p-4 border rounded-lg">
                        <Zap className="h-8 w-8 text-purple-500 mb-2" />
                        <span className="text-sm text-muted-foreground">Optimization Type</span>
                        <span className="text-xl font-medium">{selectedItem.optimization_type}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Comparison specific section */}
              {selectedItem.metrics && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Comparison Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(selectedItem.metrics || {}).map(([key, data]: [string, any]) => (
                        <div key={key} className="space-y-2">
                          <h4 className="font-medium">{key}</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={[
                                  { name: 'Baseline', value: data.baseline_value },
                                  ...data.compared_values.map((value: number, i: number) => ({
                                    name: `Variant ${i+1}`,
                                    value: value
                                  }))
                                ]}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <span className="text-sm text-muted-foreground">Baseline Value</span>
                              <div className="font-medium">{data.baseline_value.toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Max Difference</span>
                              <div className="font-medium">
                                {Math.max(...data.percentage_differences).toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {selectedItem.summary && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium mb-2">Key Findings</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {(selectedItem.summary?.key_findings || []).map((finding: string, i: number) => (
                            <li key={i}>{finding}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Export button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => exportToJson(selectedItem, `data-${selectedItem.id}.json`)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimulationHistoryComponent;
