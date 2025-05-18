import type { Tables } from '../../supabase';
import type { 
  Student, 
  Category, 
  Assignment, 
  Grade 
} from '$lib/types/gradebook';

import type {
  JeopardyGame,
  Category as JeopardyCategory,
  Question,
  Team,
  GameSettings
} from '$lib/types/jeopardy';

import type {
  StudentObservationLog
} from '$lib/types/observation-log';

// Gradebook model converters
export function dbStudentToAppStudent(dbStudent: Tables<'students'>): Student {
  return {
    id: dbStudent.id,
    name: dbStudent.name
  };
}

export function dbCategoryToAppCategory(
  dbCategory: Tables<'categories'>, 
  categoryStudents: Tables<'category_students'>[]
): Category {
  return {
    id: dbCategory.id,
    name: dbCategory.name,
    studentIds: categoryStudents
      .filter(cs => cs.category_id === dbCategory.id)
      .map(cs => cs.student_id)
  };
}

export function dbAssignmentToAppAssignment(dbAssignment: Tables<'assignments'>): Assignment {
  return {
    id: dbAssignment.id,
    name: dbAssignment.name,
    maxPoints: dbAssignment.max_points,
    categoryId: dbAssignment.category_id
  };
}

export function dbGradeToAppGrade(dbGrade: Tables<'grades'>): Grade {
  return {
    studentId: dbGrade.student_id,
    assignmentId: dbGrade.assignment_id,
    points: dbGrade.points
  };
}

// Define explicit interfaces for the database models we're working with
interface JeopardyGameDB {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  date_created: string;
  last_modified: string;
  settings?: any;
}

interface JeopardyCategoryDB {
  id: string;
  game_id: string;
  name: string;
  display_order: number;
}

interface JeopardyQuestionDB {
  id: string;
  category_id: string;
  text: string;
  answer: string;
  point_value: number;
  is_answered: boolean;
  is_double_jeopardy: boolean;
  time_limit?: number;
}

interface JeopardyTeamDB {
  id: string;
  game_id: string;
  name: string;
  score: number;
  color: string;
}

interface ObservationLogDB {
  id: string;
  student_id: string;
  date: string;
  reason: string;
  notes?: string;
  mood?: string;
  follow_up_actions?: string;
  follow_up_date?: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

// Jeopardy model converters with explicit type casting
export function dbGameToAppGame(
  dbGame: any,
  dbCategories: any[],
  dbQuestions: any[],
  dbTeams: any[]
): JeopardyGame {
  // Cast to known types
  const typedDbGame = dbGame as JeopardyGameDB;
  const typedDbCategories = dbCategories as JeopardyCategoryDB[];
  const typedDbQuestions = dbQuestions as JeopardyQuestionDB[];
  const typedDbTeams = dbTeams as JeopardyTeamDB[];
  // Convert settings from JSON to typed object
  const settings: GameSettings = {
    defaultTimeLimit: 30,
    useTimer: true,
    readingTime: 5,
    autoShowAnswer: true,
    timerSize: 'large',
    allowWagers: true,
    ...(typedDbGame.settings as Record<string, any> || {})
  };

  // Get categories for this game
  const gameCategories = typedDbCategories
    .filter(cat => cat.game_id === typedDbGame.id)
    .sort((a, b) => a.display_order - b.display_order);

  // Process categories with their questions
  const categories: JeopardyCategory[] = gameCategories.map(dbCat => {
    // Get questions for this category
    const categoryQuestions = typedDbQuestions
      .filter(q => q.category_id === dbCat.id)
      .map(dbQuestion => ({
        id: dbQuestion.id,
        text: dbQuestion.text,
        answer: dbQuestion.answer,
        pointValue: dbQuestion.point_value,
        isAnswered: dbQuestion.is_answered,
        isDoubleJeopardy: dbQuestion.is_double_jeopardy,
        timeLimit: dbQuestion.time_limit || undefined
      }));
    
    return {
      id: dbCat.id,
      name: dbCat.name,
      questions: categoryQuestions
    };
  });

  // Get teams for this game
  const teams: Team[] = typedDbTeams
    .filter(team => team.game_id === typedDbGame.id)
    .map(dbTeam => ({
      id: dbTeam.id,
      name: dbTeam.name,
      score: dbTeam.score,
      color: dbTeam.color
    }));

  return {
    id: typedDbGame.id,
    name: typedDbGame.name,
    description: typedDbGame.description || undefined,
    categories,
    teams,
    dateCreated: typedDbGame.date_created,
    lastModified: typedDbGame.last_modified,
    settings
  };
}

// Convert from app model to database model for creating/updating
export function appGameToDbModels(game: JeopardyGame, userId: string): {
  gameData: any,
  categoriesData: any[],
  questionsData: any[],
  teamsData: any[]
} {
  // Prepare game data
  const gameData: any = {
    owner_id: userId,
    name: game.name,
    description: game.description || null,
    date_created: game.dateCreated,
    last_modified: game.lastModified,
    settings: game.settings as any
  };

  // Prepare categories data
  const categoriesData: any[] = 
    game.categories.map((cat, index) => ({
      game_id: game.id,
      name: cat.name,
      display_order: index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

  // Prepare questions data
  const questionsData: any[] = 
    game.categories.flatMap((cat) => 
      cat.questions.map(q => ({
        category_id: cat.id,
        text: q.text,
        answer: q.answer,
        point_value: q.pointValue,
        is_answered: q.isAnswered,
        is_double_jeopardy: q.isDoubleJeopardy || false,
        time_limit: q.timeLimit || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    );

  // Prepare teams data
  const teamsData: any[] = 
    game.teams.map(team => ({
      game_id: game.id,
      name: team.name,
      score: team.score,
      color: team.color,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

  return {
    gameData,
    categoriesData,
    questionsData,
    teamsData
  };
}

// Observation log model converters
export function dbLogToAppLog(dbLog: any, studentName: string = ''): StudentObservationLog {
  // Cast to known type
  const typedDbLog = dbLog as ObservationLogDB;
  
  return {
    id: typedDbLog.id,
    studentName,
    studentId: typedDbLog.student_id,
    date: typedDbLog.date,
    reason: typedDbLog.reason,
    notes: typedDbLog.notes || '',
    mood: typedDbLog.mood || undefined,
    followUpActions: typedDbLog.follow_up_actions || undefined,
    followUpDate: typedDbLog.follow_up_date || '',
    resolved: typedDbLog.resolved,
    createdAt: typedDbLog.created_at,
    updatedAt: typedDbLog.updated_at
  };
}

export function appLogToDbLog(log: Partial<StudentObservationLog>): any {
  return {
    student_id: log.studentId,
    date: log.date,
    reason: log.reason,
    notes: log.notes || null,
    mood: log.mood || null,
    follow_up_actions: log.followUpActions || null,
    follow_up_date: log.followUpDate || null,
    resolved: log.resolved
  };
}