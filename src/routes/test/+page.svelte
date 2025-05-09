<script lang="ts">
	import { AgGrid } from 'ag-grid-svelte5-extended';
	import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
	import TestHeadlessUI from '$lib/components/TestHeadlessUI.svelte';

	// Sample data for testing
	const rowData = [
		{ id: '1', student: 'Alice', assignment1: 95, assignment2: 88, average: 91.5 },
		{ id: '2', student: 'Bob', assignment1: 82, assignment2: 90, average: 86 },
		{ id: '3', student: 'Charlie', assignment1: 76, assignment2: 81, average: 78.5 },
		{ id: '4', student: 'Diana', assignment1: 91, assignment2: 93, average: 92 }
	];

	// Column definitions
	const columnDefs = [
		{
			headerName: 'Student',
			field: 'student',
			editable: false
		},
		{
			headerName: 'Assignment 1',
			field: 'assignment1',
			editable: true
		},
		{
			headerName: 'Assignment 2',
			field: 'assignment2',
			editable: true
		},
		{
			headerName: 'Average',
			field: 'average',
			editable: false
		}
	];

	// Simple grid options
	const gridOptions = {
		defaultColDef: {
			sortable: true,
			filter: true
		},
		getRowId: (params) => params.data.id
	};

	// Module for grid
	const modules = [ClientSideRowModelModule];
</script>

<div class="min-h-screen py-8 px-6">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-white mb-2">AG Grid Test Page</h1>
		<p class="text-dark-muted">Testing the AG Grid implementation</p>
	</div>

	<div class="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-dark-card mb-8">
		<div class="p-4 border-b border-dark-border bg-dark-surface">
			<h3 class="font-medium text-white">Grid Implementation</h3>
		</div>
		<div class="h-[400px]">
			<AgGrid
				gridClass="ag-theme-material w-full h-full"
				{gridOptions}
				{rowData}
				{columnDefs}
				{modules}
			/>
		</div>
	</div>

	<div class="bg-white shadow-xl rounded-lg overflow-hidden dark:bg-gray-800 mt-12">
		<div class="px-6 py-8">
			<h2 class="text-xl font-semibold text-gray-800 mb-4 dark:text-gray-200">
				HeadlessUI Component Demo
			</h2>
			<TestHeadlessUI />
		</div>
	</div>
</div>

<style>
/* Basic styling for AG Grid dark theme */
:global(.ag-theme-material) {
  --ag-background-color: #121212 !important;
  --ag-header-background-color: #1e1e1e !important;
  --ag-foreground-color: #e0e0e0 !important;
  --ag-border-color: #333333 !important;
}
</style>