import { supabase } from '$lib/supabaseClient';
import type {
	FileFolder,
	FileMetadata,
	FileShare,
	FileShareWithDetails,
	FileFolderWithChildren,
	FileMetadataWithFolder,
	UserFileStats
} from '$lib/types/files';
import { validateFile, getFileType } from '$lib/types/files';

export class FileService {
	private static readonly STORAGE_BUCKET = 'teacher-files';

	// =================== FOLDER OPERATIONS ===================

	/**
	 * Get all folders for the current user
	 */
	async getFolders(): Promise<FileFolder[]> {
		try {
			const { data, error } = await supabase.from('file_folders').select('*').order('name');

			if (error) throw error;
			return data || [];
		} catch (error) {
			console.error('Error fetching folders:', error);
			return [];
		}
	}

	/**
	 * Get folder tree structure with nested children
	 */
	async getFolderTree(): Promise<FileFolderWithChildren[]> {
		try {
			const folders = await this.getFolders();
			return this.buildFolderTree(folders);
		} catch (error) {
			console.error('Error building folder tree:', error);
			return [];
		}
	}

	/**
	 * Create a new folder
	 */
	async createFolder(name: string, parentId?: string): Promise<FileFolder | null> {
		try {
			const {
				data: { user }
			} = await supabase.auth.getUser();
			if (!user) throw new Error('User not authenticated');

			const { data, error } = await supabase
				.from('file_folders')
				.insert({
					user_id: user.id,
					name: name.trim(),
					parent_id: parentId ?? null
				})
				.select()
				.single();

			if (error) throw error;
			return data;
		} catch (error) {
			console.error('Error creating folder:', error);
			return null;
		}
	}

	/**
	 * Delete a folder and all its contents
	 */
	async deleteFolder(folderId: string): Promise<boolean> {
		try {
			// First, delete all files in the folder
			const files = await this.getFiles(folderId);
			for (const file of files) {
				await this.deleteFile(file.id);
			}

			// Then delete the folder
			const { error } = await supabase.from('file_folders').delete().eq('id', folderId);

			if (error) throw error;
			return true;
		} catch (error) {
			console.error('Error deleting folder:', error);
			return false;
		}
	}

	/**
	 * Rename a folder
	 */
	async renameFolder(folderId: string, newName: string): Promise<boolean> {
		try {
			const { error } = await supabase
				.from('file_folders')
				.update({ name: newName.trim() })
				.eq('id', folderId);

			if (error) throw error;
			return true;
		} catch (error) {
			console.error('Error renaming folder:', error);
			return false;
		}
	}

	// =================== FILE OPERATIONS ===================

	/**
	 * Get all files for the current user, optionally filtered by folder
	 */
	async getFiles(folderId?: string): Promise<FileMetadataWithFolder[]> {
		try {
			let query = supabase
				.from('file_metadata')
				.select(
					`
          *,
          folder:file_folders(*)
        `
				)
				.order('created_at', { ascending: false });

			if (folderId) {
				query = query.eq('folder_id', folderId);
			}

			const { data, error } = await query;

			if (error) throw error;
			return data || [];
		} catch (error) {
			console.error('Error fetching files:', error);
			return [];
		}
	}

	/**
	 * Upload a file to Supabase Storage
	 */
	async uploadFile(
		file: File,
		folderId?: string,
		onProgress?: (progress: number) => void
	): Promise<FileMetadata | null> {
		console.log('fileService.uploadFile called', { file, folderId });
		try {
			// Validate file
			const validation = validateFile(file);
			if (!validation.valid) {
				throw new Error(validation.error);
			}

			const {
				data: { user }
			} = await supabase.auth.getUser();
			if (!user) throw new Error('User not authenticated');

			// Generate unique file path
			const fileType = getFileType(file.name);
			const timestamp = Date.now();
			const fileName = `${timestamp}_${file.name}`;
			const storagePath = folderId
				? `${user.id}/${folderId}/${fileName}`
				: `${user.id}/${fileName}`;

			// Upload to Supabase Storage
			const { data: uploadData, error: uploadError } = await supabase.storage
				.from(FileService.STORAGE_BUCKET)
				.upload(storagePath, file, {
					cacheControl: '3600',
					upsert: false
				});

			if (uploadError) throw uploadError;
			if (onProgress) onProgress(50); // Upload complete, now saving metadata

			// Save file metadata to database
			const { data: metadataData, error: metadataError } = await supabase
				.from('file_metadata')
				.insert({
					user_id: user.id,
					folder_id: folderId ?? null,
					storage_path: uploadData.path,
					name: file.name,
					size: file.size,
					type: fileType,
					mime_type: file.type || null
				})
				.select()
				.single();

			if (metadataError) {
				// If metadata save fails, cleanup the uploaded file
				await supabase.storage.from(FileService.STORAGE_BUCKET).remove([uploadData.path]);
				throw metadataError;
			}

			if (onProgress) onProgress(100);
			return metadataData;
		} catch (error) {
			console.error('Error uploading file:', error);
			throw error;
		}
	}

