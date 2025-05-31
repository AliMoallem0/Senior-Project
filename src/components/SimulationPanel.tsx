/**
 * SimulationPanel Component
 * 
 * A component that provides a user interface for running urban planning simulations.
 * Features:
 * - Project details management
 * - Simulation parameters configuration
 * - Real-time simulation controls
 * - Results visualization
 * - Responsive design
 * - Dark mode support
 */

import React, { FC, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from "@/lib/utils";
import { 
  PlayCircle, 
  StopCircle, 
  RotateCcw, 
  Save,
  Share2,
  Bookmark,
  Building,
  Car,
  Users,
  Bus,
  Map,
  Download,
  Settings,
  Trophy,
  Mic,
  Layers,
  MapPin,
  BarChart2,
  MessageSquare,
  Trash,
  Plus,
  CheckSquare,
  FolderOpen
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CustomProgress } from "@/components/ui/custom-progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { createProject, getProjects } from '@/services/cityService';
import { checkUserPermissions } from '@/services/dbService';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js/auto';
import { Bar } from 'react-chartjs-2';
import L from 'leaflet';
import { MapContainer, TileLayer, Circle, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import TrafficMap from './TrafficMap';
import { TOMTOM_API_KEY } from '@/services/trafficService';
import { toast } from "@/components/ui/use-toast";
import type { SimulationResult } from '@/services/dbService';
import { saveSimulationResult, getSimulationResults } from '@/services/dbService';
import type { CityParameters } from '@/services/cityService';
import { Parameters } from '../services/aiService';
import { AIRecommendations } from './AIRecommendations';
import { AIParameterAnalysis } from './AIParameterAnalysis';
import { AIResultsInterpretation } from './AIResultsInterpretation';
import { AISmartGoals } from './AISmartGoals';
import { ActivityTimeline } from './ActivityTimeline';
import { AISaveResults } from './AISaveResults';
import { ExportResultsPDF } from './ExportResultsPDF';

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SimulationPanelProps {
  projectId: string | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  displayContent: string;
  isTyping: boolean;
  timestamp?: Date;
  reactions?: string[];
  suggestions?: string[];
  id?: string; // Used when loading from database
}

interface SimulationHistory {
  id: string;
  timestamp: Date;
  params: typeof defaultParams;
  results: SimulationResults;
  notes?: string;
}

interface SimulationResults {
  congestion: number;
  satisfaction: number;
  emissions: number;
  transit_usage: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface Preset {
  id: string;
  name: string;
  description: string;
  params: typeof defaultParams;
  category: 'sustainable' | 'economic' | 'social' | 'custom';
}

interface ProjectGoal {
  id: string;
  description: string;
  target: number;
  current: number;
  metric: keyof SimulationResults;
  completed: boolean;
}

interface GeocodingResult {
  lat: number;
  lon: number;
}

const DUBAI_COORDINATES = {
  lat: 25.2048,
  lng: 55.2708
};

const defaultParams = {
  roads: 50,
  population: 50,
  housing: 50,
  public_transport: 50,
};

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

// Update the mapContainerStyle constant
const mapContainerStyle = {
  height: '400px',
  width: '100%',
  position: 'relative' as const,
  zIndex: 1,
  background: '#f8f9fa'  // Light background color while tiles load
};

interface Results {
  congestion: number;
  satisfaction: number;
  emissions: number;
  transit_usage: number;
}

// Add TimelineEvent interface before the SimulationPanel component
interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'simulation' | 'project' | 'analysis';
  title: string;
  description: string;
  status: 'in-progress' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

interface SavedProject {
  id: string;
  name: string;
  type: string;
  location: string;
  description: string;
  goals: string;
  parameters: {
    roads: number;
    population: number;
    housing: number;
    public_transport: number;
  };
}

export const SimulationPanel: FC<SimulationPanelProps> = ({ projectId: initialProjectId }): ReactNode => {
  const { toast, dismiss } = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  const [projectId, setProjectId] = useState<string | null>(initialProjectId || null);
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cityName, setCityName] = useState<string>('');
  const [params, setParams] = useState<CityParameters>({
    roads: 50,
    population: 50,
    housing: 50,
    public_transport: 50
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [simulationTime, setSimulationTime] = useState<null | number>(null);
  const [showLoading, setShowLoading] = useState(false);
  
  const [projectDetails, setProjectDetails] = useState({
    name: '',
    type: '',
    location: '',
    description: '',
    goals: ''
  });
  
  const [results, setResults] = useState<null | {
    congestion: number;
    satisfaction: number;
    emissions: number;
    transit_usage: number;
  }>(null);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const API_KEY = 'AIzaSyAvja_Okim1g9zfR5MXYLYtvV2It4ZTMs4';
  const abortControllerRef = useRef<AbortController | null>(null);
  const voiceRecognitionRef = useRef<any>(null);
  
  // Chat history state
  const [savedChats, setSavedChats] = useState<{id: string, title: string, updated_at: string}[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New state for enhanced features
  const [simulationHistory, setSimulationHistory] = useState<SimulationHistory[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [savedPresets, setSavedPresets] = useState<Preset[]>([]);
  const [projectGoals, setProjectGoals] = useState<ProjectGoal[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [selectedVisualization, setSelectedVisualization] = useState<'chart' | 'map' | 'table'>('chart');
  const [notifications, setNotifications] = useState<{id: string; message: string; type: 'warning' | 'success' | 'info'}[]>([]);
  const [isHighContrastMode, setIsHighContrastMode] = useState(false);
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(true);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [comments, setComments] = useState<{id: string; user: string; text: string; timestamp: Date}[]>([]);
  
  // Refs for new features
  const chartRef = useRef(null);
  const mapRef = useRef<L.Map | null>(null);
  
  const [mapCenter, setMapCenter] = useState({ lat: 25.2048, lng: 55.2708 }); // Initialize with Dubai coordinates
  const [activeTab, setActiveTab] = useState('simulation');
  
  // Add these state variables
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [locationDetails, setLocationDetails] = useState<{
    address: string;
    municipality?: string;
    subdivision?: string;
  } | null>(null);

  const [activityEvents, setActivityEvents] = useState<TimelineEvent[]>([]);
  
  // Local type for simulation history table
  type HistoryRow = {
    id: string | number | Date;
    created_at?: string | Date;
    city_name: string;
    parameters: { roads: number; population: number; housing: number; public_transport: number; };
    results: { congestion: number; satisfaction: number; emissions: number; transit_usage: number; };
  };
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([]);

  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  
  // Load latest simulation result on mount
  useEffect(() => {
    const loadLatestResult = async () => {
      try {
        if (!projectId) return; // Add null check
        const results = await getSimulationResults(projectId);
        if (results && results.length > 0) {
          setSimulationResults(results[0]);
          setCityName(results[0].city_name);
        }
      } catch (error) {
        console.error('Failed to load latest simulation result:', error);
      }
    };
    loadLatestResult();
  }, [projectId]);
  
  // Fetch saved projects when component mounts
  useEffect(() => {
    const fetchSavedProjects = async () => {
      if (!user?.id) return;
      try {
        const projects = await getProjects(user.id);
        setSavedProjects(projects);
      } catch (error) {
        console.error('Error fetching saved projects:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load saved projects.",
        });
      }
    };

    fetchSavedProjects();
  }, [user?.id]);
  
  const handleParamChange = (param: keyof CityParameters, value: number[]) => {
    setParams((prev: CityParameters) => ({ ...prev, [param]: value[0] }));
    
    if (isSimulating) {
      handleStopSimulation();
    } else {
      setResults(null);
    }
  };

  const handleProjectDetailChange = (field: keyof typeof projectDetails, value: string) => {
    setProjectDetails(prev => ({ ...prev, [field]: value }));
    
    // Immediately update map when location changes
    if (field === 'location') {
      console.log('Location changed to:', value); // Debug log
      if (value.trim()) {
        updateMapLocation(value);
      } else {
        // Reset to default if location is cleared
        setMapCenter({ lat: 25.2048, lng: 55.2708 });
        setLocationDetails(null);
      }
    }
    
    if (isSimulating) {
      handleStopSimulation();
    } else {
      setResults(null);
    }
  };
  
  const handleStopSimulation = () => {
    setIsSimulating(false);
  };
  
  const handleStartSimulation = async () => {
    // UUID validation regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!projectId || !uuidRegex.test(projectId)) {
      toast({
        variant: "destructive",
        title: "No Valid Project",
        description: "Please save your project before running a simulation.",
      });
      return;
    }
    setIsSimulating(true);
    setShowLoading(true);
    setProgress(0);
    setResults(null);
    setSimulationTime(null);
    
    const startTime = Date.now();
    
    try {
      // Update progress to show simulation is running
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 2;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          
          const endTime = Date.now();
          setSimulationTime(endTime - startTime);
          
            // Calculate results using the fallback formula
          const congestion = Math.max(0, 100 - (params.roads * 0.8) - (params.public_transport * 0.5) + (params.population * 0.7));
          const satisfaction = (params.housing * 0.4) + (params.roads * 0.2) + (params.public_transport * 0.4) - (congestion * 0.5);
          const emissions = (params.population * 0.6) - (params.public_transport * 0.4) + (congestion * 0.3);
          const transit_usage = (params.public_transport * 0.7) + (congestion * 0.3);
          
          setResults({
            congestion: Math.min(100, Math.max(0, congestion)),
            satisfaction: Math.min(100, Math.max(0, satisfaction)),
            emissions: Math.min(100, Math.max(0, emissions)),
              transit_usage: Math.min(100, Math.max(0, transit_usage))
            });

            // Switch to visualization tab after simulation completes
            setTimeout(() => {
              setActiveTab('visualization');
              setShowLoading(false);
            }, 500);
          
          // Save the results if we have a project ID
          if (projectId) {
            saveResults();
          }
        }
        return newProgress;
      });
      }, 100);
    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        variant: "destructive",
        title: "Simulation Error",
        description: "An error occurred during the simulation.",
      });
    } finally {
    setIsSimulating(false);
    }
  };
  
  const handleResetParams = () => {
    setParams(defaultParams);
    setProjectDetails({
      name: '',
      type: '',
      location: '',
      description: '',
      goals: ''
    });
    setResults(null);
    setProgress(0);
    setIsSimulating(false);
  };
  
  const saveProject = async () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // Debug log for user and cityName
    console.log('saveProject called. user:', user, 'cityName:', cityName, 'projectDetails.location:', projectDetails.location);
    // Use projectDetails.location as cityName if cityName is empty
    const city = cityName || projectDetails.location;
    if (!user || !city) {
      toast({
        variant: "destructive",
        title: "Cannot save project",
        description: "You must be logged in and have a city selected to save a project.",
      });
      return;
    }

    if (!projectDetails.name) {
      toast({
        variant: "destructive",
        title: "Project name required",
        description: "Please provide a name for your project before saving.",
      });
      return;
    }

    try {
      setIsSaving(true);
      const project = await createProject({
        user_id: user.id,
        city_id: city,
        name: projectDetails.name,
        type: projectDetails.type,
        description: projectDetails.description,
        location: projectDetails.location,
        goals: projectDetails.goals,
        parameters: {
          roads: params.roads,
          population: params.population,
          housing: params.housing,
          public_transport: params.public_transport,
        }
      });
      // Debug log for the full project object
      console.log('Project object returned:', project);
      console.log('Project object keys:', Object.keys(project));
      // Try to set the correct project ID
      let newProjectId: string | undefined = undefined;
      if (typeof project.id === 'string' && uuidRegex.test(project.id)) {
        newProjectId = project.id;
      } else if (project && typeof project === 'object' && 'data' in project && project.data && typeof (project.data as any).id === 'string' && uuidRegex.test((project.data as any).id)) {
        newProjectId = (project.data as any).id;
      } else if (Array.isArray(project) && typeof project[0]?.id === 'string' && uuidRegex.test(project[0].id)) {
        newProjectId = project[0].id;
      }
      if (newProjectId) {
        setProjectId(newProjectId);
        console.log('Project created with ID:', newProjectId);
      } else {
        console.error('No valid project ID found in project object:', project);
      }
      setSimulationResults(null);
      toast({
        title: "Project saved",
        description: "Your simulation project has been saved successfully.",
      });
    } catch (error: any) {
      console.error('Full error from createProject:', error);
      toast({
        variant: "destructive",
        title: "Failed to save project",
        description: (error.message || "An error occurred while saving your project.") + (error?.details ? `\nDetails: ${error.details}` : ''),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveResults = async () => {
    if (!user || !projectId || !results || !userId) { // Add userId check
      toast({
        variant: "destructive",
        title: "Cannot save results",
        description: "You must be logged in, have a saved project, and have run a simulation to save results.",
      });
      return;
    }

    // UUID validation regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId) || !uuidRegex.test(userId)) {
      toast({
        variant: "destructive",
        title: "Invalid Project or User ID",
        description: `Project ID or User ID is not a valid UUID. Please make sure you have a valid project selected and are logged in. (projectId: ${projectId}, userId: ${userId})`,
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Check if user has permissions before saving
      const hasPermission = await checkUserPermissions();
      if (!hasPermission) {
        setIsSaving(false);
        toast({
          title: "Permission Error",
          description: "You don't have permission to save simulation results",
          variant: "destructive"
        });
        return;
      }
      
      // Get AI analysis data from components
      const parameterAnalysisComponent = document.querySelector('[data-component="AIParameterAnalysis"]');
      const resultsInterpretationComponent = document.querySelector('[data-component="AIResultsInterpretation"]');
      const smartGoalsComponent = document.querySelector('[data-component="AISmartGoals"]');
      const recommendationsComponent = document.querySelector('[data-component="AIRecommendations"]');
      
      // Create AI analysis object with proper filtering to avoid empty values
      const aiAnalysis = {
        parameter_analysis: parameterAnalysisComponent?.querySelector('.impact-text')?.textContent?.trim() || '',
        risks: Array.from(parameterAnalysisComponent?.querySelectorAll('.risks-list li') || [])
          .map(item => item.textContent?.trim() || '')
          .filter(text => text !== ''),
        opportunities: Array.from(parameterAnalysisComponent?.querySelectorAll('.opportunities-list li') || [])
          .map(item => item.textContent?.trim() || '')
          .filter(text => text !== ''),
        suggestions: Array.from(parameterAnalysisComponent?.querySelectorAll('.suggestions-list li') || [])
          .map(item => item.textContent?.trim() || '')
          .filter(text => text !== ''),
        interpretation: resultsInterpretationComponent?.querySelector('.summary-text')?.textContent?.trim() || '',
        key_insights: Array.from(resultsInterpretationComponent?.querySelectorAll('.insights-list li') || [])
          .map(item => item.textContent?.trim() || '')
          .filter(text => text !== ''),
        suggested_improvements: Array.from(resultsInterpretationComponent?.querySelectorAll('.improvements-list li') || [])
          .map(item => item.textContent?.trim() || '')
          .filter(text => text !== ''),
        comparisons: Array.from(resultsInterpretationComponent?.querySelectorAll('.comparisons-list li') || [])
          .map(item => item.textContent?.trim() || '')
          .filter(text => text !== '')
      };
      
      // Only include AI analysis if there's actual content
      const hasAiContent = 
        aiAnalysis.parameter_analysis || 
        aiAnalysis.risks.length > 0 || 
        aiAnalysis.opportunities.length > 0 || 
        aiAnalysis.suggestions.length > 0 || 
        aiAnalysis.interpretation || 
        aiAnalysis.key_insights.length > 0 || 
        aiAnalysis.suggested_improvements.length > 0 || 
        aiAnalysis.comparisons.length > 0;
      
      // Try a simplified approach for AI analysis data
      const simulationData: SimulationResult = {
        project_id: projectId,
        user_id: userId,
        city_name: cityName,
        parameters: {
          roads: params.roads,
          population: params.population,
          housing: params.housing,
          public_transport: params.public_transport
        },
        results: {
          congestion: results.congestion,
          satisfaction: results.satisfaction,
          emissions: results.emissions,
          transit_usage: results.transit_usage
        },
        // Use a simplified AI analysis structure to avoid RLS issues
        ...(hasAiContent && {
          ai_analysis: {
            parameter_analysis: aiAnalysis.parameter_analysis || '',
            risks: aiAnalysis.risks || [],
            opportunities: aiAnalysis.opportunities || [],
            suggestions: aiAnalysis.suggestions || [],
            interpretation: aiAnalysis.interpretation || '',
            key_insights: aiAnalysis.key_insights || [],
            suggested_improvements: aiAnalysis.suggested_improvements || [],
            comparisons: aiAnalysis.comparisons || []
          }
        })
      };
      try {
        // Save to Supabase (with localStorage fallback)
        const resultId = await saveSimulationResult(simulationData);
        console.log('Save operation completed with ID:', resultId);
        
        // Fetch the saved results
        const savedResults = await getSimulationResults(projectId);
        if (savedResults && savedResults.length > 0) {
          // Update the simulation results state with the first (most recent) result
          setSimulationResults(savedResults[0]);
          console.log('Updated simulation results state:', savedResults[0]);
        }
        
        // Show success message to the user
        toast({
          title: "Results saved",
          description: "Your simulation results have been saved successfully.",
        });
        
        // Set isSaving to false to update UI
        setIsSaving(false);
      } catch (error) {
        console.error('Error handling saved results:', error);
        toast({
          title: "Warning",
          description: "Results processed but there was an issue retrieving the saved data.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to save results",
        description: error.message || "An error occurred while saving your results.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderResultStatus = (value: number) => {
    if (value > 75) return 'Excellent';
    if (value > 50) return 'Good';
    if (value > 25) return 'Fair';
    return 'Poor';
  };
  
  const renderResultColor = (value: number, isReversed: boolean = false) => {
    const normalizedValue = isReversed ? 100 - value : value;
    
    if (normalizedValue > 75) return 'bg-green-500';
    if (normalizedValue > 50) return 'bg-emerald-500';
    if (normalizedValue > 25) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  const splitIntoSegments = (text: string): string[] => {
    // Split by sentences and line breaks while preserving empty lines
    return text.split(/(?<=[.!?])\s+|\n+/).filter(segment => segment.trim().length > 0);
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };
  
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Create or update chat history entry if not exists
    if (!currentChatId) {
      try {
        const { data: newChat, error } = await supabase
          .from('ai_chat_history')
          .insert({
            user_id: user?.id,
            title: userInput.substring(0, 50) // Use first 50 chars of first message as title
          })
          .select('id')
          .single();
          
        if (error) throw error;
        setCurrentChatId(newChat.id);
      } catch (error) {
        console.error('Failed to create chat history:', error);
      }
    } else {
      // Update last activity timestamp
      await supabase
        .from('ai_chat_history')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentChatId);
    }
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: userInput,
      displayContent: userInput,
      isTyping: false,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    
    // Save message to database if we have a chat ID
    if (currentChatId) {
      try {
        await supabase.from('ai_chat_messages').insert({
          chat_id: currentChatId,
          role: 'user',
          content: userInput
        });
      } catch (error) {
        console.error('Failed to save message:', error);
      }
    }

    try {
      setIsGenerating(true);
      const assistantIndex = chatMessages.length + 1;
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        displayContent: '',
        isTyping: true
      };

      setChatMessages(prev => [...prev, assistantMessage]);

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{
              text: `You are an urban planning assistant. The user is working on a simulation for ${cityName || 'a city'}. 
              Project details: ${JSON.stringify(projectDetails)}. 
              Current parameters: ${JSON.stringify(params)}. 
              User question: ${userInput}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
        signal: abortControllerRef.current.signal
      });

      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;

      let currentText = '';
      for (let i = 0; i < aiResponse.length; i++) {
        // Check if generation has been stopped
        if (!abortControllerRef.current) {
          break;
        }

        currentText += aiResponse[i];
        setChatMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[assistantIndex] && newMessages[assistantIndex].role === 'assistant') {
            newMessages[assistantIndex] = {
              ...newMessages[assistantIndex],
              content: aiResponse,
              displayContent: currentText,
              isTyping: true
            };
          }
          return newMessages;
        });
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      // Final update only if not aborted
      if (abortControllerRef.current) {
        setChatMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[assistantIndex] && newMessages[assistantIndex].role === 'assistant') {
            newMessages[assistantIndex] = {
              ...newMessages[assistantIndex],
              content: aiResponse,
              displayContent: currentText,
              isTyping: false,
              timestamp: new Date()
            };
          }
          return newMessages;
        });
        
        // Save assistant's final response to database
        if (currentChatId) {
          try {
            await supabase.from('ai_chat_messages').insert({
              chat_id: currentChatId,
              role: 'assistant',
              content: aiResponse
            });
          } catch (error) {
            console.error('Failed to save assistant message:', error);
          }
        }
      }

    } catch (error) {
      console.error('Detailed error:', error);
      // Only show error toast if not aborted
      if (error instanceof Error && error.name !== 'AbortError') {
      toast({
        variant: "destructive",
        title: "Chat Error",
          description: error.message || "Failed to get response from AI assistant.",
      });
        
        // Remove the placeholder message if there's an error
        setChatMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('ai_chat_history')
          .select('id, title, updated_at')
          .order('updated_at', { ascending: false });
          
        if (error) throw error;
        setSavedChats(data || []);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load chat history."
        });
      }
    };
    
    loadChatHistory();
  }, [user]);
  
  // Load chat messages when chat ID changes
  useEffect(() => {
    const loadChatMessages = async () => {
      if (!currentChatId) {
        setChatMessages([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('ai_chat_messages')
          .select('*')
          .eq('chat_id', currentChatId)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          const formattedMessages: ChatMessage[] = data.map((msg: any) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            displayContent: msg.content,
            isTyping: false,
            timestamp: new Date(msg.created_at)
          }));
          
          setChatMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Failed to load chat messages:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load chat messages."
        });
      }
    };
    
    loadChatMessages();
  }, [currentChatId]);

  // Utility functions for chat history
  const startNewChat = () => {
    setCurrentChatId(null);
    setChatMessages([]);
  };
  
  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };
  
  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the chat when deleting
    
    try {
      const { error } = await supabase
        .from('ai_chat_history')
        .delete()
        .eq('id', chatId);
        
      if (error) throw error;
      
      // Update the local state
      setSavedChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // If the deleted chat was the current one, clear the current chat
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setChatMessages([]);
      }
      
      toast({
        title: "Chat Deleted",
        description: "Chat history has been deleted."
      });
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete chat history."
      });
    }
  };
  
  const renameChatTitle = async (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      const { error } = await supabase
        .from('ai_chat_history')
        .update({ title: newTitle })
        .eq('id', chatId);
        
      if (error) throw error;
      
      // Update local state
      setSavedChats(prev => 
        prev.map(chat => 
          chat.id === chatId ? {...chat, title: newTitle} : chat
        )
      );
      
      toast({
        title: "Chat Renamed",
        description: "Chat title has been updated."
      });
    } catch (error) {
      console.error('Failed to rename chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update chat title."
      });
    }
  };

  // Voice input handling
  const handleVoiceInput = () => {
    if (!voiceRecognitionRef.current) {
      voiceRecognitionRef.current = new window.webkitSpeechRecognition();
      voiceRecognitionRef.current.continuous = false;
      voiceRecognitionRef.current.interimResults = false;
      
      voiceRecognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setUserInput(text);
      };
    }
    
    voiceRecognitionRef.current.start();
  };

  const savePreset = () => {
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: projectDetails.name || 'Custom Preset',
      description: projectDetails.description || '',
      params: { ...params },
      category: 'custom'
    };
    setSavedPresets(prev => [...prev, newPreset]);
    toast({
      title: "Preset Saved",
      description: "Your current parameters have been saved as a preset.",
    });
  };

  const loadPreset = (preset: Preset) => {
    setParams(preset.params);
    setSelectedPreset(preset);
    toast({
      title: "Preset Loaded",
      description: `Loaded preset: ${preset.name}`,
    });
  };

  const addProjectGoal = (metric: keyof SimulationResults, target: number) => {
    const newGoal: ProjectGoal = {
      id: Date.now().toString(),
      description: `Achieve ${target}% ${metric}`,
      target,
      current: results ? results[metric] : 0,
      metric,
      completed: false
    };
    setProjectGoals(prev => [...prev, newGoal]);
  };

  const updateGoals = () => {
    if (!results) return;
    
    setProjectGoals(prev => prev.map(goal => ({
      ...goal,
      current: results[goal.metric],
      completed: results[goal.metric] >= goal.target
    })));
  };

  const checkAchievements = () => {
    if (!results) return;
    
    const newAchievements: Achievement[] = [
      {
        id: 'perfect_balance',
        title: 'Perfect Balance',
        description: 'Achieve 80% or higher in all metrics',
        unlocked: Object.values(results).every(value => value >= 80),
        progress: Object.values(results).filter(value => value >= 80).length,
        maxProgress: 4
      },
      {
        id: 'eco_friendly',
        title: 'Eco Warrior',
        description: 'Keep emissions under 20% while maintaining 70%+ satisfaction',
        unlocked: results.emissions < 20 && results.satisfaction >= 70,
        progress: results.emissions < 20 ? 1 : 0,
        maxProgress: 1
      },
      // Add more achievements as needed
    ];
    
    setAchievements(newAchievements);
  };

  const addComment = (text: string) => {
    const newComment = {
      id: Date.now().toString(),
      user: user?.user_metadata?.name || 'Anonymous',
      text,
      timestamp: new Date()
    };
    setComments(prev => [...prev, newComment]);
  };

  const shareSimulation = async () => {
    try {
      const shareData = {
        params,
        results,
        projectDetails,
        timestamp: new Date()
      };
      
      // Generate a unique sharing URL or ID
      const shareId = Date.now().toString(36);
      
      // In a real app, you would save this to a database
      console.log('Sharing simulation:', shareId, shareData);
      
      // Copy sharing link to clipboard
      await navigator.clipboard.writeText(`${window.location.origin}/simulation/${shareId}`);
      
      toast({
        title: "Simulation Shared",
        description: "Share link copied to clipboard!",
      });
    } catch (error) {
      console.error('Error sharing simulation:', error);
      toast({
        variant: "destructive",
        title: "Share Error",
        description: "Failed to share simulation.",
      });
    }
  };

  const exportResults = () => {
    if (!results) return;
    
    const exportData = {
      projectDetails,
      params,
      results,
      timestamp: new Date(),
      history: simulationHistory
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleKeyboardShortcut = (event: KeyboardEvent) => {
    if (!keyboardShortcutsEnabled) return;
    
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault();
          saveProject();
          break;
        case 'r':
          event.preventDefault();
          handleStartSimulation();
          break;
        case 'z':
          event.preventDefault();
          handleResetParams();
          break;
        // Add more shortcuts as needed
      }
    }
  };

  // Effect for keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, [keyboardShortcutsEnabled]);

  // Effect for updating goals and checking achievements after simulation
  useEffect(() => {
    if (results) {
      updateGoals();
      checkAchievements();
      
      // Add to simulation history
      setSimulationHistory(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date(),
        params: { ...params },
        results: { ...results },
        notes: projectDetails.description
      }]);
    }
  }, [results]);

  // Fetch all simulation results for the current project
  useEffect(() => {
    async function fetchHistory() {
      if (!projectId) return;
      try {
        const historyRaw = await getSimulationResults(projectId);
        const history: HistoryRow[] = historyRaw.map(run => ({
          id: run.id || run.created_at || Math.random().toString(),
          created_at: run.created_at,
          city_name: run.city_name,
          parameters: run.parameters,
          results: run.results
        }));
        setHistoryRows(history);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch simulation history',
          variant: 'destructive',
        });
      }
    }
    fetchHistory();
  }, [projectId, simulationResults]);

  // This duplicate saveResults function has been removed

  // Chart configuration
  const chartData = {
    labels: ['Congestion', 'Satisfaction', 'Emissions', 'Transit Usage'],
    datasets: [
      {
        label: 'Current Results',
        data: results ? [
          results.congestion,
          results.satisfaction,
          results.emissions,
          results.transit_usage
        ] : [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(54, 162, 235, 0.5)',
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(75, 192, 192)',
          'rgb(255, 206, 86)',
          'rgb(54, 162, 235)',
        ],
        borderWidth: 1,
      },
      {
        label: 'Previous Results',
        data: historyRows.length > 0 ? [
          historyRows[historyRows.length - 1].results.congestion,
          historyRows[historyRows.length - 1].results.satisfaction,
          historyRows[historyRows.length - 1].results.emissions,
          historyRows[historyRows.length - 1].results.transit_usage,
        ] : [],
        backgroundColor: 'rgba(201, 203, 207, 0.5)',
        borderColor: 'rgb(201, 203, 207)',
        borderWidth: 1,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Simulation Results Comparison',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const updateMapLocation = async (location: string) => {
    console.log('Updating map location for:', location); // Debug log
    
    try {
      const geocodeUrl = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(location)}.json?key=${TOMTOM_API_KEY}`;
      console.log('Geocoding URL:', geocodeUrl); // Debug log
      
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      console.log('Geocoding response:', data); // Debug log
      
      if (data.results && data.results.length > 0) {
        const { lat, lon } = data.results[0].position;
        const { address } = data.results[0];
        
        console.log('Found coordinates:', { lat, lon }); // Debug log
        
        // Update map center and coordinates
        setMapCenter({ lat, lng: lon });
        setMapCoordinates({ lat, lon });
        
        // Store location details
        const locationInfo = {
          address: address.freeformAddress || location,
          municipality: address.municipality,
          subdivision: address.countrySubdivision
        };
        console.log('Setting location details:', locationInfo); // Debug log
        setLocationDetails(locationInfo);
        
        // If we have a map reference, update its view with animation
        if (mapRef.current) {
          console.log('Updating map view to:', [lat, lon]); // Debug log
          mapRef.current.setView([lat, lon], 13, {
            animate: true,
            duration: 1
          });
        } else {
          console.log('No map reference available'); // Debug log
        }
        
        toast({
          title: "Location Updated",
          description: `Map centered on ${address.freeformAddress || location}`,
          variant: "default"
        });
      } else {
        console.log('No results found for location:', location); // Debug log
        // If no results found, use default coordinates
        setMapCenter({ lat: 25.2048, lng: 55.2708 });
        setLocationDetails(null);
        toast({
          title: "Location Not Found",
          description: "Using default location (Dubai)",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error updating map location:', error);
      // On error, use default coordinates
      setMapCenter({ lat: 25.2048, lng: 55.2708 });
      setLocationDetails(null);
      toast({
        title: "Location Error",
        description: "Failed to update map location, using default location",
        variant: "destructive"
      });
    }
  };

  // Add an effect to update map when location changes
  useEffect(() => {
    if (projectDetails.location) {
      console.log('Location changed in effect:', projectDetails.location); // Debug log
      updateMapLocation(projectDetails.location);
    }
  }, [projectDetails.location]);

  // Add this useEffect
  useEffect(() => {
    const fetchCityCoordinates = async () => {
      try {
        if (!cityName) return;
        const geocodeUrl = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(cityName)}.json?key=${TOMTOM_API_KEY}`;
        const response = await fetch(geocodeUrl);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const { lat, lon } = data.results[0].position;
          setMapCoordinates({ lat, lon });
        }
      } catch (error) {
        console.error('Error fetching city coordinates:', error);
      }
    };

    fetchCityCoordinates();
  }, [cityName]);

  // Add this useEffect after the other useEffects
  useEffect(() => {
    // Initialize map with default location if none is set
    if (!mapCenter.lat || !mapCenter.lng) {
      setMapCenter({ lat: 25.2048, lng: 55.2708 }); // Dubai coordinates
    }
    
    // If we have a map reference, ensure it's properly centered
    if (mapRef.current) {
      mapRef.current.setView([mapCenter.lat, mapCenter.lng], 13);
    }
  }, []);
  
  // Add new activity to timeline
  const addActivityEvent = (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => {
    setActivityEvents(prev => [{
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }, ...prev]);
  };

  // Track simulation activities
  useEffect(() => {
    if (isSimulating) {
      addActivityEvent({
        type: 'simulation',
        title: 'Simulation Started',
        description: `Running simulation for ${projectDetails.location}`,
        status: 'in-progress',
        metadata: {
          location: projectDetails.location,
          projectType: projectDetails.type,
        }
      });
    }
  }, [isSimulating]);

  // Track project changes
  useEffect(() => {
    if (projectDetails.location) {
      addActivityEvent({
        type: 'project',
        title: 'Project Location Updated',
        description: `Location set to ${projectDetails.location}`,
        status: 'completed',
        metadata: {
          location: projectDetails.location,
        }
      });
    }
  }, [projectDetails.location]);

  // Track simulation results
  useEffect(() => {
    if (simulationResults) {
      addActivityEvent({
        type: 'simulation',
        title: 'Simulation Completed',
        description: 'Results available for analysis',
        status: 'completed',
        metadata: {
          metrics: {
            congestion: simulationResults.results.congestion,
            satisfaction: simulationResults.results.satisfaction,
            emissions: simulationResults.results.emissions,
            transit_usage: simulationResults.results.transit_usage
          }
        }
      });
    }
  }, [simulationResults]);

  const handleLoadProject = async (projectId: string) => {
    const project = savedProjects.find(p => p.id === projectId);
    if (!project) return;

    // Update all project details and parameters
    setProjectDetails({
      name: project.name,
      type: project.type,
      location: project.location,
      description: project.description,
      goals: project.goals
    });

    setParams(project.parameters);
    setProjectId(project.id);
    
    // Reset simulation results when loading a new project
    setResults(null);
    setProgress(0);
    
    toast({
      title: "Project loaded",
      description: "Project parameters have been loaded successfully."
    });
  };

  return (
    <Card className="shadow-md border-gray-200 dark:border-gray-800 overflow-hidden h-full relative">
      {/* Panel Header */}
      <CardHeader className="bg-gray-50 dark:bg-gray-900/50 pb-4">
        <CardTitle className="text-xl flex items-center">
          <PlayCircle className="mr-2 h-5 w-5 text-osat-500" />
          Scenario Simulation
        </CardTitle>
        <CardDescription>
          {cityName ? `Simulate urban planning scenarios for ${cityName}.` : 'Adjust parameters and run simulations to see the impact on the city.'}
        </CardDescription>
      </CardHeader>
      
      {/* Panel Content */}
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="simulation">Simulation</TabsTrigger>
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Main Simulation Tab */}
          <TabsContent value="simulation">
            <div className="space-y-6">
              {/* Project Details Section */}
              <div className="border-b pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium">Project Details</h3>
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={savePreset}>
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save as Preset</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={shareSimulation}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share Simulation</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="project-name" className="flex items-center text-sm font-medium">
                      <Layers size={16} className="mr-2 text-gray-500" />
                      Project Name
                    </Label>
                    <Input
                      id="project-name"
                      placeholder="Enter project name"
                      value={projectDetails.name}
                      onChange={(e) => handleProjectDetailChange('name', e.target.value)}
                      disabled={isSimulating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-type" className="flex items-center text-sm font-medium">
                      <Building size={16} className="mr-2 text-gray-500" />
                      Project Type
                    </Label>
                    <Select
                      value={projectDetails.type}
                      onValueChange={(value) => handleProjectDetailChange('type', value)}
                      disabled={isSimulating}
                    >
                      <SelectTrigger id="project-type" className="w-full">
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential Development</SelectItem>
                        <SelectItem value="commercial">Commercial Development</SelectItem>
                        <SelectItem value="mixed-use">Mixed-Use Development</SelectItem>
                        <SelectItem value="industrial">Industrial Development</SelectItem>
                        <SelectItem value="infrastructure">Infrastructure Project</SelectItem>
                        <SelectItem value="public-space">Public Space Development</SelectItem>
                        <SelectItem value="transit-oriented">Transit-Oriented Development</SelectItem>
                        <SelectItem value="smart-city">Smart City Initiative</SelectItem>
                        <SelectItem value="green-space">Green Space Development</SelectItem>
                        <SelectItem value="cultural">Cultural District</SelectItem>
                        <SelectItem value="education">Educational Campus</SelectItem>
                        <SelectItem value="healthcare">Healthcare Facility</SelectItem>
                        <SelectItem value="retail">Retail Development</SelectItem>
                        <SelectItem value="office">Office Complex</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-location" className="flex items-center text-sm font-medium">
                      <MapPin size={16} className="mr-2 text-gray-500" />
                      Location
                    </Label>
                    <Input
                      id="project-location"
                      placeholder="Enter project location"
                      value={projectDetails.location}
                      onChange={(e) => handleProjectDetailChange('location', e.target.value)}
                      disabled={isSimulating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-description" className="flex items-center text-sm font-medium">
                      <Layers size={16} className="mr-2 text-gray-500" />
                      Description
                    </Label>
                    <Textarea
                      id="project-description"
                      placeholder="Describe the project's main features and objectives"
                      value={projectDetails.description}
                      onChange={(e) => handleProjectDetailChange('description', e.target.value)}
                      className="min-h-[100px]"
                      disabled={isSimulating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-goals" className="flex items-center text-sm font-medium">
                      <CheckSquare size={16} className="mr-2 text-gray-500" />
                      Project Goals
                    </Label>
                    <Textarea
                      id="project-goals"
                      placeholder="What are the main objectives and expected outcomes?"
                      value={projectDetails.goals}
                      onChange={(e) => handleProjectDetailChange('goals', e.target.value)}
                      className="min-h-[100px]"
                      disabled={isSimulating}
                    />
                  </div>
                </div>
              </div>

              {/* Parameters Section */}
              <div className="border-b pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium">Simulation Parameters</h3>
                </div>

                {/* Project Selection Dropdown */}
                {user && (
                  <div className="mb-6 space-y-2">
                    <Label htmlFor="saved-projects" className="flex items-center text-sm font-medium">
                      <FolderOpen size={16} className="mr-2 text-gray-500" />
                      Load Saved Project
                    </Label>
                    <Select
                      onValueChange={(projectId) => handleLoadProject(projectId)}
                    >
                      <SelectTrigger id="saved-projects">
                        <SelectValue placeholder="Select a saved project" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Load parameters from a previously saved project
                    </p>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="roads" className="flex items-center text-sm font-medium">
                        <Car size={16} className="mr-2 text-gray-500" />
                        Road Infrastructure
                      </Label>
                      <span className="text-sm font-medium">{params.roads}%</span>
                    </div>
                    <Slider
                      id="roads"
                      disabled={isSimulating}
                      value={[params.roads]}
                      onValueChange={(value) => handleParamChange('roads', value)}
                      max={100}
                      step={1}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Higher values represent better road infrastructure.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="population" className="flex items-center text-sm font-medium">
                        <Users size={16} className="mr-2 text-gray-500" />
                        Population Density
                      </Label>
                      <span className="text-sm font-medium">{params.population}%</span>
                    </div>
                    <Slider
                      id="population"
                      disabled={isSimulating}
                      value={[params.population]}
                      onValueChange={(value) => handleParamChange('population', value)}
                      max={100}
                      step={1}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Higher values indicate higher population density.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="housing" className="flex items-center text-sm font-medium">
                        <Building size={16} className="mr-2 text-gray-500" />
                        Housing Development
                      </Label>
                      <span className="text-sm font-medium">{params.housing}%</span>
                    </div>
                    <Slider
                      id="housing"
                      disabled={isSimulating}
                      value={[params.housing]}
                      onValueChange={(value) => handleParamChange('housing', value)}
                      max={100}
                      step={1}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Higher values represent more housing availability.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="public_transport" className="flex items-center text-sm font-medium">
                        <Bus size={16} className="mr-2 text-gray-500" />
                        Public Transport
                      </Label>
                      <span className="text-sm font-medium">{params.public_transport}%</span>
                    </div>
                    <Slider
                      id="public_transport"
                      disabled={isSimulating}
                      value={[params.public_transport]}
                      onValueChange={(value) => handleParamChange('public_transport', value)}
                      max={100}
                      step={1}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Higher values represent better public transport coverage.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Results Visualization Tab */}
          <TabsContent value="visualization">
            <div className="space-y-6">
              {!results ? (
                <div className="flex items-center justify-center h-[400px] text-gray-500">
                  Run a simulation to see results and AI analysis
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-x-2">
                      <Button
                        variant={selectedVisualization === 'chart' ? 'default' : 'outline'}
                        onClick={() => setSelectedVisualization('chart')}
                      >
                        <BarChart2 className="h-4 w-4 mr-2" />
                        Chart
                      </Button>
                      <Button
                        variant={selectedVisualization === 'map' ? 'default' : 'outline'}
                        onClick={() => setSelectedVisualization('map')}
                      >
                        <Map className="h-4 w-4 mr-2" />
                        Map
                      </Button>
                    </div>
                    <Button variant="outline" onClick={exportResults}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  {/* Results Display */}
                  <div className="border rounded-lg p-4">
                    {selectedVisualization === 'map' ? (
                      <div className="w-full h-[400px] rounded-lg overflow-hidden border relative">
                        <MapContainer
                          key={`map-${mapCenter.lat}-${mapCenter.lng}`}
                          center={[mapCenter.lat || 25.2048, mapCenter.lng || 55.2708]}
                          zoom={13}
                          style={mapContainerStyle}
                          className="z-10"
                          ref={mapRef}
                          scrollWheelZoom={true}
                          zoomControl={true}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            maxZoom={19}
                            subdomains={['a', 'b', 'c']}
                          />
                          {mapCenter && mapCenter.lat && mapCenter.lng && (
                            <Marker position={[mapCenter.lat, mapCenter.lng]}>
                              <Popup>
                                <div className="font-semibold">{locationDetails?.address || projectDetails.location}</div>
                                {locationDetails && (
                                  <div className="text-sm text-gray-600">
                                    {[locationDetails.municipality, locationDetails.subdivision]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </div>
                                )}
                              </Popup>
                            </Marker>
                          )}
                          {results && (
                            <>
                              <Circle
                                center={[mapCenter.lat, mapCenter.lng]}
                                pathOptions={{
                                  color: results.congestion > 50 ? 'red' : 'green',
                                  fillColor: results.congestion > 50 ? 'red' : 'green',
                                  fillOpacity: 0.3,
                                }}
                                radius={1000}
                              >
                                <Popup>
                                  <div>Traffic Congestion: {results.congestion}%</div>
                                </Popup>
                              </Circle>
                              
                              <Circle
                                center={[mapCenter.lat + 0.005, mapCenter.lng]}
                                pathOptions={{
                                  color: 'blue',
                                  fillColor: 'blue',
                                  fillOpacity: results.transit_usage / 200,
                                }}
                                radius={1500}
                              >
                                <Popup>
                                  <div>Transit Usage: {results.transit_usage}%</div>
                                </Popup>
                              </Circle>
                              
                              <Circle
                                center={[mapCenter.lat - 0.005, mapCenter.lng + 0.005]}
                                pathOptions={{
                                  color: results.emissions > 50 ? 'orange' : 'green',
                                  fillColor: results.emissions > 50 ? 'orange' : 'green',
                                  fillOpacity: 0.2,
                                }}
                                radius={2000}
                              >
                                <Popup>
                                  <div>Emissions Level: {results.emissions}%</div>
                                </Popup>
                              </Circle>
                            </>
                          )}
                        </MapContainer>
                      </div>
                    ) : (
                      <div className="w-full h-[400px] p-4">
                        <Bar data={chartData} options={chartOptions} />
                      </div>
                    )}
                  </div>

                  {/* AI Analysis Section */}
                  <div className="space-y-6 mt-8">
                    <h3 className="text-lg font-semibold">AI Analysis & Recommendations</h3>
                    
                    {/* Parameter Analysis */}
                    <div className="border-b pb-6">
                      <AIParameterAnalysis
                        parameters={params}
                        projectType={projectDetails.type}
                        location={projectDetails.location}
                        apiKey={API_KEY}
                      />
                    </div>

                    {/* Results Interpretation */}
                    <div className="border-b pb-6">
                      <AIResultsInterpretation
                        results={results}
                        projectType={projectDetails.type}
                        location={projectDetails.location}
                        apiKey={API_KEY}
                      />
                    </div>

                    {/* Smart Goals */}
                    <div className="border-b pb-6">
                      <AISmartGoals
                        projectType={projectDetails.type}
                        location={projectDetails.location}
                        description={projectDetails.description}
                        currentGoals={projectDetails.goals}
                        apiKey={API_KEY}
                        onAddGoal={({ metric, target }) => addProjectGoal(metric, target)}
                      />
                    </div>

                    {/* Recommendations */}
                    <div className="pb-6">
                      <AIRecommendations
                        projectType={projectDetails.type}
                        location={projectDetails.location}
                        description={projectDetails.description}
                        goals={projectDetails.goals}
                        onApplyParameters={(params: CityParameters | undefined) => {
                          if (params) {
                            setParams(params);
                          }
                        }}
                        apiKey={API_KEY}
                      />
                    </div>
                    
                    {/* Save & Export AI Analysis Results */}
                    <div className="mt-6 flex justify-end space-x-3">
                      <AISaveResults 
                        projectId={projectId || ''} 
                        cityName={projectDetails?.location || 'AI Analysis'}
                        aiData={{
                          parameterAnalysis: document.querySelector('[data-component="AIParameterAnalysis"] .impact-text')?.textContent || '',
                          interpretation: document.querySelector('[data-component="AIResultsInterpretation"] .summary-text')?.textContent || '',
                          smartGoals: Array.from(document.querySelectorAll('[data-component="AISmartGoals"] .goals-list li')).map(el => el.textContent || ''),
                          recommendations: Array.from(document.querySelectorAll('[data-component="AIRecommendations"] .recommendations-list li')).map(el => el.textContent || ''),
                          keyInsights: Array.from(document.querySelectorAll('[data-component="AIResultsInterpretation"] .insights-list li')).map(el => el.textContent || ''),
                          risks: Array.from(document.querySelectorAll('[data-component="AIParameterAnalysis"] .risks-list li')).map(el => el.textContent || ''),
                          opportunities: Array.from(document.querySelectorAll('[data-component="AIParameterAnalysis"] .opportunities-list li')).map(el => el.textContent || '')
                        }}
                        buttonText="Save AI Analysis"
                      />
                      
                      <ExportResultsPDF
                        projectName={projectDetails?.name || 'Urban Simulation'}
                        contentSelector=".space-y-6.mt-8" // Selector for the AI Analysis section
                        fileName={`${projectDetails?.name?.toLowerCase().replace(/\s+/g, '-') || 'urban-simulation'}-ai-analysis`}
                        buttonText="Export as PDF"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <h2 className="text-xl font-bold mb-2">Simulation History</h2>
            {historyRows.length === 0 ? (
              <div className="text-gray-500">No simulation runs yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border-b">Date</th>
                      <th className="px-4 py-2 border-b">City</th>
                      <th className="px-4 py-2 border-b">Roads</th>
                      <th className="px-4 py-2 border-b">Population</th>
                      <th className="px-4 py-2 border-b">Housing</th>
                      <th className="px-4 py-2 border-b">Public Transport</th>
                      <th className="px-4 py-2 border-b">Congestion</th>
                      <th className="px-4 py-2 border-b">Satisfaction</th>
                      <th className="px-4 py-2 border-b">Emissions</th>
                      <th className="px-4 py-2 border-b">Transit Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((run) => (
                      <tr key={String(run.id)} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 border-b">{run.created_at ? new Date(run.created_at).toLocaleString() : ''}</td>
                        <td className="px-4 py-2 border-b">{run.city_name}</td>
                        <td className="px-4 py-2 border-b">{run.parameters.roads}</td>
                        <td className="px-4 py-2 border-b">{run.parameters.population}</td>
                        <td className="px-4 py-2 border-b">{run.parameters.housing}</td>
                        <td className="px-4 py-2 border-b">{run.parameters.public_transport}</td>
                        <td className="px-4 py-2 border-b">{run.results.congestion}</td>
                        <td className="px-4 py-2 border-b">{run.results.satisfaction}</td>
                        <td className="px-4 py-2 border-b">{run.results.emissions}</td>
                        <td className="px-4 py-2 border-b">{run.results.transit_usage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            {/* Implementation of projects tab */}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>High Contrast Mode</Label>
                <Switch
                  checked={isHighContrastMode}
                  onCheckedChange={setIsHighContrastMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Keyboard Shortcuts</Label>
                <Switch
                  checked={keyboardShortcutsEnabled}
                  onCheckedChange={setKeyboardShortcutsEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Voice Input</Label>
                <Switch
                  checked={isVoiceEnabled}
                  onCheckedChange={setIsVoiceEnabled}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Settings Panel */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="fixed bottom-4 right-4">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>High Contrast Mode</Label>
                <Switch
                  checked={isHighContrastMode}
                  onCheckedChange={setIsHighContrastMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Keyboard Shortcuts</Label>
                <Switch
                  checked={keyboardShortcutsEnabled}
                  onCheckedChange={setKeyboardShortcutsEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Voice Input</Label>
                <Switch
                  checked={isVoiceEnabled}
                  onCheckedChange={setIsVoiceEnabled}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Existing Chat Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="font-mono text-blue-500">AI Assistant</span>
            </h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 px-2 flex items-center gap-1 text-xs"
                onClick={() => setShowChatHistory(!showChatHistory)}
              >
                <MessageSquare className="h-3 w-3" />
                {showChatHistory ? "Hide History" : "Chat History"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 px-2 flex items-center gap-1 text-xs"
                onClick={startNewChat}
              >
                <Plus className="h-3 w-3" />
                New Chat
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              {/* Chat History Sidebar */}
              {showChatHistory && (
                <div className="w-72 h-80 border rounded-lg overflow-y-auto bg-white shadow-sm">
                  <div className="p-3 border-b border-gray-200">
                    <Input 
                      placeholder="Search chats..." 
                      className="text-xs h-7"
                      value={searchQuery || ''}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="divide-y divide-gray-100">
                    {(searchQuery ? savedChats.filter(chat => 
                      chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    : savedChats).map(chat => (
                      <div 
                        key={chat.id}
                        className={`p-2 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center ${
                          currentChatId === chat.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => selectChat(chat.id)}
                      >
                        <div className="flex-1 min-w-0 py-1">
                          <p className="text-xs font-medium truncate text-gray-800">{chat.title}</p>
                          <p className="text-[10px] text-gray-500">
                            {new Date(chat.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => deleteChat(chat.id, e)}
                        >
                          <Trash className="h-3 w-3 text-gray-400" />
                        </Button>
                      </div>
                    ))}
                    {savedChats.length === 0 && (
                      <div className="p-3 text-center text-gray-500">
                        <p className="text-xs">No conversation history</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Chat Messages Area */}
              <div 
                ref={chatContainerRef}
                className={`${showChatHistory ? 'flex-1' : 'w-full'} h-80 overflow-y-auto border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent`}
              >
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mb-4 text-blue-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-center font-mono animate-fade-in">Ask me anything about your simulation!</p>
                  <p className="text-sm mt-2 text-center font-mono animate-fade-in-delayed">I can help you analyze parameters, suggest improvements, and explain results.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                        } shadow-sm transition-all duration-300 hover:shadow-md`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && (
                            <svg className="w-5 h-5 mt-1 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          )}
                          <p className={`text-sm font-mono ${message.isTyping ? 'after:content-["▋"] after:ml-1 after:animate-blink' : ''}`}>
                            {message.displayContent}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isGenerating}
                className="flex-1"
              />
              {isVoiceEnabled && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleVoiceInput}
                  disabled={isGenerating}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              )}
              {isGenerating ? (
                <Button
                  onClick={stopGeneration}
                  variant="destructive"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              ) : (
                <Button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim()}
                >
                  Send
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ActivityTimeline events={activityEvents} />
        </div>
      </CardContent>

      <CardFooter className="border-t p-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetParams}
              disabled={isSimulating}
            >
              <RotateCcw size={16} className="mr-2" />
              Reset
            </Button>
            
            {user && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveProject}
                  disabled={isSimulating || isSaving}
                >
                  <Save size={16} className="mr-2" />
                  Save Project
                </Button>

                {results && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveResults}
                    disabled={isSimulating || isSaving || !projectId}
                  >
                    <Save size={16} className="mr-2" />
                    Save Results
                  </Button>
                )}
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isSimulating ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStopSimulation}
              >
                <StopCircle size={16} className="mr-2" />
                Stop
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleStartSimulation}
                disabled={!projectDetails.name || !projectDetails.type || !projectDetails.location}
              >
                <PlayCircle size={16} className="mr-2" />
                Run Simulation
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
      
      {/* Enhanced Loading Overlay */}
      {showLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[100]">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl flex flex-col items-center max-w-md mx-4">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-blue-500">
                {progress}%
              </div>
            </div>
            
            <div className="mt-6 space-y-2 text-center">
              <h3 className="text-xl font-semibold">Running Simulation</h3>
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <p>Analyzing urban parameters...</p>
                <p className="animate-pulse">
                  {progress < 30 && "Calculating traffic patterns..."}
                  {progress >= 30 && progress < 60 && "Evaluating environmental impact..."}
                  {progress >= 60 && progress < 90 && "Assessing public transit efficiency..."}
                  {progress >= 90 && "Finalizing results..."}
                </p>
              </div>
            </div>

            <div className="w-full max-w-xs mt-6">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ 
                    width: `${progress}%`,
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};