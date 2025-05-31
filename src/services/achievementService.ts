import { supabase } from '@/lib/supabase';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: Date;
  icon: string;
  level: "bronze" | "silver" | "gold";
  category: "sustainability" | "planning" | "transportation" | "community" | "innovation";
  progress: number;
  isNew?: boolean;
  user_id: string;
}

interface AchievementCriteria {
  id: string;
  title: string;
  description: string;
  category: Achievement['category'];
  level: Achievement['level'];
  icon: string;
  thresholds: {
    bronze: number;
    silver: number;
    gold: number;
  };
  checkProgress: (userId: string) => Promise<number>;
}

// Achievement criteria definitions
const ACHIEVEMENT_CRITERIA: AchievementCriteria[] = [
  {
    id: 'projects-count',
    title: 'Project Aficionado',
    description: 'Complete urban planning projects',
    category: 'planning',
    level: 'bronze',
    icon: 'building',
    thresholds: {
      bronze: 1,
      silver: 5,
      gold: 10
    },
    checkProgress: async (userId: string) => {
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      return count || 0;
    }
  },
  {
    id: 'low-emissions',
    title: 'Sustainability Champion',
    description: 'Create projects with low emissions',
    category: 'sustainability',
    level: 'silver',
    icon: 'leaf',
    thresholds: {
      bronze: 1,
      silver: 3,
      gold: 5
    },
    checkProgress: async (userId: string) => {
      const { count } = await supabase
        .from('simulation_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lt('emissions', 25); // Emissions below 25%
      
      return count || 0;
    }
  },
  {
    id: 'high-transit',
    title: 'Transit Master',
    description: 'Achieve high transit usage in projects',
    category: 'transportation',
    level: 'gold',
    icon: 'car',
    thresholds: {
      bronze: 1,
      silver: 3,
      gold: 5
    },
    checkProgress: async (userId: string) => {
      const { count } = await supabase
        .from('simulation_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('transitUsage', 75); // Transit usage above 75%
      
      return count || 0;
    }
  },
  {
    id: 'satisfaction',
    title: 'Community Connector',
    description: 'Design cities with high citizen satisfaction',
    category: 'community',
    level: 'silver',
    icon: 'users',
    thresholds: {
      bronze: 1,
      silver: 3,
      gold: 5
    },
    checkProgress: async (userId: string) => {
      const { count } = await supabase
        .from('simulation_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('satisfaction', 90); // Satisfaction above 90%
      
      return count || 0;
    }
  },
  {
    id: 'ai-analysis',
    title: 'Innovation Pioneer',
    description: 'Use AI analysis in different projects',
    category: 'innovation',
    level: 'gold',
    icon: 'bulb',
    thresholds: {
      bronze: 1,
      silver: 3,
      gold: 5
    },
    checkProgress: async (userId: string) => {
      const { count } = await supabase
        .from('simulation_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('ai_analysis', 'is', null);
      
      return count || 0;
    }
  }
];

// Fetch the user's achievements
export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  try {
    // First, check if we have any existing achievements for this user
    const { data: existingAchievements, error: fetchError } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    // If we have no achievements yet, initialize them
    if (!existingAchievements || existingAchievements.length === 0) {
      return initializeUserAchievements(userId);
    }

    // Update achievement progress for existing achievements
    return updateAchievementProgress(userId, existingAchievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }
}

// Initialize achievements for a new user
async function initializeUserAchievements(userId: string): Promise<Achievement[]> {
  try {
    const newAchievements: Omit<Achievement, 'id' | 'date'>[] = [];

    // Create initial achievement records for all criteria
    for (const criteria of ACHIEVEMENT_CRITERIA) {
      const progress = await criteria.checkProgress(userId);
      const level = determineLevel(progress, criteria.thresholds);
      const isCompleted = progress >= criteria.thresholds[level];
      
      newAchievements.push({
        title: criteria.title,
        description: criteria.description,
        icon: criteria.icon,
        level: level,
        category: criteria.category,
        progress: calculateProgress(progress, criteria.thresholds[level]),
        isNew: isCompleted,
        user_id: userId
      });
    }

    // Insert all new achievements into the database
    const { data, error } = await supabase
      .from('achievements')
      .insert(newAchievements)
      .select();

    if (error) throw error;
    
    return data.map(a => ({
      ...a,
      date: new Date()
    }));
  } catch (error) {
    console.error('Error initializing achievements:', error);
    return [];
  }
}

// Update achievement progress based on user activity
async function updateAchievementProgress(
  userId: string, 
  existingAchievements: any[]
): Promise<Achievement[]> {
  try {
    const updatedAchievements = [];
    
    for (const achievement of existingAchievements) {
      const criteria = ACHIEVEMENT_CRITERIA.find(c => c.title === achievement.title);
      
      if (!criteria) continue;
      
      const currentProgress = await criteria.checkProgress(userId);
      const newLevel = determineLevel(currentProgress, criteria.thresholds);
      const wasCompleted = achievement.progress >= 100;
      const isCompleted = currentProgress >= criteria.thresholds[newLevel];
      const isNew = isCompleted && !wasCompleted;
      
      const updatedAchievement = {
        ...achievement,
        level: newLevel,
        progress: calculateProgress(currentProgress, criteria.thresholds[newLevel]),
        isNew: isNew,
        date: isNew ? new Date() : achievement.date
      };
      
      // Update in database if changed
      if (
        updatedAchievement.progress !== achievement.progress || 
        updatedAchievement.level !== achievement.level
      ) {
        await supabase
          .from('achievements')
          .update(updatedAchievement)
          .eq('id', achievement.id);
      }
      
      updatedAchievements.push(updatedAchievement);
    }
    
    return updatedAchievements;
  } catch (error) {
    console.error('Error updating achievements:', error);
    return existingAchievements;
  }
}

// Check for and award new achievements based on user activity
export async function checkForAchievements(userId: string): Promise<Achievement[]> {
  return getUserAchievements(userId);
}

// Determine the appropriate level based on progress
function determineLevel(progress: number, thresholds: AchievementCriteria['thresholds']): Achievement['level'] {
  if (progress >= thresholds.gold) return 'gold';
  if (progress >= thresholds.silver) return 'silver';
  return 'bronze';
}

// Calculate percentage progress toward next level
function calculateProgress(currentValue: number, threshold: number): number {
  const percentage = (currentValue / threshold) * 100;
  return Math.min(Math.round(percentage), 100);
}
