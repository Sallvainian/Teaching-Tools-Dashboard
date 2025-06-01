<script lang="ts">
	import type { FileMetadata } from '$lib/types/files';
	import { filePermissionService } from '$lib/services/filePermissionService';
	import { authStore } from '$lib/stores/auth';

	interface Props {
		file: FileMetadata;
		onshared?: () => void;
	}

	let { file, onshared }: Props = $props();

	let isLoading = $state(false);
	let showShareMenu = $state(false);
	let permissions = $state<any[]>([]);

	async function loadPermissions() {
		if (!showShareMenu) return;

		isLoading = true;
		try {
			permissions = await filePermissionService.getFilePermissions(file.id);
		} catch (error) {
			console.error('Error loading permissions:', error);
		} finally {
			isLoading = false;
		}
	}

	async function shareWithClass(classId: string) {
		const user = $authStore.user;
		if (!user) return;

		try {
			const result = await filePermissionService.shareFile(
				{
					file_id: file.id,
					shared_with_type: 'class',
					shared_with_id: classId,
					permission_level: 'view',
					share_scope: 'class'
				},
				user.id
			);

			if (result.success) {
				onshared?.();
				showShareMenu = false;
			}
		} catch (error) {
			console.error('Error sharing file:', error);
		}
	}

	function toggleShareMenu() {
		showShareMenu = !showShareMenu;
		if (showShareMenu) {
			loadPermissions();
		}
	}
</script>

<div class="relative">
	<button
		onclick={toggleShareMenu}
		class="p-2 text-gray-400 hover:text-dark-highlight transition-colors"
		title="Share file"
	>
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
			/>
		</svg>
	</button>

	{#if showShareMenu}
		<div
			class="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20"
		>
			<div class="p-4">
				<h3 class="text-sm font-medium text-gray-900 dark:text-dark-text mb-3">
					Share "{file.name}"
				</h3>

				{#if isLoading}
					<div class="text-center py-4">
						<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
					</div>
				{:else}
					<div class="space-y-2">
						<button
							onclick={() => shareWithClass('public')}
							class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
						>
							📢 Share with all students
						</button>
						<button
							onclick={() => shareWithClass('teachers')}
							class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
						>
							👥 Share with all teachers
						</button>
					</div>

					{#if permissions.length > 0}
						<div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
							<h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
								Currently shared with:
							</h4>
							<div class="space-y-1">
								{#each permissions as permission}
									<div class="text-xs text-gray-600 dark:text-gray-300">
										{permission.recipient_name} ({permission.permission_level})
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>
