import type { Tables } from '$lib/types/database';
import type { Student, Class, Assignment, Grade } from '$lib/types/gradebook';

// Type aliases for better readability and to fix type inference
type DBStudent = Tables<'students'>;
type DBCategory = Tables<'categories'>;
type DBClass = Tables<'classes'>;
type DBClassStudent = Tables<'class_students'>;
type DBAssignment = Tables<'assignments'>;
type DBGrade = Tables<'grades'>;

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
