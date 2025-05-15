// src/lib/stores/gradebook.ts
import { writable, derived, get } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import type { Student, Category, Assignment, Grade } from '$lib/types/gradebook';
import { supabase } from '$lib/supabaseClient';
import type { Tables } from '../../supabase';

// Function to load data from localStorage as fallback
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

// Function to save data to localStorage as fallback
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(`gradebook_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

// Convert a database model to an application model
function dbStudentToAppStudent(dbStudent: Tables<'students'>): Student {
  return {
    id: dbStudent.id,
    name: dbStudent.name
  };
}

function dbCategoryToAppCategory(
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

function dbAssignmentToAppAssignment(dbAssignment: Tables<'assignments'>): Assignment {
  return {
    id: dbAssignment.id,
    name: dbAssignment.name,
    maxPoints: dbAssignment.max_points,
    categoryId: dbAssignment.category_id
  };
}

function dbGradeToAppGrade(dbGrade: Tables<'grades'>): Grade {
  return {
    studentId: dbGrade.student_id,
    assignmentId: dbGrade.assignment_id,
    points: dbGrade.points
  };
}

function createGradebookStore() {
  // Initialize stores with data from localStorage as temporary fallback
  const students = writable<Student[]>(loadFromStorage('students', []));
  const categories = writable<Category[]>(loadFromStorage('categories', []));
  const selectedCategoryId = writable<string | null>(loadFromStorage('selectedCategoryId', null));
  const assignments = writable<Assignment[]>(loadFromStorage('assignments', []));
  const grades = writable<Grade[]>(loadFromStorage('grades', []));
  const isLoading = writable(false);
  const error = writable<string | null>(null);
  const useSupabase = writable(true); // Toggle between Supabase and localStorage

  // Derived stores
  const getGlobalStudents = derived(students, ($s: Student[]) => $s);
  const getCategories = derived(categories, ($c: Category[]) => $c);
  const getSelectedCategory = derived([categories, selectedCategoryId], ([$c, $sel]: [Category[], string | null]) =>
    $sel ? ($c.find((cat: Category) => cat.id === $sel) ?? null) : null
  );
  const getStudentsInSelectedCategory = derived([students, getSelectedCategory], ([$s, sel]: [Student[], Category | null]) =>
    sel ? $s.filter((st: Student) => sel.studentIds.includes(st.id)) : []
  );
  const getAssignmentsForSelectedCategory = derived(
    [assignments, selectedCategoryId],
    ([$a, $sel]: [Assignment[], string | null]) => ($sel ? $a.filter((asgn: Assignment) => asgn.categoryId === $sel) : [])
  );

  // Load all data from Supabase
  async function loadAllData() {
    isLoading.set(true);
    error.set(null);
    
    try {
      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*');
      
      if (studentsError) throw studentsError;
      
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');
      
      if (categoriesError) throw categoriesError;
      
      // Load category_students relations
      const { data: categoryStudentsData, error: categoryStudentsError } = await supabase
        .from('category_students')
        .select('*');
      
      if (categoryStudentsError) throw categoryStudentsError;
      
      // Load assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*');
      
      if (assignmentsError) throw assignmentsError;
      
      // Load grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*');
      
      if (gradesError) throw gradesError;

      // Transform data to match our store format
      const transformedStudents = studentsData.map(dbStudentToAppStudent);
      
      const transformedCategories = categoriesData.map((cat: Tables<'categories'>) =>
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
      }
      
      // Store in localStorage as fallback
      saveToStorage('students', transformedStudents);
      saveToStorage('categories', transformedCategories);
      saveToStorage('assignments', transformedAssignments);
      saveToStorage('grades', transformedGrades);
      saveToStorage('selectedCategoryId', get(selectedCategoryId));
      
    } catch (err: any) {
      console.error('Error loading data from Supabase:', err);
      error.set(err.message || 'Failed to load data');
      
      // Fallback to localStorage if available
      students.set(loadFromStorage('students', []));
      categories.set(loadFromStorage('categories', []));
      selectedCategoryId.set(loadFromStorage('selectedCategoryId', null));
      assignments.set(loadFromStorage('assignments', []));
      grades.set(loadFromStorage('grades', []));
    } finally {
      isLoading.set(false);
    }
  }

  // Student management
  async function addGlobalStudent(name: string): Promise<string | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    
    if (get(useSupabase)) {
      try {
        const { data, error: insertError } = await supabase
          .from('students')
          .insert({ name: trimmed })
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        // Update local store
        const newStudent = dbStudentToAppStudent(data);
        students.update((arr: Student[]) => [...arr, newStudent]);
        
        // Also update localStorage as fallback
        saveToStorage('students', get(students));
        
        return newStudent.id;
      } catch (err: any) {
        console.error('Error adding student:', err);
        error.set(err.message || 'Failed to add student');
        
        // Fallback to local-only if Supabase fails
        const id = uuidv4();
        const newStudent: Student = { id, name: trimmed };
        students.update((arr: Student[]) => [...arr, newStudent]);
        saveToStorage('students', get(students));
        return id;
      }
    } else {
      // Local storage only mode
      const id = uuidv4();
      const newStudent: Student = { id, name: trimmed };
      students.update((arr: Student[]) => [...arr, newStudent]);
      saveToStorage('students', get(students));
      return id;
    }
  }

  // Category management
  async function addCategory(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    
    if (get(useSupabase)) {
      try {
        const { data, error: insertError } = await supabase
          .from('categories')
          .insert({ name: trimmed })
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        // Update local store
        const newCategory: Category = {
          id: data.id,
          name: data.name,
          studentIds: []
        };

        categories.update((arr: Category[]) => [...arr, newCategory]);
        selectedCategoryId.update((cur: string | null) => cur || data.id);
        
        // Also update localStorage as fallback
        saveToStorage('categories', get(categories));
        saveToStorage('selectedCategoryId', get(selectedCategoryId));
      } catch (err: any) {
        console.error('Error adding category:', err);
        error.set(err.message || 'Failed to add category');
        
        // Fallback to local-only if Supabase fails
        const id = uuidv4();
        const newCategory: Category = { id, name: trimmed, studentIds: [] };
        categories.update((arr: Category[]) => [...arr, newCategory]);
        selectedCategoryId.update((cur: string | null) => cur || id);
        saveToStorage('categories', get(categories));
        saveToStorage('selectedCategoryId', get(selectedCategoryId));
      }
    } else {
      // Local storage only mode
      const id = uuidv4();
      const newCategory: Category = { id, name: trimmed, studentIds: [] };
      categories.update((arr: Category[]) => [...arr, newCategory]);
      selectedCategoryId.update((cur: string | null) => cur || id);
      saveToStorage('categories', get(categories));
      saveToStorage('selectedCategoryId', get(selectedCategoryId));
    }
  }

  function selectCategory(id: string | null): void {
    selectedCategoryId.set(id);
    saveToStorage('selectedCategoryId', id);
  }

  // Student assignment to category
  async function assignStudentToCategory(studentId: string, categoryId: string): Promise<void> {
    if (get(useSupabase)) {
      try {
        // Insert relationship into Supabase
        const { error: insertError } = await supabase
          .from('category_students')
          .insert({
            category_id: categoryId,
            student_id: studentId
          } as Tables<'category_students'>);
        
        if (insertError) throw insertError;
        
        // Update local store
        categories.update((cats: Category[]) =>
          cats.map((cat: Category) =>
            cat.id === categoryId && !cat.studentIds.includes(studentId)
              ? { ...cat, studentIds: [...cat.studentIds, studentId] }
              : cat
          )
        );
        
        // Also update localStorage as fallback
        saveToStorage('categories', get(categories));
      } catch (err: any) {
        console.error('Error assigning student to category:', err);
        error.set(err.message || 'Failed to assign student');
        
        // Fallback to local-only if Supabase fails
        categories.update((cats: Category[]) =>
          cats.map((cat: Category) =>
            cat.id === categoryId && !cat.studentIds.includes(studentId)
              ? { ...cat, studentIds: [...cat.studentIds, studentId] }
              : cat
          )
        );
        saveToStorage('categories', get(categories));
      }
    } else {
      // Local storage only mode
      categories.update((cats: Category[]) =>
        cats.map((cat: Category) =>
          cat.id === categoryId && !cat.studentIds.includes(studentId)
            ? { ...cat, studentIds: [...cat.studentIds, studentId] }
            : cat
        )
      );
      saveToStorage('categories', get(categories));
    }
  }

  async function removeStudentFromCategory(studentId: string, categoryId: string): Promise<void> {
    if (get(useSupabase)) {
      try {
        // Remove relationship from Supabase
        const { error: deleteError } = await supabase
          .from('category_students')
          .delete()
          .match({
            category_id: categoryId,
            student_id: studentId
          });
        
        if (deleteError) throw deleteError;
        
        // Update local store
        categories.update((cats: Category[]) =>
          cats.map((cat: Category) =>
            cat.id === categoryId
              ? { ...cat, studentIds: cat.studentIds.filter((id: string) => id !== studentId) }
              : cat
          )
        );
        
        // Also update localStorage as fallback
        saveToStorage('categories', get(categories));
      } catch (err: any) {
        console.error('Error removing student from category:', err);
        error.set(err.message || 'Failed to remove student');
        
        // Fallback to local-only if Supabase fails
        categories.update((cats: Category[]) =>
          cats.map((cat: Category) =>
            cat.id === categoryId
              ? { ...cat, studentIds: cat.studentIds.filter((id: string) => id !== studentId) }
              : cat
          )
        );
        saveToStorage('categories', get(categories));
      }
    } else {
      // Local storage only mode
      categories.update((cats: Category[]) =>
        cats.map((cat: Category) =>
          cat.id === categoryId
            ? { ...cat, studentIds: cat.studentIds.filter((id: string) => id !== studentId) }
            : cat
        )
      );
      saveToStorage('categories', get(categories));
    }
  }

  // Assignment management
  async function addAssignmentToCategory(name: string, maxPoints: number, categoryId: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed || maxPoints <= 0) return;
    
    if (get(useSupabase)) {
      try {
        // Insert into Supabase
        const { data, error: insertError } = await supabase
          .from('assignments')
          .insert({
            name: trimmed,
            max_points: maxPoints,
            category_id: categoryId
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        // Update local store
        const newAssignment = dbAssignmentToAppAssignment(data);
        assignments.update((arr: Assignment[]) => [...arr, newAssignment]);
        
        // Also update localStorage as fallback
        saveToStorage('assignments', get(assignments));
      } catch (err: any) {
        console.error('Error adding assignment:', err);
        error.set(err.message || 'Failed to add assignment');
        
        // Fallback to local-only if Supabase fails
        const id = uuidv4();
        const newAssignment: Assignment = { id, name: trimmed, maxPoints, categoryId };
        assignments.update((arr: Assignment[]) => [...arr, newAssignment]);
        saveToStorage('assignments', get(assignments));
      }
    } else {
      // Local storage only mode
      const id = uuidv4();
      const newAssignment: Assignment = { id, name: trimmed, maxPoints, categoryId };
      assignments.update((arr: Assignment[]) => [...arr, newAssignment]);
      saveToStorage('assignments', get(assignments));
    }
  }

  // Grade recording
  async function recordGrade(studentId: string, assignmentId: string, points: number): Promise<void> {
    const pts = Math.max(0, points);
    
    if (get(useSupabase)) {
      try {
        // Check if grade already exists
        const { data: existingGrade } = await supabase
          .from('grades')
          .select('*')
          .match({ student_id: studentId, assignment_id: assignmentId })
          .maybeSingle();
        
        if (existingGrade) {
          // Update existing grade
          const { error: updateError } = await supabase
            .from('grades')
            .update({ points: pts })
            .match({ id: existingGrade.id });
          
          if (updateError) throw updateError;
        } else {
          // Insert new grade
          const { error: insertError } = await supabase
            .from('grades')
            .insert({
              student_id: studentId,
              assignment_id: assignmentId,
              points: pts
            });
          
          if (insertError) throw insertError;
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
        
        // Also update localStorage as fallback
        saveToStorage('grades', get(grades));
      } catch (err: any) {
        console.error('Error recording grade:', err);
        error.set(err.message || 'Failed to record grade');
        
        // Fallback to local-only if Supabase fails
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
        saveToStorage('grades', get(grades));
      }
    } else {
      // Local storage only mode
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
      saveToStorage('grades', get(grades));
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
      const g = currentGrades.find((gr: Grade) => gr.assignmentId === a.id && gr.studentId === studentId);
      if (g) earned += g.points;
      possible += a.maxPoints;
    }

    return possible > 0 ? parseFloat(((earned / possible) * 100).toFixed(1)) : 0;
  }

  // Clear all data
  async function clearAllData(): Promise<void> {
    if (get(useSupabase)) {
      try {
        // Delete in reverse order to respect foreign key constraints
        await supabase.from('grades').delete().neq('id', 'none');
        await supabase.from('category_students').delete().neq('category_id', 'none');
        await supabase.from('assignments').delete().neq('id', 'none');
        await supabase.from('categories').delete().neq('id', 'none');
        await supabase.from('students').delete().neq('id', 'none');
        
        // Clear local stores
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
      } catch (err: any) {
        console.error('Error clearing data:', err);
        error.set(err.message || 'Failed to clear data');
      }
    } else {
      // Local storage only mode - just clear localStorage
      students.set([]);
      categories.set([]);
      selectedCategoryId.set(null);
      assignments.set([]);
      grades.set([]);

      if (typeof window !== 'undefined') {
        localStorage.removeItem('gradebook_students');
        localStorage.removeItem('gradebook_categories');
        localStorage.removeItem('gradebook_selectedCategoryId');
        localStorage.removeItem('gradebook_assignments');
        localStorage.removeItem('gradebook_grades');
      }
    }
  }

  // Toggle storage mode
  function setUseSupabase(value: boolean): void {
    useSupabase.set(value);
    if (value) {
      // If enabling Supabase, load data from it
      void loadAllData();
    }
  }

  // Load initial data based on storage mode
  if (get(useSupabase)) {
    void loadAllData();
  }

  return {
    students,
    categories,
    selectedCategoryId,
    assignments,
    grades,
    isLoading,
    error,
    useSupabase,
    getGlobalStudents,
    getCategories,
    getSelectedCategory,
    getStudentsInSelectedCategory,
    getAssignmentsForSelectedCategory,
    studentAverageInCategory,
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
  };
}

export const gradebookStore = createGradebookStore();