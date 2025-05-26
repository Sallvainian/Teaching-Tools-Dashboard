<script lang="ts">
	import type { LogEntry } from '$lib/types/log-entries';

	// Using $props() for component props
	interface Props {
		logs: LogEntry[];
		onselect?: (logId: string) => void;
		ondelete?: (logId: string) => void;
		onrestore?: (log: LogEntry) => void;
		onbulkdelete?: (logIds: string[]) => void;
	}

	let { logs = [], onselect, ondelete, onrestore, onbulkdelete }: Props = $props();

	// State for handling deletion confirmation and selection
	let itemsToConfirmDelete = $state<Record<string, boolean>>({});
	let selectedItems = $state<Record<string, boolean>>({});
	let showBulkActions = $state(false);
	let selectAll = $state(false);

	// Undo functionality
	let lastDeletedItem = $state<LogEntry | null>(null);
	let showUndoBar = $state(false);
	let undoTimeout = $state<ReturnType<typeof setTimeout> | undefined>(undefined);

	// Derived values
	let selectedCount = $derived(Object.values(selectedItems).filter(Boolean).length);

	function handleSelectLog(logId: string) {
		if (showBulkActions) {
			toggleSelection(logId);
		} else {
			onselect?.(logId);
		}
	}

	function confirmDelete(logId: string) {
		itemsToConfirmDelete[logId] = true;

		// Auto-reset after 5 seconds
		setTimeout(() => {
			itemsToConfirmDelete[logId] = false;
		}, 5000);
	}

	function handleDeleteLog(event: Event, logId: string, log: LogEntry) {
		event.stopPropagation();

		if (itemsToConfirmDelete[logId]) {
			// This is the confirmation click - actual delete
			lastDeletedItem = log;
			showUndoBanner();

			ondelete?.(logId);
			itemsToConfirmDelete[logId] = false;
		} else {
			// First click - show confirmation
			confirmDelete(logId);
		}
	}

	function showUndoBanner() {
		// Clear any existing timeout
		if (undoTimeout) clearTimeout(undoTimeout);

		showUndoBar = true;

		// Auto-hide after 10 seconds
		undoTimeout = setTimeout(() => {
			showUndoBar = false;
			lastDeletedItem = null;
		}, 10000);
	}

	function handleUndo() {
		if (lastDeletedItem) {
			onrestore?.(lastDeletedItem);
			showUndoBar = false;
			lastDeletedItem = null;
			if (undoTimeout) clearTimeout(undoTimeout);
		}
	}

	// Bulk selection functionality
	function toggleBulkMode() {
		showBulkActions = !showBulkActions;
		if (!showBulkActions) {
			// Clear selections when exiting bulk mode
			selectedItems = {};
			selectAll = false;
		}
	}

	function toggleSelection(logId: string) {
		selectedItems[logId] = !selectedItems[logId];

		// Update selectAll based on current selections
		selectAll = selectedCount === logs.length;
	}

	function handleSelectAll() {
		selectAll = !selectAll;

		if (selectAll) {
			// Select all items
			logs.forEach((log) => {
				selectedItems[log.id] = true;
			});
		} else {
			// Deselect all items
			selectedItems = {};
		}
	}

	function handleBulkDelete() {
		const selectedIds = Object.entries(selectedItems)
			.filter(([_id, selected]) => selected)
			.map(([id, _selectedVal]) => id);

		if (selectedIds.length > 0) {
			if (confirm(`Delete ${selectedIds.length} log entries?`)) {
				onbulkdelete?.(selectedIds);
				selectedItems = {};
				selectAll = false;
			}
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString();
	}

	function truncateText(text: string, maxLength: number) {
		if (!text) return '';
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}
</script>

<div class="space-y-4">
	{#if showBulkActions}
		<div class="bg-card border border-border rounded-xl p-4 mb-4 flex justify-between items-center">
			<div class="flex items-center space-x-2">
				<input
					type="checkbox"
					checked={selectAll}
					onchange={handleSelectAll}
					class="h-4 w-4 rounded border-border text-purple"
				/>
				<span class="text-highlight">Select All</span>
			</div>
			<div class="flex space-x-2">
				<button
					class="px-3 py-1 text-text-base hover:text-highlight transition-colors"
					onclick={toggleBulkMode}
					aria-label="Cancel bulk selection mode"
				>
					Cancel
				</button>
				<button
					class="px-3 py-1 bg-error text-highlight rounded-lg hover:bg-error-hover transition-colors"
					onclick={handleBulkDelete}
					aria-label="Delete selected log entries"
				>
					Delete Selected
				</button>
			</div>
		</div>
	{:else}
		<div class="flex justify-end mb-4">
			<button
				class="px-3 py-1 text-gray-300 hover:text-white transition-colors"
				onclick={toggleBulkMode}
				aria-label="Enable bulk selection mode"
			>
				Select Multiple
			</button>
		</div>
	{/if}

	{#each logs as log (log.id)}
		<div
			class="bg-card border border-border rounded-xl p-4 mb-2 relative cursor-pointer hover:border-purple transition-colors"
			onclick={() => handleSelectLog(log.id)}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleSelectLog(log.id);
				}
			}}
			role="button"
			tabindex="0"
		>
			<!-- Content area with conditional padding -->
			<div class={showBulkActions ? 'ml-8' : ''}>
				<!-- Checkbox for bulk selection mode -->
				{#if showBulkActions}
					<div class="absolute left-4 top-1/2 transform -translate-y-1/2">
						<input
							type="checkbox"
							checked={selectedItems[log.id] || false}
							onchange={() => toggleSelection(log.id)}
							onclick={(e) => e.stopPropagation()}
							class="h-5 w-5 rounded border-border text-purple"
						/>
					</div>
				{/if}

				<!-- Entry header -->
				<div class="flex justify-between items-start mb-2">
					<div>
						<h3 class="text-lg font-semibold text-highlight">{log.student}</h3>
						<p class="text-sm text-muted">{formatDate(log.date)}</p>
					</div>
					<div class="flex items-center gap-2">
						{#if log.tags && log.tags.length > 0}
							<div class="flex gap-2">
								{#each log.tags?.slice(0, 3) || [] as tag (tag)}
									<span class="px-2 py-1 bg-accent text-xs text-text-base rounded-full">
										{tag}
									</span>
								{/each}
								{#if log.tags && log.tags.length > 3}
									<span class="px-2 py-1 bg-accent text-xs text-text-base rounded-full">
										+{log.tags.length - 3}
									</span>
								{/if}
							</div>
						{/if}
						{#if !showBulkActions}
							<button
								class="text-muted hover:text-error transition-colors p-1 rounded-full"
								onclick={(e) => handleDeleteLog(e, log.id, log)}
								onkeydown={() => {}}
								title={itemsToConfirmDelete[log.id]
									? 'Click to confirm deletion'
									: 'Delete log entry'}
								aria-label={itemsToConfirmDelete[log.id]
									? 'Confirm deletion of log entry'
									: 'Delete log entry'}
							>
								{#if itemsToConfirmDelete[log.id]}
									<span class="text-error font-medium text-sm px-2">Confirm?</span>
								{:else}
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
								{/if}
							</button>
						{/if}
					</div>
				</div>

				<!-- Log entry content -->
				<p class="text-text-base">
					{truncateText(log.observation, 200)}
				</p>

				<!-- Follow-up indicator -->
				{#if log.follow_up}
					<div class="mt-2 pt-2 border-t border-border">
						<p class="text-sm text-purple-light">Follow-up required</p>
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>

<!-- Undo notification banner -->
{#if showUndoBar}
	<div
		class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-surface border border-border rounded-lg shadow-dropdown p-4 flex items-center space-x-4 z-50"
	>
		<span class="text-highlight">Entry deleted</span>
		<button
			class="px-3 py-1 bg-purple text-white rounded-lg hover:bg-purple-hover transition-colors"
			onclick={handleUndo}
			aria-label="Undo deletion"
		>
			Undo
		</button>
	</div>
{/if}
