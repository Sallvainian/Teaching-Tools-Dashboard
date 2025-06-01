import { supabase } from '$lib/supabaseClient';
import type {
	FilePermissionLevel,
	ShareScope,
	FilePermission,
	FileShareRequest,
	FileWithPermissions,
	ClassContext
} from '$lib/types/files';
import { hasPermission, canUserShare, PERMISSION_LEVELS } from '$lib/types/files';

export class FilePermissionService {
	/**
	 * Get user's permission level for a specific file
	 * Follows Microsoft Teams hierarchy: Owner > Contribute > Edit > View
	 */
	async getUserFilePermission(fileId: string, userId: string): Promise<FilePermissionLevel> {
		try {
			// Check if user is the file owner
			const { data: fileData } = await supabase
				.from('file_metadata')
				.select('user_id')
				.eq('id', fileId)
				.single();

			if (fileData?.user_id === userId) {
				return 'owner';
			}

			// Check explicit permissions granted to user
			const { data: userPermissions } = await supabase
				.from('file_permissions')
				.select('permission_level')
				.eq('file_id', fileId)
				.eq('user_id', userId)
				.order('permission_level', { ascending: false });

			if (userPermissions && userPermissions.length > 0) {
				return userPermissions[0].permission_level;
			}

			// Check class-based permissions
			const { data: classPermissions } = await supabase
				.from('file_permissions')
				.select(
					`
					permission_level,
					class_id,
					classes!inner(*)
				`
				)
				.eq('file_id', fileId)
				.not('class_id', 'is', null);

			if (classPermissions) {
				// Get user's classes
				const { data: userClasses } = await supabase
					.from('class_students')
					.select('class_id')
					.eq('student_id', userId);

				const userClassIds = userClasses?.map((c) => c.class_id) || [];

				// Find highest permission from user's classes
				const applicablePermissions = classPermissions
					.filter((cp) => userClassIds.includes(cp.class_id))
					.map((cp) => cp.permission_level);

				if (applicablePermissions.length > 0) {
					return this.getHighestPermission(applicablePermissions);
				}
			}

			// Check role-based permissions
			const { data: userRole } = await supabase
				.from('app_users')
				.select('role')
				.eq('id', userId)
				.single();

			if (userRole) {
				const { data: rolePermissions } = await supabase
					.from('file_permissions')
					.select('permission_level')
					.eq('file_id', fileId)
					.eq('role', userRole.role)
					.order('permission_level', { ascending: false });

				if (rolePermissions && rolePermissions.length > 0) {
					return rolePermissions[0].permission_level;
				}
			}

			// Default: no access (but we'll return 'view' for now)
			return 'view';
		} catch (error) {
			console.error('Error getting user file permission:', error);
			return 'view';
		}
	}

	/**
	 * Share a file with users, classes, or roles
	 * Similar to Microsoft Teams sharing workflow
	 */
	async shareFile(
		shareRequest: FileShareRequest,
		currentUserId: string
	): Promise<{ success: boolean; error?: string }> {
		try {
			// Check if current user can share this file
			const currentUserPermission = await this.getUserFilePermission(
				shareRequest.file_id,
				currentUserId
			);

			if (!canUserShare(currentUserPermission)) {
				return { success: false, error: 'You do not have permission to share this file' };
			}

			// Validate permission level (can't grant higher permission than you have)
			if (this.isHigherPermissionLevel(shareRequest.permission_level, currentUserPermission)) {
				return { success: false, error: 'Cannot grant higher permission level than you have' };
			}

			const permission: Omit<FilePermission, 'id'> = {
				file_id: shareRequest.file_id,
				permission_level: shareRequest.permission_level,
				share_scope: shareRequest.share_scope,
				granted_by: currentUserId,
				granted_at: new Date().toISOString(),
				expires_at: shareRequest.expires_at
			};

			// Set the appropriate recipient field
			switch (shareRequest.shared_with_type) {
				case 'user':
					permission.user_id = shareRequest.shared_with_id;
					break;
				case 'class':
					permission.class_id = shareRequest.shared_with_id;
					break;
				case 'role':
					permission.role = shareRequest.shared_with_role;
					break;
			}

			const { error } = await supabase.from('file_permissions').insert(permission);

			if (error) throw error;

			return { success: true };
		} catch (error) {
			console.error('Error sharing file:', error);
			return { success: false, error: 'Failed to share file' };
		}
	}

	/**
	 * Get all permissions for a file (for permission management UI)
	 */
	async getFilePermissions(
		fileId: string
	): Promise<Array<FilePermission & { recipient_name?: string }>> {
		try {
			const { data: permissions } = await supabase
				.from('file_permissions')
				.select(
					`
					*,
					user:app_users(full_name, email),
					class:classes(name),
					granted_by_user:app_users!file_permissions_granted_by_fkey(full_name)
				`
				)
				.eq('file_id', fileId);

			return (
				permissions?.map((p) => ({
					...p,
					recipient_name: p.user?.full_name || p.class?.name || `All ${p.role}s`
				})) || []
			);
		} catch (error) {
			console.error('Error getting file permissions:', error);
			return [];
		}
	}

