import { writable } from 'svelte/store';

type ConfirmationOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  cancelButtonClass?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

// Default options
const defaultOptions: Partial<ConfirmationOptions> = {
  title: 'Confirm Action',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  confirmButtonClass: 'bg-purple hover:bg-purple/90',
  cancelButtonClass: 'bg-surface hover:bg-surface/80',
  onCancel: () => {}
};

// Create the store
const createConfirmationStore = () => {
  const { subscribe, set, update } = writable<{
    isOpen: boolean;
    options: ConfirmationOptions;
  }>({
    isOpen: false,
    options: {
      message: '',
      onConfirm: () => {},
      ...defaultOptions
    }
  });

  return {
    subscribe,
    
    // Show confirmation dialog
    confirm: (options: ConfirmationOptions) => {
      set({
        isOpen: true,
        options: { ...defaultOptions, ...options }
      });
      
      // Return a promise that resolves when the user confirms or rejects
      return new Promise<boolean>((resolve) => {
        const originalOnConfirm = options.onConfirm;
        const originalOnCancel = options.onCancel || (() => {});
        
        update(state => ({
          ...state,
          options: {
            ...state.options,
            onConfirm: function handleConfirm() {
              originalOnConfirm();
              resolve(true);
            },
            onCancel: function handleCancel() {
              originalOnCancel();
              resolve(false);
            }
          }
        }));
      });
    },
    
    // Close the dialog
    close: () => {
      set({
        isOpen: false,
        options: {
          message: '',
          onConfirm: () => {},
          ...defaultOptions
        }
      });
    }
  };
};

// Export a singleton instance
export const confirmationStore = createConfirmationStore();