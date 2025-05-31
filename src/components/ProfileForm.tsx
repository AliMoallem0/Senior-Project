import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  User,
  Users,
  Settings,
  Trophy,
  History,
  MapPin,
  Building,
  Bell,
  Moon,
  Sun,
  Globe,
  Mail,
  Phone,
  Loader2,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';
import { ActivityChart } from '@/components/ui/ActivityChart';
import { ProfileSkeleton, ChartSkeleton } from '@/components/ui/skeleton';
import { getProjects, getSimulationResults, deleteProject, updateProject } from '@/services/cityService';
import { getUserAchievements, checkForAchievements, Achievement as AchievementType } from '@/services/achievementService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "next-themes";

interface ProfileFormProps {
  userId: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  organization?: string;
  location?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  created_at: string;
  country_code?: string;
  country_name?: string;
  phone_number?: string;
  phone_country_code?: string;
}

interface SimulationResults {
  congestion: number;
  satisfaction: number;
  emissions: number;
  transitUsage: number;
}

interface SimulationResult {
  id: string;
  project_id: string;
  congestion: number;
  satisfaction: number;
  emissions: number;
  transitUsage: number;
  created_at: string;
  ai_analysis?: {
    parameter_analysis?: string;
    risks?: string[];
    opportunities?: string[];
    suggestions?: string[];
    interpretation?: string;
    key_insights?: string[];
    suggested_improvements?: string[];
    comparisons?: string[];
  };
}

interface SimulationResultData {
  id?: number;
  project_id: string;
  user_id: string;
  city_name: string;
  parameters: {
    roads: number;
    population: number;
    housing: number;
    public_transport: number;
  };
  results: SimulationResults;
  ai_analysis?: {
    parameter_analysis?: string;
    risks?: string[];
    opportunities?: string[];
    suggestions?: string[];
    interpretation?: string;
    key_insights?: string[];
    suggested_improvements?: string[];
    comparisons?: string[];
  };
  created_at?: Date;
}

interface ProjectParameters {
  roads: number;
  population: number;
  housing: number;
  public_transport: number;
}

interface ProjectHistory {
  id: string;
  name: string;
  type: string;
  location: string;
  date: Date;
  status: 'completed' | 'in-progress' | 'planned';
  description?: string;
  goals?: string;
  parameters: ProjectParameters;
  simulationResults?: SimulationResults;
  city_id?: string;
}

// Use the Achievement type from the service
type Achievement = AchievementType;

interface UserSettings {
  notifications: boolean;
  emailUpdates: boolean;
  language: string;
  timezone: string;
}

interface ActivityData {
  date: string;
  projects: number;
  achievements: number;
}

interface ProjectDetailsModalProps {
  project: ProjectHistory | null;
  isOpen: boolean;
  onClose: () => void;
  setProjects: React.Dispatch<React.SetStateAction<ProjectHistory[]>>;
}

