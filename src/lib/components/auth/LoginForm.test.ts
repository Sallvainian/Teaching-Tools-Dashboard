import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import LoginForm from './LoginForm.svelte';
import { authStore } from '$lib/stores/auth';

// Mock the auth store
vi.mock('$lib/stores/auth', () => ({
  authStore: {
    signIn: vi.fn(),
    resetPassword: vi.fn()
  }
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render login form elements', () => {
    render(LoginForm);
    
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  test('should handle successful login', async () => {
    vi.mocked(authStore.signIn).mockResolvedValue(true);
    
    render(LoginForm);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(authStore.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('should display error on failed login', async () => {
    vi.mocked(authStore.signIn).mockResolvedValue(false);
    
    render(LoginForm);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'wrongpassword' } });
    await fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  test('should validate email format', async () => {
    render(LoginForm);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
    
    expect(authStore.signIn).not.toHaveBeenCalled();
  });

  test('should require all fields', async () => {
    render(LoginForm);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
    });
    
    expect(authStore.signIn).not.toHaveBeenCalled();
  });

  test('should disable submit button while loading', async () => {
    vi.mocked(authStore.signIn).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(true), 100))
    );
    
    render(LoginForm);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    await fireEvent.input(passwordInput, { target: { value: 'password123' } });
    await fireEvent.click(submitButton);
    
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/signing in/i);
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  test('should toggle password visibility', async () => {
    render(LoginForm);
    
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    await fireEvent.click(toggleButton);
    
    expect(passwordInput.type).toBe('text');
    expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');
    
    await fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  test('should show forgot password modal', async () => {
    render(LoginForm);
    
    const forgotPasswordLink = screen.getByText(/forgot password/i);
    await fireEvent.click(forgotPasswordLink);
    
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByText(/enter your email/i)).toBeInTheDocument();
  });

  test('should handle password reset', async () => {
    vi.mocked(authStore.resetPassword).mockResolvedValue(true);
    
    render(LoginForm);
    
    // Open forgot password modal
    const forgotPasswordLink = screen.getByText(/forgot password/i);
    await fireEvent.click(forgotPasswordLink);
    
    // Find the email input in the modal
    const resetEmailInput = screen.getByPlaceholderText(/email address/i);
    const sendButton = screen.getByRole('button', { name: /send reset email/i });
    
    await fireEvent.input(resetEmailInput, { target: { value: 'reset@example.com' } });
    await fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(authStore.resetPassword).toHaveBeenCalledWith('reset@example.com');
      expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument();
    });
  });

  test('should close forgot password modal', async () => {
    render(LoginForm);
    
    // Open modal
    const forgotPasswordLink = screen.getByText(/forgot password/i);
    await fireEvent.click(forgotPasswordLink);
    
    // Close modal
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /reset password/i })).not.toBeInTheDocument();
    });
  });

  test('should link to signup page', () => {
    render(LoginForm);
    
    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toHaveAttribute('href', '/auth/signup');
  });
});