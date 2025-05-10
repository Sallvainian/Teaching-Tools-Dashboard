// src/lib/stores/gradebook-supabase.ts
import { writable, derived, get } from 'svelte/store';
import type { Student, Category, Assignment, Grade } from '$lib/types/gradebook';
import * as db from '$lib/services/database';

function createGradebookStore() {
  // Create the stores
  const students = writable<Student[]>([]);
  const categories = writable<Category[]>([]);
  const selectedCategoryId = writable<string | null>(null);
  const assignments = writable<Assignment[]>([]);
  const grades = writable<Grade[]>([]);
  const isLoading = writable(true);
  const error = writable<string | null>(null);

  // Derived stores
  const getGlobalStudents = derived(students, ($s) => $s);
  const getCategories = derived(categories, ($c) => $c);
  
  const getSelectedCategory = derived([categories, selectedCategoryId], ([$c, $sel]) =>
    $sel ? ($c.find((cat) => cat.id === $sel) ?? null) : null
  );
  
  const getStudentsInSelectedCategory = derived([students, getSelectedCategory], ([$s, sel]) =>
    sel ? $s.filter((st) => sel.studentIds?.includes(st.id)) : []
  );
  
  const getAssignmentsForSelectedCategory = derived(
    [assignments, selectedCategoryId],
    ([$a, $sel]) => ($sel ? $a.filter((asgn) => asgn.categoryId === $sel) : [])
  );

  // Initialize by loading data from database
  async function initialize() {
    // Skip if we're on the server (no window object)
    if (typeof window === 'undefined') {
      return;
    }

    isLoading.set(true);
    error.set(null);

    try {
      // Load students
      const dbStudents = await db.fetchStudents();
      if (Array.isArray(dbStudents)) {
        students.set(dbStudents.map(s => ({
          id: s.id,
          name: s.name
        })));
      }

      // Load categories
      const dbCategories = await db.fetchCategories();

      if (Array.isArray(dbCategories)) {
        // For each category, load students enrolled in it
        const categoriesWithStudents = await Promise.all(
          dbCategories.map(async (cat) => {
            const studentsInCategory = await db.getStudentsInCategory(cat.id) || [];
            return {
              id: cat.id,
              name: cat.name,
              studentIds: Array.isArray(studentsInCategory)
                ? studentsInCategory.map(s => s.id)
                : []
            };
          })
        );

        categories.set(categoriesWithStudents);
      }

      // Load assignments
      const dbAssignments = await db.fetchAssignments();
      if (Array.isArray(dbAssignments)) {
        assignments.set(dbAssignments.map(a => ({
          id: a.id,
          name: a.name,
          maxPoints: a.total_points,
          categoryId: a.category_id
        })));
      }

      // Load grades
      const dbGrades = await db.fetchGrades();
      if (Array.isArray(dbGrades)) {
        grades.set(dbGrades.map(g => ({
          studentId: g.student_id,
          assignmentId: g.assignment_id,
          points: g.score
        })));
      }

      // If there's a selected category stored, load it
      try {
        const storedCategoryId = localStorage.getItem('gradebook_selectedCategoryId');
        if (storedCategoryId) {
          selectedCategoryId.set(JSON.parse(storedCategoryId));
        }
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }

    } catch (err) {
      console.error("Error initializing gradebook store:", err);
      error.set("Failed to load gradebook data");
    } finally {
      isLoading.set(false);
    }
  }

  // Calculate student average in a category
  function studentAverageInCategory(studentId: string, categoryId: string): number {
    const assigns = get(assignments).filter(a => a.categoryId === categoryId);
    if (assigns.length === 0) return 0;

    const currentGrades = get(grades);
    let earned = 0;
    let possible = 0;

    for (const a of assigns) {
      const g = currentGrades.find((gr) => gr.assignmentId === a.id && gr.studentId === studentId);
      if (g) earned += g.points;
      possible += a.maxPoints;
    }

    return possible > 0 ? parseFloat(((earned / possible) * 100).toFixed(1)) : 0;
  }

  // CRUD operations with database syncing
  async function addGlobalStudent(name: string): Promise<string | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    
    try {
      const newStudent = await db.addStudent(trimmed);
      
      if (newStudent) {
        students.update(s => [...s, { id: newStudent.id, name: newStudent.name }]);
        return newStudent.id;
      }
      
      return null;
    } catch (err) {
      console.error("Error adding student:", err);
      error.set("Failed to add student");
      return null;
    }
  }

  async function addCategory(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    
    try {
      const newCategory = await db.addCategory(trimmed);
      
      if (newCategory) {
        categories.update(c => [...c, { 
          id: newCategory.id, 
          name: newCategory.name, 
          studentIds: [] 
        }]);
        
        // Auto-select if no category is selected
        selectedCategoryId.update(cur => cur || newCategory.id);
      }
    } catch (err) {
      console.error("Error adding category:", err);
      error.set("Failed to add category");
    }
  }

  function selectCategory(id: string | null): void {
    selectedCategoryId.set(id);
    
    // Save selection to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('gradebook_selectedCategoryId', JSON.stringify(id));
    }
  }

  async function assignStudentToCategory(studentId: string, categoryId: string): Promise<void> {
    try {
      // Add to database
      await db.enrollStudentInCategory(studentId, categoryId);
      
      // Update local store
      categories.update(cats =>
        cats.map(cat =>
          cat.id === categoryId && !cat.studentIds.includes(studentId)
            ? { ...cat, studentIds: [...cat.studentIds, studentId] }
            : cat
        )
      );
    } catch (err) {
      console.error("Error enrolling student:", err);
      error.set("Failed to enroll student");
    }
  }

  async function removeStudentFromCategory(studentId: string, categoryId: string): Promise<void> {
    try {
      // Remove from database
      await db.unenrollStudentFromCategory(studentId, categoryId);
      
      // Update local store
      categories.update(cats =>
        cats.map(cat =>
          cat.id === categoryId
            ? { ...cat, studentIds: cat.studentIds.filter(id => id !== studentId) }
            : cat
        )
      );
    } catch (err) {
      console.error("Error removing student from category:", err);
      error.set("Failed to remove student from category");
    }
  }

  async function addAssignmentToCategory(name: string, maxPoints: number, categoryId: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed || maxPoints <= 0) return;
    
    try {
      const newAssignment = await db.addAssignment(trimmed, categoryId, maxPoints);
      
      if (newAssignment) {
        assignments.update(a => [...a, { 
          id: newAssignment.id, 
          name: newAssignment.name, 
          maxPoints: newAssignment.total_points,
          categoryId: newAssignment.category_id
        }]);
      }
    } catch (err) {
      console.error("Error adding assignment:", err);
      error.set("Failed to add assignment");
    }
  }

  async function recordGrade(studentId: string, assignmentId: string, points: number): Promise<void> {
    const pts = Math.max(0, points);
    
    try {
      await db.addOrUpdateGrade(studentId, assignmentId, pts);
      
      // Update local store
      grades.update(arr => {
        const idx = arr.findIndex(g => g.studentId === studentId && g.assignmentId === assignmentId);
        if (idx > -1) {
          arr[idx].points = pts;
          return [...arr]; // Create a new array reference for reactivity
        }
        return [...arr, { studentId, assignmentId, points: pts }];
      });
    } catch (err) {
      console.error("Error recording grade:", err);
      error.set("Failed to record grade");
    }
  }

  // Clear all data
  async function clearAllData() {
    isLoading.set(true);
    error.set(null);
    
    try {
      // This would be a dangerous operation in production
      // For now, we'll just clear the UI state
      students.set([]);
      categories.set([]);
      selectedCategoryId.set(null);
      assignments.set([]);
      grades.set([]);
      
      localStorage.removeItem('gradebook_selectedCategoryId');
    } catch (err) {
      console.error("Error clearing data:", err);
      error.set("Failed to clear data");
    } finally {
      isLoading.set(false);
    }
  }

  // Call initialize when the store is created
  initialize();

  return {
    students,
    categories,
    selectedCategoryId,
    assignments,
    grades,
    isLoading,
    error,
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
    clearAllData,
    initialize
  };
}

export const gradebookStore = createGradebookStore();