// Project types from SimulationPanel
const PROJECT_TYPES = [
  { value: "residential", label: "Residential Development" },
  { value: "commercial", label: "Commercial Development" },
  { value: "mixed-use", label: "Mixed-Use Development" },
  { value: "industrial", label: "Industrial Development" },
  { value: "infrastructure", label: "Infrastructure Project" },
  { value: "public-space", label: "Public Space Development" },
  { value: "transit-oriented", label: "Transit-Oriented Development" },
  { value: "smart-city", label: "Smart City Initiative" },
  { value: "green-space", label: "Green Space Development" },
  { value: "cultural", label: "Cultural District" },
  { value: "education", label: "Educational Campus" },
  { value: "healthcare", label: "Healthcare Facility" },
  { value: "retail", label: "Retail Development" },
  { value: "office", label: "Office Complex" },
  { value: "other", label: "Other" }
];

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } }
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const cardHover = {
  initial: { scale: 1, y: 0, boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)" },
  hover: { 
    scale: 1.02, 
    y: -5, 
    boxShadow: "0px 10px 20px rgba(8, 56, 116, 0.15)",
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

const pulseAnimation = {
  initial: { scale: 1, opacity: 0.7 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
  },
  transition: {
    repeat: Infinity,
    repeatType: "reverse" as const,
    duration: 2.5,
    ease: "easeInOut"
  }
};

const achievementCategories = {
  sustainability: "Sustainability Champion",
  planning: "Urban Planner",
  transportation: "Transportation Expert",
  community: "Community Builder",
  innovation: "Innovation Leader"
};

type AchievementLevel = "bronze" | "silver" | "gold";
type AchievementCategory = keyof typeof achievementCategories;

interface EnhancedAchievement extends Achievement {
  level: AchievementLevel;
  category: AchievementCategory;
  progress: number;
  isNew?: boolean;
}

const achievementColorMap: Record<AchievementLevel, string> = {
  bronze: "bg-amber-100 text-amber-700",
  silver: "bg-slate-200 text-slate-700",
  gold: "bg-yellow-100 text-yellow-700"
};

const achievementIconMap: Record<AchievementCategory, React.ReactNode> = {
  sustainability: <LeafIcon className="h-6 w-6" />,
  planning: <Building className="h-6 w-6" />,
  transportation: <CarIcon className="h-6 w-6" />,
  community: <Users className="h-6 w-6" />,
  innovation: <LightbulbIcon className="h-6 w-6" />
};

function LeafIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 22a10 10 0 0 1 20 0" />
      <path d="M12 22V12" />
      <path d="M2 10s2.5-8 10-8c7.5 0 10 8 10 8" />
      <path d="M12 2v4" />
    </svg>
  );
}

function CarIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
      <circle cx="6.5" cy="16.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </svg>
  );
}

function LightbulbIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

const badgeHover = {
  initial: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2, ease: "easeOut" } }
};

