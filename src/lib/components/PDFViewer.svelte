<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let { pdfUrl = '', height = '600px' } = $props<{
		pdfUrl: string;
		height?: string;
	}>();

	// Reset state when pdfUrl changes
	$effect(() => {
		// Reset when URL changes
		if (pdfUrl && pdfDoc) {
			cleanup();
			isLoading = true;
		}
		// Clear loadedPdfUrl if the URL becomes null
		if (!pdfUrl) {
			loadedPdfUrl = null;
		}
	});

	let pdfContainer: HTMLDivElement | undefined = $state();
	let isLoading = $state(false); // Start with false since we check for URL first
	let error = $state<string | null>(null);
	let currentPage = $state(1);
	let totalPages = $state(0);
	let scale = $state(1.2);
	let isMounted = $state(false);
	let isPDFJSLoaded = $state(false);
	let isLoadingPDF = $state(false);
	let loadedPdfUrl = $state<string | null>(null);

	// PDF.js types
	interface PDFPageProxy {
		getViewport(params: { scale: number }): { width: number; height: number };
		render(params: {
			canvasContext: CanvasRenderingContext2D;
			viewport: { width: number; height: number };
		}): { promise: Promise<void> };
	}

	interface PDFDocumentProxy {
		numPages: number;
		getPage(pageNumber: number): Promise<PDFPageProxy>;
	}

	interface PDFJSLib {
		GlobalWorkerOptions: { workerSrc: string };
		getDocument(url: string): { promise: Promise<PDFDocumentProxy> };
	}

	// PDF.js variables
	let pdfjsLib: PDFJSLib | null = $state(null);
	let pdfDoc: PDFDocumentProxy | null = $state(null);

	onMount(async () => {
		isMounted = true;

		// If no PDF URL, stay in non-loading state
		if (!pdfUrl) {
			isLoading = false;
			return;
		}

		try {
			// Set loading state when we have a URL
			isLoading = true;
			// Load PDF.js from CDN
			await loadPDFJS();
			// Initial load will be handled by the $effect when container is ready
		} catch (err) {
			console.error('Error initializing PDF viewer:', err);
			error = 'Failed to load PDF viewer';
			isLoading = false;
		}
	});

	function cleanup() {
		pdfDoc = null;
		currentPage = 1;
		totalPages = 0;
		error = null;
		loadedPdfUrl = null;
	}

	onDestroy(() => {
		isMounted = false;
		isLoadingPDF = false;
		cleanup();
	});

	async function loadPDFJS() {
		return new Promise<PDFJSLib>((resolve, reject) => {
			if (
				typeof window !== 'undefined' &&
				(window as Window & typeof globalThis & { pdfjsLib: PDFJSLib }).pdfjsLib
			) {
				pdfjsLib = (window as Window & typeof globalThis & { pdfjsLib: PDFJSLib }).pdfjsLib;
				isPDFJSLoaded = true;
				resolve(pdfjsLib);
				return;
			}

			// Load PDF.js from CDN
			const script = document.createElement('script');
			script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
			script.onload = () => {
				pdfjsLib = (window as Window & typeof globalThis & { pdfjsLib: PDFJSLib }).pdfjsLib;
				if (pdfjsLib) {
					pdfjsLib.GlobalWorkerOptions.workerSrc =
						'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
					isPDFJSLoaded = true;
					resolve(pdfjsLib);
				} else {
					reject(new Error('pdfjsLib not found on window after script load'));
				}
			};
			script.onerror = (err) => {
				console.error('Failed to load PDF.js script:', err);
				reject(err);
			};
			document.head.appendChild(script);
		});
	}

	async function loadPDF() {
		if (!isMounted || !pdfjsLib || !pdfUrl || !pdfContainer || isLoadingPDF) {
			console.warn('Cannot load PDF - missing requirements');
			return;
		}

		isLoadingPDF = true;

		try {
			isLoading = true;
			error = null;

			const loadingTask = pdfjsLib.getDocument(pdfUrl);
			pdfDoc = await loadingTask.promise;
			totalPages = pdfDoc.numPages;

			await renderPage(1);
			// isLoading will be set to false in renderPage
			loadedPdfUrl = pdfUrl;
		} catch (err) {
			console.error('Error loading PDF:', err);
			error = 'Failed to load PDF document';
			isLoading = false;
		} finally {
			isLoadingPDF = false;
		}
	}

	async function renderPage(pageNumber: number) {
		if (!isMounted || !pdfDoc) {
			console.warn('Cannot render page - component not ready', {
				isMounted,
				pdfDoc: !!pdfDoc
			});
			return;
		}

		// Store reference to container at start of render
		const container = pdfContainer;
		if (!container) {
			console.error('No PDF container available');
			return;
		}
		isLoading = true;
		error = null;

		try {
			const page = await pdfDoc.getPage(pageNumber);
			const viewport = page.getViewport({ scale });

			// Ensure container is visible
			container.style.display = 'block';

			let canvas = container.querySelector('canvas');
			if (!canvas) {
				canvas = document.createElement('canvas');
				container.appendChild(canvas);
			}

			const context = canvas.getContext('2d');
			if (!context) {
				throw new Error('Could not get 2D rendering context');
			}

			canvas.height = viewport.height;
			canvas.width = viewport.width;

			container.style.width = `${viewport.width}px`;
			container.style.height = `${viewport.height}px`;

			const renderContext = {
				canvasContext: context,
				viewport: viewport
			};

			await page.render(renderContext).promise;
			currentPage = pageNumber;
			isLoading = false;
		} catch (err) {
			console.error('Error rendering page:', err);
			error = 'Failed to render PDF page';
			isLoading = false;
		}
	}

	async function nextPage() {
		if (currentPage < totalPages && pdfContainer) {
			await renderPage(currentPage + 1);
		}
	}

	async function prevPage() {
		if (currentPage > 1 && pdfContainer) {
			await renderPage(currentPage - 1);
		}
	}

	async function zoomIn() {
		if (pdfContainer) {
			scale = Math.min(scale + 0.2, 3.0);
			await renderPage(currentPage);
		}
	}

	async function zoomOut() {
		if (pdfContainer) {
			scale = Math.max(scale - 0.2, 0.5);
			await renderPage(currentPage);
		}
	}

	// Watch for URL changes
	$effect(() => {
		if (
			isMounted &&
			isPDFJSLoaded &&
			pdfUrl &&
			pdfContainer &&
			!isLoadingPDF &&
			pdfUrl !== loadedPdfUrl
		) {
			// Add a small delay to ensure container is fully rendered
			setTimeout(() => {
				if (pdfContainer && !isLoadingPDF && pdfUrl !== loadedPdfUrl) {
					loadPDF();
				}
			}, 100);
		}
	});
