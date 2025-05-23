import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import StudentRoster from './StudentRoster.svelte';
import { gradebookStore } from '$lib/stores/gradebook';

// Mock the gradebook store
vi.mock('$lib/stores/gradebook', () => ({
  gradebookStore: {
    subscribe: vi.fn(),
    loadStudents: vi.fn(),
    addStudent: vi.fn(),
    updateStudent: vi.fn(),
    deleteStudent: vi.fn()
  }
}));

describe('StudentRoster', () => {
  const mockStudents = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock store subscription
    vi.mocked(gradebookStore.subscribe).mockImplementation((callback) => {
      callback({
        students: mockStudents,
        isLoading: false,
        error: null,
        categories: [],
        assignments: [],
        grades: []
      });
      return () => {}; // unsubscribe function
    });
  });

  test('should render student list', async () => {
    render(StudentRoster);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  test('should show loading state', () => {
    vi.mocked(gradebookStore.subscribe).mockImplementation((callback) => {
      callback({
        students: [],
        isLoading: true,
        error: null,
        categories: [],
        assignments: [],
        grades: []
      });
      return () => {};
    });

    render(StudentRoster);
    
    expect(screen.getByText(/loading students/i)).toBeInTheDocument();
  });

  test('should show error state', () => {
    const errorMessage = 'Failed to load students';
    vi.mocked(gradebookStore.subscribe).mockImplementation((callback) => {
      callback({
        students: [],
        isLoading: false,
        error: errorMessage,
        categories: [],
        assignments: [],
        grades: []
      });
      return () => {};
    });

    render(StudentRoster);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('should open add student modal', async () => {
    render(StudentRoster);
    
    const addButton = screen.getByRole('button', { name: /add student/i });
    await fireEvent.click(addButton);
    
    expect(screen.getByRole('heading', { name: /add new student/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/student name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  test('should add new student', async () => {
    vi.mocked(gradebookStore.addStudent).mockResolvedValue(undefined);
    
    render(StudentRoster);
    
    // Open modal
    const addButton = screen.getByRole('button', { name: /add student/i });
    await fireEvent.click(addButton);
    
    // Fill form
    const nameInput = screen.getByLabelText(/student name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    
    await fireEvent.input(nameInput, { target: { value: 'New Student' } });
    await fireEvent.input(emailInput, { target: { value: 'new@example.com' } });
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /add student/i });
    await fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(gradebookStore.addStudent).toHaveBeenCalledWith({
        name: 'New Student',
        email: 'new@example.com'
      });
    });
  });

  test('should open edit modal for student', async () => {
    render(StudentRoster);
    
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons).toHaveLength(2);
    });
    
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await fireEvent.click(editButtons[0]);
    
    expect(screen.getByRole('heading', { name: /edit student/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });

  test('should update student', async () => {
    vi.mocked(gradebookStore.updateStudent).mockResolvedValue(undefined);
    
    render(StudentRoster);
    
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons).toHaveLength(2);
    });
    
    // Open edit modal
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await fireEvent.click(editButtons[0]);
    
    // Update name
    const nameInput = screen.getByDisplayValue('John Doe');
    await fireEvent.clear(nameInput);
    await fireEvent.input(nameInput, { target: { value: 'John Updated' } });
    
    // Save
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(gradebookStore.updateStudent).toHaveBeenCalledWith('1', {
        name: 'John Updated',
        email: 'john@example.com'
      });
    });
  });

  test('should confirm before deleting student', async () => {
    render(StudentRoster);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(2);
    });
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await fireEvent.click(deleteButtons[0]);
    
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
  });

  test('should delete student after confirmation', async () => {
    vi.mocked(gradebookStore.deleteStudent).mockResolvedValue(undefined);
    
    render(StudentRoster);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(2);
    });
    
    // Click delete
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await fireEvent.click(deleteButtons[0]);
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /yes, delete/i });
    await fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(gradebookStore.deleteStudent).toHaveBeenCalledWith('1');
    });
  });

  test('should cancel delete operation', async () => {
    render(StudentRoster);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(2);
    });
    
    // Click delete
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await fireEvent.click(deleteButtons[0]);
    
    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await fireEvent.click(cancelButton);
    
    // Confirmation dialog should be gone
    await waitFor(() => {
      expect(screen.queryByText(/are you sure you want to delete/i)).not.toBeInTheDocument();
    });
    
    expect(gradebookStore.deleteStudent).not.toHaveBeenCalled();
  });

  test('should show empty state when no students', () => {
    vi.mocked(gradebookStore.subscribe).mockImplementation((callback) => {
      callback({
        students: [],
        isLoading: false,
        error: null,
        categories: [],
        assignments: [],
        grades: []
      });
      return () => {};
    });

    render(StudentRoster);
    
    expect(screen.getByText(/no students added yet/i)).toBeInTheDocument();
    expect(screen.getByText(/click "add student" to get started/i)).toBeInTheDocument();
  });

  test('should validate form inputs', async () => {
    render(StudentRoster);
    
    // Open modal
    const addButton = screen.getByRole('button', { name: /add student/i });
    await fireEvent.click(addButton);
    
    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /add student/i });
    await fireEvent.click(submitButton);
    
    // Should not call addStudent
    expect(gradebookStore.addStudent).not.toHaveBeenCalled();
    
    // Fill only name
    const nameInput = screen.getByLabelText(/student name/i);
    await fireEvent.input(nameInput, { target: { value: 'Test Student' } });
    await fireEvent.click(submitButton);
    
    // Still should not call without email
    expect(gradebookStore.addStudent).not.toHaveBeenCalled();
  });

  test('should close modal on cancel', async () => {
    render(StudentRoster);
    
    // Open modal
    const addButton = screen.getByRole('button', { name: /add student/i });
    await fireEvent.click(addButton);
    
    expect(screen.getByRole('heading', { name: /add new student/i })).toBeInTheDocument();
    
    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /add new student/i })).not.toBeInTheDocument();
    });
  });
});