<script lang="ts">
  import { onMount } from 'svelte';
  
  // Current date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Mock data for dashboard
  let totalProducts = $state(25.4);
  let totalRevenue = $state(6352400);
  let totalCollection = $state(1.3);
  
  let productSales = $state(12900);
  let developmentService = $state(9950);
  let subscription = $state(3700);
  let digitalAssets = $state(3700);
  
  let totalSales = $state(59304);
  let monthSales = $state(12661);
  let monthCustomers = $state(759);
  let monthVisitors = $state(166543);
  
  let activeVisitors = $state(49);
  
  // Chart data
  let chartLoaded = $state(false);
  
  onMount(() => {
    // Simulate chart loading
    setTimeout(() => {
      chartLoaded = true;
    }, 500);
  });
</script>

<div class="min-h-screen bg-bg-base text-text-base">
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
    
    <!-- Top Row -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <!-- Monthly Sales -->
      <div class="card-dark">
        <h2 class="text-xl font-bold text-highlight mb-4">Monthly Sales</h2>
        
        <div class="mb-4">
          <div class="text-sm text-text-base">Total product</div>
          <div class="text-2xl font-bold text-highlight">{totalProducts}k</div>
        </div>
        
        <div class="mb-4">
          <div class="text-sm text-text-base">Revenue</div>
          <div class="text-2xl font-bold text-highlight">${(totalRevenue/1000).toLocaleString()}k</div>
        </div>
        
        <div class="mb-4">
          <div class="text-sm text-text-base">Total collection</div>
          <div class="text-2xl font-bold text-highlight">{totalCollection}M</div>
        </div>
        
        <div class="w-full h-2 bg-surface rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-purple to-purple-light" style="width: 65%"></div>
        </div>
      </div>
      
      <!-- Revenue Summary -->
      <div class="card-dark">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-highlight">Revenue Summary</h2>
          <span class="text-xs text-text-base bg-surface px-2 py-1 rounded">Last 30 Days</span>
        </div>
        
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-text-base">Product Sales</span>
            <span class="text-highlight font-medium">${productSales.toLocaleString()}</span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-text-base">Development Service</span>
            <span class="text-highlight font-medium">${developmentService.toLocaleString()}</span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-text-base">Subscription</span>
            <span class="text-highlight font-medium">${subscription.toLocaleString()}</span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-text-base">Digital Assets</span>
            <span class="text-highlight font-medium">${digitalAssets.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <!-- Real-time -->
      <div class="card-dark">
        <h2 class="text-xl font-bold text-highlight mb-4">Real-time</h2>
        
        <div class="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
          <div class="text-6xl font-bold text-highlight mb-2">{activeVisitors}</div>
          <div class="text-text-base">Visiting now</div>
          
          {#if chartLoaded}
            <div class="w-full h-24 mt-4 relative overflow-hidden">
              <!-- SVG chart with gradient -->
              <svg viewBox="0 0 300 100" class="w-full h-full">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#4338ca" />
                    <stop offset="100%" stop-color="#ec4899" />
                  </linearGradient>
                </defs>
                <path 
                  d="M0,80 C20,70 40,90 60,80 C80,70 100,50 120,60 C140,70 160,90 180,80 C200,70 220,40 240,30 C260,20 280,10 300,20" 
                  fill="none" 
                  stroke="url(#gradient)" 
                  stroke-width="3"
                />
                <path 
                  d="M0,80 C20,70 40,90 60,80 C80,70 100,50 120,60 C140,70 160,90 180,80 C200,70 220,40 240,30 C260,20 280,10 300,20 L300,100 L0,100 Z" 
                  fill="url(#gradient)" 
                  fill-opacity="0.2"
                />
              </svg>
            </div>
          {:else}
            <div class="w-full h-24 mt-4 bg-surface/50 rounded-lg animate-pulse"></div>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Bottom Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Sales -->
      <div class="card-dark">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-purple">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="text-text-base">Total Sales</span>
        </div>
        
        <div class="text-3xl font-bold text-highlight">${totalSales.toLocaleString()}</div>
      </div>
      
      <!-- This Month Sales -->
      <div class="card-dark">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-purple">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <span class="text-text-base">This Month Sales</span>
        </div>
        
        <div class="text-3xl font-bold text-highlight">${monthSales.toLocaleString()}</div>
      </div>
      
      <!-- This Month Customer -->
      <div class="card-dark">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-purple">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <span class="text-text-base">This Month Customer</span>
        </div>
        
        <div class="text-3xl font-bold text-highlight">{monthCustomers.toLocaleString()}</div>
      </div>
      
      <!-- This Month Visitors -->
      <div class="card-dark">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-purple">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18" />
              <path d="M18.4 9l-6-6-7 7" />
              <path d="M8 9h10v10" />
            </svg>
          </div>
          <span class="text-text-base">This Month Visitors</span>
        </div>
        
        <div class="text-3xl font-bold text-highlight">{monthVisitors.toLocaleString()}</div>
      </div>
    </div>
  </div>
</div>