</script>

<div
	class="pdf-viewer bg-surface rounded-lg h-full flex flex-col"
	style="height: {height}; min-height: 400px;"
>
	{#if error}
		<div class="flex items-center justify-center h-full">
			<div class="text-center">
				<svg
					class="w-16 h-16 text-error mx-auto mb-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
				<p class="text-error font-medium mb-2">PDF Loading Error</p>
				<p class="text-text-base text-sm">{error}</p>
			</div>
		</div>
	{:else}
		{#if !isLoading}
			<!-- PDF Controls -->
			<div class="flex items-center justify-between p-3 border-b border-border bg-card">
				<div class="flex items-center gap-2">
					<button
						class="btn-icon"
						onclick={() => prevPage()}
						disabled={currentPage <= 1}
						title="Previous page"
						aria-label="Previous page"
					>
						<svg
							class="w-4 h-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="15 18 9 12 15 6"></polyline>
						</svg>
					</button>

					<span class="text-sm text-text-base">
						Page {currentPage} of {totalPages}
					</span>

					<button
						class="btn-icon"
						onclick={() => nextPage()}
						disabled={currentPage >= totalPages}
						title="Next page"
						aria-label="Next page"
					>
						<svg
							class="w-4 h-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="9 18 15 12 9 6"></polyline>
						</svg>
					</button>
				</div>

				<div class="flex items-center gap-2">
					<button class="btn-icon" onclick={() => zoomOut()} title="Zoom out" aria-label="Zoom out">
						<svg
							class="w-4 h-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="11" cy="11" r="8"></circle>
							<line x1="8" y1="11" x2="14" y2="11"></line>
							<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
						</svg>
					</button>

					<span class="text-sm text-text-base">
						{Math.round(scale * 100)}%
					</span>

					<button class="btn-icon" onclick={() => zoomIn()} title="Zoom in" aria-label="Zoom in">
						<svg
							class="w-4 h-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="11" cy="11" r="8"></circle>
							<line x1="8" y1="11" x2="14" y2="11"></line>
							<line x1="11" y1="8" x2="11" y2="14"></line>
							<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
						</svg>
					</button>
				</div>
			</div>
		{/if}

		<!-- PDF Content Area - Always rendered -->
		<div class="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-800 relative">
			{#if isLoading}
				<div
					class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10"
				>
					<div class="text-center">
						<div
							class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple mx-auto mb-4"
						></div>
						<p class="text-text-base">Loading PDF...</p>
						<p class="text-xs text-muted mt-2">
							{#if !isPDFJSLoaded}
								Loading PDF viewer library...
							{:else if !pdfDoc}
								Loading document...
							{:else}
								Rendering page...
							{/if}
						</p>
					</div>
				</div>
			{/if}

			<!-- PDF Container - Always present but may be hidden by loading overlay -->
			<div class="flex justify-center">
				<div
					bind:this={pdfContainer}
					class="pdf-canvas-container shadow-lg bg-card"
					style="opacity: {isLoading ? 0 : 1}; transition: opacity 0.3s;"
				></div>
			</div>
		</div>
	{/if}
</div>

<style lang="postcss">
	.btn-icon {
		padding: 0.5rem;
		color: var(--text-base);
		border-radius: 0.5rem;
		transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out;
	}

	.btn-icon:hover {
		color: var(--text-hover);
		background-color: var(--surface);
	}

	.btn-icon:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.pdf-canvas-container {
		min-height: 200px;
		border-radius: 4px;
		display: block;
	}
</style>
