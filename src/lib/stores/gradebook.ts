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

			// Load assignments
			const assignmentsData = await gradebookService.getItems('assignments');

			// Load grades
			const gradesData = await gradebookService.getItems('grades');

			// Transform data to match our store format
			const transformedStudents = studentsData.map(dbStudentToAppStudent);

			const transformedClasses = classesData.map((cls) =>
				dbClassToAppClass(cls, classStudentsData)
			);

			const transformedAssignments = assignmentsData.map(dbAssignmentToAppAssignment);

			const transformedGrades = gradesData.map(dbGradeToAppGrade);

			// Debug logging for data transformation
			console.log('🔧 Gradebook Data Loading Debug:', {
				studentsLoaded: transformedStudents.length,
				classesLoaded: transformedClasses.length,
				classStudentsRelations: classStudentsData.length,
				studentsData: transformedStudents.map((s) => ({ id: s.id, name: s.name })),
				classesWithStudentCounts: transformedClasses.map((c) => ({
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
			// Insert into database or localStorage
			const result = await gradebookService.insertItem('assignments', {
				// Type assertion for Inserts<T>
				name: trimmed,
				max_points: maxPoints,
				category_id: classId // DB column is still category_id but it references classes
			});

			if (!result) throw new Error('Failed to add assignment');

			// Update local store
			const newAssignment = dbAssignmentToAppAssignment(result);
			assignments.update((arr: Assignment[]) => [...arr, newAssignment]);
		} catch (err: unknown) {
			// Error adding assignment: err
			error.set(err instanceof Error ? err.message : 'Failed to add assignment');
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
		selectClass,
		assignStudentToClass,
		removeStudentFromClass,
		addAssignmentToClass,
		recordGrade,
		clearAllData,
		setUseSupabase,
		ensureDataLoaded,
		studentAverageInClass
	};
}

export const gradebookStore = createGradebookStore();
