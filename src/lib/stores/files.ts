import { writable, derived, get } from 'svelte/store';
import type { 
  FileFolder, 
  FileFolderWithChildren, 
  FileMetadataWithFolder,
  UserFileStats,
  FileUploadProgress 
} from '$lib/types/files';
import { fileService } from '$lib/services/fileService';

// Store state interface
interface FileStoreState {
  folders: FileFolder[];
  files: FileMetadataWithFolder[];
  currentFolderId: string | null;
  uploadProgress: FileUploadProgress[];
  userStats: UserFileStats | null;
  isLoading: boolean;
  error: string | null;
  dataLoaded: boolean;
}

// Initial state
const initialState: FileStoreState = {
  folders: [],
  files: [],
  currentFolderId: null,
  uploadProgress: [],
  userStats: null,
  isLoading: false,
  error: null,
  dataLoaded: false
};

// Create the main store
const fileStore = writable<FileStoreState>(initialState);

// Helper function to update store
function updateStore(updater: (state: FileStoreState) => FileStoreState) {
  fileStore.update(updater);
}

// Helper function to set loading state
function setLoading(loading: boolean) {
  updateStore(state => ({ ...state, isLoading: loading }));
}

// Helper function to set error
function setError(error: string | null) {
  updateStore(state => ({ ...state, error }));
}

// Derived stores for computed values
export const folders = derived(fileStore, $store => $store.folders);
export const files = derived(fileStore, $store => $store.files);
export const currentFolderId = derived(fileStore, $store => $store.currentFolderId);
export const uploadProgress = derived(fileStore, $store => $store.uploadProgress);
export const userStats = derived(fileStore, $store => $store.userStats);
export const isLoading = derived(fileStore, $store => $store.isLoading);
export const error = derived(fileStore, $store => $store.error);

// Derived store for folder tree
export const folderTree = derived(fileStore, $store => {
  return buildFolderTree($store.folders);
});

// Derived store for current folder files
export const currentFolderFiles = derived(
  [fileStore], 
  ([$store]) => {
    if ($store.currentFolderId === null) {
      // Root level files (no folder)
      return $store.files.filter(file => !file.folder_id);
    } else {
      return $store.files.filter(file => file.folder_id === $store.currentFolderId);
    }
  }
);

// Derived store for file statistics
export const fileStats = derived(fileStore, $store => {
  const totalFiles = $store.files.length;
  const totalSize = $store.files.reduce((sum, file) => sum + file.size, 0);
  const folderCount = $store.folders.length;
  
  return {
    totalFiles,
    totalSize,
    folderCount,
    formattedSize: formatFileSize(totalSize)
  };
});

// Helper function to build folder tree
function buildFolderTree(folders: FileFolder[]): FileFolderWithChildren[] {
  const folderMap = new Map<string, FileFolderWithChildren>();
  const rootFolders: FileFolderWithChildren[] = [];

  // Create folder map
  folders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] });
  });

  // Build tree structure
  folders.forEach(folder => {
    const folderWithChildren = folderMap.get(folder.id)!;
    
    if (folder.parent_id) {
      const parent = folderMap.get(folder.parent_id);
      if (parent) {
        parent.children!.push(folderWithChildren);
      }
    } else {
      rootFolders.push(folderWithChildren);
    }
  });

  return rootFolders;
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =================== ACTIONS ===================

