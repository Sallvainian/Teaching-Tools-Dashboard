// src/lib/stores/gradebook.ts
import { writable, derived, get } from 'svelte/store';
import type { Student, Category, Assignment, Grade } from '$lib/types/gradebook';
import { gradebookService } from '$lib/services/supabaseService';
import {
	dbStudentToAppStudent,
	dbCategoryToAppCategory,
	dbAssignmentToAppAssignment,
	dbGradeToAppGrade
} from '$lib/utils/modelConverters';

function createGradebookStore() {
	// Initialize stores with empty data or data from localStorage
	const students = writable<Student[]>([]);
	const categories = writable<Category[]>([]);
	const selectedCategoryId = writable<string | null>(
		gradebookService.loadFromStorage('selectedCategoryId', null)
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
			categories,
			selectedCategoryId,
			assignments,
			grades,
			isLoading,
			error,
			useSupabase,
			dataLoaded
		],
		([
			$students,
			$categories,
			$selectedCategoryId,
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
				categories: $categories,
				selectedCategoryId: $selectedCategoryId,
				assignments: $assignments,
				grades: $grades,
				isLoading: $isLoading,
				error: $error,
				useSupabase: $useSupabase,
				dataLoaded: $dataLoaded,

				// Computed values
				getGlobalStudents: $students,
				getCategories: $categories,
				getSelectedCategory: $selectedCategoryId
					? $categories.find((cat) => cat.id === $selectedCategoryId) || null
					: null,
				getStudentsInSelectedCategory: $selectedCategoryId
					? $students.filter((st) => {
							const cat = $categories.find((c) => c.id === $selectedCategoryId);
							return cat ? cat.studentIds.includes(st.id) : false;
						})
					: [],
				getAssignmentsForSelectedCategory: $selectedCategoryId
					? $assignments.filter((asgn) => asgn.categoryId === $selectedCategoryId)
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

			// Load categories
			const categoriesData = await gradebookService.getItems('categories');

			// Load category_students relations
			const categoryStudentsData = await gradebookService.getItems('category_students');

			// Load assignments
			const assignmentsData = await gradebookService.getItems('assignments');

			// Load grades
			const gradesData = await gradebookService.getItems('grades');

			// Transform data to match our store format
			const transformedStudents = studentsData.map(dbStudentToAppStudent);

			const transformedCategories = categoriesData.map((cat) =>
				dbCategoryToAppCategory(cat, categoryStudentsData)
			);

			const transformedAssignments = assignmentsData.map(dbAssignmentToAppAssignment);

			const transformedGrades = gradesData.map(dbGradeToAppGrade);

			// Update stores
			students.set(transformedStudents);
			categories.set(transformedCategories);
			assignments.set(transformedAssignments);
			grades.set(transformedGrades);

			// Select first category if none selected
			if (categoriesData.length > 0 && get(selectedCategoryId) === null) {
				selectedCategoryId.set(categoriesData[0].id);
				gradebookService.saveToStorage('selectedCategoryId', categoriesData[0].id);
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
	async function addGlobalStudent(name: string): Promise<string | null> {
		const trimmed = name.trim();
		if (!trimmed) return null;

		try {
			// Insert into database or localStorage
			const result = await gradebookService.insertItem('students', {
				name: trimmed
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

	// Category management
	async function addCategory(name: string, userId?: string): Promise<void> {
		const trimmed = name.trim();
		if (!trimmed) return;

		try {
			// Insert into database or localStorage
			const result = await gradebookService.insertItem('categories', {
				name: trimmed,
				user_id: userId, // Include user_id if provided
				class_id: '0c741791-d46d-4c19-978c-e0fcf4322283' // Use default class ID
			});

			if (!result) throw new Error('Failed to add category');

			// Update local store
			const newCategory: Category = {
				id: result.id,
				name: result.name,
				studentIds: []
			};

			categories.update((arr: Category[]) => [...arr, newCategory]);
			selectedCategoryId.update((cur: string | null) => cur ?? result.id);

			// Save selected category ID
			gradebookService.saveToStorage('selectedCategoryId', get(selectedCategoryId));
		} catch (err: unknown) {
			// Error adding category: err
			error.set(err instanceof Error ? err.message : 'Failed to add category');
		}
	}

	function selectCategory(id: string | null): void {
		selectedCategoryId.set(id);
		gradebookService.saveToStorage('selectedCategoryId', id);
	}

	// Student assignment to category
	async function assignStudentToCategory(studentId: string, categoryId: string): Promise<void> {
		try {
			// Insert relationship into database or localStorage
			await gradebookService.insertItem('category_students', {
				category_id: categoryId,
				student_id: studentId
			});

			// Update local store
			categories.update((cats: Category[]) =>
				cats.map((cat: Category) =>
					cat.id === categoryId && !cat.studentIds.includes(studentId)
						? { ...cat, studentIds: [...cat.studentIds, studentId] }
						: cat
				)
			);
		} catch (err: unknown) {
			// Error assigning student to category: err
			error.set(err instanceof Error ? err.message : 'Failed to assign student');
		}
	}

	function removeStudentFromCategoryHelper(
		cat: Category,
		categoryId: string,
		studentId: string
	): Category {
		if (cat.id !== categoryId) return cat;
		return { ...cat, studentIds: cat.studentIds.filter((id: string) => id !== studentId) };
	}

	async function removeStudentFromCategory(studentId: string, categoryId: string): Promise<void> {
		try {
			// Get the specific category_students entry
			const categoryStudents = await gradebookService.getItems('category_students', {
				filters: {
					category_id: categoryId,
					student_id: studentId
				}
			});

			if (categoryStudents.length > 0) {
				// For tables that use composite keys instead of an 'id' field
				await gradebookService.deleteItem('category_students', {
					category_id: categoryId,
					student_id: studentId
				});
			}

			// Update local store
			categories.update((cats: Category[]) =>
				cats.map((cat: Category) => removeStudentFromCategoryHelper(cat, categoryId, studentId))
			);
		} catch (err: unknown) {
			// Error removing student from category: err
			error.set(err instanceof Error ? err.message : 'Failed to remove student');
		}
	}

	// Assignment management
	async function addAssignmentToCategory(
		name: string,
		maxPoints: number,
		categoryId: string
	): Promise<void> {
		const trimmed = name.trim();
		if (!trimmed || maxPoints <= 0) return;

		try {
			// Insert into database or localStorage
			const result = await gradebookService.insertItem('assignments', {
				// Type assertion for Inserts<T>
				name: trimmed,
				max_points: maxPoints,
				category_id: categoryId
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
	function studentAverageInCategory(studentId: string, categoryId: string): number {
		const assigns = get(assignments).filter((a: Assignment) => a.categoryId === categoryId);
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
			const tablesWithId = ['grades', 'assignments', 'categories', 'students'] as const;

			for (const table of tablesWithId) {
				const items = await gradebookService.getItems(table);
				for (const item of items) {
					await gradebookService.deleteItem(table, item.id);
				}
			}

			// Handle category_students with composite key
			const categoryStudents = await gradebookService.getItems('category_students');
			for (const item of categoryStudents) {
				// Pass composite key as an object
				await gradebookService.deleteItem('category_students', {
					category_id: item.category_id,
					student_id: item.student_id
				});
			}

			// Clear local stores
			students.set([]);
			categories.set([]);
			selectedCategoryId.set(null);
			assignments.set([]);
			grades.set([]);

			// Clear localStorage
			gradebookService.removeFromStorage('selectedCategoryId');
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
			const { data: authData } = await supabase.auth.getSession();
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
		addCategory,
		selectCategory,
		assignStudentToCategory,
		removeStudentFromCategory,
		addAssignmentToCategory,
		recordGrade,
		clearAllData,
		setUseSupabase,
		ensureDataLoaded,
		studentAverageInCategory
	};
}

export const gradebookStore = createGradebookStore();
