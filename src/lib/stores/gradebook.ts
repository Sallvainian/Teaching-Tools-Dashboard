// src/lib/stores/gradebook.ts
import { writable, derived, get } from 'svelte/store';
import { nanoid } from 'nanoid';
import type { Student, Category, Assignment, Grade } from '$lib/types/gradebook';

// Function to load data from localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
	if (typeof window === 'undefined') return defaultValue;

	try {
		const stored = localStorage.getItem(`gradebook_${key}`);
		return stored ? JSON.parse(stored) : defaultValue;
	} catch (e) {
		console.error(`Error loading ${key} from localStorage:`, e);
		return defaultValue;
	}
}

// Function to save data to localStorage
function saveToStorage<T>(key: string, value: T): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(`gradebook_${key}`, JSON.stringify(value));
	} catch (e) {
		console.error(`Error saving ${key} to localStorage:`, e);
	}
}

function createGradebookStore() {
	// Initialize stores with data from localStorage
	const students = writable<Student[]>(loadFromStorage('students', []));
	const categories = writable<Category[]>(loadFromStorage('categories', []));
	const selectedCategoryId = writable<string | null>(loadFromStorage('selectedCategoryId', null));
	const assignments = writable<Assignment[]>(loadFromStorage('assignments', []));
	const grades = writable<Grade[]>(loadFromStorage('grades', []));

	const getGlobalStudents = derived(students, ($s) => $s);
	const getCategories = derived(categories, ($c) => $c);
	const getSelectedCategory = derived([categories, selectedCategoryId], ([$c, $sel]) =>
		$sel ? ($c.find((cat) => cat.id === $sel) ?? null) : null
	);
	const getStudentsInSelectedCategory = derived([students, getSelectedCategory], ([$s, sel]) =>
		sel ? $s.filter((st) => sel.studentIds.includes(st.id)) : []
	);
	const getAssignmentsForSelectedCategory = derived(
		[assignments, selectedCategoryId],
		([$a, $sel]) => ($sel ? $a.filter((asgn) => asgn.categoryId === $sel) : [])
	);

	function studentAverageInCategory(studentId: string, categoryId: string): number {
		const assigns = get(getAssignmentsForSelectedCategory);
		const relevant = assigns.filter((a) => a.categoryId === categoryId);
		if (relevant.length === 0) return 0;

		const currentGrades = get(grades);
		let earned = 0;
		let possible = 0;

		for (const a of relevant) {
			const g = currentGrades.find((gr) => gr.assignmentId === a.id && gr.studentId === studentId);
			if (g) earned += g.points;
			possible += a.maxPoints;
		}

		return possible > 0 ? parseFloat(((earned / possible) * 100).toFixed(1)) : 0;
	}

	function addGlobalStudent(name: string): string | null {
		const trimmed = name.trim();
		if (!trimmed) return null;
		const id = nanoid();
		students.update((arr) => [...arr, { id, name: trimmed }]);
		return id;
	}

	function addCategory(name: string): void {
		const trimmed = name.trim();
		if (!trimmed) return;
		const id = nanoid();
		categories.update((arr) => [...arr, { id, name: trimmed, studentIds: [] }]);
		selectedCategoryId.update((cur) => cur || id);
	}

	function selectCategory(id: string | null): void {
		selectedCategoryId.set(id);
	}

	function assignStudentToCategory(studentId: string, categoryId: string): void {
		categories.update((cats) =>
			cats.map((cat) =>
				cat.id === categoryId && !cat.studentIds.includes(studentId)
					? { ...cat, studentIds: [...cat.studentIds, studentId] }
					: cat
			)
		);
	}

	function removeStudentFromCategory(studentId: string, categoryId: string): void {
		categories.update((cats) =>
			cats.map((cat) =>
				cat.id === categoryId
					? { ...cat, studentIds: cat.studentIds.filter((id) => id !== studentId) }
					: cat
			)
		);
	}

	function addAssignmentToCategory(name: string, maxPoints: number, categoryId: string): void {
		const trimmed = name.trim();
		if (!trimmed || maxPoints <= 0) return;
		const id = nanoid();
		assignments.update((arr) => [...arr, { id, name: trimmed, maxPoints, categoryId }]);
	}

	function recordGrade(studentId: string, assignmentId: string, points: number): void {
		const pts = Math.max(0, points);
		grades.update((arr) => {
			const idx = arr.findIndex(
				(g) => g.studentId === studentId && g.assignmentId === assignmentId
			);
			if (idx > -1) {
				arr[idx].points = Math.min(pts, pts);
				return arr;
			}
			return [...arr, { studentId, assignmentId, points: Math.min(pts, pts) }];
		});
	}

	// Subscribe to store changes to save to localStorage
	students.subscribe(($students) => saveToStorage('students', $students));
	categories.subscribe(($categories) => saveToStorage('categories', $categories));
	selectedCategoryId.subscribe(($id) => saveToStorage('selectedCategoryId', $id));
	assignments.subscribe(($assignments) => saveToStorage('assignments', $assignments));
	grades.subscribe(($grades) => saveToStorage('grades', $grades));

	// Clear all data
	function clearAllData() {
		students.set([]);
		categories.set([]);
		selectedCategoryId.set(null);
		assignments.set([]);
		grades.set([]);

		// Clear localStorage
		if (typeof window !== 'undefined') {
			localStorage.removeItem('gradebook_students');
			localStorage.removeItem('gradebook_categories');
			localStorage.removeItem('gradebook_selectedCategoryId');
			localStorage.removeItem('gradebook_assignments');
			localStorage.removeItem('gradebook_grades');
		}
	}

	return {
		students,
		categories,
		selectedCategoryId,
		assignments,
		grades,
		getGlobalStudents,
		getCategories,
		getSelectedCategory,
		getStudentsInSelectedCategory,
		getAssignmentsForSelectedCategory,
		studentAverageInCategory,
		addGlobalStudent,
		addCategory,
		selectCategory,
		assignStudentToCategory,
		removeStudentFromCategory,
		addAssignmentToCategory,
		recordGrade,
		clearAllData
	};
}

export const gradebookStore = createGradebookStore();
