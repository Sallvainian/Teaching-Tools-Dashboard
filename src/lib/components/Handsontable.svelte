<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type Handsontable from 'handsontable'; // Import Handsontable type

	// Define props with $props
	let {
		data = [],
		colHeaders = true as boolean | string[],
		rowHeaders = true,
		height = 400,
		width = '100%',
		licenseKey = 'non-commercial-and-evaluation',
		settings = {}
	} = $props<{
		data?: any[][];
		colHeaders?: boolean | string[];
		rowHeaders?: boolean;
		height?: number;
		width?: string | number;
		licenseKey?: string;
		settings?: any;
	}>();

	// Create Svelte event dispatcher
	const dispatch = createEventDispatcher();

	// Container reference
	let container: HTMLDivElement;
	let hotInstance = $state<Handsontable | null>(null); // Typed hotInstance

	onMount(async () => {
		try {
			// Dynamically import Handsontable to avoid SSR issues
			const Handsontable = (await import('handsontable')).default;

			// Also import CSS
			await import('handsontable/dist/handsontable.full.min.css');

			// Additional CSS for dark theme
			const darkStyles = document.createElement('style');
			darkStyles.textContent = `
        .dark-theme .handsontable {
          background-color: #111827;
          color: #F9FAFB;
        }
        
        .dark-theme .handsontable th {
          background-color: #1F2937;
          color: #9CA3AF;
          border-color: #374151;
          font-weight: 600;
        }
        
        .dark-theme .handsontable td {
          background-color: #1E293B;
          border-color: #374151;
          color: #F9FAFB;
        }
        
        .dark-theme .handsontable td.area-selection {
          background-color: rgba(139, 92, 246, 0.2) !important;
        }
        
        .dark-theme .handsontable .current {
          background-color: rgba(139, 92, 246, 0.15) !important;
        }
        
        .dark-theme .handsontable tbody th.ht__highlight,
        .dark-theme .handsontable thead th.ht__highlight {
          background-color: #374151;
        }
        
        .dark-theme .handsontable .wtBorder {
          background-color: #8B5CF6 !important;
        }
        
        .dark-theme .handsontable .copyPaste {
          border: 2px dashed #8B5CF6 !important;
        }
        
        .dark-theme .handsontable .ht_master .wtHolder::-webkit-scrollbar-track {
          background-color: #1F2937;
        }
        
        .dark-theme .handsontable .ht_master .wtHolder::-webkit-scrollbar-thumb {
          background-color: #4B5563;
          border-radius: 4px;
        }
        
        .dark-theme .handsontable .ht_master .wtHolder::-webkit-scrollbar-thumb:hover {
          background-color: #6B7280;
        }
        
        .dark-theme .handsontable .ht_master .wtHolder::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .dark-theme .handsontable .htContextMenu {
          background-color: #1F2937;
          border-color: #374151;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
        }
        
        .dark-theme .handsontable .htContextMenu table tbody tr td {
          background-color: #1F2937;
          border-color: #374151;
          color: #F9FAFB;
        }
        
        .dark-theme .handsontable .htContextMenu table tbody tr td.htDisabled {
          color: #6B7280;
        }
        
        .dark-theme .handsontable .htContextMenu table tbody tr td.htSeparator {
          border-top-color: #374151;
        }
        
        .dark-theme .handsontable .htContextMenu table tbody tr td:hover {
          background-color: #374151;
        }
        
        .dark-theme .handsontable .htFiltersMenuCondition .htUISelect {
          background-color: #1F2937;
          border-color: #374151;
          color: #F9FAFB;
        }
        
        .dark-theme .handsontable .htFiltersMenuCondition input {
          background-color: #1F2937;
          border-color: #374151;
          color: #F9FAFB;
        }
        
        .dark-theme .handsontable .htUIMultipleSelectHot {
          background-color: #1F2937;
          border-color: #374151;
        }
        
        .dark-theme .handsontable .htUIButton {
          background-color: #8B5CF6;
          border-color: #7C3AED;
          color: white;
        }
        
        .dark-theme .handsontable .htUIButton:hover {
          background-color: #7C3AED;
        }
        
        .dark-theme .handsontable .htDimmed {
          color: #9CA3AF;
        }
        
        .dark-theme .handsontable .htCheckboxRendererInput {
          accent-color: #8B5CF6;
        }
        
        .dark-theme .handsontable .htAutocompleteArrow {
          color: #9CA3AF;
        }
        
        .dark-theme .handsontable .htNoFrame {
          border: none;
        }
        
        .dark-theme .handsontable .htCore tbody tr td.htSearchResult {
          background-color: rgba(139, 92, 246, 0.3) !important;
        }
        
        .dark-theme .handsontable .htDropdownMenu {
          background-color: #1F2937;
          border-color: #374151;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
        }
        
        .dark-theme .handsontable .htDropdownMenu .ht_master .wtHolder {
          background-color: #1F2937;
        }
        
        .dark-theme .handsontable .htDropdownMenu table tbody tr td {
          background-color: #1F2937;
          color: #F9FAFB;
        }
        
        .dark-theme .handsontable .htDropdownMenu table tbody tr td.current {
          background-color: #374151;
        }
        
        .dark-theme .handsontable .htDropdownMenu table tbody tr td:hover {
          background-color: #374151;
        }
        
        .dark-theme .handsontable .htDropdownMenu .htCore tbody tr td.htSearchResult {
          background-color: rgba(139, 92, 246, 0.3) !important;
        }
        
        .dark-theme .handsontable .htCommentTextArea {
          background-color: #1F2937;
          border-color: #374151;
          color: #F9FAFB;
        }
        
        .dark-theme .handsontable .htCommentCell:after {
          border-color: #8B5CF6 transparent transparent #8B5CF6;
        }
        
        .dark-theme .handsontable .htComments {
          background-color: #1F2937;
          border-color: #374151;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
        }
        
        .dark-theme .handsontable .htCommentsCell {
          color: #F9FAFB;
        }
        
        .dark-theme .handsontable .htCommentsTextArea {
          background-color: #1F2937;
          border-color: #374151;
          color: #F9FAFB;
        }
        
        .dark-theme .handsontable .htCommentsAddButton {
          background-color: #8B5CF6;
          border-color: #7C3AED;
          color: white;
        }
        
        .dark-theme .handsontable .htCommentsAddButton:hover {
          background-color: #7C3AED;
        }
        
        .dark-theme .handsontable .htCommentsRemoveButton {
          background-color: #EF4444;
          border-color: #DC2626;
          color: white;
        }
        
        .dark-theme .handsontable .htCommentsRemoveButton:hover {
          background-color: #DC2626;
        }
        
        .dark-theme .handsontable .htCommentsCell {
          color: #F9FAFB;
        }
        
        .dark-theme .handsontable .htCommentsTextArea {
          background-color: #1F2937;
          border-color: #374151;
          color: #F9FAFB;
        }
        
        .dark-theme .handsontable .htCommentsAddButton {
          background-color: #8B5CF6;
          border-color: #7C3AED;
          color: white;
        }
        
        .dark-theme .handsontable .htCommentsAddButton:hover {
          background-color: #7C3AED;
        }
        
        .dark-theme .handsontable .htCommentsRemoveButton {
          background-color: #EF4444;
          border-color: #DC2626;
          color: white;
        }
        
        .dark-theme .handsontable .htCommentsRemoveButton:hover {
          background-color: #DC2626;
        }
      `;
			document.head.appendChild(darkStyles);

			// Initialize Handsontable with merged settings
			const mergedSettings = {
				data,
				colHeaders,
				rowHeaders,
				licenseKey,
				width,
				height,
				afterChange: (
					changes: Handsontable.CellChange[] | null,
					source: Handsontable.ChangeSource
				) => {
					if (source !== 'loadData' && changes) {
						dispatch('afterChange', { changes, source });
					}
				},
				afterSelection: (row: number, column: number, row2: number, column2: number) => {
					dispatch('afterSelection', { row, column, row2, column2 });
				},
				...settings
			};

			// Add the dark theme to the container
			container.classList.add('dark-theme');

			// Initialize Handsontable
			hotInstance = new Handsontable(container, mergedSettings);

			// Make the instance available to parent components
			dispatch('init', { hotInstance });
		} catch (error) {
			console.error('Error initializing Handsontable:', error);
		}
	});

	onDestroy(() => {
		// Clean up
		if (hotInstance) {
			hotInstance.destroy();
		}
	});

	// Method to update data from outside
	export function updateData(newData: Handsontable.RowObject[]) {
		if (hotInstance) {
			hotInstance.loadData(newData);
		}
	}

	// Method to get current data
	export function getData() {
		return hotInstance ? hotInstance.getData() : [];
	}

	// Method to refresh the table
	export function render() {
		if (hotInstance) {
			hotInstance.render();
		}
	}
</script>

<div class="relative" bind:this={container} style="width: {width}; height: {height}px;"></div>

<style>
	/* Your custom styles */
	.relative {
		position: relative;
	}
</style>
