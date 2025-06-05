// src/lib/stores/gradebook.ts
import { writable, derived, get } from 'svelte/store';
import type { Student, Class, Assignment, Grade } from '$lib/types/gradebook';
import { gradebookService } from '$lib/services/supabaseService';
import {
	dbStudentToAppStudent,
	dbClassToAppClass,
	dbAssignmentToAppAssignment,
	dbGradeToAppGrade
} from '$lib/utils/modelConverters';
import { authStore } from './auth';

function createGradebookStore() {
	// Initialize stores with empty data or data from localStorage
	const students = writable<Student[]>([]);
	const classes = writable<Class[]>([]);
	const selectedClassId = writable<string | null>(
		gradebookService.loadFromStorage('selectedClassId', null)
	);
	const assignments = writable<Assignment[]>([]);
	const grades = writable<Grade[]>([]);
	const isLoading = writable(false);
	const error = writable<string | null>(null);
	const dataLoaded = writable(false);

	// Get current state of useSupabase from service
	const useSupabase = writable(gradebookService.isUsingSupabase());

	// Create a derived store for the entire state
	const store = derived(
		[
			students,
			classes,
			selectedClassId,
			assignments,
			grades,
			isLoading,
			error,
			useSupabase,
			dataLoaded
		],
		([
			$students,
			$classes,
			$selectedClassId,
			$assignments,
			$grades,
			$isLoading,
			$error,
			$useSupabase,
			$dataLoaded
		]) => {
			return {
				// State values
				students: $students,
				classes: $classes,
				selectedClassId: $selectedClassId,
				assignments: $assignments,
				grades: $grades,
				isLoading: $isLoading,
				error: $error,
				useSupabase: $useSupabase,
				dataLoaded: $dataLoaded,

				// Computed values
				getGlobalStudents: $students,
				getClasses: $classes,
				getSelectedClass: $selectedClassId
					? $classes.find((cls) => cls.id === $selectedClassId) || null
					: null,
				getStudentsInSelectedClass: $selectedClassId
					? $students.filter((st) => {
							const cls = $classes.find((c) => c.id === $selectedClassId);
							return cls ? cls.studentIds.includes(st.id) : false;
						})
					: [],
				getAssignmentsForSelectedClass: $selectedClassId
					? $assignments.filter((asgn) => asgn.classId === $selectedClassId)
					: []
			};
		}
	);

	// Load all data from Supabase or localStorage
	async function loadAllData() {
		isLoading.set(true);
		error.set(null);

		try {
			// Load students
			const studentsData = await gradebookService.getItems('students');

			// Load classes
			const classesData = await gradebookService.getItems('classes');

			// Load class_students relations
			const classStudentsData = await gradebookService.getItems('class_students');

			// Load assignments with class relationships
			const assignmentsData = await gradebookService.getItems('assignments');
			
			// Load gradebook_categories and categories to map assignments to classes
			const gradebookCategoriesData = await gradebookService.getItems('gradebook_categories');
			const categoriesData = await gradebookService.getItems('categories');

			// Load grades
			const gradesData = await gradebookService.getItems('grades');

			// Transform data to match our store format
			const transformedStudents = studentsData.map(dbStudentToAppStudent);

			const transformedClasses = classesData.map((cls) =>
				dbClassToAppClass(cls, classStudentsData)
			);

			// Map assignments to their classes through the foreign key chain
			const transformedAssignments = assignmentsData.map((assignment) => {
				// Find gradebook_category for this assignment
				const gradebookCategory = gradebookCategoriesData.find(gc => gc.id === assignment.category_id);
				if (gradebookCategory) {
					// Find category for this gradebook_category
					const category = categoriesData.find(c => c.id === gradebookCategory.category_id);
					if (category) {
						// Use the class_id from the category
						return dbAssignmentToAppAssignment(assignment, category.class_id);
					}
				}
				// Fallback to original behavior
				return dbAssignmentToAppAssignment(assignment);
			});

			const transformedGrades = gradesData.map(dbGradeToAppGrade);

			// Debug logging for data transformation
			console.log('Transformed data:', {
				classes: transformedClasses.map(c => ({
					id: c.id,
					name: c.name,
					studentIds: c.studentIds,
					studentCount: c.studentIds.length
				})),
				classStudentsRaw: classStudentsData
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
			// Error loading data: err
			error.set(err instanceof Error ? err.message : 'Failed to load data');
		} finally {
			isLoading.set(false);
		}
	}

	// Student management
	async function addGlobalStudent(name: string, userId?: string): Promise<string | null> {
		const trimmed = name.trim();
		if (!trimmed) return null;

		try {
			// Get user_id from auth if not provided
			if (!userId) {
				const currentUser = get(authStore).user;
				userId = currentUser?.id;
			}

			// Insert into database or localStorage
			const result = await gradebookService.insertItem('students', {
				name: trimmed,
				user_id: userId
			});

			if (!result) throw new Error('Failed to add student');

			// Update local store
			const newStudent = dbStudentToAppStudent(result);
			students.update((arr: Student[]) => [...arr, newStudent]);

			return newStudent.id;
		} catch (err: unknown) {
			// Error adding student: err
			error.set(err instanceof Error ? err.message : 'Failed to add student');
			return null;
		}
	}

	// Class management
	async function addClass(name: string, userId?: string): Promise<void> {
		const trimmed = name.trim();
		if (!trimmed) return;

		try {
			// Check if class already exists
			const currentClasses = get(classes);
			const existingClass = currentClasses.find(cls => cls.name === trimmed);
			if (existingClass) {
				console.warn(`Class "${trimmed}" already exists`);
				return;
			}

			// Insert into database or localStorage
			const result = await gradebookService.insertItem('classes', {
				name: trimmed,
				user_id: userId // Include user_id if provided
			});

			if (!result) throw new Error('Failed to add class');

			// Update local store
			const newClass: Class = {
				id: result.id,
				name: result.name,
				studentIds: []
			};

			classes.update((arr: Class[]) => [...arr, newClass]);
			selectedClassId.update((cur: string | null) => cur ?? result.id);

			// Save selected class ID
			gradebookService.saveToStorage('selectedClassId', get(selectedClassId));
		} catch (err: unknown) {
			// Error adding class: err
			error.set(err instanceof Error ? err.message : 'Failed to add class');
		}
	}

	// Delete class
	async function deleteClass(classId: string): Promise<void> {
		try {
			// Delete from database
			await gradebookService.deleteItem('classes', classId);

			// Update local store
			classes.update((arr: Class[]) => arr.filter((cls) => cls.id !== classId));

			// If this was the selected class, clear selection
			if (get(selectedClassId) === classId) {
				selectedClassId.set(null);
				gradebookService.saveToStorage('selectedClassId', null);
			}
		} catch (err: unknown) {
			error.set(err instanceof Error ? err.message : 'Failed to delete class');
		}
	}

	// Import classes from JSON
	async function importClassesFromJSON(
		jsonData: Array<{ name: string; students?: Array<{ name: string }> }>,
		userId?: string
	): Promise<void> {
		try {
			for (const classData of jsonData) {
				if (classData.name) {
					// Add the class
					await addClass(classData.name, userId);

					// If students are included, add them
					if (classData.students && Array.isArray(classData.students)) {
						const currentClasses = get(classes);
						const newClass = currentClasses[currentClasses.length - 1]; // Get the just-added class

						for (const studentData of classData.students) {
							if (studentData.name) {
								const studentId = await addGlobalStudent(studentData.name, userId);
								if (studentId && newClass) {
									await assignStudentToClass(studentId, newClass.id);
								}
							}
						}
					}
				}
			}
		} catch (err: unknown) {
			error.set(err instanceof Error ? err.message : 'Failed to import classes');
		}
	}

	// Import students to existing class from JSON
	async function importStudentsToClass(
		studentsData: Array<{ name: string }>,
		classId: string,
		userId?: string
	): Promise<void> {
		try {
			for (const studentData of studentsData) {
				if (studentData.name) {
					const studentId = await addGlobalStudent(studentData.name.trim(), userId);
					if (studentId) {
						await assignStudentToClass(studentId, classId);
					}
				}
			}
		} catch (err: unknown) {
			error.set(err instanceof Error ? err.message : 'Failed to import students to class');
		}
	}

	function selectClass(id: string | null): void {
		selectedClassId.set(id);
		gradebookService.saveToStorage('selectedClassId', id);
	}

	// Student assignment to class
	async function assignStudentToClass(studentId: string, classId: string): Promise<void> {
		try {
			// Insert relationship into database or localStorage
			await gradebookService.insertItem('class_students', {
				class_id: classId,
				student_id: studentId
			});

			// Update local store
			classes.update((clsArray: Class[]) =>
				clsArray.map((cls: Class) =>
					cls.id === classId && !cls.studentIds.includes(studentId)
						? { ...cls, studentIds: [...cls.studentIds, studentId] }
						: cls
				)
			);
		} catch (err: unknown) {
			// Error assigning student to class: err
			error.set(err instanceof Error ? err.message : 'Failed to assign student');
		}
	}

	function removeStudentFromClassHelper(cls: Class, classId: string, studentId: string): Class {
		if (cls.id !== classId) return cls;
		return { ...cls, studentIds: cls.studentIds.filter((id: string) => id !== studentId) };
	}

	async function removeStudentFromClass(studentId: string, classId: string): Promise<void> {
		try {
			// Get the specific class_students entry
			const classStudents = await gradebookService.getItems('class_students', {
				filters: {
					class_id: classId,
					student_id: studentId
				}
			});

			if (classStudents.length > 0) {
				// For tables that use composite keys instead of an 'id' field
				await gradebookService.deleteItem('class_students', {
					class_id: classId,
					student_id: studentId
				});
			}

			// Update local store
			classes.update((clsArray: Class[]) =>
				clsArray.map((cls: Class) => removeStudentFromClassHelper(cls, classId, studentId))
			);
		} catch (err: unknown) {
			// Error removing student from class: err
			error.set(err instanceof Error ? err.message : 'Failed to remove student');
		}
	}

	// Assignment management
	async function addAssignmentToClass(
		name: string,
		maxPoints: number,
		classId: string
	): Promise<void> {
		const trimmed = name.trim();
		if (!trimmed || maxPoints <= 0) return;

		try {
			
			// Verify the class exists first
			const classData = await gradebookService.getItems('classes', {
				filters: { id: classId }
			});
			
			if (!classData || classData.length === 0) {
				throw new Error(`Class with ID ${classId} not found`);
			}
			


			// First, ensure a category exists for this class (assignments by default)
			const existingCategoryEntries = await gradebookService.getItems('categories', {
				filters: { class_id: classId, name: 'Assignments' }
			});

			let categoryId;
			if (!existingCategoryEntries || existingCategoryEntries.length === 0) {
				// Create category entry (class_id points to classes table)
				const newCategoryEntry = await gradebookService.insertItem('categories', {
					class_id: classId,
					name: 'Assignments',
					weight: 1.0,
					description: 'General assignments for this class',
					user_id: classData[0].user_id // Required for RLS policy
				});
				
				if (newCategoryEntry) {
					categoryId = newCategoryEntry.id;
				}
			} else {
				categoryId = existingCategoryEntries[0].id;
			}

			// Now check if gradebook_category exists for this category
			const existingGradebookCategories = await gradebookService.getItems('gradebook_categories', {
				filters: { category_id: categoryId }
			});

			let gradebookCategoryId: string;
			if (!existingGradebookCategories || existingGradebookCategories.length === 0) {
				// Create gradebook_category entry (category_id points to categories table)
				const newGradebookCategory = await gradebookService.insertItem('gradebook_categories', {
					name: 'Assignments',
					category_id: categoryId
				});
				
				if (!newGradebookCategory) {
					throw new Error('Failed to create gradebook category');
				}
				gradebookCategoryId = newGradebookCategory.id;
			} else {
				gradebookCategoryId = existingGradebookCategories[0].id;
			}

			// Insert assignment referencing the gradebook category
			const result = await gradebookService.insertItem('assignments', {
				name: trimmed,
				max_points: maxPoints,
				category_id: gradebookCategoryId
			});

			if (!result) throw new Error('Failed to add assignment');

			// Update local store with correct class ID
			const newAssignment = dbAssignmentToAppAssignment(result, classId);
			assignments.update((arr: Assignment[]) => [...arr, newAssignment]);
		} catch (err: unknown) {
			console.error('🔧 Error adding assignment:', err);
			error.set(err instanceof Error ? err.message : 'Failed to add assignment');
		}
	}

	// Update assignment
	async function updateAssignment(assignmentId: string, name: string, maxPoints: number): Promise<void> {
		try {
			// Update in database
			const updatedAssignment = await gradebookService.updateItem('assignments', assignmentId, {
				name,
				max_points: maxPoints
			});

			if (updatedAssignment) {
				// Update local store
				assignments.update((arr: Assignment[]) => 
					arr.map(a => a.id === assignmentId ? {
						...a,
						name,
						maxPoints
					} : a)
				);
			}
		} catch (err: unknown) {
			console.error('🔧 Error updating assignment:', err);
			error.set(err instanceof Error ? err.message : 'Failed to update assignment');
		}
	}

	// Delete assignment
	async function deleteAssignment(assignmentId: string): Promise<void> {
		try {
			// Delete from database
			await gradebookService.deleteItem('assignments', assignmentId);

			// Delete all grades for this assignment
			const gradesToDelete = await gradebookService.getItems('grades', {
				filters: { assignment_id: assignmentId }
			});

			for (const grade of gradesToDelete) {
				await gradebookService.deleteItem('grades', grade.id);
			}

			// Update local stores
			assignments.update((arr: Assignment[]) => 
				arr.filter(a => a.id !== assignmentId)
			);
			
			grades.update((arr: Grade[]) => 
				arr.filter(g => g.assignmentId !== assignmentId)
			);
		} catch (err: unknown) {
			console.error('Error deleting assignment:', err);
			error.set(err instanceof Error ? err.message : 'Failed to delete assignment');
		}
	}

	// Grade recording
	async function recordGrade(
		studentId: string,
		assignmentId: string,
		points: number
	): Promise<void> {
		const pts = Math.max(0, points);

		try {
			// Check if grade already exists
			const existingGrades = await gradebookService.getItems('grades', {
				filters: {
					student_id: studentId,
					assignment_id: assignmentId
				}
			});

			if (existingGrades.length > 0) {
				// Update existing grade
				await gradebookService.updateItem('grades', existingGrades[0].id, {
					points: pts
				});
			} else {
				// Insert new grade
				await gradebookService.insertItem('grades', {
					student_id: studentId,
					assignment_id: assignmentId,
					points: pts
				});
			}

			// Update local store
			grades.update((arr: Grade[]) => {
				const idx = arr.findIndex(
					(g: Grade) => g.studentId === studentId && g.assignmentId === assignmentId
				);
				if (idx > -1) {
					const newArr = [...arr];
					newArr[idx].points = pts;
					return newArr;
				}
				return [...arr, { studentId, assignmentId, points: pts }];
			});
		} catch (err: unknown) {
			// Error recording grade: err
			error.set(err instanceof Error ? err.message : 'Failed to record grade');
		}
	}

	// Student average calculation (no change needed - works with local data)
	function studentAverageInClass(studentId: string, classId: string): number {
		const assigns = get(assignments).filter((a: Assignment) => a.classId === classId);
		if (assigns.length === 0) return 0;

		const currentGrades = get(grades);
		let earned = 0;
		let possible = 0;

		for (const a of assigns) {
			const g = currentGrades.find(
				(gr: Grade) => gr.assignmentId === a.id && gr.studentId === studentId
			);
			if (g) earned += g.points;
			possible += a.maxPoints;
		}

		return possible > 0 ? parseFloat(((earned / possible) * 100).toFixed(1)) : 0;
	}

	// Clear all data
	async function clearAllData(): Promise<void> {
		try {
			// Clear tables with id field
			const tablesWithId = ['grades', 'assignments', 'classes', 'students'] as const;

			for (const table of tablesWithId) {
				const items = await gradebookService.getItems(table);
				for (const item of items) {
					await gradebookService.deleteItem(table, item.id);
				}
			}

			// Handle class_students with composite key
			const classStudents = await gradebookService.getItems('class_students');
			for (const item of classStudents) {
				// Pass composite key as an object
				await gradebookService.deleteItem('class_students', {
					class_id: item.class_id,
					student_id: item.student_id
				});
			}

			// Clear local stores
			students.set([]);
			classes.set([]);
			selectedClassId.set(null);
			assignments.set([]);
			grades.set([]);

			// Clear localStorage
			gradebookService.removeFromStorage('selectedClassId');
		} catch (err: unknown) {
			error.set(err instanceof Error ? err.message : 'Failed to clear data');
		}
	}

	// Toggle storage mode
	function setUseSupabase(value: boolean): void {
		useSupabase.set(value);
		gradebookService.setUseSupabase(value);
		if (value) {
			// If enabling Supabase, load data from it
			void loadAllData();
		}
	}

	// Lazy loading - don't load data until explicitly requested
	async function ensureDataLoaded() {
		try {
			// Check if data is already loaded
			if (get(dataLoaded)) {
				// GradebookStore: Data already loaded
				return true;
			}

			// Check if we should use Supabase
			if (!get(useSupabase)) {
				// GradebookStore: Not using Supabase, loading from localStorage
				dataLoaded.set(true);
				return true;
			}

			// Import supabase client dynamically if needed to ensure it's initialized
			const { supabase } = await import('$lib/supabaseClient');

			// Check authentication state
			const { data: _authData } = await supabase.auth.getSession();
			// const isAuthenticated = !!authData?.session?.user; // Removed unused variable

			// Log auth state and proceed with loading
			// GradebookStore: User is/is not authenticated

			// Load data
			// GradebookStore: Loading data from Supabase...
			await loadAllData();
			return true;
		} catch (err) {
			// GradebookStore: Error ensuring data loaded: err
			error.set(err instanceof Error ? err.message : String(err));
			throw err;
		}
	}

	// Return both the store and methods to update it
	return {
		subscribe: store.subscribe,
		loadAllData,
		addGlobalStudent,
		addClass,
		deleteClass,
		importClassesFromJSON,
		importStudentsToClass,
		selectClass,
		assignStudentToClass,
		removeStudentFromClass,
		addAssignmentToClass,
		updateAssignment,
		deleteAssignment,
		recordGrade,
		clearAllData,
		setUseSupabase,
		ensureDataLoaded,
		studentAverageInClass
	};
}

export const gradebookStore = createGradebookStore();
