<script lang="ts">
	import type { FileMetadata } from '$lib/types/files';
	import { formatFileSize, getFileIcon } from '$lib/types/files';

	interface Props {
		file: FileMetadata;
		view?: 'grid' | 'list';
		onclick?: (event?: Event) => void;
		ondownload?: () => void;
		ondelete?: () => void;
	}

	let { file, view = 'grid', onclick, ondownload, ondelete }: Props = $props();

	const fileIcon = $derived(getFileIcon(file.type));
	const formattedSize = $derived(formatFileSize(file.size));
	const formattedDate = $derived(new Date(file.updated_at).toLocaleDateString());
</script>

{#if view === 'grid'}
	<div
		class="card-dark p-4 cursor-pointer hover:bg-accent transition-colors group"
		role="button"
		tabindex="0"
		{onclick}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') onclick?.(e);
		}}
	>
		<div class="flex flex-col items-center gap-3">
			<div class="text-4xl">{fileIcon}</div>
			<div class="text-center w-full">
				<p class="text-highlight font-medium truncate">{file.name}</p>
				<p class="text-muted text-sm">{formattedSize}</p>
			</div>
		</div>

		<div class="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
			<button
				onclick={(e) => {
					e.stopPropagation();
					ondownload?.();
				}}
				class="flex-1 p-1 bg-purple hover:bg-purple-hover rounded text-highlight text-sm"
				title="Download"
				aria-label="Download file"
			>
				<svg
					class="w-4 h-4 mx-auto"
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
				onclick={(e) => {
					e.stopPropagation();
					ondelete?.();
				}}
				class="flex-1 p-1 bg-error hover:bg-error-hover rounded text-highlight text-sm"
				title="Delete"
				aria-label="Delete file"
			>
				<svg
					class="w-4 h-4 mx-auto"
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
	</div>
{:else}
	<div
		class="card-dark p-4 cursor-pointer hover:bg-accent transition-colors group"
		role="button"
		tabindex="0"
		{onclick}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') onclick?.(e);
		}}
	>
		<div class="flex items-center gap-4">
			<div class="text-2xl flex-shrink-0">{fileIcon}</div>
			<div class="flex-1 min-w-0">
				<p class="text-highlight font-medium truncate">{file.name}</p>
				<p class="text-muted text-sm">
					{file.type.toUpperCase()} • {formattedSize} • {formattedDate}
				</p>
			</div>
			<div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
				<button
					onclick={(e) => {
						e.stopPropagation();
						ondownload?.();
					}}
					class="p-2 bg-purple hover:bg-purple-hover rounded text-highlight"
					title="Download"
					aria-label="Download file"
				>
					<svg
						class="w-4 h-4"
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
					onclick={(e) => {
						e.stopPropagation();
						ondelete?.();
					}}
					class="p-2 bg-error hover:bg-error-hover rounded text-highlight"
					title="Delete"
					aria-label="Delete file"
				>
					<svg
						class="w-4 h-4"
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
		</div>
	</div>
{/if}
