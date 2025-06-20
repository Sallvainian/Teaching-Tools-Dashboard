/**
 * @ai-context GRADEBOOK_DATABASE - Enhanced database operations with parallel loading
 * @ai-dependencies enhanced database service, gradebook stores, model converters
 * @ai-sideEffects Updates gradebook stores, modifies localStorage cache
 * @ai-exports loadAllData, ensureDataLoaded functions with performance optimization
 */

import { get } from 'svelte/store';
import { gradebookService } from '$lib/services/supabaseService';
import {
	dbStudentToAppStudent,
	dbClassToAppClass,
	dbAssignmentToAppAssignment,
	dbGradeToAppGrade
} from '$lib/utils/modelConverters';
import {
	students,
	classes,
	assignments,
	grades,
	selectedClassId,
	isLoading,
	error,
	dataLoaded
} from './core';

// Load all data from Supabase or localStorage with parallel optimization
export async function loadAllData(): Promise<void> {
	isLoading.set(true);
	error.set(null);

	try {
		// Get current user ID for filtering
		const currentUser = await gradebookService.getCurrentUser();
		const currentUserId = currentUser?.id;

		if (!currentUserId) {
			console.warn('No authenticated user found, using localStorage fallback');
			// If no user is authenticated, fall back to localStorage only
			gradebookService.setUseSupabase(false);
		}

		// ====== PERFORMANCE OPTIMIZATION: PARALLEL LOADING ======
		// Instead of 5 sequential database calls, execute all in parallel
		console.log('🚀 Loading gradebook data in parallel...');
		const startTime = performance.now();

		const [
			studentsData,
			classesData,
			classStudentsData,
			assignmentsData,
			gradesData
		] = await Promise.all([
			// Filter students by current user
			gradebookService.getItems('students', { 
				filters: currentUserId ? { user_id: currentUserId } : {} 
			}),
			// Filter classes by current user  
			gradebookService.getItems('classes', { 
				filters: currentUserId ? { user_id: currentUserId } : {} 
			}),
			gradebookService.getItems('class_students'),
			gradebookService.getItems('assignments'),
			gradebookService.getItems('grades')
		]);

		const loadTime = performance.now() - startTime;
		console.log(`✅ Parallel loading completed in ${loadTime.toFixed(2)}ms`);
		console.log(`🔍 Raw data counts:`, {
			students: studentsData.length,
			classes: classesData.length,
			classStudents: classStudentsData.length,
			assignments: assignmentsData.length,
			grades: gradesData.length,
			currentUserId
		});

		// Get the list of class IDs owned by the current user for filtering relationships
		const userClassIds = new Set(classesData.map(cls => cls.id));

		// Filter class_students to only include relationships for the user's classes
		const filteredClassStudents = classStudentsData.filter(relationship => 
			userClassIds.has(relationship.class_id)
		);

		// Transform data to match our store format
		const transformedStudents = studentsData.map(dbStudentToAppStudent);

		const transformedClasses = classesData.map((cls) =>
			dbClassToAppClass(cls, filteredClassStudents)
		);

		// Filter assignments to only include those belonging to the user's classes
		const filteredAssignments = assignmentsData.filter(assignment => 
			userClassIds.has(assignment.class_id)
		);

		// Filter grades to only include those for assignments in the user's classes
		const filteredGrades = gradesData.filter(grade => {
			// Find the assignment this grade belongs to
			const assignment = assignmentsData.find(a => a.id === grade.assignment_id);
			return assignment && userClassIds.has(assignment.class_id);
		});

		// Map assignments to their classes directly using assignment.class_id
		const transformedAssignments = filteredAssignments.map((assignment) => {
			return dbAssignmentToAppAssignment(assignment, assignment.class_id);
		});

		const transformedGrades = filteredGrades.map(dbGradeToAppGrade);

		console.log(`🎯 Filtered data counts:`, {
			students: transformedStudents.length,
			classes: transformedClasses.length,
			classStudents: filteredClassStudents.length,
			assignments: transformedAssignments.length,
			grades: transformedGrades.length,
			userClassIds: Array.from(userClassIds)
		});

		// Update stores
		students.set(transformedStudents);
		classes.set(transformedClasses);
		assignments.set(transformedAssignments);
		grades.set(transformedGrades);

		// Select first class if none selected
		if (classesData.length > 0 && get(selectedClassId) === null) {
			selectedClassId.set(classesData[0].id);
			gradebookService.saveToStorage('selectedClassId', classesData[0].id);
		}

		// Mark data as loaded
		dataLoaded.set(true);
	} catch (err: unknown) {
		console.error('Error loading gradebook data:', err);
		error.set(err instanceof Error ? err.message : 'Failed to load data');
	} finally {
		isLoading.set(false);
	}
}

// Ensure data is loaded before using the store
export async function ensureDataLoaded(): Promise<void> {
	if (get(dataLoaded)) return;
	await loadAllData();
}

// Utility function to save to storage
export function saveToStorage<T>(key: string, value: T): void {
	gradebookService.saveToStorage(key, value);
}

// Utility function to load from storage
export function loadFromStorage<T>(key: string, defaultValue: T): T {
	return gradebookService.loadFromStorage(key, defaultValue);
}