	/**
	 * Download a file from Supabase Storage
	 */
	async downloadFile(fileId: string): Promise<string | null> {
		try {
			// Get file metadata
			const { data: fileData, error: fileError } = await supabase
				.from('file_metadata')
				.select('storage_path, name')
				.eq('id', fileId)
				.single();

			if (fileError) throw fileError;

			// Get signed URL for download
			const { data, error } = await supabase.storage
				.from(FileService.STORAGE_BUCKET)
				.createSignedUrl(fileData.storage_path, 3600); // 1 hour expiry

			if (error) throw error;
			return data.signedUrl;
		} catch (error) {
			console.error('Error downloading file:', error);
			return null;
		}
	}

	/**
	 * Delete a file
	 */
	async deleteFile(fileId: string): Promise<boolean> {
		try {
			// Get file metadata first
			const { data: fileData, error: fileError } = await supabase
				.from('file_metadata')
				.select('storage_path')
				.eq('id', fileId)
				.single();

			if (fileError) throw fileError;

			// Delete from storage
			const { error: storageError } = await supabase.storage
				.from(FileService.STORAGE_BUCKET)
				.remove([fileData.storage_path]);

			if (storageError) {
				console.warn('Error deleting from storage:', storageError);
				// Continue with metadata deletion even if storage deletion fails
			}

			// Delete metadata
			const { error: metadataError } = await supabase
				.from('file_metadata')
				.delete()
				.eq('id', fileId);

			if (metadataError) throw metadataError;
			return true;
		} catch (error) {
			console.error('Error deleting file:', error);
			return false;
		}
	}

	/**
	 * Rename a file
	 */
	async renameFile(fileId: string, newName: string): Promise<boolean> {
		try {
			const { error } = await supabase
				.from('file_metadata')
				.update({ name: newName.trim() })
				.eq('id', fileId);

			if (error) throw error;
			return true;
		} catch (error) {
			console.error('Error renaming file:', error);
			return false;
		}
	}

	// =================== FILE SHARING ===================

	/**
	 * Get files shared with the current user
	 */
	async getSharedFiles(): Promise<FileMetadataWithFolder[]> {
		try {
			const { data, error } = await supabase
				.from('file_shares')
				.select(
					`
          *,
          file:file_metadata(
            *,
            folder:file_folders(*)
          )
        `
				)
				.eq('shared_with', (await supabase.auth.getUser()).data.user?.id)
				.is('expires_at', null)
				.or('expires_at.gt.' + new Date().toISOString());

			if (error) throw error;
			return data?.map((share) => share.file).filter(Boolean) || [];
		} catch (error) {
			console.error('Error fetching shared files:', error);
			return [];
		}
	}

	// =================== STATISTICS ===================

	/**
	 * Get file statistics for the current user
	 */
	async getUserStats(): Promise<UserFileStats | null> {
		try {
			const { data, error } = await supabase.from('user_file_stats').select('*');

			if (error) throw error;
			// The view may return 0 or 1 row for a user
			return data && data.length > 0 ? data[0] : null;
		} catch (error) {
			console.error('Error fetching user stats:', error);
			return null;
		}
	}

	// =================== HELPER METHODS ===================

