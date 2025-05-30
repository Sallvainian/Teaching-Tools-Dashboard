<script lang="ts">
	import type { FileFolder } from '$lib/types/files';
	import { filesActions, currentFolderId, files } from '$lib/stores/files';
	import Self from './FolderTree.svelte';

	interface Props {
		folders: FileFolder[];
		parentId: string | null;
		level?: number;
	}

	let { folders, parentId, level = 0 }: Props = $props();

	// Track expanded folders
	let expandedFolders = $state<Set<string>>(new Set());

	// Get child folders for a given parent
	let childFolders: FileFolder[] = $derived(folders.filter((f) => f.parent_id === parentId));

	// Check if a folder has children
	function hasChildren(folderId: string): boolean {
		return folders.some((f) => f.parent_id === folderId);
	}

	// Get folder stats
	function getFolderStats(folder: FileFolder) {
		const folderFiles = $files.filter((f) => f.folder_id === folder.id);
		const totalSize = folderFiles.reduce((sum, file) => sum + file.size, 0);
		return {
			fileCount: folderFiles.length,
			size: formatFileSize(totalSize)
		};
	}

	// Format file size
	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	// Toggle folder expansion
	function toggleExpanded(folderId: string) {
		const newExpanded = new Set(expandedFolders);
		if (newExpanded.has(folderId)) {
			newExpanded.delete(folderId);
		} else {
			newExpanded.add(folderId);
		}
		expandedFolders = newExpanded;
	}

	// Navigate to folder
	function navigateToFolder(folderId: string) {
		filesActions.setCurrentFolder(folderId);
	}

	// Delete folder with confirmation
	async function deleteFolder(e: Event, folder: FileFolder) {
		e.stopPropagation();
		if (confirm(`Are you sure you want to delete "${folder.name}" and all its contents?`)) {
			await filesActions.deleteFolder(folder.id);
		}
	}
</script>

<div class="space-y-0.5">
	{#each childFolders as folder (folder.id)}
		{@const stats = getFolderStats(folder)}
		{@const hasSubfolders = hasChildren(folder.id)}
		{@const isExpanded = expandedFolders.has(folder.id)}
		{@const isActive = $currentFolderId === folder.id}

		<div>
			<div
				class={`group flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors cursor-pointer text-xs ${
					isActive
						? 'bg-purple-bg text-highlight'
						: 'hover:bg-surface text-text-base hover:text-text-hover'
				}`}
				style={`padding-left: ${0.5 + level * 0.75}rem`}
			>
				<!-- Expand/Collapse button -->
				{#if hasSubfolders}
					<button
						onclick={(e) => {
							e.stopPropagation();
							toggleExpanded(folder.id);
						}}
						class="p-0.5 rounded hover:bg-purple-bg transition-colors"
						aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
					>
						<svg
							class={`w-2.5 h-2.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="9 18 15 12 9 6"></polyline>
						</svg>
					</button>
				{:else}
					<div class="w-3.5"></div>
				{/if}

				<!-- Folder button -->
				<button
					onclick={() => navigateToFolder(folder.id)}
					class="flex-1 flex items-center gap-1 text-left"
				>
					<svg
						class="w-3.5 h-3.5 flex-shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						{#if isExpanded}
							<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v1"
							></path>
							<path d="M2 10h20"></path>
						{:else}
							<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
							></path>
						{/if}
					</svg>

					<span class="flex-1 truncate">{folder.name}</span>
					<span class="text-[10px] text-muted">{stats.fileCount}</span>
				</button>

				<!-- Delete button (shown on hover) -->
				<button
					onclick={(e) => deleteFolder(e, folder)}
					class="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-error/20 hover:text-error transition-all"
					title="Delete folder"
					aria-label="Delete folder"
				>
					<svg
						class="w-3 h-3"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="3 6 5 6 21 6"></polyline>
						<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
						></path>
					</svg>
				</button>
			</div>

			<!-- Recursive children -->
			{#if hasSubfolders && isExpanded}
				<Self {folders} parentId={folder.id} level={level + 1} />
			{/if}
		</div>
	{/each}
</div>
