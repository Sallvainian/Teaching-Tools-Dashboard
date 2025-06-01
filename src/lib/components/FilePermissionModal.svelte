<script lang="ts">
	import type {
		FileMetadata,
		FilePermissionLevel,
		ShareScope,
		FileShareRequest,
		ClassContext
	} from '$lib/types/files';
	import { filePermissionService } from '$lib/services/filePermissionService';
	import { PERMISSION_LEVELS, SHARE_SCOPES } from '$lib/types/files';
	import { authStore } from '$lib/stores/auth';

	interface Props {
		file: FileMetadata;
		isOpen: boolean;
		onclose?: () => void;
		onshared?: (fileId: string) => void;
	}

	let { file, isOpen, onclose, onshared }: Props = $props();

	let shareWithType = $state<'user' | 'class' | 'role'>('user');
	let selectedUserId = $state('');
	let selectedClassId = $state('');
	let selectedRole = $state<'teacher' | 'student'>('student');
	let permissionLevel = $state<FilePermissionLevel>('view');
	let shareScope = $state<ShareScope>('private');
	let expiresAt = $state('');
	let message = $state('');

	let availableClasses = $state<ClassContext[]>([]);
	let isLoading = $state(false);
	let error = $state('');

	$effect(() => {
		if (isOpen) {
			loadAvailableOptions();
		}
	});

	async function loadAvailableOptions() {
		try {
			const user = $authStore.user;
			if (!user) return;
			const classes = await filePermissionService.getAvailableClasses(user.id);
			availableClasses = classes;
		} catch (err) {
			console.error('Error loading sharing options:', err);
		}
	}
	async function handleShare() {
		if (!$authStore.user) return;

		isLoading = true;
		error = '';

		try {
			const shareRequest: FileShareRequest = {
				file_id: file.id,
				shared_with_type: shareWithType,
				permission_level: permissionLevel,
				share_scope: shareScope,
				expires_at: expiresAt || undefined,
				message: message || undefined
			};

			switch (shareWithType) {
				case 'user':
					shareRequest.shared_with_id = selectedUserId;
					break;
				case 'class':
					shareRequest.shared_with_id = selectedClassId;
					break;
				case 'role':
					shareRequest.shared_with_role = selectedRole;
					break;
			}

			const result = await filePermissionService.shareFile(shareRequest, $authStore.user.id);

			if (result.success) {
				onshared?.(file.id);
				onclose?.();
			} else {
				error = result.error || 'Failed to share file';
			}
		} catch (err) {
			error = 'An unexpected error occurred';
			console.error('Share error:', err);
		} finally {
			isLoading = false;
		}
	}

	function handleClose() {
		onclose?.();
	}
</script>
{#if isOpen}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
		<div class="bg-white dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-2xl mx-4">
			<div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-dark-text">
					Share "{file.name}"
				</h2>
				<button
					onclick={handleClose}
					class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="p-6 space-y-6">
				{#if error}
					<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
						<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
					</div>
				{/if}

				<!-- Share with type selection -->
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Share with
					</label>
					<div class="flex gap-4">
						<label class="flex items-center">
							<input
								type="radio"
								bind:group={shareWithType}
								value="user"
								class="mr-2"
							/>
							<span class="text-sm">Specific User</span>
						</label>
						<label class="flex items-center">
							<input
								type="radio"
								bind:group={shareWithType}
								value="class"
								class="mr-2"
							/>
							<span class="text-sm">Class</span>
						</label>
						<label class="flex items-center">
							<input
								type="radio"
								bind:group={shareWithType}
								value="role"
								class="mr-2"
							/>
							<span class="text-sm">All Users by Role</span>
						</label>
					</div>
				</div>