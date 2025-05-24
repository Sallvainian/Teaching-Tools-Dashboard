<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  
  // File storage state
  let files = $state([
    { id: '1', name: 'Lesson Plan - Week 12.pdf', type: 'pdf', size: '1.2 MB', modified: '2025-05-10T14:30:00', folder: 'Lesson Plans' },
    { id: '2', name: 'Math Quiz - Fractions.docx', type: 'docx', size: '450 KB', modified: '2025-05-09T10:15:00', folder: 'Assessments' },
    { id: '3', name: 'Science Project Guidelines.pdf', type: 'pdf', size: '2.8 MB', modified: '2025-05-08T16:45:00', folder: 'Projects' },
    { id: '4', name: 'Student Progress Report.xlsx', type: 'xlsx', size: '1.5 MB', modified: '2025-05-08T09:20:00', folder: 'Reports' },
    { id: '5', name: 'Reading Comprehension Worksheet.pdf', type: 'pdf', size: '890 KB', modified: '2025-05-07T13:10:00', folder: 'Worksheets' },
    { id: '6', name: 'Classroom Rules Poster.png', type: 'image', size: '3.2 MB', modified: '2025-05-06T11:30:00', folder: 'Resources' },
    { id: '7', name: 'Parent Conference Notes.docx', type: 'docx', size: '320 KB', modified: '2025-05-05T15:45:00', folder: 'Meetings' },
    { id: '8', name: 'Geometry Lesson Slides.pptx', type: 'pptx', size: '4.5 MB', modified: '2025-05-04T10:00:00', folder: 'Presentations' }
  ]);
  
  let folders = $state([
    { id: '1', name: 'Lesson Plans', files: 12, size: '24.5 MB' },
    { id: '2', name: 'Assessments', files: 8, size: '12.3 MB' },
    { id: '3', name: 'Projects', files: 5, size: '18.7 MB' },
    { id: '4', name: 'Reports', files: 10, size: '15.2 MB' },
    { id: '5', name: 'Worksheets', files: 15, size: '22.8 MB' },
    { id: '6', name: 'Resources', files: 7, size: '35.6 MB' },
    { id: '7', name: 'Meetings', files: 4, size: '8.2 MB' },
    { id: '8', name: 'Presentations', files: 6, size: '28.4 MB' }
  ]);
  
  // UI state
  let currentView = $state('grid'); // 'grid' or 'list'
  let searchQuery = $state('');
  let selectedFolder = $state('All Files');
  let sortBy = $state('name'); // 'name', 'modified', 'size'
  let sortDirection = $state('asc'); // 'asc' or 'desc'
  let isUploading = $state(false);
  let uploadProgress = $state(0);
  let showNewFolderModal = $state(false);
  let newFolderName = $state('');
  
  // Filtered and sorted files
  let filteredFiles = $derived(getFilteredFiles());
  
  function getFilteredFiles() {
    let result = [...files];
    
    // Filter by folder
    if (selectedFolder !== 'All Files') {
      result = result.filter(file => file.folder === selectedFolder);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(file => 
        file.name.toLowerCase().includes(query) || 
        file.type.toLowerCase().includes(query)
      );
    }
    
    // Sort files
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'modified') {
        comparison = new Date(b.modified).getTime() - new Date(a.modified).getTime();
      } else if (sortBy === 'size') {
        // Convert size strings to comparable numbers (rough approximation)
        const sizeA = parseFileSize(a.size);
        const sizeB = parseFileSize(b.size);
        comparison = sizeA - sizeB;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }
  
  function parseFileSize(sizeStr: string): number {
    const value = parseFloat(sizeStr);
    if (sizeStr.includes('KB')) return value * 1024;
    if (sizeStr.includes('MB')) return value * 1024 * 1024;
    if (sizeStr.includes('GB')) return value * 1024 * 1024 * 1024;
    return value;
  }
  
  function toggleSort(column: string) {
    if (sortBy === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = column;
      sortDirection = 'asc';
    }
  }
  
  function getFileIcon(fileType: string) {
    switch (fileType) {
      case 'pdf':
        return `<svg class="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <path d="M9 15h6"></path>
                  <path d="M9 11h6"></path>
                </svg>`;
      case 'docx':
        return `<svg class="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>`;
      case 'xlsx':
        return `<svg class="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="8" y1="13" x2="16" y2="13"></line>
                  <line x1="8" y1="17" x2="16" y2="17"></line>
                  <line x1="8" y1="9" x2="10" y2="9"></line>
                </svg>`;
      case 'pptx':
        return `<svg class="w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <rect x="8" y="12" width="8" height="6" rx="1"></rect>
                </svg>`;
      case 'image':
        return `<svg class="w-8 h-8 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>`;
      default:
        return `<svg class="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>`;
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
  
  function simulateUpload() {
    if (isUploading) return;
    
    isUploading = true;
    uploadProgress = 0;
    
    const interval = setInterval(() => {
      uploadProgress += 5;
      
      if (uploadProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          isUploading = false;
          
          // Add a new mock file
          const newFile = {
            id: (files.length + 1).toString(),
            name: 'New Uploaded File.pdf',
            type: 'pdf',
            size: '2.4 MB',
            modified: new Date().toISOString(),
            folder: selectedFolder === 'All Files' ? 'Resources' : selectedFolder
          };
          
          files = [...files, newFile];
        }, 500);
      }
    }, 100);
  }
  
  function createNewFolder() {
    if (!newFolderName.trim()) return;
    
    const newFolder = {
      id: (folders.length + 1).toString(),
      name: newFolderName.trim(),
      files: 0,
      size: '0 KB'
    };
    
    folders = [...folders, newFolder];
    newFolderName = '';
    showNewFolderModal = false;
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
          <svg class="w-5 h-5 text-muted absolute left-3 top-1/2 transform -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>
      
      <div class="flex gap-2">
        <button 
          class="btn btn-primary"
          onclick={simulateUpload}
          disabled={isUploading}
        >
          <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
        
        <button 
          class="btn btn-secondary"
          onclick={() => showNewFolderModal = true}
        >
          <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line x1="12" y1="11" x2="12" y2="17"></line>
            <line x1="9" y1="14" x2="15" y2="14"></line>
          </svg>
          New Folder
        </button>
        
        <div class="flex border border-border rounded-lg overflow-hidden">
          <button 
            class={`p-2 ${currentView === 'grid' ? 'bg-purple text-white' : 'bg-surface text-text-base hover:bg-accent hover:text-text-hover'}`}
            onclick={() => currentView = 'grid'}
            title="Grid view"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button 
            class={`p-2 ${currentView === 'list' ? 'bg-purple text-white' : 'bg-surface text-text-base hover:bg-accent hover:text-text-hover'}`}
            onclick={() => currentView = 'list'}
            title="List view"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
    
    {#if isUploading}
      <div class="card-dark mb-6">
        <div class="flex items-center gap-3 mb-2">
          <svg class="w-5 h-5 text-purple animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <span class="text-highlight">Uploading file...</span>
          <span class="text-text-base ml-auto">{uploadProgress}%</span>
        </div>
        
        <div class="w-full bg-surface rounded-full h-2 overflow-hidden">
          <div class="bg-purple h-full transition-all duration-300" style={`width: ${uploadProgress}%`}></div>
        </div>
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
              class={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${selectedFolder === 'All Files' ? 'bg-purple-bg text-highlight' : 'hover:bg-surface text-text-base hover:text-text-hover'}`}
              onclick={() => selectedFolder = 'All Files'}
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6l9-4 9 4v12l-9 4-9-4V6z"></path>
                <path d="M3 6l9 4 9-4"></path>
                <path d="M12 10v10"></path>
              </svg>
              All Files
            </button>
            
            {#each folders as folder}
              <button 
                class={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${selectedFolder === folder.name ? 'bg-purple-bg text-highlight' : 'hover:bg-surface text-text-base hover:text-text-hover'}`}
                onclick={() => selectedFolder = folder.name}
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <div class="flex-1 flex justify-between items-center">
                  <span>{folder.name}</span>
                  <span class="text-xs text-muted">{folder.files}</span>
                </div>
              </button>
            {/each}
          </div>
          
          <div class="mt-6 pt-6 border-t border-border">
            <div class="text-sm text-text-base mb-2">Storage</div>
            <div class="w-full bg-surface rounded-full h-2 mb-2">
              <div class="bg-purple h-full" style="width: 65%"></div>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-text-base">6.5 GB used</span>
              <span class="text-text-base">10 GB total</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Files Display -->
      <div class="flex-1">
        <div class="card-dark">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-highlight">{selectedFolder}</h2>
            
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
                onclick={() => sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'}
                class="p-1 text-text-base hover:text-text-hover"
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          
          {#if filteredFiles.length === 0}
            <div class="flex flex-col items-center justify-center py-12">
              <svg class="w-16 h-16 text-muted mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <h3 class="text-lg font-medium text-highlight mb-2">No files found</h3>
              <p class="text-text-base text-center max-w-md">
                {searchQuery 
                  ? `No files matching "${searchQuery}" in ${selectedFolder}` 
                  : `This folder is empty. Upload files to get started.`}
              </p>
            </div>
          {:else if currentView === 'grid'}
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {#each filteredFiles as file}
                <div class="bg-surface/50 rounded-lg p-4 hover:bg-surface transition-colors cursor-pointer group">
                  <div class="flex justify-center mb-3">
                    {@html getFileIcon(file.type)}
                  </div>
                  <div class="text-center">
                    <div class="font-medium text-highlight mb-1 truncate" title={file.name}>{file.name}</div>
                    <div class="flex justify-between text-xs text-text-base">
                      <span>{file.size}</span>
                      <span>{formatDate(file.modified).split(',')[0]}</span>
                    </div>
                  </div>
                  <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-1 text-text-base hover:text-text-hover">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="text-left border-b border-border">
                  <tr>
                    <th class="pb-3 text-text-base font-medium">
                      <button 
                        class="flex items-center gap-1"
                        onclick={() => toggleSort('name')}
                      >
                        Name
                        {#if sortBy === 'name'}
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                      <button 
                        class="flex items-center gap-1"
                        onclick={() => toggleSort('size')}
                      >
                        Size
                        {#if sortBy === 'size'}
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                  {#each filteredFiles as file}
                    <tr class="border-b border-border/50 hover:bg-surface/50 transition-colors">
                      <td class="py-3 text-highlight">
                        <div class="flex items-center gap-2">
                          {@html getFileIcon(file.type)}
                          <span>{file.name}</span>
                        </div>
                      </td>
                      <td class="py-3 text-text-base uppercase text-xs">{file.type}</td>
                      <td class="py-3 text-text-base">{file.size}</td>
                      <td class="py-3 text-text-base">{formatDate(file.modified)}</td>
                      <td class="py-3 text-right">
                        <div class="flex justify-end gap-2">
                          <button class="p-1 text-text-base hover:text-purple transition-colors" title="Download">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                          </button>
                          <button class="p-1 text-text-base hover:text-purple transition-colors" title="Share">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <circle cx="18" cy="5" r="3"></circle>
                              <circle cx="6" cy="12" r="3"></circle>
                              <circle cx="18" cy="19" r="3"></circle>
                              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                          </button>
                          <button class="p-1 text-text-base hover:text-error transition-colors" title="Delete">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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
        <label for="folder-name" class="block text-sm font-medium text-text-base mb-2">Folder Name</label>
        <input 
          id="folder-name"
          type="text" 
          bind:value={newFolderName}
          placeholder="Enter folder name"
          class="input w-full"
        />
      </div>
      
      <div class="flex justify-end gap-3">
        <button 
          class="btn btn-secondary"
          onclick={() => showNewFolderModal = false}
        >
          Cancel
        </button>
        <button 
          class="btn btn-primary"
          onclick={createNewFolder}
          disabled={!newFolderName.trim()}
        >
          Create Folder
        </button>
      </div>
    </div>
  </div>
{/if}