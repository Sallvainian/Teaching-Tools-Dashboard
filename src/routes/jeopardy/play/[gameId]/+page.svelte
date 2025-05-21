<script lang="ts">
  import { page } from '$app/stores';
  import { jeopardyStore } from '$lib/stores/jeopardy';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import JeopardyTimer from '$lib/components/JeopardyTimer.svelte';
  import LoadingBounce from '$lib/components/LoadingBounce.svelte';
  import type { Question } from '$lib/types/jeopardy';

  const {
    getActiveGame,
    getActiveQuestion,
    getLeadingTeam,
    wagerAmount,
    setActiveGame,
    markQuestionAnswered,
    setActiveQuestion,
    setWagerAmount,
    updateTeamScore,
    resetAllScores,
    resetGameBoard
  } = jeopardyStore;

  let gameId = $page.params.gameId;
  let isLoading = true;
  let showAnswer = false;
  let selectedTeamId = '';
  let wagerInputValue = '0';
  
  onMount(async () => {
    await jeopardyStore.ensureDataLoaded();
    setActiveGame(gameId);
    isLoading = false;
  });

  function handleSelectQuestion(categoryId: string, questionId: string) {
    const category = $getActiveGame?.categories.find(c => c.id === categoryId);
    const question = category?.questions.find(q => q.id === questionId);
    if (question && !question.answered) {
      setActiveQuestion({
        ...question,
        categoryId,
        categoryName: category?.name || ''
      });
      showAnswer = false;
      selectedTeamId = '';
      wagerInputValue = question.pointValue.toString();
    }
  }

  function handleWagerSubmit() {
    const amount = parseInt(wagerInputValue) || 0;
    setWagerAmount(amount);
  }

  function handleAwardPoints(teamId: string, points: number) {
    if ($getActiveQuestion) {
      updateTeamScore(teamId, points);
      markQuestionAnswered($getActiveQuestion.categoryId, $getActiveQuestion.id);
      setActiveQuestion(null);
    }
  }

  function handleBackToBoard() {
    setActiveQuestion(null);
    showAnswer = false;
    selectedTeamId = '';
  }

  function handleResetScores() {
    if (confirm('Are you sure you want to reset all team scores?')) {
      resetAllScores();
    }
  }

  function handleResetBoard() {
    if (confirm('Are you sure you want to reset the entire game board?')) {
      resetGameBoard();
    }
  }
</script>