function ProjectDetailsModal({ project, isOpen, onClose, setProjects }: ProjectDetailsModalProps) {
  const { user: authUser } = useAuth();
  const [simResults, setSimResults] = useState<SimulationResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<ProjectHistory | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setEditedProject({ ...project });
    }
  }, [project]);

  useEffect(() => {
    const fetchResults = async () => {
      if (project?.id) {
        try {
          const results = await getSimulationResults(project.id);
          if (results && results.length > 0) {
            const result = results[0];
            setSimResults(result);
          }
        } catch (error) {
          console.error('Error fetching simulation results:', error);
        }
      }
    };

    fetchResults();
  }, [project?.id]);

  const handleDelete = async () => {
    if (!project || !authUser) return;
    try {
      await deleteProject(project.id);
      onClose();
      toast.success('Project deleted successfully');
      // Refresh projects list
      const updatedProjects = await getProjects(authUser.id);
      setProjects(updatedProjects.map(project => ({
        ...project,
        date: new Date(project.created_at),
        status: 'completed'
      })));
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleUpdate = async () => {
    if (!editedProject || !authUser) return;
    
    setIsSaving(true);
    try {
      // Validate required fields
      if (!editedProject.name || !editedProject.type || !editedProject.location) {
        toast.error('Please fill in all required fields (name, type, and location)');
        return;
      }

      // Validate parameters
      if (!editedProject.parameters || 
          typeof editedProject.parameters.roads !== 'number' ||
          typeof editedProject.parameters.population !== 'number' ||
          typeof editedProject.parameters.housing !== 'number' ||
          typeof editedProject.parameters.public_transport !== 'number') {
        toast.error('Invalid simulation parameters');
        return;
      }

      // Update the project in the database
      await updateProject(editedProject.id, {
        name: editedProject.name,
        type: editedProject.type,
        location: editedProject.location,
        description: editedProject.description || '',
        goals: editedProject.goals || '',
        parameters: {
          roads: editedProject.parameters.roads,
          population: editedProject.parameters.population,
          housing: editedProject.parameters.housing,
          public_transport: editedProject.parameters.public_transport
        }
      });

      // Refresh projects list with updated data
      const updatedProjects = await getProjects(authUser.id);
      setProjects(updatedProjects.map(project => ({
        ...project,
        date: new Date(project.created_at),
        status: 'completed'
      })));

      setIsEditing(false);
      toast.success('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleParameterChange = (param: keyof ProjectParameters, value: number[]) => {
    if (!editedProject?.parameters) return;
    setEditedProject(prev => {
      if (!prev) return null;
      return {
        ...prev,
        parameters: {
          ...prev.parameters,
          [param]: value[0]
        }
      };
    });
  };

  if (!project) return null;

  const renderResultBar = (value: number, label: string) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{label}</p>
        <span className="text-sm font-medium text-gray-700">{value}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full">
        <div 
          className="h-full bg-#083874-600 rounded-full" 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  const renderParameterSlider = (param: keyof ProjectParameters, label: string) => {
    if (!editedProject?.parameters) return null;
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm text-gray-500">{label}</Label>
          <span className="text-sm font-medium text-gray-700">
            {editedProject.parameters[param]}%
          </span>
        </div>
        <Slider
          value={[editedProject.parameters[param]]}
          min={0}
          max={100}
          step={1}
          onValueChange={(value: number[]) => handleParameterChange(param, value)}
          disabled={!isEditing}
        />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isEditing ? (
              <Input
                value={editedProject?.name || ''}
                onChange={(e) => setEditedProject(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="text-2xl font-bold"
              />
            ) : (
              project.name
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isEditing ? (
              <div className="space-y-2">
                <Select
                  value={editedProject?.type || ''}
                  onValueChange={(value: string) => setEditedProject(prev => prev ? { ...prev, type: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={editedProject?.location || ''}
                  onChange={(e) => setEditedProject(prev => prev ? { ...prev, location: e.target.value } : null)}
                  placeholder="Location"
                />
              </div>
            ) : (
              `${project.type} • ${project.location}`
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Description</h3>
            {isEditing ? (
              <Textarea
                value={editedProject?.description || ''}
                onChange={(e) => setEditedProject(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Project description"
                className="min-h-[100px]"
              />
            ) : (
              <p className="text-gray-600">{project.description || 'No description available.'}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Goals</h3>
            {isEditing ? (
              <Textarea
                value={editedProject?.goals || ''}
                onChange={(e) => setEditedProject(prev => prev ? { ...prev, goals: e.target.value } : null)}
                placeholder="Project goals"
                className="min-h-[100px]"
              />
            ) : (
              <p className="text-gray-600">{project.goals || 'No goals specified.'}</p>
            )}
          </div>

          {project.city_id && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">City ID</h3>
              <p className="text-gray-600">{project.city_id}</p>
            </div>
          )}

          {project.parameters && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Simulation Parameters</h3>
              <div className="grid grid-cols-1 gap-4">
                {isEditing && editedProject?.parameters ? (
                  <>
                    {renderParameterSlider('roads', 'Roads')}
                    {renderParameterSlider('population', 'Population')}
                    {renderParameterSlider('housing', 'Housing')}
                    {renderParameterSlider('public_transport', 'Public Transport')}
                  </>
                ) : (
                  <>
                    {renderResultBar(project.parameters.roads, 'Roads')}
                    {renderResultBar(project.parameters.population, 'Population')}
                    {renderResultBar(project.parameters.housing, 'Housing')}
                    {renderResultBar(project.parameters.public_transport, 'Public Transport')}
                  </>
                )}
              </div>
            </div>
          )}

          {simResults && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Simulation Results</h3>
              <div className="grid grid-cols-1 gap-4">
                {renderResultBar(simResults.congestion, 'Congestion Level')}
                {renderResultBar(simResults.satisfaction, 'Citizen Satisfaction')}
                {renderResultBar(simResults.emissions, 'Emissions Level')}
                {renderResultBar(simResults.transitUsage, 'Transit Usage')}
              </div>
            </div>
          )}
          
          {simResults && simResults.ai_analysis && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">AI Analysis & Recommendations</h3>
              
              {simResults.ai_analysis.parameter_analysis && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Parameter Analysis</h4>
                  <p className="text-gray-600">{simResults.ai_analysis.parameter_analysis}</p>
                </div>
              )}
              
              {simResults.ai_analysis.interpretation && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Interpretation</h4>
                  <p className="text-gray-600">{simResults.ai_analysis.interpretation}</p>
                </div>
              )}
              
              {simResults.ai_analysis.risks && simResults.ai_analysis.risks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Risks</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {simResults.ai_analysis.risks.map((risk: string, index: number) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {simResults.ai_analysis.opportunities && simResults.ai_analysis.opportunities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Opportunities</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {simResults.ai_analysis.opportunities.map((opportunity: string, index: number) => (
                      <li key={index}>{opportunity}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {simResults.ai_analysis.suggestions && simResults.ai_analysis.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Suggestions</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {simResults.ai_analysis.suggestions.map((suggestion: string, index: number) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {simResults.ai_analysis.key_insights && simResults.ai_analysis.key_insights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Key Insights</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {simResults.ai_analysis.key_insights.map((insight: string, index: number) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {simResults.ai_analysis.suggested_improvements && simResults.ai_analysis.suggested_improvements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Suggested Improvements</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {simResults.ai_analysis.suggested_improvements.map((improvement: string, index: number) => (
                      <li key={index}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {simResults.ai_analysis.comparisons && simResults.ai_analysis.comparisons.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-800">Comparisons</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {simResults.ai_analysis.comparisons.map((comparison: string, index: number) => (
                      <li key={index}>{comparison}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Created</h3>
            <p className="text-gray-600">
              {new Date(project.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdate}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Project
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Format date to a readable string
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Helper function to calculate profile completeness percentage
function calculateProfileCompleteness(userData: UserData | null): number {
  if (!userData) return 0;
  
  const fields = [
    userData.name,
    userData.email,
    userData.role,
    userData.organization,
    userData.location,
    userData.phone_number,
    userData.bio,
    userData.avatar
  ];
  
  const filledFields = fields.filter(field => field && field.trim().length > 0).length;
  return Math.round((filledFields / fields.length) * 100);
}

// Reusable card component for stats
function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-xl font-bold text-[#083874]">{value}</div>
    </div>
  );
}

// Reusable card component for profile information
function InfoCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="bg-[#083874]/10 p-3 rounded-full">
        {icon}
      </div>
      <div className="overflow-hidden">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="font-medium text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

interface TooltipProps {
  children: React.ReactNode;
  content: string;
}

// Simple tooltip component
function Tooltip({ children, content }: TooltipProps) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  );
}

export function ProfileForm({ userId }: ProfileFormProps) {
  const { user, dbUser, updateProfile } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [projects, setProjects] = useState<ProjectHistory[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    notifications: true,
    emailUpdates: true,
    language: 'en',
    timezone: 'UTC',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectHistory | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Fetch user data from Supabase
  // Fetch and update achievements based on user activity
  useEffect(() => {
    const fetchAchievements = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        // Load existing achievements
        const userAchievements = await getUserAchievements(userId);
        setAchievements(userAchievements);
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAchievements();
  }, [userId]);
  
  // Update achievements whenever user projects change
  useEffect(() => {
    const updateAchievements = async () => {
      if (!userId || projects.length === 0) return;
      
      try {
        // Check for new achievements based on current activity
        const updatedAchievements = await checkForAchievements(userId);
        setAchievements(updatedAchievements);
      } catch (error) {
        console.error('Error updating achievements:', error);
      }
    };
    
    updateAchievements();
  }, [userId, projects]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Get user profile from users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        if (profile) {
          setUserData(profile);
        }

        // Get user's projects from simulation_projects table
        const userProjects = await getProjects(userId);
        if (userProjects) {
          setProjects(userProjects.map(project => ({
            id: project.id,
            name: project.name,
            type: project.type,
            location: project.location,
            description: project.description,
            goals: project.goals,
            city_id: project.city_id,
            date: new Date(project.created_at),
            parameters: project.parameters,
            status: 'completed'
          })));
        }

        // Get user's achievements
        const { data: userAchievements, error: achievementsError } = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (achievementsError) throw achievementsError;

        if (userAchievements) {
          setAchievements(userAchievements.map(achievement => ({
            ...achievement,
            date: new Date(achievement.date)
          })));
        }

        // Generate activity data
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        const activity = last30Days.map(date => {
          const dayProjects = projects.filter(p => 
            new Date(p.date).toISOString().split('T')[0] === date
          ).length;
          
          const dayAchievements = achievements.filter(a => 
            new Date(a.date).toISOString().split('T')[0] === date
          ).length;

          return {
            date,
            projects: dayProjects,
            achievements: dayAchievements
          };
        });

        setActivityData(activity);

      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleSettingChange = async (setting: keyof UserSettings, value: boolean | string) => {
    try {
      setIsLoading(true);
      
      // Update settings state
      setSettings(prev => ({
        ...prev,
        [setting]: value
      }));
      
      // Update user settings in the database
      const { error: updateError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          [setting]: value,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;
      
      toast.success('Settings updated successfully.');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !userData) {
    return (
      <>
        <Navbar />
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 pt-24">
          <ProfileSkeleton />
          <ChartSkeleton />
        </div>
      </>
    );
  }

  if (!userData) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-600">User not found.</p>
      </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <motion.div
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 pt-24"
      >
        <motion.div 
          className="flex flex-col gap-6 bg-gradient-to-br from-[#083874]/10 to-[#083874]/5 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-[#083874]/20"
          variants={fadeInUp}
        >
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar Section */}
            <div className="relative group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Avatar className="h-28 w-28 md:h-36 md:w-36 ring-4 ring-[#083874]/30 shadow-xl">
                  <AvatarImage src={userData?.avatar} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-[#083874] to-[#0a4c9e] text-white">
                    {userData?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-md hidden md:flex">
                  <Edit className="h-4 w-4 text-[#083874]" />
                </div>
              </motion.div>
            </div>
            
            {/* User Info Section */}
            <div className="space-y-4 flex-1">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl md:text-4xl font-bold text-[#083874]">{userData?.name}</h1>
                  <Badge className="bg-[#083874]/10 text-[#083874] hover:bg-[#083874]/20 border-none">
                    {userData?.role}
                  </Badge>
                </div>
                <p className="text-gray-500 mt-1">{userData?.organization || 'No organization'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/80 p-2 px-3 rounded-lg shadow-sm">
                  <MapPin className="h-4 w-4 text-[#083874]" />
                  <span>{userData?.location || 'Location not set'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/80 p-2 px-3 rounded-lg shadow-sm">
                  <Mail className="h-4 w-4 text-[#083874]" />
                  <span className="truncate">{userData?.email}</span>
                </div>
              </div>
              
              {/* Profile Completeness Indicator */}
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500">Profile Completeness</span>
                  <span className="text-xs font-medium text-[#083874]">
                    {calculateProfileCompleteness(userData)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#083874] to-[#0a4c9e] h-2 rounded-full" 
                    style={{ width: `${calculateProfileCompleteness(userData)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 w-full md:w-auto md:min-w-[180px]">
              <StatCard 
                title="Projects" 
                value={projects.length.toString()} 
                icon={<Building className="h-4 w-4 text-[#083874]" />}
              />
              <StatCard 
                title="Achievements" 
                value={achievements.length.toString()} 
                icon={<Trophy className="h-4 w-4 text-[#083874]" />}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="w-full"
        >
          <ActivityChart data={activityData} />
        </motion.div>

        <Card className="bg-white/80 backdrop-blur-sm border-#083874-100">
          <CardContent className="p-0">
        <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-[#083874]/5 rounded-lg">
                {[
                  { value: 'overview', label: 'Overview', icon: <User className="h-4 w-4" /> },
                  { value: 'projects', label: 'Projects', icon: <Building className="h-4 w-4" /> },
                  { value: 'achievements', label: 'Achievements', icon: <Trophy className="h-4 w-4" /> },
                  { value: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> }
                ].map((tab) => (
                  <motion.div
                    key={tab.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <TabsTrigger 
                      value={tab.value}
                      className="w-full capitalize text-sm font-medium bg-white/80 text-[#083874] border border-[#083874]/10 data-[state=active]:bg-[#083874] data-[state=active]:text-white transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {tab.icon}
                      {tab.label}
                    </TabsTrigger>
                  </motion.div>
                ))}
          </TabsList>

              <TabsContent value="overview" className="p-6">
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-8"
                >
                  {/* Profile Information Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoCard 
                      icon={<Mail className="h-5 w-5 text-[#083874]" />}
                      title="Email"
                      value={userData.email}
                    />
                    
                    <InfoCard 
                      icon={<Phone className="h-5 w-5 text-[#083874]" />}
                      title="Phone"
                      value={userData.phone_number || 'Not provided'}
                    />
                    
                    <InfoCard 
                      icon={<Globe className="h-5 w-5 text-[#083874]" />}
                      title="Location"
                      value={userData.location || 'Not provided'}
                    />
                  </div>
                  
                  {/* Bio Section */}
                  <motion.div variants={fadeInUp} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-medium text-[#083874]">About Me</Label>
                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                    </div>
                    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[100px]">
                      <p className="text-gray-700 leading-relaxed">
                        {userData.bio || 'No bio added yet. Tell others about yourself, your interests, and your expertise in urban planning.'}
                      </p>
                    </div>
                  </motion.div>
                  
                  {/* Recent Activity Section */}
                  <motion.div variants={fadeInUp} className="space-y-3">
                    <Label className="text-lg font-medium text-[#083874]">Recent Activity</Label>
                    <Card className="overflow-hidden border-none shadow-sm">
                      <ScrollArea className="h-[220px] rounded-xl">
                        <div className="p-4 space-y-4">
                          {projects.length > 0 ? (
                            projects.slice(0, 5).map((project, index) => (
                              <div key={project.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                                <div className="bg-[#083874]/10 p-2 rounded-full">
                                  <MapPin className="h-4 w-4 text-[#083874]" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800">{project.name}</p>
                                  <p className="text-sm text-gray-500">Created a new {project.type} project</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(project.date).toLocaleDateString()} • {project.location}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <motion.div 
                              className="flex flex-col items-center justify-center h-[180px] text-center p-4"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <motion.div
                                variants={pulseAnimation}
                                initial="initial"
                                animate="animate"
                                className="flex items-center justify-center rounded-full bg-gray-100/50 p-3"
                              >
                                <Building className="h-10 w-10 text-gray-300" />
                              </motion.div>
                              <p className="text-gray-500">No recent activity</p>
                              <p className="text-sm text-gray-400">Start creating projects to track your activity</p>
                            </motion.div>
                          )}
                        </div>
                      </ScrollArea>
                    </Card>
                  </motion.div>
                </motion.div>
              </TabsContent>

              <TabsContent value="achievements" className="p-6">
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[#083874]">Your Achievements</h2>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                        <span className="text-xs text-gray-500">Bronze</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                        <span className="text-xs text-gray-500">Silver</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                        <span className="text-xs text-gray-500">Gold</span>
                      </div>
                    </div>
                  </div>

                  {/* Achievement Categories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {Object.entries(achievementCategories).map(([key, value]) => (
                      <motion.div
                        key={key}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-white shadow-sm rounded-lg p-4 text-center cursor-pointer hover:shadow-md transition-all duration-300 border border-gray-100"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="p-3 rounded-full bg-[#083874]/10 text-[#083874]">
                            {achievementIconMap[key as AchievementCategory]}
                          </div>
                          <h3 className="font-medium text-[#083874]">{value}</h3>
                          <p className="text-xs text-gray-500">
                            {achievements.filter(a => a.category === key).length} achievements
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Recent Achievements */}
                  <div>
                    <h3 className="text-md font-medium text-[#083874] mb-4">Recent Achievements</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {achievements.filter(a => a.isNew).map((achievement) => (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-gradient-to-r from-[#083874]/5 to-transparent border border-[#083874]/10 rounded-lg p-4 relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                            New!
                          </div>
                          <div className="flex items-start gap-4">
                            <motion.div 
                              className={`p-3 rounded-full ${achievement.level ? achievementColorMap[achievement.level] : 'bg-gray-100 text-gray-500'}`}
                              variants={pulseAnimation}
                              initial="initial"
                              animate="animate"
                            >
                              {achievement.category ? achievementIconMap[achievement.category] : <Trophy className="h-6 w-6" />}
                            </motion.div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-[#083874]">{achievement.title}</h3>
                                  <p className="text-sm text-gray-600">{achievement.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">
                                  Earned on {formatDate(achievement.date)}
                                </span>
                                <Badge className={`${achievement.level === 'gold' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : achievement.level === 'silver' ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                                  {achievement.level ? achievement.level.charAt(0).toUpperCase() + achievement.level.slice(1) : 'Bronze'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* All Achievements */}
                  <div>
                    <h3 className="text-md font-medium text-[#083874] mb-4">All Achievements</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {achievements.map((achievement) => (
                        <motion.div
                          key={achievement.id}
                          variants={badgeHover}
                          whileHover="hover"
                          initial="initial"
                          animate="animate"
                          className="group"
                        >
                          <Card className="overflow-hidden transition-all duration-300 bg-white backdrop-blur-sm border-gray-100 h-full">
                            <div className={`h-1.5 ${achievement.level === 'gold' ? 'bg-gradient-to-r from-yellow-300 to-yellow-500' : achievement.level === 'silver' ? 'bg-gradient-to-r from-slate-300 to-slate-400' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`}></div>
                            <CardContent className="p-5 flex flex-col h-full">
                              <div className="flex items-start gap-3 mb-3">
                                <div className={`p-2.5 rounded-full flex-shrink-0 ${achievement.level ? achievementColorMap[achievement.level] : 'bg-gray-100 text-gray-500'}`}>
                                  {achievement.category ? achievementIconMap[achievement.category] : <Trophy className="h-6 w-6" />}
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-800 group-hover:text-[#083874] transition-colors">
                                    {achievement.title}
                                  </h3>
                                  <p className="text-sm text-gray-500">{achievement.description}</p>
                                </div>
                              </div>
                              
                              {achievement.progress !== undefined && achievement.progress < 100 && (
                                <div className="mt-auto">
                                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Progress</span>
                                    <span>{achievement.progress}%</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div 
                                      className={`h-full ${achievement.level === 'gold' ? 'bg-yellow-400' : achievement.level === 'silver' ? 'bg-slate-400' : 'bg-amber-400'}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${achievement.progress || 0}%` }}
                                      transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center mt-auto pt-3 text-xs text-gray-500">
                                <span>{formatDate(achievement.date)}</span>
                                <Badge variant="outline" className={`${achievement.level === 'gold' ? 'border-yellow-200 text-yellow-700' : achievement.level === 'silver' ? 'border-slate-200 text-slate-700' : 'border-amber-200 text-amber-700'}`}>
                                  {achievement.level ? achievement.level.charAt(0).toUpperCase() + achievement.level.slice(1) : 'Bronze'}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="projects" className="p-6">
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-[#083874]">Your Projects</h2>
                    <Button size="sm" className="bg-[#083874] hover:bg-[#05294a]">
                      <Plus className="h-4 w-4 mr-2" /> New Project
                    </Button>
                  </div>
                  
                  {projects.length > 0 ? (
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                    >
                      {projects.map((project, index) => (
                        <motion.div
                          key={project.id}
                          variants={cardHover}
                          whileHover="hover"
                          initial="initial"
                          animate="animate"
                          className="group"
                        >
                          <Card className="overflow-hidden transition-all duration-300 bg-white backdrop-blur-sm border-gray-100 h-full flex flex-col">
                            <div className="h-2 bg-gradient-to-r from-[#083874] to-[#0a4c9e]"></div>
                            <CardContent className="p-6 flex-1 flex flex-col">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-xl font-semibold group-hover:text-[#083874] transition-colors line-clamp-1">
                                    {project.name}
                                  </h3>
                                  <Badge variant="outline" className="mt-1 bg-[#083874]/5 border-[#083874]/10">
                                    {project.type}
                                  </Badge>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-full hover:bg-[#083874]/10 hover:text-[#083874]"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 text-gray-600 overflow-hidden">
                                  <MapPin className="h-4 w-4 flex-shrink-0 text-[#083874]/70" />
                                  <span className="text-sm truncate">{project.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <History className="h-4 w-4 flex-shrink-0 text-[#083874]/70" />
                                  <span className="text-sm">
                                    {new Date(project.date).toLocaleDateString()}
                                  </span>
                                </div>
                                {project.description && (
                                  <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                                    {project.description}
                                  </p>
                                )}
                              </div>
                              
                              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-[#083874] border-[#083874]/20 hover:bg-[#083874]/10 hover:text-[#083874] transition-all"
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setIsProjectModalOpen(true);
                                  }}
                                >
                                  View Details
                                </Button>
                                <div className="flex space-x-1">
                                  {project.parameters && (
                                    <Tooltip content="Parameters Score">
                                      <Badge variant="outline" className="bg-[#083874]/5 border-[#083874]/10 text-xs">
                                        P: {Math.round((project.parameters.roads + project.parameters.population + 
                                        project.parameters.housing + project.parameters.public_transport) / 4)}
                                      </Badge>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="bg-[#083874]/5 p-6 rounded-full mb-4">
                        <Building className="h-12 w-12 text-[#083874]/40" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No projects yet</h3>
                      <p className="text-gray-500 max-w-md mb-6">Start creating urban planning projects to see them here</p>
                      <Button className="bg-[#083874] hover:bg-[#05294a]">
                        <Plus className="h-4 w-4 mr-2" /> Create First Project
                      </Button>
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="achievements" className="p-6">
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      variants={fadeInUp}
                      whileHover={{ 
                        scale: 1.02,
                        rotateX: 5,
                        rotateY: 5,
                        transition: { duration: 0.2 }
                      }}
                      className="group perspective-1000"
                    >
                      <Card className="overflow-hidden transition-all duration-300 bg-gradient-to-br from-white/90 to-#083874-100 transform-gpu">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="text-3xl bg-white p-3 rounded-lg shadow-sm">
                              {achievement.icon}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold group-hover:text-#083874-600 transition-colors">
                                {achievement.title}
                              </h3>
                              <p className="text-gray-600 text-sm">{achievement.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
            </motion.div>
          </TabsContent>

              <TabsContent value="settings" className="p-6">
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-6"
                >
                  {Object.entries(settings).map(([key, value]) => (
                    <motion.div
                      key={key}
                      variants={fadeInUp}
                      className="flex items-center justify-between p-4 bg-background border rounded-lg"
                    >
                      <div className="space-y-1">
                        <h3 className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {typeof value === 'boolean' 
                            ? `Toggle ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`
                            : `Current ${key}: ${value}`
                          }
                        </p>
                      </div>
                      {typeof value === 'boolean' ? (
                <Switch
                          checked={value}
                          onCheckedChange={(checked: boolean) => handleSettingChange(key as keyof UserSettings, checked)}
                  disabled={isLoading}
                />
                      ) : (
                        <Input
                          value={value}
                          onChange={e => handleSettingChange(key as keyof UserSettings, e.target.value)}
                          className="max-w-[200px]"
                  disabled={isLoading}
                />
                      )}
                    </motion.div>
                  ))}
                </motion.div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

        <ProjectDetailsModal 
          project={selectedProject}
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          setProjects={setProjects}
        />
      </motion.div>
    </>
  );
} 