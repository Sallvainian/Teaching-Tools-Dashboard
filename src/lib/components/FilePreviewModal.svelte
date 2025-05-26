<script lang="ts">
  import type { FileMetadata } from '$lib/types/files';
  import { getFileType } from '$lib/types/files';
  import { fileService } from '$lib/services/fileService';
  import PDFViewer from './PDFViewer.svelte';
  
  let { 
    isOpen = $bindable(false), 
    file = $bindable<FileMetadata | null>(null),
    onDelete = $bindable<((file: FileMetadata) => void) | undefined>(undefined)
  } = $props<{
    isOpen: boolean;
    file: FileMetadata | null;
    onDelete?: (file: FileMetadata) => void;
  }>();
  
  let imageUrl = $state<string | null>(null);
  let pdfUrl = $state<string | null>(null);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  
  // Watch for file changes
  $effect(() => {
    if (file && isOpen) {
      loadFilePreview();
    } else {
      cleanup();
    }
  });
  
  async function loadFilePreview() {
    if (!file) return;
    
    const fileType = getFileType(file.name).toLowerCase();
    
    // Handle images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      isLoading = true;
      error = null;
      
      try {
        const url = await fileService.getFileUrl(file.storage_path);
        if (url) {
          imageUrl = url;
        } else {
          error = 'Failed to load image';
        }
      } catch (err) {
        console.error('Error loading image:', err);
        error = 'Failed to load image';
      } finally {
        isLoading = false;
      }
    }
    
    // Handle PDFs
    if (fileType === 'pdf') {
      isLoading = true;
      error = null;
      
      try {
        const url = await fileService.getFileUrl(file.storage_path);
        if (url) {
          pdfUrl = url;
        } else {
          error = 'Failed to load PDF';
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        error = 'Failed to load PDF';
      } finally {
        isLoading = false;
      }
    }
  }
  
  function cleanup() {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      imageUrl = null;
    }
    pdfUrl = null;
    error = null;
    isLoading = false;
  }
  
  function closeModal() {
    isOpen = false;
    file = null;
  }
  
  function openInNewTab() {
    if (!file) return;
    
    // For non-image files, open in new tab for browser native viewing
    fileService.getFileUrl(file.storage_path).then(url => {
      if (url) {
        window.open(url, '_blank');
      }
    });
  }
  
  function getPreviewContent() {
    if (!file) return null;
    
    const fileType = getFileType(file.name).toLowerCase();
    
    // Image preview
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return 'image';
    }
    
    // PDF preview (for future PDF.js integration)
    if (fileType === 'pdf') {
      return 'pdf';
    }
    
    // Text files
    if (['txt', 'csv', 'json', 'md'].includes(fileType)) {
      return 'text';
    }
    
    // Office documents
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileType)) {
      return 'office';
    }
    
    return 'unsupported';
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
  
  async function handleDelete() {
    if (!file) return;
    
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      if (onDelete) {
        onDelete(file);
      }
      closeModal();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && file}
  <div class="fixed inset-0 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-card border border-border rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-border">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-purple-bg flex items-center justify-center text-purple">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-highlight">{file.name}</h3>
            <p class="text-sm text-text-base">{getFileType(file.name).toUpperCase()} • {Math.round(file.size / 1024)}KB</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            class="btn btn-secondary"
            onclick={openInNewTab}
            title="Open in new tab"
          >
            <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Open
          </button>
          {#if onDelete}
            <button 
              class="btn btn-error"
              onclick={handleDelete}
              title="Delete file"
            >
              <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete
            </button>
          {/if}
          <button 
            class="p-2 text-text-base hover:text-text-hover rounded-lg hover:bg-surface transition-colors"
            onclick={closeModal}
            title="Close"
            aria-label="Close modal"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Content -->
      <div class="flex-1 overflow-auto">
        {#if getPreviewContent() === 'image'}
          {#if isLoading}
            <div class="flex items-center justify-center h-64">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple"></div>
            </div>
          {:else if error}
            <div class="flex flex-col items-center justify-center h-64 text-center">
              <svg class="w-16 h-16 text-muted mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <p class="text-text-base">{error}</p>
              <button class="btn btn-secondary mt-4" onclick={openInNewTab}>
                Try opening in new tab
              </button>
            </div>
          {:else if imageUrl}
            <div class="p-4">
              <img 
                src={imageUrl} 
                alt={file.name}
                class="max-w-full max-h-[60vh] mx-auto rounded-lg shadow-lg"
                style="object-fit: contain;"
              />
            </div>
          {/if}
        {:else if getPreviewContent() === 'pdf'}
          {#if isLoading}
            <div class="flex items-center justify-center h-64">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple mb-4"></div>
              <p class="text-text-base">Loading PDF...</p>
            </div>
          {:else if error}
            <div class="flex flex-col items-center justify-center h-64 text-center">
              <svg class="w-16 h-16 text-error mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <p class="text-error font-medium mb-2">Failed to load PDF</p>
              <p class="text-text-base mb-4">{error}</p>
              <button class="btn btn-secondary" onclick={openInNewTab}>
                Try opening in new tab
              </button>
            </div>
          {:else if pdfUrl}
            <div class="h-[70vh]">
              <PDFViewer pdfUrl={pdfUrl} height="100%" />
            </div>
          {/if}
        {:else}
          <!-- Other file types -->
          <div class="flex flex-col items-center justify-center h-64 text-center p-8">
            <svg class="w-16 h-16 text-muted mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <h4 class="text-lg font-medium text-highlight mb-2">File Preview</h4>
            <p class="text-text-base mb-4">
              {#if getPreviewContent() === 'office'}
                This office document can be opened in a new tab for viewing.
              {:else if getPreviewContent() === 'text'}
                This text file can be opened in a new tab for viewing.
              {:else}
                This file type doesn't support inline preview. You can download or open it in a new tab.
              {/if}
            </p>
            <button class="btn btn-primary" onclick={openInNewTab}>
              <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              Open File
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}