<script lang="ts">
	import { onMount } from 'svelte';
	import {
		filesActions,
		files,
		folders,
		currentFolderId,
		isLoading,
		error,
		userStats,
		uploadProgress
	} from '$lib/stores/files';
	import FilePreviewModal from '$lib/components/FilePreviewModal.svelte';
	import FileShareModal from '$lib/components/FileShareModal.svelte';
	import type { FileMetadata, FileFolder } from '$lib/types/files';
	import { formatFileSize, getFileType, getFileIcon } from '$lib/types/files';

	// UI state
	let currentView = $state('grid'); // 'grid' or 'list'
	let searchQuery = $state('');
	let sortBy = $state('name'); // 'name', 'modified', 'size'
	let sortDirection = $state('asc'); // 'asc' or 'desc'
	let showNewFolderModal = $state(false);
	let newFolderName = $state('');

	// File preview modal
	let previewModalOpen = $state(false);
	let selectedFile = $state<FileMetadata | null>(null);

	// File sharing modal
	let shareModalOpen = $state(false);
	let fileToShare = $state<FileMetadata | null>(null);

	// File input for uploads
	let fileInput: HTMLInputElement;

	// Get current folder name
	const currentFolderName = $derived(() => {
		const folderId = $currentFolderId;
		if (!folderId) return 'All Files';
		const folder = $folders.find((f) => f.id === folderId);
		return folder?.name || 'All Files';
	});

	// Filtered and sorted files
	const filteredFiles = $derived(() => {
		let result = [...$files];

		// Filter by current folder
		if ($currentFolderId === null) {
			result = result.filter((file) => !file.folder_id);
		} else {
			result = result.filter((file) => file.folder_id === $currentFolderId);
		}

		// Filter by search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(file) => file.name.toLowerCase().includes(query) || file.type.toLowerCase().includes(query)
			);
		}

		// Sort files
		result.sort((a, b) => {
			let comparison = 0;

			if (sortBy === 'name') {
				comparison = a.name.localeCompare(b.name);
			} else if (sortBy === 'modified') {
				comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
			} else if (sortBy === 'size') {
				comparison = a.size - b.size;
			}

			return sortDirection === 'asc' ? comparison : -comparison;
		});

		return result;
	});

	onMount(async () => {
		await filesActions.ensureDataLoaded();
	});

	function toggleSort(column: string) {
		if (sortBy === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortDirection = 'asc';
		}
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function handleFileUpload(event: Event) {
		console.log('handleFileUpload called', event);
		const target = event.target as HTMLInputElement;
		const files = target.files;
		console.log('Selected files:', files);
		if (!files || files.length === 0) return;

		for (const file of files) {
			await filesActions.uploadFile(file, $currentFolderId || undefined);
		}

		// Clear the input
		target.value = '';
	}

	async function createNewFolder() {
		if (!newFolderName.trim()) return;

		await filesActions.createFolder(newFolderName.trim(), $currentFolderId || undefined);
		newFolderName = '';
		showNewFolderModal = false;
	}

	async function deleteFile(file: FileMetadata) {
		if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
			await filesActions.deleteFile(file.id);
		}
	}

	async function downloadFile(file: FileMetadata) {
		await filesActions.downloadFile(file.id, file.name);
	}

	function shareFile(file: FileMetadata) {
		fileToShare = file;
		shareModalOpen = true;
	}

	function openFilePreview(file: FileMetadata) {
		selectedFile = file;
		previewModalOpen = true;
	}

	function navigateToFolder(folderId: string | null) {
		filesActions.setCurrentFolder(folderId);
	}

	// Compute folder stats
	function getFolderStats(folder: FileFolder) {
		const folderFiles = $files.filter((f) => f.folder_id === folder.id);
		const totalSize = folderFiles.reduce((sum, file) => sum + file.size, 0);
		return {
			fileCount: folderFiles.length,
			size: formatFileSize(totalSize)
		};
	}
</script>

