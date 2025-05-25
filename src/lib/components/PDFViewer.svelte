<script lang="ts">
  import { onMount } from 'svelte';
  
  let { 
    pdfUrl = '',
    height = '600px' 
  } = $props<{
    pdfUrl: string;
    height?: string;
  }>();
  
  let pdfContainer: HTMLDivElement;
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let currentPage = $state(1);
  let totalPages = $state(0);
  let scale = $state(1.2);
  
  // PDF.js variables
  let pdfjsLib: any = null;
  let pdfDoc: any = null;
  
  onMount(async () => {
    try {
      // Load PDF.js from CDN
      await loadPDFJS();
      if (pdfUrl) {
        await loadPDF();
      }
    } catch (err) {
      console.error('Error initializing PDF viewer:', err);
      error = 'Failed to load PDF viewer';
      isLoading = false;
    }
  });
  
  async function loadPDFJS() {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
        pdfjsLib = (window as any).pdfjsLib;
        resolve(pdfjsLib);
        return;
      }
      
      // Load PDF.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjsLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  async function loadPDF() {
    if (!pdfjsLib || !pdfUrl) return;
    
    try {
      isLoading = true;
      error = null;
      
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      pdfDoc = await loadingTask.promise;
      totalPages = pdfDoc.numPages;
      
      await renderPage(1);
      isLoading = false;
    } catch (err) {
      console.error('Error loading PDF:', err);
      error = 'Failed to load PDF document';
      isLoading = false;
    }
  }
  
  async function renderPage(pageNum: number) {
    if (!pdfDoc || !pdfContainer) return;
    
    try {
      // Clear previous content
      pdfContainer.innerHTML = '';
      
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      
      pdfContainer.appendChild(canvas);
      
      // Render page
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      currentPage = pageNum;
    } catch (err) {
      console.error('Error rendering page:', err);
      error = 'Failed to render PDF page';
    }
  }
  
  async function nextPage() {
    if (currentPage < totalPages) {
      await renderPage(currentPage + 1);
    }
  }
  
  async function prevPage() {
    if (currentPage > 1) {
      await renderPage(currentPage - 1);
    }
  }
  
  async function zoomIn() {
    scale = Math.min(scale + 0.2, 3.0);
    await renderPage(currentPage);
  }
  
  async function zoomOut() {
    scale = Math.max(scale - 0.2, 0.5);
    await renderPage(currentPage);
  }
  
  // Watch for URL changes
  $effect(() => {
    if (pdfjsLib && pdfUrl) {
      loadPDF();
    }
  });
</script>

<div class="pdf-viewer bg-surface rounded-lg" style="height: {height}">
  {#if isLoading}
    <div class="flex items-center justify-center h-full">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple mx-auto mb-4"></div>
        <p class="text-text-base">Loading PDF...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center h-full">
      <div class="text-center">
        <svg class="w-16 h-16 text-error mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <p class="text-error font-medium mb-2">PDF Loading Error</p>
        <p class="text-text-base text-sm">{error}</p>
      </div>
    </div>
  {:else}
    <!-- PDF Controls -->
    <div class="flex items-center justify-between p-3 border-b border-border bg-card">
      <div class="flex items-center gap-2">
        <button 
          class="btn-icon" 
          onclick={prevPage} 
          disabled={currentPage <= 1}
          title="Previous page"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        
        <span class="text-sm text-text-base">
          Page {currentPage} of {totalPages}
        </span>
        
        <button 
          class="btn-icon" 
          onclick={nextPage} 
          disabled={currentPage >= totalPages}
          title="Next page"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      
      <div class="flex items-center gap-2">
        <button 
          class="btn-icon" 
          onclick={zoomOut}
          title="Zoom out"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="8" y1="11" x2="14" y2="11"></line>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        
        <span class="text-sm text-text-base">
          {Math.round(scale * 100)}%
        </span>
        
        <button 
          class="btn-icon" 
          onclick={zoomIn}
          title="Zoom in"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="8" y1="11" x2="14" y2="11"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- PDF Content -->
    <div class="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-800">
      <div class="flex justify-center">
        <div bind:this={pdfContainer} class="pdf-canvas-container shadow-lg bg-white"></div>
      </div>
    </div>
  {/if}
</div>

<style>
  .btn-icon {
    @apply p-2 text-text-base hover:text-text-hover rounded-lg hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .pdf-canvas-container {
    min-height: 200px;
    border-radius: 4px;
  }
</style>