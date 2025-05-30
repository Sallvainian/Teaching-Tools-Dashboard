import type { Tables } from '$lib/types/database';
import type { Student, Class, Assignment, Grade } from '$lib/types/gradebook';

// Commented out unused imports
// import type {
//   JeopardyGame,
//   Category as JeopardyCategory,
//   Team,
//   GameSettings
// } from '$lib/types/jeopardy';

// import type {
//   LogEntry
// } from '$lib/types/log-entries';

// Type aliases for better readability and to fix type inference
type DBStudent = Tables<'students'>;
type DBCategory = Tables<'categories'>;
type DBClass = Tables<'classes'>;
type DBClassStudent = Tables<'class_students'>;
type DBAssignment = Tables<'assignments'>;
type DBGrade = Tables<'grades'>;
type DBObservationLog = Tables<'log_entries'>;

// Gradebook model converters
export function dbStudentToAppStudent(dbStudent: DBStudent): Student {
	return {
		id: dbStudent.id,
		name: dbStudent.name
	};
}

export function dbCategoryToAppClass(
	dbCategory: DBCategory,
	classStudents: DBClassStudent[]
): Class {
	// Handle categories from both schema versions
	return {
		id: dbCategory.id,
		name: dbCategory.name,
		// Filter class_students relationships for this category
		studentIds: classStudents
			.filter((cs) => cs.class_id === dbCategory.id)
			.map((cs) => cs.student_id)
	};
}

export function dbClassToAppClass(dbClass: DBClass, classStudents: DBClassStudent[]): Class {
	// Convert classes table data to Class format
	return {
		id: dbClass.id,
		name: dbClass.name,
		// Filter class_students relationships for this class
		studentIds: classStudents.filter((cs) => cs.class_id === dbClass.id).map((cs) => cs.student_id)
	};
}

export function dbAssignmentToAppAssignment(dbAssignment: DBAssignment): Assignment {
	return {
		id: dbAssignment.id,
		name: dbAssignment.name,
		maxPoints: dbAssignment.max_points,
		classId: dbAssignment.category_id // Still maps from DB column category_id to app property classId
	};
}

export function dbGradeToAppGrade(dbGrade: DBGrade): Grade {
	return {
		studentId: dbGrade.student_id,
		assignmentId: dbGrade.assignment_id,
		points: dbGrade.points ?? 0 // Handle null as 0 for Grade type compatibility
	};
}

// Jeopardy interfaces - commented out as the converter functions are not currently used
// interface JeopardyGameDB {
//   id: string;
//   name: string;
//   description?: string;
//   owner_id: string;
//   date_created: string;
//   last_modified: string;
//   settings?: any;
// }

// interface JeopardyCategoryDB {
//   id: string;
//   game_id: string;
//   name: string;
//   display_order: number;
// }

// interface JeopardyQuestionDB {
//   id: string;
//   category_id: string;
//   text: string;
//   answer: string;
//   point_value: number;
//   is_answered: boolean;
//   is_double_jeopardy: boolean;
//   time_limit?: number;
// }

// interface JeopardyTeamDB {
//   id: string;
//   game_id: string;
//   name: string;
//   score: number;
//   color: string;
// }

// Log entries model converters - commented out as they're not used
// export function dbLogToAppLog(dbLog: DBObservationLog): LogEntry {
//   return {
//     id: dbLog.id,
//     observer: '', // Not in database, needs to be added or derived
//     date: dbLog.date,
//     student: dbLog.student,
//     subject: null, // Not in database
//     objective: null, // Not in database
//     observation: dbLog.log_entry, // Database uses 'log_entry' field
//     actions: dbLog.actions,
//     follow_up: dbLog.follow_up,
//     tags: dbLog.tags ?? null
//   };
// }

// export function appLogToDbLog(log: Partial<LogEntry>): Partial<DBObservationLog> {
//   return {
//     date: log.date,
//     student: log.student,
//     log_entry: log.observation ?? '', // Map 'observation' to 'log_entry' - using ?? for nullish coalescing
//     actions: log.actions ?? null,
//     follow_up: log.follow_up ?? null,
//     tags: log.tags ?? []
//   };
// }
