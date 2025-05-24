<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  
  // Current date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Dashboard stats
  let totalStudents = $state(25);
  let totalClasses = $state(4);
  let totalLessons = $state(32);
  let totalFiles = $state(128);
  
  let recentUploads = $state([
    { name: 'Lesson Plan - Week 12.pdf', size: '1.2 MB', date: '2 hours ago' },
    { name: 'Math Quiz - Fractions.docx', size: '450 KB', date: '5 hours ago' },
    { name: 'Science Project Guidelines.pdf', size: '2.8 MB', date: 'Yesterday' },
    { name: 'Student Progress Report.xlsx', size: '1.5 MB', date: 'Yesterday' }
  ]);
  
  let recentMessages = $state([
    { from: 'Emily Johnson', message: 'When is the science project due?', time: '10:45 AM' },
    { from: 'Michael Smith', message: 'I submitted my math homework', time: '9:30 AM' },
    { from: 'Sarah Williams', message: 'Can we review the test questions?', time: 'Yesterday' }
  ]);
  
  let upcomingLessons = $state([
    { title: 'Algebra Fundamentals', class: 'Math 101', time: 'Today, 2:00 PM' },
    { title: 'Cell Structure & Function', class: 'Biology', time: 'Tomorrow, 10:30 AM' },
    { title: 'Essay Writing Workshop', class: 'English', time: 'Wed, 1:15 PM' }
  ]);
  
  // Chart data
  let chartLoaded = $state(false);
  
  onMount(() => {
    // Simulate chart loading
    setTimeout(() => {
      chartLoaded = true;
    }, 500);
  });
</script>

<div class="min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-3">
        <div class="text-purple">
          <svg class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-highlight">Dashboard</h1>
          <p class="text-text-base">Today, {formattedDate}</p>
        </div>
      </div>
    </div>
    
    <!-- Stats Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <!-- Students -->
      <div class="card-dark">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <span class="text-text-base">Students</span>
        </div>
        
        <div class="text-3xl font-bold text-highlight">{totalStudents}</div>
      </div>
      
      <!-- Classes -->
      <div class="card-dark">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <span class="text-text-base">Classes</span>
        </div>
        
        <div class="text-3xl font-bold text-highlight">{totalClasses}</div>
      </div>
      
      <!-- Lessons -->
      <div class="card-dark">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
            </svg>
          </div>
          <span class="text-text-base">Lessons</span>
        </div>
        
        <div class="text-3xl font-bold text-highlight">{totalLessons}</div>
      </div>
      
      <!-- Files -->
      <div class="card-dark">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <span class="text-text-base">Files</span>
        </div>
        
        <div class="text-3xl font-bold text-highlight">{totalFiles}</div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Files -->
      <div class="card-dark lg:col-span-2">
        <h2 class="text-xl font-bold text-highlight mb-4">Recent Files</h2>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="text-left border-b border-border">
              <tr>
                <th class="pb-3 text-text-base font-medium">Name</th>
                <th class="pb-3 text-text-base font-medium">Size</th>
                <th class="pb-3 text-text-base font-medium">Uploaded</th>
                <th class="pb-3 text-text-base font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {#each recentUploads as file}
                <tr class="border-b border-border/50 hover:bg-surface/50 transition-colors">
                  <td class="py-3 text-highlight">
                    <div class="flex items-center gap-2">
                      <svg class="w-5 h-5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      {file.name}
                    </div>
                  </td>
                  <td class="py-3 text-text-base">{file.size}</td>
                  <td class="py-3 text-text-base">{file.date}</td>
                  <td class="py-3 text-right">
                    <button class="text-purple hover:text-purple-hover transition-colors">
                      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        
        <div class="mt-4 flex justify-end">
          <button class="text-purple hover:text-purple-hover transition-colors text-sm flex items-center gap-1">
            View all files
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Upcoming Lessons -->
      <div class="card-dark">
        <h2 class="text-xl font-bold text-highlight mb-4">Upcoming Lessons</h2>
        
        <div class="space-y-4">
          {#each upcomingLessons as lesson}
            <div class="p-3 bg-surface/50 rounded-lg">
              <div class="font-medium text-highlight">{lesson.title}</div>
              <div class="flex justify-between mt-1">
                <span class="text-sm text-purple">{lesson.class}</span>
                <span class="text-sm text-text-base">{lesson.time}</span>
              </div>
            </div>
          {/each}
        </div>
        
        <div class="mt-4 flex justify-center">
          <button class="btn btn-primary">
            <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Add New Lesson
          </button>
        </div>
      </div>
    </div>
    
    <!-- Bottom Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <!-- Recent Messages -->
      <div class="card-dark lg:col-span-2">
        <h2 class="text-xl font-bold text-highlight mb-4">Recent Messages</h2>
        
        <div class="space-y-4">
          {#each recentMessages as message}
            <div class="p-4 bg-surface/50 rounded-lg">
              <div class="flex justify-between mb-2">
                <span class="font-medium text-highlight">{message.from}</span>
                <span class="text-sm text-text-base">{message.time}</span>
              </div>
              <p class="text-text-base">{message.message}</p>
            </div>
          {/each}
        </div>
        
        <div class="mt-4 flex justify-end">
          <button class="text-purple hover:text-purple-hover transition-colors text-sm flex items-center gap-1">
            Open Chat
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Storage Usage -->
      <div class="card-dark">
        <h2 class="text-xl font-bold text-highlight mb-4">Storage Usage</h2>
        
        <div class="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
          <div class="relative w-32 h-32 mb-4">
            <svg class="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#374151"
                stroke-width="3"
                stroke-dasharray="100, 100"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="url(#gradient-storage)"
                stroke-width="3"
                stroke-dasharray="65, 100"
                class="animate-pulse-subtle"
              />
              <defs>
                <linearGradient id="gradient-storage" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#8B5CF6" />
                  <stop offset="100%" stop-color="#A78BFA" />
                </linearGradient>
              </defs>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center flex-col">
              <span class="text-2xl font-bold text-highlight">65%</span>
              <span class="text-xs text-text-base">Used</span>
            </div>
          </div>
          
          <div class="text-center">
            <p class="text-text-base mb-1">6.5 GB of 10 GB used</p>
            <button class="text-sm text-purple hover:text-purple-hover transition-colors">
              Upgrade Storage
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>