export const filesActions = {
  // Ensure data is loaded
  async ensureDataLoaded() {
    const state = get(fileStore);
    if (state.dataLoaded) return;
    await this.loadAllData();
  },

  // Load all files and folders
  async loadAllData() {
    try {
      setLoading(true);
      setError(null);

      const [folders, files, stats] = await Promise.all([
        fileService.getFolders(),
        fileService.getFiles(),
        fileService.getUserStats()
      ]);

      updateStore(state => ({
        ...state,
        folders,
        files,
        userStats: stats,
        dataLoaded: true
      }));

    } catch (err) {
      console.error('Error loading file data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  },

  // Set current folder
  setCurrentFolder(folderId: string | null) {
    updateStore(state => ({ ...state, currentFolderId: folderId }));
  },

  // Create folder
  async createFolder(name: string, parentId?: string) {
    try {
      setError(null);
      const newFolder = await fileService.createFolder(name, parentId);
      
      if (newFolder) {
        updateStore(state => ({
          ...state,
          folders: [...state.folders, newFolder]
        }));
        return newFolder;
      }
      throw new Error('Failed to create folder');
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to create folder');
      return null;
    }
  },

  // Delete folder
  async deleteFolder(folderId: string) {
    try {
      setError(null);
      const success = await fileService.deleteFolder(folderId);
      
      if (success) {
        updateStore(state => ({
          ...state,
          folders: state.folders.filter(f => f.id !== folderId),
          files: state.files.filter(f => f.folder_id !== folderId)
        }));
        return true;
      }
      throw new Error('Failed to delete folder');
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete folder');
      return false;
    }
  },

  // Upload file
  async uploadFile(file: File, folderId?: string) {
    try {
      setError(null);
      
      // Add to upload progress
      const progressItem: FileUploadProgress = {
        file,
        progress: 0,
        status: 'uploading'
      };

      updateStore(state => ({
        ...state,
        uploadProgress: [...state.uploadProgress, progressItem]
      }));

      // Upload file with progress tracking
      const uploadedFile = await fileService.uploadFile(
        file, 
        folderId,
        (progress) => {
          updateStore(state => ({
            ...state,
            uploadProgress: state.uploadProgress.map(item => 
              item.file === file ? { ...item, progress } : item
            )
          }));
        }
      );

      if (uploadedFile) {
        // Add to files list
        updateStore(state => ({
          ...state,
          files: [uploadedFile, ...state.files],
          uploadProgress: state.uploadProgress.map(item => 
            item.file === file 
              ? { ...item, progress: 100, status: 'success' } 
              : item
          )
        }));

        // Remove from progress after 2 seconds
        setTimeout(() => {
          updateStore(state => ({
            ...state,
            uploadProgress: state.uploadProgress.filter(item => item.file !== file)
          }));
        }, 2000);

        return uploadedFile;
      }
      throw new Error('Failed to upload file');

    } catch (err) {
      console.error('Error uploading file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);

      // Update progress with error
      updateStore(state => ({
        ...state,
        uploadProgress: state.uploadProgress.map(item => 
          item.file === file 
            ? { ...item, status: 'error', error: errorMessage } 
            : item
        )
      }));

      return null;
    }
  },

  // Delete file
  async deleteFile(fileId: string) {
    try {
      setError(null);
      const success = await fileService.deleteFile(fileId);
      
      if (success) {
        updateStore(state => ({
          ...state,
          files: state.files.filter(f => f.id !== fileId)
        }));
        return true;
      }
      throw new Error('Failed to delete file');
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete file');
      return false;
    }
  },

  // Move file to different folder
  async moveFile(fileId: string, newFolderId: string | null) {
    try {
      setError(null);
      const success = await fileService.moveFile(fileId, newFolderId);
      
      if (success) {
        updateStore(state => ({
          ...state,
          files: state.files.map(f => 
            f.id === fileId 
              ? { ...f, folder_id: newFolderId }
              : f
          )
        }));
        return true;
      }
      throw new Error('Failed to move file');
    } catch (err) {
      console.error('Error moving file:', err);
      setError(err instanceof Error ? err.message : 'Failed to move file');
      return false;
    }
  },

  // Download file
  async downloadFile(fileId: string, fileName: string) {
    try {
      setError(null);
      const downloadUrl = await fileService.downloadFile(fileId);
      
      if (downloadUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      }
      throw new Error('Failed to get download URL');
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(err instanceof Error ? err.message : 'Failed to download file');
      return false;
    }
  },

  // Clear error
  clearError() {
    setError(null);
  },

  // Refresh data
  async refresh() {
    updateStore(state => ({ ...state, dataLoaded: false }));
    await this.loadAllData();
  },

  // Share file with another user
  async shareFile(
    fileId: string, 
    shareWith: string, 
    permission: 'view' | 'edit' | 'delete' = 'view',
    expiresAt: string | null = null
  ) {
    try {
      setError(null);
      const share = await fileService.shareFile(fileId, shareWith, permission, expiresAt);
      
      if (share) {
        // Optionally update local state or trigger a refresh
        return share;
      }
      throw new Error('Failed to share file');
    } catch (err) {
      console.error('Error sharing file:', err);
      setError(err instanceof Error ? err.message : 'Failed to share file');
      return null;
    }
  },

  // Get file shares
  async getFileShares(fileId: string) {
    try {
      setError(null);
      return await fileService.getFileShares(fileId);
    } catch (err) {
      console.error('Error getting file shares:', err);
      setError(err instanceof Error ? err.message : 'Failed to get file shares');
      return [];
    }
  },

  // Revoke file share
  async revokeShare(shareId: string) {
    try {
      setError(null);
      const success = await fileService.revokeShare(shareId);
      
      if (success) {
        return true;
      }
      throw new Error('Failed to revoke share');
    } catch (err) {
      console.error('Error revoking share:', err);
      setError(err instanceof Error ? err.message : 'Failed to revoke share');
      return false;
    }
  },

  // Get files shared with me
  async getSharedWithMe() {
    try {
      setError(null);
      return await fileService.getSharedWithMe();
    } catch (err) {
      console.error('Error getting shared files:', err);
      setError(err instanceof Error ? err.message : 'Failed to get shared files');
      return [];
    }
  }
};

// Export the main store
export { fileStore };