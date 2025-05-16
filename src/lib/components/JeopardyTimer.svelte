<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { TimerSize } from '$lib/types/jeopardy';
  
  let { 
    readingTime = 5,
    totalTime = 30,
    onTimeExpired = () => {},
    onReadingComplete = () => {},
    startImmediately = true,
    size = 'large' as TimerSize,
    position = 'top' // 'top' for large/medium, 'corner' for small
  } = $props();
  
  let currentTime = $state(0);
  let isReading = $state(true);
  let timerInterval: number | null = null;
  let isActive = $state(false);
  
  let progress = $derived(
    isReading 
      ? (currentTime / readingTime) * 100
      : ((totalTime - currentTime) / totalTime) * 100
  );
    
  let timeDisplay = $derived(
    isReading
      ? Math.ceil(readingTime - currentTime)
      : Math.ceil(totalTime - currentTime)
  );
  
  function startTimer() {
    if (timerInterval) return;
    
    isActive = true;
    currentTime = 0;
    isReading = true;
    
    timerInterval = window.setInterval(() => {
      currentTime += 0.1;
      
      if (isReading && currentTime >= readingTime) {
        isReading = false;
        currentTime = 0;
        onReadingComplete();
      } else if (!isReading && currentTime >= totalTime) {
        stopTimer();
        onTimeExpired();
      }
    }, 100);
  }
  
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    isActive = false;
  }
  
  function reset() {
    stopTimer();
    currentTime = 0;
    isReading = true;
  }
  
  onMount(() => {
    if (startImmediately) {
      startTimer();
    }
  });
  
  onDestroy(() => {
    stopTimer();
  });
</script>

{#if size === 'small'}
  <div class="timer-small" class:corner={position === 'corner'}>
    <div class="timer-small-bar-background">
      <div 
        class="timer-small-bar"
        class:reading={isReading}
        class:countdown={!isReading}
        style="width: {progress}%"
      ></div>
    </div>
    <div class="timer-small-display">
      <span class="time-value-small">{timeDisplay}s</span>
    </div>
  </div>
{:else}
  <div class="timer-container" class:medium={size === 'medium'}>
    <div class="timer-bar-background">
      <div 
        class="timer-bar"
        class:reading={isReading}
        class:countdown={!isReading}
        style="width: {progress}%"
      ></div>
    </div>
    
    <div class="timer-display">
      {#if isReading}
        <span class="reading-label">Get Ready!</span>
      {/if}
      <span class="time-value">{timeDisplay}</span>
      {#if !isReading}
        <span class="seconds-label">seconds</span>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Large and medium timer styles */
  .timer-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto 1.5rem;
    padding: 1rem;
    background: rgba(30, 30, 40, 0.9);
    border-radius: 12px;
    border: 2px solid rgba(100, 80, 200, 0.3);
  }
  
  .timer-container.medium {
    max-width: 800px;
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .timer-bar-background {
    width: 100%;
    height: 30px;
    background: rgba(50, 50, 60, 0.8);
    border-radius: 15px;
    overflow: hidden;
    position: relative;
    margin-bottom: 1rem;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .medium .timer-bar-background {
    height: 24px;
    margin-bottom: 0.75rem;
  }
  
  .timer-bar {
    height: 100%;
    transition: width 0.1s linear;
    position: relative;
    overflow: hidden;
    border-radius: 15px;
  }
  
  .timer-bar::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    100% {
      transform: translateX(200%);
    }
  }
  
  .timer-bar.reading {
    background: linear-gradient(90deg, #4CAF50, #66BB6A);
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
  }
  
  .timer-bar.countdown {
    background: linear-gradient(90deg, #FF6B6B, #EE5A24);
    box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
  }
  
  .timer-bar.countdown[style*="width: 2"] {
    background: linear-gradient(90deg, #FF4757, #EE5A24);
    animation: pulse 0.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scaleY(1);
    }
    50% {
      transform: scaleY(0.95);
    }
  }
  
  .timer-display {
    text-align: center;
    color: white;
  }
  
  .medium .timer-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .reading-label {
    display: block;
    font-size: 1.2rem;
    font-weight: 600;
    color: #66BB6A;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  
  .medium .reading-label {
    font-size: 1rem;
    margin-bottom: 0;
  }
  
  .time-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  }
  
  .medium .time-value {
    font-size: 1.8rem;
  }
  
  .seconds-label {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.7);
    margin-left: 0.5rem;
  }
  
  .medium .seconds-label {
    font-size: 0.875rem;
  }
  
  /* Small timer styles */
  .timer-small {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(30, 30, 40, 0.95);
    border-radius: 8px;
    padding: 0.5rem;
    border: 1px solid rgba(100, 80, 200, 0.3);
    min-width: 120px;
    z-index: 10;
  }
  
  .timer-small.corner {
    top: 10px;
    right: 10px;
  }
  
  .timer-small-bar-background {
    width: 100%;
    height: 6px;
    background: rgba(50, 50, 60, 0.8);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.25rem;
  }
  
  .timer-small-bar {
    height: 100%;
    transition: width 0.1s linear;
    border-radius: 3px;
  }
  
  .timer-small-bar.reading {
    background: #66BB6A;
  }
  
  .timer-small-bar.countdown {
    background: #FF6B6B;
  }
  
  .timer-small-display {
    text-align: center;
    color: white;
  }
  
  .time-value-small {
    font-size: 1rem;
    font-weight: 600;
    color: white;
  }
</style>