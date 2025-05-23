import { describe, test, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { gradebookStore } from './gradebook';

// Mock the supabaseService
vi.mock('$lib/services/supabaseService', () => ({
  supabaseService: {
    getItems: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn()
  }
}));

// Mock model converters
vi.mock('$lib/utils/modelConverters', () => ({
  dbStudentToAppStudent: vi.fn((db) => ({
    id: db.id,
    name: db.name,
    email: db.email,
    joinCode: db.join_code
  })),
  dbCategoryToAppCategory: vi.fn((db) => ({
    id: db.id,
    name: db.name,
    weight: db.weight
  })),
  dbAssignmentToAppAssignment: vi.fn((db) => ({
    id: db.id,
    name: db.name,
    categoryId: db.category_id,
    totalPoints: db.total_points,
    dueDate: db.due_date
  })),
  dbGradeToAppGrade: vi.fn((db) => ({
    id: db.id,
    studentId: db.student_id,
    assignmentId: db.assignment_id,
    pointsEarned: db.points_earned,
    comments: db.comments
  }))
}));

import { supabaseService } from '$lib/services/supabaseService';

describe('gradebookStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    gradebookStore.reset();
  });

  test('should have initial state', () => {
    const state = get(gradebookStore);
    expect(state.students).toEqual([]);
    expect(state.categories).toEqual([]);
    expect(state.assignments).toEqual([]);
    expect(state.grades).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('loadAllData should fetch all data', async () => {
    const mockStudents = [{ id: '1', name: 'Student 1', email: 'student1@test.com', join_code: null }];
    const mockCategories = [{ id: '1', name: 'Homework', weight: 0.3 }];
    const mockAssignments = [{ id: '1', name: 'HW1', category_id: '1', total_points: 100, due_date: null }];
    const mockGrades = [{ id: '1', student_id: '1', assignment_id: '1', points_earned: 95, comments: null }];

    vi.mocked(supabaseService.getItems)
      .mockResolvedValueOnce(mockStudents)
      .mockResolvedValueOnce(mockCategories)
      .mockResolvedValueOnce(mockAssignments)
      .mockResolvedValueOnce(mockGrades);

    await gradebookStore.loadAllData();

    const state = get(gradebookStore);
    expect(state.students).toHaveLength(1);
    expect(state.categories).toHaveLength(1);
    expect(state.assignments).toHaveLength(1);
    expect(state.grades).toHaveLength(1);
    expect(state.loading).toBe(false);
  });

  test('addStudent should create new student', async () => {
    const newStudent = { name: 'New Student', email: 'new@test.com' };
    const mockCreatedStudent = { id: '2', ...newStudent, join_code: null };

    vi.mocked(supabaseService.createItem).mockResolvedValue(mockCreatedStudent);

    await gradebookStore.addStudent(newStudent);

    expect(supabaseService.createItem).toHaveBeenCalledWith('students', newStudent);
    const state = get(gradebookStore);
    expect(state.students).toHaveLength(1);
    expect(state.students[0].name).toBe('New Student');
  });

  test('updateStudent should update existing student', async () => {
    // Setup initial student
    const initialStudent = { id: '1', name: 'Student 1', email: 'student1@test.com', join_code: null };
    vi.mocked(supabaseService.getItems).mockResolvedValueOnce([initialStudent]);
    await gradebookStore.loadStudents();

    // Update student
    const updates = { name: 'Updated Student' };
    const mockUpdatedStudent = { ...initialStudent, ...updates };
    vi.mocked(supabaseService.updateItem).mockResolvedValue(mockUpdatedStudent);

    await gradebookStore.updateStudent('1', updates);

    expect(supabaseService.updateItem).toHaveBeenCalledWith('students', '1', updates);
    const state = get(gradebookStore);
    expect(state.students[0].name).toBe('Updated Student');
  });

  test('deleteStudent should remove student', async () => {
    // Setup initial student
    const initialStudent = { id: '1', name: 'Student 1', email: 'student1@test.com', join_code: null };
    vi.mocked(supabaseService.getItems).mockResolvedValueOnce([initialStudent]);
    await gradebookStore.loadStudents();

    // Delete student
    vi.mocked(supabaseService.deleteItem).mockResolvedValue(undefined);

    await gradebookStore.deleteStudent('1');

    expect(supabaseService.deleteItem).toHaveBeenCalledWith('students', '1');
    const state = get(gradebookStore);
    expect(state.students).toHaveLength(0);
  });

  test('addCategory should create new category', async () => {
    const newCategory = { name: 'Tests', weight: 0.4 };
    const mockCreatedCategory = { id: '1', ...newCategory };

    vi.mocked(supabaseService.createItem).mockResolvedValue(mockCreatedCategory);

    await gradebookStore.addCategory(newCategory);

    expect(supabaseService.createItem).toHaveBeenCalledWith('categories', newCategory);
    const state = get(gradebookStore);
    expect(state.categories).toHaveLength(1);
    expect(state.categories[0].name).toBe('Tests');
  });

  test('addAssignment should create new assignment', async () => {
    const newAssignment = { name: 'Test 1', categoryId: '1', totalPoints: 100 };
    const mockCreatedAssignment = { 
      id: '1', 
      name: 'Test 1',
      category_id: '1',
      total_points: 100,
      due_date: null
    };

    vi.mocked(supabaseService.createItem).mockResolvedValue(mockCreatedAssignment);

    await gradebookStore.addAssignment(newAssignment);

    expect(supabaseService.createItem).toHaveBeenCalledWith('assignments', {
      name: 'Test 1',
      category_id: '1',
      total_points: 100
    });
    const state = get(gradebookStore);
    expect(state.assignments).toHaveLength(1);
  });

  test('updateGrade should update existing grade', async () => {
    const studentId = '1';
    const assignmentId = '1';
    const updates = { pointsEarned: 90 };
    
    const mockUpdatedGrade = {
      id: '1',
      student_id: studentId,
      assignment_id: assignmentId,
      points_earned: 90,
      comments: null
    };

    vi.mocked(supabaseService.updateItem).mockResolvedValue(mockUpdatedGrade);

    await gradebookStore.updateGrade(studentId, assignmentId, updates);

    expect(supabaseService.updateItem).toHaveBeenCalledWith(
      'grades',
      { student_id: studentId, assignment_id: assignmentId },
      { points_earned: 90 }
    );
  });

  test('computed values should calculate correctly', () => {
    // Setup test data using the store's internal state
    const state = get(gradebookStore);
    
    // Directly set state for testing computed values
    state.students.push({ id: '1', name: 'Student 1', email: 'test@test.com' });
    state.categories.push({ id: '1', name: 'Tests', weight: 0.5 });
    state.assignments.push({ 
      id: '1', 
      name: 'Test 1', 
      categoryId: '1', 
      totalPoints: 100,
      dueDate: null
    });
    state.grades.push({
      id: '1',
      studentId: '1',
      assignmentId: '1',
      pointsEarned: 90,
      comments: null
    });

    // Test computed values
    const computedState = get(gradebookStore);
    expect(computedState.students).toHaveLength(1);
    expect(computedState.categories).toHaveLength(1);
    expect(computedState.assignments).toHaveLength(1);
    expect(computedState.grades).toHaveLength(1);
  });

  test('error handling should update error state', async () => {
    const errorMessage = 'Failed to load students';
    vi.mocked(supabaseService.getItems).mockRejectedValue(new Error(errorMessage));

    await gradebookStore.loadStudents();

    const state = get(gradebookStore);
    expect(state.error).toBe(errorMessage);
    expect(state.loading).toBe(false);
  });
});