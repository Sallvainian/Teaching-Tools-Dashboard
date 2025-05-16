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

// Jeopardy model converters
export function dbGameToAppGame(
  dbGame: Tables<'jeopardy_games'>,
  dbCategories: Tables<'jeopardy_categories'>[],
  dbQuestions: Tables<'jeopardy_questions'>[],
  dbTeams: Tables<'jeopardy_teams'>[]
): JeopardyGame {
  // Convert settings from JSON to typed object
  const settings: GameSettings = {
    defaultTimeLimit: 30,
    useTimer: true,
    readingTime: 5,
    autoShowAnswer: true,
    timerSize: 'large',
    allowWagers: true,
    ...dbGame.settings as Record<string, any>
  };

  // Get categories for this game
  const gameCategories = dbCategories
    .filter(cat => cat.game_id === dbGame.id)
    .sort((a, b) => a.display_order - b.display_order);

  // Process categories with their questions
  const categories: JeopardyCategory[] = gameCategories.map(dbCat => {
    // Get questions for this category
    const categoryQuestions = dbQuestions
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
  const teams: Team[] = dbTeams
    .filter(team => team.game_id === dbGame.id)
    .map(dbTeam => ({
      id: dbTeam.id,
      name: dbTeam.name,
      score: dbTeam.score,
      color: dbTeam.color
    }));

  return {
    id: dbGame.id,
    name: dbGame.name,
    description: dbGame.description || undefined,
    categories,
    teams,
    dateCreated: dbGame.date_created,
    lastModified: dbGame.last_modified,
    settings
  };
}

// Convert from app model to database model for creating/updating
export function appGameToDbModels(game: JeopardyGame, userId: string): {
  gameData: Omit<Tables<'jeopardy_games'>, 'id'>,
  categoriesData: Omit<Tables<'jeopardy_categories'>, 'id'>[],
  questionsData: Omit<Tables<'jeopardy_questions'>, 'id'>[],
  teamsData: Omit<Tables<'jeopardy_teams'>, 'id'>[]
} {
  // Prepare game data
  const gameData: Omit<Tables<'jeopardy_games'>, 'id'> = {
    owner_id: userId,
    name: game.name,
    description: game.description || null,
    date_created: game.dateCreated,
    last_modified: game.lastModified,
    settings: game.settings as any
  };

  // Prepare categories data
  const categoriesData: Omit<Tables<'jeopardy_categories'>, 'id'>[] = 
    game.categories.map((cat, index) => ({
      game_id: game.id,
      name: cat.name,
      display_order: index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

  // Prepare questions data
  const questionsData: Omit<Tables<'jeopardy_questions'>, 'id'>[] = 
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
  const teamsData: Omit<Tables<'jeopardy_teams'>, 'id'>[] = 
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
export function dbLogToAppLog(dbLog: Tables<'observation_logs'>, studentName: string = ''): StudentObservationLog {
  return {
    id: dbLog.id,
    studentName,
    studentId: dbLog.student_id,
    date: dbLog.date,
    reason: dbLog.reason,
    notes: dbLog.notes || '',
    mood: dbLog.mood || undefined,
    followUpActions: dbLog.follow_up_actions || undefined,
    followUpDate: dbLog.follow_up_date || '',
    resolved: dbLog.resolved,
    createdAt: dbLog.created_at,
    updatedAt: dbLog.updated_at
  };
}

export function appLogToDbLog(log: Partial<StudentObservationLog>): Partial<Tables<'observation_logs'>> {
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