<div class="min-h-screen bg-gradient-dark">
  {#if isLoading}
    <div class="flex justify-center items-center h-screen">
      <LoadingBounce />
    </div>
  {:else if $getActiveGame}
    {#if !$getActiveQuestion}
      <!-- Game Board View -->
      <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <div class="mb-6 flex justify-between items-center">
          <div class="flex items-center gap-4">
            <button
              onclick={() => goto('/jeopardy')}
              class="text-gray-400 hover:text-gray-200 transition-colors"
              title="Back to Games"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
            </button>
            <h1 class="text-2xl font-bold text-dark-highlight">{$getActiveGame.name}</h1>
          </div>
          <div class="flex gap-2">
            <button
              onclick={handleResetScores}
              class="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm"
            >
              Reset Scores
            </button>
            <button
              onclick={handleResetBoard}
              class="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm"
            >
              Reset Board
            </button>
            <a
              href="/jeopardy/editor/{gameId}"
              class="px-3 py-1 bg-dark-purple-bg text-dark-purple-light rounded-lg hover:bg-dark-purple-hover hover:text-white transition-all duration-200 text-sm"
            >
              Edit Game
            </a>
          </div>
        </div>

        <!-- Team Scores -->
        <div class="mb-8 flex flex-wrap gap-4 justify-center">
          {#each $getActiveGame.teams as team}
            <div 
              class="card-dark px-6 py-3 {$getLeadingTeam?.id === team.id ? 'border-dark-purple ring-2 ring-dark-purple' : ''}"
              style="border-color: {team.color};"
            >
              <div class="text-gray-400 text-sm">{team.name}</div>
              <div class="text-2xl font-bold text-gray-200">${team.score}</div>
            </div>
          {/each}
        </div>

        <!-- Game Board -->
        <div class="grid gap-4 max-w-6xl mx-auto" style="grid-template-columns: repeat({$getActiveGame.categories.length}, minmax(0, 1fr));">
          {#each $getActiveGame.categories as category}
            <div class="space-y-4">
              <div class="card-dark text-center py-3">
                <h3 class="text-lg font-bold text-gray-200">{category.name}</h3>
              </div>
              {#each category.questions.sort((a, b) => a.pointValue - b.pointValue) as question}
                <button
                  onclick={() => handleSelectQuestion(category.id, question.id)}
                  disabled={question.answered}
                  class="w-full card-dark py-8 text-center transition-all duration-200 
                         {question.answered 
                           ? 'opacity-30 cursor-not-allowed' 
                           : 'hover:border-dark-purple hover:shadow-dark-glow cursor-pointer'}"
                >
                  {#if question.answered}
                    <span class="text-gray-600">-</span>
                  {:else}
                    <span class="text-2xl font-bold text-dark-purple-light">
                      ${question.pointValue}
                    </span>
                  {/if}
                </button>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Question View -->
      <div class="container mx-auto px-4 py-8 flex flex-col h-screen">
        {#if $getActiveGame?.settings?.useTimer && $getActiveGame?.settings?.timerSize !== 'small'}
          <JeopardyTimer 
            readingTime={$getActiveGame.settings.readingTime || 5}
            totalTime={$getActiveQuestion.timeLimit || $getActiveGame.settings.defaultTimeLimit || 30}
            size={$getActiveGame.settings.timerSize || 'large'}
            on:timeExpired={() => {
              if ($getActiveGame.settings?.autoShowAnswer) {
                showAnswer = true;
              }
            }}
            on:readingComplete={() => {
              // Reading phase complete, main timer starts
            }}
          />
        {/if}
        
        <div class="flex-1 flex items-center justify-center">
          <div class="w-full max-w-4xl">
            <div class="card-dark p-10 text-center relative">
              {#if $getActiveGame?.settings?.useTimer && $getActiveGame?.settings?.timerSize === 'small'}
                <JeopardyTimer 
                  readingTime={$getActiveGame.settings.readingTime || 5}
                  totalTime={$getActiveQuestion.timeLimit || $getActiveGame.settings.defaultTimeLimit || 30}
                  size="small"
                  position="corner"
                  on:timeExpired={() => {
                    if ($getActiveGame.settings?.autoShowAnswer) {
                      showAnswer = true;
                    }
                  }}
                  on:readingComplete={() => {
                    // Reading phase complete, main timer starts
                  }}
                />
              {/if}
              
              {#if $getActiveQuestion.isDoubleJeopardy}
                <div class="absolute top-4 left-4 bg-dark-purple text-white px-3 py-1 rounded-lg font-bold">
                  Daily Double
                </div>
              {/if}
              
              <div class="mb-8">
                <div class="text-lg text-gray-400 mb-2">{$getActiveQuestion.categoryName}</div>
                <div class="text-4xl font-bold text-dark-purple-light">${$getActiveQuestion.pointValue}</div>
              </div>
              
              <div class="text-2xl md:text-3xl text-gray-200 font-medium mb-8">
                {$getActiveQuestion.text}
              </div>
              
              {#if showAnswer}
                <div class="text-xl md:text-2xl text-dark-highlight font-medium mb-8 border-t border-dark-border pt-6">
                  {$getActiveQuestion.answer}
                </div>
              {/if}
              
              <div class="flex justify-center gap-4">
                <button
                  onclick={() => showAnswer = !showAnswer}
                  class="px-6 py-3 bg-dark-purple-bg text-dark-purple-light rounded-lg hover:bg-dark-purple-hover hover:text-white transition-all duration-200"
                >
                  {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </button>
                <button
                  onclick={handleBackToBoard}
                  class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
                >
                  Back to Board
                </button>
              </div>
            </div>
            
            {#if $getActiveQuestion.isDoubleJeopardy}
              <div class="card-dark mt-6 p-6">
                <h3 class="text-lg font-semibold text-gray-200 mb-4 text-center">Daily Double Wager</h3>
                <div class="flex items-center justify-center gap-3">
                  <input
                    type="number"
                    bind:value={wagerInputValue}
                    min="0"
                    max={Math.max($getActiveQuestion.pointValue * 2, 1000)}
                    class="w-32 px-3 py-2 bg-dark-bg text-gray-200 border border-dark-border rounded-lg focus:outline-none focus:border-dark-purple text-center"
                  />
                  <button
                    onclick={handleWagerSubmit}
                    class="px-4 py-2 bg-dark-purple text-white rounded-lg hover:bg-dark-purple-hover transition-all duration-200"
                  >
                    Set Wager
                  </button>
                </div>
                <p class="text-center text-gray-400 text-sm mt-2">
                  Current wager: <span class="text-gray-200 font-medium">${$wagerAmount}</span>
                </p>
              </div>
            {/if}
            
            <!-- Team Scoring -->
            <div class="card-dark mt-6 p-6">
              <h3 class="text-lg font-semibold text-gray-200 mb-4 text-center">Award Points</h3>
              <div class="grid grid-cols-2 gap-3" style="grid-template-columns: repeat(min({$getActiveGame.teams.length}, 4), minmax(0, 1fr));">
                {#each $getActiveGame.teams as team}
                  <div class="text-center">
                    <button
                      onclick={() => handleAwardPoints(team.id, $getActiveQuestion.isDoubleJeopardy ? $wagerAmount : $getActiveQuestion.pointValue)}
                      class="w-full px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                      style="background-color: {team.color}; color: white;"
                    >
                      +${$getActiveQuestion.isDoubleJeopardy ? $wagerAmount : $getActiveQuestion.pointValue}
                    </button>
                    <button
                      onclick={() => handleAwardPoints(team.id, -($getActiveQuestion.isDoubleJeopardy ? $wagerAmount : $getActiveQuestion.pointValue))}
                      class="w-full mt-2 px-4 py-2 bg-dark-error text-white rounded-lg hover:bg-dark-error-hover transition-all duration-200"
                    >
                      -${$getActiveQuestion.isDoubleJeopardy ? $wagerAmount : $getActiveQuestion.pointValue}
                    </button>
                    <div class="mt-2 text-gray-400 text-sm">{team.name}</div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  {:else}
    <div class="flex justify-center items-center h-screen">
      <div class="text-center">
        <p class="text-gray-400 mb-4">Game not found</p>
        <button
          onclick={() => goto('/jeopardy')}
          class="btn-primary"
        >
          Back to Games
        </button>
      </div>
    </div>
  {/if}
</div>