	/**
	 * Build a nested folder tree structure
	 */
	private buildFolderTree(folders: FileFolder[]): FileFolderWithChildren[] {
		const folderMap = new Map<string, FileFolderWithChildren>();
		const rootFolders: FileFolderWithChildren[] = [];

		// Create folder map
		folders.forEach((folder) => {
			folderMap.set(folder.id, { ...folder, children: [] });
		});

		// Build tree structure
		folders.forEach((folder) => {
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

	/**
	 * Create default folders for a new user
	 */
	async createDefaultFolders(): Promise<void> {
		try {
			const {
				data: { user }
			} = await supabase.auth.getUser();
			if (!user) throw new Error('User not authenticated');

			// Call the database function
			const { error } = await supabase.rpc('create_default_folders', {
				user_id: user.id
			});

			if (error) throw error;
		} catch (error) {
			console.error('Error creating default folders:', error);
		}
	}

	/**
	 * Get a public URL for viewing a file
	 */
	async getFileUrl(storagePath: string): Promise<string | null> {
		try {
			const { data } = await supabase.storage
				.from('teacher-files')
				.createSignedUrl(storagePath, 3600); // 1 hour expiry

			return data?.signedUrl ?? null;
		} catch (error) {
			console.error('Error getting file URL:', error);
			return null;
		}
	}

	/**
	 * Move a file to a different folder
	 */
	async moveFile(fileId: string, newFolderId: string | null): Promise<boolean> {
		try {
			const { error } = await supabase
				.from('file_metadata')
				.update({
					folder_id: newFolderId,
					updated_at: new Date().toISOString()
				})
				.eq('id', fileId);

			if (error) throw error;
			return true;
		} catch (error) {
			console.error('Error moving file:', error);
			return false;
		}
	}

	/**
	 * Share a file with another user
	 */
	async shareFile(
		fileId: string,
		shareWithEmail: string,
		permission: 'view' | 'edit' | 'delete' = 'view',
		expiresAt: string | null = null
	): Promise<FileShare | null> {
		try {
			const {
				data: { user }
			} = await supabase.auth.getUser();
			if (!user) throw new Error('User not authenticated');

			// First, look up the user by email to get their ID
			const { data: userData, error: userError } = await supabase
				.from('app_users')
				.select('id')
				.eq('email', shareWithEmail)
				.single();

			if (userError || !userData) {
				throw new Error('User not found with that email address');
			}

			const { data, error } = await supabase
				.from('file_shares')
				.insert({
					file_id: fileId,
					shared_with: userData.id,
					shared_by: user.id,
					permission,
					expires_at: expiresAt
				})
				.select()
				.single();

			if (error) throw error;
			return data;
		} catch (error) {
			console.error('Error sharing file:', error);
			return null;
		}
	}

	/**
	 * Get all shares for a file
	 */
	async getFileShares(fileId: string): Promise<FileShareWithDetails[]> {
		try {
			const { data, error } = await supabase
				.from('file_shares')
				.select(
					`
          *,
          file:file_metadata(*),
          shared_with_user:shared_with(id, email, full_name),
          shared_by_user:shared_by(id, email, full_name)
        `
				)
				.eq('file_id', fileId)
				.order('created_at', { ascending: false });

			if (error) throw error;
			return data || [];
		} catch (error) {
			console.error('Error getting file shares:', error);
			return [];
		}
	}

	/**
	 * Revoke a file share
	 */
	async revokeShare(shareId: string): Promise<boolean> {
		try {
			const { error } = await supabase.from('file_shares').delete().eq('id', shareId);

			if (error) throw error;
			return true;
		} catch (error) {
			console.error('Error revoking share:', error);
			return false;
		}
	}

	/**
	 * Get files shared with the current user
	 */
	async getSharedWithMe(): Promise<FileShareWithDetails[]> {
		try {
			const {
				data: { user }
			} = await supabase.auth.getUser();
			if (!user) return [];

			const { data, error } = await supabase
				.from('file_shares')
				.select(
					`
          *,
          file:file_metadata(*),
          shared_with_user:shared_with(id, email, full_name),
          shared_by_user:shared_by(id, email, full_name)
        `
				)
				.eq('shared_with', user.email)
				.order('created_at', { ascending: false });

			if (error) throw error;
			return data || [];
		} catch (error) {
			console.error('Error getting shared files:', error);
			return [];
		}
	}

	/**
	 * Get deleted files (soft delete)
	 */
	async getDeletedFiles(): Promise<FileMetadataWithFolder[]> {
		try {
			const { data, error } = await supabase
				.from('file_metadata')
				.select(`
					*,
					folder:file_folders(*)
				`)
				.eq('is_deleted', true)
				.order('deleted_at', { ascending: false });

			if (error) throw error;
			return data || [];
		} catch (error) {
			console.error('Error getting deleted files:', error);
			return [];
		}
	}

	/**
	 * Restore a deleted file
	 */
	async restoreFile(fileId: string): Promise<boolean> {
		try {
			const { error } = await supabase
				.from('file_metadata')
				.update({
					is_deleted: false,
					deleted_at: null,
					updated_at: new Date().toISOString()
				})
				.eq('id', fileId);

			if (error) throw error;
			return true;
		} catch (error) {
			console.error('Error restoring file:', error);
			return false;
		}
	}

	/**
	 * Permanently delete a file
	 */
	async permanentlyDeleteFile(fileId: string): Promise<boolean> {
		try {
			// Get file metadata first
			const { data: fileData, error: fetchError } = await supabase
				.from('file_metadata')
				.select('storage_path')
				.eq('id', fileId)
				.single();

			if (fetchError) throw fetchError;

			// Delete from storage
			if (fileData?.storage_path) {
				const { error: storageError } = await supabase.storage
					.from(FileService.STORAGE_BUCKET)
					.remove([fileData.storage_path]);

				if (storageError) {
					console.warn('Error deleting from storage:', storageError);
				}
			}

			// Delete metadata record
			const { error } = await supabase
				.from('file_metadata')
				.delete()
				.eq('id', fileId);

			if (error) throw error;
			return true;
		} catch (error) {
			console.error('Error permanently deleting file:', error);
			return false;
		}
}
}

// Export singleton instance
export const fileService = new FileService();