<div class="min-h-screen">
	<div class="container mx-auto px-4 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-highlight mb-2">File Storage</h1>
			<p class="text-text-base">Organize and manage your teaching materials</p>
		</div>

		<!-- Actions Bar -->
		<div class="flex flex-wrap gap-4 mb-6">
			<div class="flex-1">
				<div class="relative">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search files..."
						class="input w-full pl-10"
					/>
					<svg
						class="w-5 h-5 text-muted absolute left-3 top-1/2 transform -translate-y-1/2"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
				</div>
			</div>

			<div class="flex gap-2">
				<input
					type="file"
					multiple
					bind:this={fileInput}
					onchange={(e) => handleFileUpload(e)}
					class="hidden"
				/>
				<button
					class="btn btn-primary"
					onclick={() => {
						console.log('Upload button clicked', fileInput);
						fileInput?.click();
					}}
					disabled={$isLoading}
				>
					<svg
						class="w-5 h-5 mr-2"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
						<polyline points="17 8 12 3 7 8"></polyline>
						<line x1="12" y1="3" x2="12" y2="15"></line>
					</svg>
					Upload
				</button>

				<button class="btn btn-secondary" onclick={() => (showNewFolderModal = true)}>
					<svg
						class="w-5 h-5 mr-2"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
						></path>
						<line x1="12" y1="11" x2="12" y2="17"></line>
						<line x1="9" y1="14" x2="15" y2="14"></line>
					</svg>
					New Folder
				</button>

				<div class="flex border border-border rounded-lg overflow-hidden">
					<button
						class={`p-2 ${currentView === 'grid' ? 'bg-purple text-white' : 'bg-surface text-text-base hover:bg-accent hover:text-text-hover'}`}
						onclick={() => (currentView = 'grid')}
						title="Grid view"
						aria-label="Grid view"
					>
						<svg
							class="w-5 h-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="3" width="7" height="7"></rect>
							<rect x="14" y="3" width="7" height="7"></rect>
							<rect x="14" y="14" width="7" height="7"></rect>
							<rect x="3" y="14" width="7" height="7"></rect>
						</svg>
					</button>
					<button
						class={`p-2 ${currentView === 'list' ? 'bg-purple text-white' : 'bg-surface text-text-base hover:bg-accent hover:text-text-hover'}`}
						onclick={() => (currentView = 'list')}
						title="List view"
						aria-label="List view"
					>
						<svg
							class="w-5 h-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="8" y1="6" x2="21" y2="6"></line>
							<line x1="8" y1="12" x2="21" y2="12"></line>
							<line x1="8" y1="18" x2="21" y2="18"></line>
							<line x1="3" y1="6" x2="3.01" y2="6"></line>
							<line x1="3" y1="12" x2="3.01" y2="12"></line>
							<line x1="3" y1="18" x2="3.01" y2="18"></line>
						</svg>
					</button>
				</div>
			</div>
		</div>

		<!-- Upload Progress -->
		{#if $uploadProgress.length > 0}
			<div class="card-dark mb-6 space-y-3">
				{#each $uploadProgress as progress}
					<div>
						<div class="flex items-center gap-3 mb-2">
							{#if progress.status === 'uploading'}
								<svg
									class="w-5 h-5 text-purple animate-pulse"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
									<polyline points="17 8 12 3 7 8"></polyline>
									<line x1="12" y1="3" x2="12" y2="15"></line>
								</svg>
							{:else if progress.status === 'success'}
								<svg
									class="w-5 h-5 text-success"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="12" cy="12" r="10"></circle>
									<path d="M9 12l2 2 4-4"></path>
								</svg>
							{:else}
								<svg
									class="w-5 h-5 text-error"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="12" cy="12" r="10"></circle>
									<line x1="15" y1="9" x2="9" y2="15"></line>
									<line x1="9" y1="9" x2="15" y2="15"></line>
								</svg>
							{/if}
							<span class="text-highlight flex-1">{progress.file.name}</span>
							<span class="text-text-base">{progress.progress}%</span>
						</div>

						<div class="w-full bg-surface rounded-full h-2 overflow-hidden">
							<div
								class={`h-full transition-all duration-300 ${
									progress.status === 'error'
										? 'bg-error'
										: progress.status === 'success'
											? 'bg-success'
											: 'bg-purple'
								}`}
								style={`width: ${progress.progress}%`}
							></div>
						</div>

						{#if progress.error}
							<p class="text-error text-sm mt-1">{progress.error}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Main Content -->
		<div class="flex flex-col lg:flex-row gap-6">
			<!-- Sidebar -->
			<div class="lg:w-64 flex-shrink-0">
				<div class="card-dark">
					<h3 class="text-lg font-medium text-highlight mb-4">Folders</h3>

					<div class="space-y-1">
						<button
							class={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${$currentFolderId === null ? 'bg-purple-bg text-highlight' : 'hover:bg-surface text-text-base hover:text-text-hover'}`}
							onclick={() => navigateToFolder(null)}
						>
							<svg
								class="w-5 h-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M3 6l9-4 9 4v12l-9 4-9-4V6z"></path>
								<path d="M3 6l9 4 9-4"></path>
								<path d="M12 10v10"></path>
							</svg>
							All Files
						</button>

						{#each $folders.filter((f) => !f.parent_id) as folder}
							{@const stats = getFolderStats(folder)}
							<button
								class={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${$currentFolderId === folder.id ? 'bg-purple-bg text-highlight' : 'hover:bg-surface text-text-base hover:text-text-hover'}`}
								onclick={() => navigateToFolder(folder.id)}
							>
								<svg
									class="w-5 h-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
									></path>
								</svg>
								<div class="flex-1 flex justify-between items-center">
									<span>{folder.name}</span>
									<span class="text-xs text-muted">{stats.fileCount}</span>
								</div>
							</button>
						{/each}
					</div>

					{#if $userStats}
						<div class="mt-6 pt-6 border-t border-border">
							<div class="text-sm text-text-base mb-2">Storage</div>
							<div class="w-full bg-surface rounded-full h-2 mb-2">
								<div
									class="bg-purple h-full"
									style={`width: ${Math.min(($userStats.total_size_bytes / (1024 * 1024 * 1024)) * 100, 100)}%`}
								></div>
							</div>
							<div class="flex justify-between text-xs">
								<span class="text-text-base"
									>{formatFileSize($userStats.total_size_bytes)} used</span
								>
								<span class="text-text-base">1 GB total</span>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Files Display -->
			<div class="flex-1">
				<div class="card-dark">
					<div class="flex justify-between items-center mb-6">
						<h2 class="text-xl font-bold text-highlight">{currentFolderName()}</h2>

						<div class="flex items-center gap-2">
							<span class="text-sm text-text-base">Sort by:</span>
							<select
								bind:value={sortBy}
								class="bg-surface border border-border rounded-lg text-text-hover text-sm py-1 px-2"
							>
								<option value="name">Name</option>
								<option value="modified">Date</option>
								<option value="size">Size</option>
							</select>

							<button
								onclick={() => (sortDirection = sortDirection === 'asc' ? 'desc' : 'asc')}
								class="p-1 text-text-base hover:text-text-hover"
								title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
							>
								<svg
									class="w-5 h-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									{#if sortDirection === 'asc'}
										<path d="M3 4h13M3 8h9M3 12h5M7 20V8"></path>
										<path d="M18 20l3-3-3-3"></path>
										<path d="M21 17h-8"></path>
									{:else}
										<path d="M3 4h13M3 8h9M3 12h5M7 20V8"></path>
										<path d="M18 8l3 3-3 3"></path>
										<path d="M21 11h-8"></path>
									{/if}
								</svg>
							</button>
						</div>
					</div>

					{#if $error}
						<div class="bg-error/20 text-error px-4 py-3 rounded mb-4" role="alert">
							<p>{$error}</p>
						</div>
					{/if}

					{#if $isLoading}
						<div class="flex justify-center py-12">
							<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple"></div>
						</div>
					{:else if filteredFiles().length === 0}
						<div class="flex flex-col items-center justify-center py-12">
							<svg
								class="w-16 h-16 text-muted mb-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
							>
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
								<polyline points="14 2 14 8 20 8"></polyline>
								<line x1="12" y1="18" x2="12" y2="12"></line>
								<line x1="9" y1="15" x2="15" y2="15"></line>
							</svg>
							<h3 class="text-lg font-medium text-highlight mb-2">No files found</h3>
							<p class="text-text-base text-center max-w-md">
								{searchQuery
									? `No files matching "${searchQuery}" in ${currentFolderName()}`
									: `This folder is empty. Upload files to get started.`}
							</p>
						</div>
					{:else if currentView === 'grid'}
						<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{#each filteredFiles() as file}
								<button
									class="bg-surface/50 rounded-lg p-4 hover:bg-surface transition-colors cursor-pointer group relative w-full text-left"
									onclick={() => openFilePreview(file)}
									aria-label={`Open ${file.name}`}
								>
									<div class="flex justify-center mb-3">
										<div class="w-12 h-12 text-purple text-3xl flex items-center justify-center">
											{getFileIcon(file.type)}
										</div>
									</div>
									<div class="text-center">
										<div class="font-medium text-highlight mb-1 truncate" title={file.name}>
											{file.name}
										</div>
										<div class="flex justify-between text-xs text-text-base">
											<span>{formatFileSize(file.size)}</span>
											<span>{formatDate(file.updated_at).split(',')[0]}</span>
										</div>
									</div>
									<div
										class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<div
											class="p-1 text-text-base hover:text-text-hover cursor-pointer"
											onclick={(e) => {
												e.stopPropagation();
												// Show context menu
											}}
											onkeydown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													e.stopPropagation();
													// Show context menu
												}
											}}
											role="button"
											tabindex="0"
											aria-label="File options"
										>
											<svg
												class="w-4 h-4"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<circle cx="12" cy="12" r="1"></circle>
												<circle cx="19" cy="12" r="1"></circle>
												<circle cx="5" cy="12" r="1"></circle>
											</svg>
										</div>
									</div>
								</button>
							{/each}
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead class="text-left border-b border-border">
									<tr>
										<th class="pb-3 text-text-base font-medium">
											<button class="flex items-center gap-1" onclick={() => toggleSort('name')}>
												Name
												{#if sortBy === 'name'}
													<svg
														class="w-4 h-4"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														{#if sortDirection === 'asc'}
															<polyline points="18 15 12 9 6 15"></polyline>
														{:else}
															<polyline points="6 9 12 15 18 9"></polyline>
														{/if}
													</svg>
												{/if}
											</button>
										</th>
										<th class="pb-3 text-text-base font-medium">Type</th>
										<th class="pb-3 text-text-base font-medium">
											<button class="flex items-center gap-1" onclick={() => toggleSort('size')}>
												Size
												{#if sortBy === 'size'}
													<svg
														class="w-4 h-4"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														{#if sortDirection === 'asc'}
															<polyline points="18 15 12 9 6 15"></polyline>
														{:else}
															<polyline points="6 9 12 15 18 9"></polyline>
														{/if}
													</svg>
												{/if}
											</button>
										</th>
										<th class="pb-3 text-text-base font-medium">
											<button
												class="flex items-center gap-1"
												onclick={() => toggleSort('modified')}
											>
												Modified
												{#if sortBy === 'modified'}
													<svg
														class="w-4 h-4"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														{#if sortDirection === 'asc'}
															<polyline points="18 15 12 9 6 15"></polyline>
														{:else}
															<polyline points="6 9 12 15 18 9"></polyline>
														{/if}
													</svg>
												{/if}
											</button>
										</th>
										<th class="pb-3 text-text-base font-medium text-right">Actions</th>
									</tr>
								</thead>
								<tbody>
									{#each filteredFiles() as file}
										<tr class="border-b border-border/50 hover:bg-surface/50 transition-colors">
											<td class="py-3 text-highlight">
												<button
													class="flex items-center gap-2 hover:underline"
													onclick={() => openFilePreview(file)}
												>
													<div class="w-5 h-5 text-purple">
														{getFileIcon(file.type)}
													</div>
													<span>{file.name}</span>
												</button>
											</td>
											<td class="py-3 text-text-base uppercase text-xs">{file.type}</td>
											<td class="py-3 text-text-base">{formatFileSize(file.size)}</td>
											<td class="py-3 text-text-base">{formatDate(file.updated_at)}</td>
											<td class="py-3 text-right">
												<div class="flex justify-end gap-2">
													<button
														class="p-1 text-text-base hover:text-purple transition-colors"
														title="Share"
														aria-label="Share file"
														onclick={() => shareFile(file)}
													>
														<svg
															class="w-5 h-5"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
														>
															<circle cx="18" cy="5" r="3"></circle>
															<circle cx="6" cy="12" r="3"></circle>
															<circle cx="18" cy="19" r="3"></circle>
															<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
															<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
														</svg>
													</button>
													<button
														class="p-1 text-text-base hover:text-purple transition-colors"
														title="Download"
														aria-label="Download file"
														onclick={() => downloadFile(file)}
													>
														<svg
															class="w-5 h-5"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
														>
															<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
															<polyline points="7 10 12 15 17 10"></polyline>
															<line x1="12" y1="15" x2="12" y2="3"></line>
														</svg>
													</button>
													<button
														class="p-1 text-text-base hover:text-error transition-colors"
														title="Delete"
														aria-label="Delete file"
														onclick={() => deleteFile(file)}
													>
														<svg
															class="w-5 h-5"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
														>
															<polyline points="3 6 5 6 21 6"></polyline>
															<path
																d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
															></path>
														</svg>
													</button>
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- New Folder Modal -->
{#if showNewFolderModal}
	<div class="fixed inset-0 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center z-50">
		<div class="bg-card border border-border rounded-lg p-6 w-full max-w-md">
			<h3 class="text-xl font-bold text-highlight mb-4">Create New Folder</h3>

			<div class="mb-4">
				<label for="folder-name" class="block text-sm font-medium text-text-base mb-2"
					>Folder Name</label
				>
				<input
					id="folder-name"
					type="text"
					bind:value={newFolderName}
					placeholder="Enter folder name"
					class="input w-full"
					onkeydown={(e) => e.key === 'Enter' && createNewFolder()}
				/>
			</div>

			<div class="flex justify-end gap-3">
				<button
					class="btn btn-secondary"
					onclick={() => {
						showNewFolderModal = false;
						newFolderName = '';
					}}
				>
					Cancel
				</button>
				<button class="btn btn-primary" onclick={createNewFolder} disabled={!newFolderName.trim()}>
					Create Folder
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- File Preview Modal -->
<FilePreviewModal bind:isOpen={previewModalOpen} bind:file={selectedFile} onDelete={deleteFile} />

<!-- File Share Modal -->
<FileShareModal
	bind:isOpen={shareModalOpen}
	file={fileToShare}
	onClose={() => {
		shareModalOpen = false;
		fileToShare = null;
	}}
/>
