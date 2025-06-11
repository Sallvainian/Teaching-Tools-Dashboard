import type { Tables } from '$lib/types/database';
import type { Student, Class, Assignment, Grade } from '$lib/types/gradebook';
import { createStudentId, createClassId, createAssignmentId } from '$lib/types/ai-optimized';

// Type aliases for better readability and to fix type inference
type DBStudent = Tables<'students'>;
type DBClass = Tables<'classes'>;
type DBClassStudent = Tables<'class_students'>;
type DBAssignment = Tables<'assignments'>;
type DBGrade = Tables<'grades'>;

// Gradebook model converters
export function dbStudentToAppStudent(dbStudent: DBStudent): Student {
	return {
		id: createStudentId(dbStudent.id),
		name: dbStudent.name
	};
}

export function dbClassToAppClass(dbClass: DBClass, classStudents: DBClassStudent[]): Class {
	// Convert classes table data to Class format
	return {
		id: createClassId(dbClass.id),
		name: dbClass.name,
		// Filter class_students relationships for this class
		studentIds: classStudents.filter((cs) => cs.class_id === dbClass.id).map((cs) => createStudentId(cs.student_id))
	};
}

export function dbAssignmentToAppAssignment(dbAssignment: DBAssignment, classId: string): Assignment {
	return {
		id: createAssignmentId(dbAssignment.id),
		name: dbAssignment.name,
		maxPoints: dbAssignment.max_points,
		classId: createClassId(classId)
	};
}

export function dbGradeToAppGrade(dbGrade: DBGrade): Grade {
	return {
		studentId: createStudentId(dbGrade.student_id),
		assignmentId: createAssignmentId(dbGrade.assignment_id),
		points: dbGrade.points ?? 0 // Handle null as 0 for Grade type compatibility
	};
}