	/**
	 * Remove a specific permission
	 */
	async removePermission(
		permissionId: string,
		currentUserId: string
	): Promise<{ success: boolean; error?: string }> {
		try {
			// Check if current user can manage permissions
			const { data: permission } = await supabase
				.from('file_permissions')
				.select('file_id, granted_by')
				.eq('id', permissionId)
				.single();

			if (!permission) {
				return { success: false, error: 'Permission not found' };
			}

			const currentUserPermission = await this.getUserFilePermission(
				permission.file_id,
				currentUserId
			);

			// Only file owners or permission granters can remove permissions
			if (currentUserPermission !== 'owner' && permission.granted_by !== currentUserId) {
				return { success: false, error: 'You do not have permission to remove this sharing' };
			}

			const { error } = await supabase.from('file_permissions').delete().eq('id', permissionId);

			if (error) throw error;

			return { success: true };
		} catch (error) {
			console.error('Error removing permission:', error);
			return { success: false, error: 'Failed to remove permission' };
		}
	}

	/**
	 * Get available classes for sharing (for teachers)
	 */
	async getAvailableClasses(userId: string): Promise<ClassContext[]> {
		try {
			// Get user's role
			const { data: user } = await supabase
				.from('app_users')
				.select('role')
				.eq('id', userId)
				.single();

			if (user?.role === 'teacher') {
				// Teachers can share with their classes
				const { data: classes } = await supabase
					.from('classes')
					.select(
						`
						id,
						name,
						grade_level,
						subject,
						teacher_id,
						class_students(count)
					`
					)
					.eq('teacher_id', userId);

				return (
					classes?.map((c) => ({
						id: c.id,
						name: c.name,
						grade_level: c.grade_level,
						subject: c.subject,
						teacher_id: c.teacher_id,
						student_count: c.class_students?.[0]?.count || 0
					})) || []
				);
			} else {
				// Students can only see their enrolled classes
				const { data: studentRecord } = await supabase
					.from('students')
					.select('id')
					.eq('user_id', userId)
					.single();

				if (studentRecord) {
					const { data: enrolledClasses } = await supabase
						.from('class_students')
						.select(
							`
							classes(
								id,
								name,
								grade_level,
								subject,
								teacher_id
							)
						`
						)
						.eq('student_id', studentRecord.id);

					return (
						enrolledClasses?.map((ec) => ({
							id: ec.classes.id,
							name: ec.classes.name,
							grade_level: ec.classes.grade_level,
							subject: ec.classes.subject,
							teacher_id: ec.classes.teacher_id,
							student_count: 0 // Students don't need to see count
						})) || []
					);
				}
			}

			return [];
		} catch (error) {
			console.error('Error getting available classes:', error);
			return [];
		}
	}

	/**
	 * Check if one permission level is higher than another
	 */
	private isHigherPermissionLevel(
		level1: FilePermissionLevel,
		level2: FilePermissionLevel
	): boolean {
		const hierarchy = ['view', 'edit', 'contribute', 'owner'];
		return hierarchy.indexOf(level1) > hierarchy.indexOf(level2);
	}

	/**
	 * Get the highest permission level from a list
	 */
	private getHighestPermission(permissions: FilePermissionLevel[]): FilePermissionLevel {
		const hierarchy = ['view', 'edit', 'contribute', 'owner'];
		let highest = 'view' as FilePermissionLevel;

		for (const permission of permissions) {
			if (hierarchy.indexOf(permission) > hierarchy.indexOf(highest)) {
				highest = permission;
			}
		}

		return highest;
	}

	/**
	 * Get files shared with a user (similar to Teams "Shared with me")
	 */
	async getSharedWithUser(userId: string): Promise<FileWithPermissions[]> {
		try {
			const { data: sharedFiles } = await supabase
				.from('file_permissions')
				.select(
					`
					permission_level,
					granted_at,
					file_metadata!inner(*)
				`
				)
				.eq('user_id', userId)
				.neq('file_metadata.user_id', userId); // Exclude files user owns

			return (
				sharedFiles?.map((sf) => ({
					...sf.file_metadata,
					current_user_permission: sf.permission_level,
					is_shared: true,
					share_count: 1,
					can_reshare: hasPermission(sf.permission_level, 'share')
				})) || []
			);
		} catch (error) {
			console.error('Error getting shared files:', error);
			return [];
		}
	}
}

// Export singleton instance
export const filePermissionService = new FilePermissionService();
