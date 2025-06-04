import { writable, derived } from 'svelte/store';
import type { FileMetadata } from '$lib/types/files';

// Modal state interfaces
interface FilePreviewModal {
	open: boolean;
	file: FileMetadata | null;
}

interface FileShareModal {
	open: boolean;
	file: FileMetadata | null;
}

interface NewFolderModal {
	open: boolean;
	parentFolderId: string | null;
}

interface ConfirmDeleteModal {
	open: boolean;
	file: FileMetadata | null;
	onConfirm?: () => void;
}

interface ImportWizardModal {
	open: boolean;
	classId: string | null;
}

// View mode types
type FileViewMode = 'grid' | 'list';
type GradebookViewMode = 'standard' | 'color';

// UI State
const modals = writable({
	filePreview: { open: false, file: null } as FilePreviewModal,
	fileShare: { open: false, file: null } as FileShareModal,
	newFolder: { open: false, parentFolderId: null } as NewFolderModal,
	confirmDelete: { open: false, file: null, onConfirm: undefined } as ConfirmDeleteModal,
	importWizard: { open: false, classId: null } as ImportWizardModal
});

const views = writable({
	files: 'grid' as FileViewMode,
	gradebook: 'standard' as GradebookViewMode
});

const searchQueries = writable({
	files: '',
	conversations: '',
	classes: ''
});

const sortSettings = writable({
	files: { by: 'name', direction: 'asc' as 'asc' | 'desc' },
	gradebook: { by: 'name', direction: 'asc' as 'asc' | 'desc' }
});

// Derived stores for easy access
const isAnyModalOpen = derived(modals, ($modals) => 
	Object.values($modals).some(modal => modal.open)
);

const filePreviewModal = derived(modals, ($modals) => $modals.filePreview);
const fileShareModal = derived(modals, ($modals) => $modals.fileShare);
const newFolderModal = derived(modals, ($modals) => $modals.newFolder);
const confirmDeleteModal = derived(modals, ($modals) => $modals.confirmDelete);
const importWizardModal = derived(modals, ($modals) => $modals.importWizard);

// Actions for modals
function openFilePreviewModal(file: FileMetadata): void {
	modals.update(current => ({
		...current,
		filePreview: { open: true, file }
	}));
}

function closeFilePreviewModal(): void {
	modals.update(current => ({
		...current,
		filePreview: { open: false, file: null }
	}));
}

function openFileShareModal(file: FileMetadata): void {
	modals.update(current => ({
		...current,
		fileShare: { open: true, file }
	}));
}

function closeFileShareModal(): void {
	modals.update(current => ({
		...current,
		fileShare: { open: false, file: null }
	}));
}

function openNewFolderModal(parentFolderId: string | null = null): void {
	modals.update(current => ({
		...current,
		newFolder: { open: true, parentFolderId }
	}));
}

function closeNewFolderModal(): void {
	modals.update(current => ({
		...current,
		newFolder: { open: false, parentFolderId: null }
	}));
}

function openConfirmDeleteModal(file: FileMetadata, onConfirm: () => void): void {
	modals.update(current => ({
		...current,
		confirmDelete: { open: true, file, onConfirm }
	}));
}

function closeConfirmDeleteModal(): void {
	modals.update(current => ({
		...current,
		confirmDelete: { open: false, file: null, onConfirm: undefined }
	}));
}

function openImportWizardModal(classId: string | null = null): void {
	modals.update(current => ({
		...current,
		importWizard: { open: true, classId }
	}));
}

function closeImportWizardModal(): void {
	modals.update(current => ({
		...current,
		importWizard: { open: false, classId: null }
	}));
}

// Actions for views
function setFileView(view: FileViewMode): void {
	views.update(current => ({
		...current,
		files: view
	}));
}

function setGradebookView(view: GradebookViewMode): void {
	views.update(current => ({
		...current,
		gradebook: view
	}));
}

// Actions for search
function setFileSearch(query: string): void {
	searchQueries.update(current => ({
		...current,
		files: query
	}));
}

function setConversationSearch(query: string): void {
	searchQueries.update(current => ({
		...current,
		conversations: query
	}));
}

function setClassSearch(query: string): void {
	searchQueries.update(current => ({
		...current,
		classes: query
	}));
}

// Actions for sorting
function setFileSort(by: string, direction: 'asc' | 'desc'): void {
	sortSettings.update(current => ({
		...current,
		files: { by, direction }
	}));
}

function toggleFileSortDirection(): void {
	sortSettings.update(current => ({
		...current,
		files: {
			...current.files,
			direction: current.files.direction === 'asc' ? 'desc' : 'asc'
		}
	}));
}

// Utility function to close all modals
function closeAllModals(): void {
	modals.update(_current => ({
		filePreview: { open: false, file: null },
		fileShare: { open: false, file: null },
		newFolder: { open: false, parentFolderId: null },
		confirmDelete: { open: false, file: null, onConfirm: undefined },
		importWizard: { open: false, classId: null }
	}));
}

// Export the UI store
export const uiStore = {
	// State subscriptions
	modals: { subscribe: modals.subscribe },
	views: { subscribe: views.subscribe },
	searchQueries: { subscribe: searchQueries.subscribe },
	sortSettings: { subscribe: sortSettings.subscribe },
	
	// Derived stores
	isAnyModalOpen: { subscribe: isAnyModalOpen.subscribe },
	filePreviewModal: { subscribe: filePreviewModal.subscribe },
	fileShareModal: { subscribe: fileShareModal.subscribe },
	newFolderModal: { subscribe: newFolderModal.subscribe },
	confirmDeleteModal: { subscribe: confirmDeleteModal.subscribe },
	importWizardModal: { subscribe: importWizardModal.subscribe },
	
	// Modal actions
	openFilePreviewModal,
	closeFilePreviewModal,
	openFileShareModal,
	closeFileShareModal,
	openNewFolderModal,
	closeNewFolderModal,
	openConfirmDeleteModal,
	closeConfirmDeleteModal,
	openImportWizardModal,
	closeImportWizardModal,
	closeAllModals,
	
	// View actions
	setFileView,
	setGradebookView,
	
	// Search actions
	setFileSearch,
	setConversationSearch,
	setClassSearch,
	
	// Sort actions
	setFileSort,
	toggleFileSortDirection
};