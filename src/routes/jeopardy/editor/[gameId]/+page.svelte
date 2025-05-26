<script lang="ts">
  import { page } from '$app/stores';
  import { jeopardyStore } from '$lib/stores/jeopardy';
  import { goto } from '$app/navigation';
  import LoadingBounce from '$lib/components/LoadingBounce.svelte';
  import type { Question } from '$lib/types/jeopardy';

  const {
    getGames,
    getActiveGame,
    addCategory,
    deleteCategory,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addTeam,
    deleteTeam,
    updateGameSettings,
    setActiveGame,
    importGameData,
    exportGameData,
    getGameTemplates,
    applyGameTemplate
  } = jeopardyStore;

  let gameId = $page.params.gameId;
  let isLoading = $state(true);
  let activeTab = $state('categories');
  let showTemplateModal = $state(false);
  
  // Category management
  let newCategoryName = $state('');
  
  // Question management
  interface EditingQuestionState {
    categoryId: string;
    questionId: string;
    text: string;
    answer: string;
    pointValue: number;
    isDoubleJeopardy: boolean;
    timeLimit: number;
  }
  
  let editingQuestion = $state<EditingQuestionState>({
    categoryId: '',
    questionId: '',
    text: '',
    answer: '',
    pointValue: 100,
    isDoubleJeopardy: false,
    timeLimit: 30
  });
  
  // Point value dropdown state
  let pointValueOption = $state('100'); // '100', '200', '300', '400', '500', 'other'
  let customPointValue = $state(100);
  
  // Team management
  let newTeamName = $state('');
  let newTeamColor = $state('#3B82F6');
  
  $effect(() => {
    const loadData = async () => {
      console.log('🎮 Loading jeopardy data for game:', gameId);
      await jeopardyStore.ensureDataLoaded();
      setActiveGame(gameId);
      console.log('🎮 Active game set, loading complete');
      isLoading = false;
    };
    loadData();
  });

  function handleAddCategory(e: Event) {
    e.preventDefault();
    console.log('🎮 Adding category:', newCategoryName, 'to game:', $getActiveGame?.id);
    if (newCategoryName.trim() && $getActiveGame) {
      addCategory($getActiveGame.id, newCategoryName.trim());
      console.log('🎮 Category added successfully');
      newCategoryName = '';
    } else {
      console.log('🎮 Category add failed - missing name or game');
    }
  }

  function handleAddTeam(e: Event) {
    e.preventDefault();
    if (newTeamName.trim() && $getActiveGame) {
      addTeam($getActiveGame.id, newTeamName.trim());
      newTeamName = '';
    }
  }

  function startEditingQuestion(categoryId: string, question?: Question) {
    if (question) {
      editingQuestion = {
        categoryId,
        questionId: question.id,
        text: question.text,
        answer: question.answer,
        pointValue: question.pointValue,
        isDoubleJeopardy: question.isDoubleJeopardy || false,
        timeLimit: question.timeLimit || 30
      };
      
      // Set dropdown state based on existing point value
      const standardValues = ['100', '200', '300', '400', '500'];
      if (standardValues.includes(question.pointValue.toString())) {
        pointValueOption = question.pointValue.toString();
      } else {
        pointValueOption = 'other';
        customPointValue = question.pointValue;
      }
    } else {
      editingQuestion = {
        categoryId,
        questionId: '',
        text: '',
        answer: '',
        pointValue: 100,
        isDoubleJeopardy: false,
        timeLimit: 30
      };
      
      // Reset dropdown state
      pointValueOption = '100';
      customPointValue = 100;
    }
  }

  function handlePointValueChange() {
    if (pointValueOption === 'other') {
      editingQuestion.pointValue = customPointValue;
    } else {
      editingQuestion.pointValue = parseInt(pointValueOption);
    }
  }

  function handleSaveQuestion(e: Event) {
    e.preventDefault();
    if (editingQuestion.text.trim() && editingQuestion.answer.trim()) {
      if (editingQuestion.questionId) {
        updateQuestion(
          editingQuestion.categoryId,
          editingQuestion.questionId,
          {
            text: editingQuestion.text,
            answer: editingQuestion.answer,
            pointValue: editingQuestion.pointValue,
            isDoubleJeopardy: editingQuestion.isDoubleJeopardy,
            timeLimit: editingQuestion.timeLimit
          }
        );
      } else {
        addQuestion(
          editingQuestion.categoryId,
          {
            text: editingQuestion.text,
            answer: editingQuestion.answer,
            pointValue: editingQuestion.pointValue,
            isAnswered: false,
            isDoubleJeopardy: editingQuestion.isDoubleJeopardy,
            timeLimit: editingQuestion.timeLimit
          }
        );
      }
      cancelEditingQuestion();
    }
  }

  function cancelEditingQuestion() {
    editingQuestion = {
      categoryId: '',
      questionId: '',
      text: '',
      answer: '',
      pointValue: 100,
      isDoubleJeopardy: false,
      timeLimit: 30
    };
  }

  function handleExportGame() {
    if ($getActiveGame) {
      exportGameData($getActiveGame.id);
    }
  }

  async function handleImportGame(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && $getActiveGame) {
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        importGameData($getActiveGame.id, data);
      } catch (error) {
        alert('Invalid JSON file');
      }
    }
  }

  function handleApplyTemplate(template: any) {
    if ($getActiveGame) {
      applyGameTemplate($getActiveGame.id, template);
      showTemplateModal = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  {#if isLoading}
    <div class="flex justify-center items-center h-64">
      <LoadingBounce />
    </div>
  {:else if $getActiveGame}
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-4 mb-2">
        <button
          onclick={async () => await goto('/jeopardy')}
          class="text-dark-purple hover:text-dark-purple-hover transition-colors"
          aria-label="Back to Jeopardy games"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </button>
        <h1 class="text-3xl font-bold text-dark-highlight">Edit: {$getActiveGame.name}</h1>
      </div>
      <p class="text-dark-text">Configure categories, questions, teams, and game settings</p>
    </div>

    <!-- Tab Navigation -->
    <div class="tabs mb-6">
      <button
        onclick={() => activeTab = 'categories'}
        class="px-4 py-2 {activeTab === 'categories' ? 'bg-dark-purple text-white' : 'bg-dark-purple-bg text-dark-purple-light'} rounded-lg mr-2 hover:bg-dark-purple-hover hover:text-white transition-all duration-200"
      >
        Categories & Questions
      </button>
      <button
        onclick={() => activeTab = 'teams'}
        class="px-4 py-2 {activeTab === 'teams' ? 'bg-dark-purple text-white' : 'bg-dark-purple-bg text-dark-purple-light'} rounded-lg mr-2 hover:bg-dark-purple-hover hover:text-white transition-all duration-200"
      >
        Teams
      </button>
      <button
        onclick={() => activeTab = 'settings'}
        class="px-4 py-2 {activeTab === 'settings' ? 'bg-dark-purple text-white' : 'bg-dark-purple-bg text-dark-purple-light'} rounded-lg mr-2 hover:bg-dark-purple-hover hover:text-white transition-all duration-200"
      >
        Settings
      </button>
      <button
        onclick={() => activeTab = 'import-export'}
        class="px-4 py-2 {activeTab === 'import-export' ? 'bg-dark-purple text-white' : 'bg-dark-purple-bg text-dark-purple-light'} rounded-lg hover:bg-dark-purple-hover hover:text-white transition-all duration-200"
      >
        Import/Export
      </button>
    </div>

    <!-- Tab Content -->
    {#if activeTab === 'categories'}
      <div class="space-y-6">
        <!-- Add Category -->
        <div class="card-dark">
          <h3 class="text-lg font-semibold text-gray-200 mb-4">Add Category</h3>
          <form onsubmit={handleAddCategory} class="flex gap-3">
            <input
              type="text"
              bind:value={newCategoryName}
              placeholder="Category name"
              class="flex-1 px-3 py-2 bg-surface text-highlight border border-border rounded-lg focus:outline-none focus:border-purple"
              required
            />
            <button type="submit" class="btn-primary">Add Category</button>
          </form>
        </div>

        <!-- Jeopardy Board Preview -->
        {#if $getActiveGame.categories.length > 0}
          <div class="card-dark mb-6">
            <h3 class="text-lg font-semibold text-gray-200 mb-4">Game Board Preview</h3>
            <div class="grid gap-4 max-w-6xl mx-auto" style="grid-template-columns: repeat({$getActiveGame.categories.length}, minmax(0, 1fr));">
              {#each $getActiveGame.categories as category (category.id)}
                <div class="space-y-4">
                  <!-- Category Header -->
                  <div class="card-dark text-center py-3 relative group">
                    <h4 class="text-lg font-bold text-gray-200">{category.name}</h4>
                    <button
                      onclick={() => deleteCategory(category.id)}
                      class="absolute top-2 right-2 text-dark-error hover:text-dark-error-hover transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Delete category"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <!-- Questions sorted by point value -->
                  {#each category.questions.sort((a, b) => a.pointValue - b.pointValue) as question (question.id)}
                    <div class="relative group">
                      <button class="w-full card-dark py-6 text-center cursor-pointer hover:border-purple transition-all duration-200"
                           onclick={() => startEditingQuestion(category.id, question)}
                           type="button">
                        <div class="text-xl font-bold text-purple-light">${question.pointValue}</div>
                        {#if question.isDoubleJeopardy}
                          <div class="text-xs text-purple mt-1">Daily Double</div>
                        {/if}
                      </button>
                      <button
                        onclick={() => deleteQuestion(category.id, question.id)}
                        class="absolute top-2 right-2 text-dark-error hover:text-dark-error-hover transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Delete question"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  {/each}
                  
                  <!-- Add Question Button -->
                  <button
                    onclick={() => startEditingQuestion(category.id)}
                    class="w-full py-4 border-2 border-dashed border-gray-600 text-gray-400 hover:border-purple hover:text-purple transition-all duration-200 rounded-lg"
                  >
                    + Add Question
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    {#if activeTab === 'teams'}
      <div class="space-y-6">
        <!-- Add Team -->
        <div class="card-dark">
          <h3 class="text-lg font-semibold text-gray-200 mb-4">Add Team</h3>
          <form onsubmit={handleAddTeam} class="flex gap-3">
            <input
              type="text"
              bind:value={newTeamName}
              placeholder="Team name"
              class="flex-1 px-3 py-2 bg-surface text-highlight border border-border rounded-lg focus:outline-none focus:border-purple"
              required
            />
            <input
              type="color"
              bind:value={newTeamColor}
              class="w-20 h-10 bg-dark-bg border border-dark-border rounded-lg cursor-pointer"
            />
            <button type="submit" class="btn-primary">Add Team</button>
          </form>
        </div>

        <!-- Teams List -->
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each $getActiveGame.teams as team}
            <div class="card-dark flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-4 h-4 rounded" style="background-color: {team.color}"></div>
                <span class="text-gray-200 font-medium">{team.name}</span>
              </div>
              <button
                onclick={() => deleteTeam(team.id)}
                class="text-dark-error hover:text-dark-error-hover transition-colors"
                aria-label={`Delete team ${team.name}`}
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if activeTab === 'settings'}
      <div class="card-dark">
        <h3 class="text-lg font-semibold text-gray-200 mb-4">Game Settings</h3>
        <form onsubmit={(e) => e.preventDefault()} class="space-y-4">
          <div>
            <label class="flex items-center gap-3">
              <input
                type="checkbox"
                checked={$getActiveGame.settings?.useTimer || false}
                onchange={(e) => updateGameSettings($getActiveGame.id, { ...$getActiveGame.settings, useTimer: e.currentTarget.checked })}
                class="w-4 h-4 text-dark-purple bg-dark-bg border-gray-600 rounded focus:ring-dark-purple"
              />
              <span class="text-gray-200">Use Timer</span>
            </label>
          </div>
          
          {#if $getActiveGame.settings?.useTimer}
            <div>
              <label for="timer-size" class="block text-sm font-medium text-gray-300 mb-2">Timer Size</label>
              <select
                id="timer-size"
                value={$getActiveGame.settings?.timerSize || 'large'}
                onchange={(e) => updateGameSettings($getActiveGame.id, { ...$getActiveGame.settings, timerSize: e.currentTarget.value })}
                class="w-full px-3 py-2 bg-surface text-highlight border border-border rounded-lg focus:outline-none focus:border-purple"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            
            <div>
              <label for="default-time-limit" class="block text-sm font-medium text-gray-300 mb-2">Default Time Limit (seconds)</label>
              <input
                id="default-time-limit"
                type="number"
                value={$getActiveGame.settings?.defaultTimeLimit || 30}
                onchange={(e) => updateGameSettings($getActiveGame.id, { ...$getActiveGame.settings, defaultTimeLimit: parseInt(e.currentTarget.value) })}
                min="10"
                max="300"
                class="w-full px-3 py-2 bg-surface text-highlight border border-border rounded-lg focus:outline-none focus:border-purple"
              />
            </div>
            
            <div>
              <label for="reading-time" class="block text-sm font-medium text-gray-300 mb-2">Reading Time (seconds)</label>
              <input
                id="reading-time"
                type="number"
                value={$getActiveGame.settings?.readingTime || 5}
                onchange={(e) => updateGameSettings($getActiveGame.id, { ...$getActiveGame.settings, readingTime: parseInt(e.currentTarget.value) })}
                min="0"
                max="30"
                class="w-full px-3 py-2 bg-surface text-highlight border border-border rounded-lg focus:outline-none focus:border-purple"
              />
            </div>
            
            <div>
              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={$getActiveGame.settings?.autoShowAnswer || false}
                  onchange={(e) => updateGameSettings($getActiveGame.id, { ...$getActiveGame.settings, autoShowAnswer: e.currentTarget.checked })}
                  class="w-4 h-4 text-dark-purple bg-dark-bg border-gray-600 rounded focus:ring-dark-purple"
                />
                <span class="text-gray-200">Auto Show Answer When Timer Expires</span>
              </label>
            </div>
          {/if}
        </form>
      </div>
    {/if}

    {#if activeTab === 'import-export'}
      <div class="space-y-6">
        <!-- Export -->
        <div class="card-dark">
          <h3 class="text-lg font-semibold text-gray-200 mb-4">Export Game</h3>
          <p class="text-gray-400 mb-4">Download your game configuration as a JSON file</p>
          <button onclick={handleExportGame} class="btn-primary">
            Export Game
          </button>
        </div>

        <!-- Import -->
        <div class="card-dark">
          <h3 class="text-lg font-semibold text-gray-200 mb-4">Import Game Data</h3>
          <p class="text-gray-400 mb-4">Upload a JSON file to replace current game data</p>
          <input
            type="file"
            accept=".json"
            onchange={handleImportGame}
            class="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-dark-purple file:text-white hover:file:bg-dark-purple-hover"
          />
        </div>

        <!-- Templates -->
        <div class="card-dark">
          <h3 class="text-lg font-semibold text-gray-200 mb-4">Apply Template</h3>
          <p class="text-gray-400 mb-4">Choose a pre-made template to apply to your game</p>
          <button onclick={() => showTemplateModal = true} class="btn-primary">
            Browse Templates
          </button>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Question Editor Modal -->
  {#if editingQuestion.categoryId}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-gradient-card border border-dark-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-dark-dropdown">
        <h2 class="text-xl font-bold text-gray-200 mb-4">
          {editingQuestion.questionId ? 'Edit Question' : 'Add Question'}
        </h2>
        <form onsubmit={handleSaveQuestion} class="space-y-4">
          <div>
            <label for="question-text" class="block text-sm font-medium text-gray-300 mb-2">Question Text</label>
            <textarea
              id="question-text"
              bind:value={editingQuestion.text}
              rows="3"
              class="w-full px-3 py-2 bg-surface text-highlight border border-border rounded-lg focus:outline-none focus:border-purple"
              required
            ></textarea>
          </div>
          
          <div>
            <label for="question-answer" class="block text-sm font-medium text-gray-300 mb-2">Answer</label>
            <input
              id="question-answer"
              type="text"
              bind:value={editingQuestion.answer}
              class="w-full px-3 py-2 bg-surface text-highlight border border-border rounded-lg focus:outline-none focus:border-purple"
              required
            />
          </div>
          
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label for="point-value" class="block text-sm font-medium text-gray-300 mb-2">Point Value</label>
              <select
                id="point-value"
                bind:value={pointValueOption}
                onchange={handlePointValueChange}
                class="w-full px-3 py-2 bg-surface text-highlight border border-border rounded-lg focus:outline-none focus:border-purple"
              >
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="other">Other</option>
              </select>
              
              {#if pointValueOption === 'other'}
                <input
                  type="number"
                  bind:value={customPointValue}
                  onchange={handlePointValueChange}
                  min="1"
                  class="w-full px-3 py-2 bg-surface text-highlight border border-border rounded-lg focus:outline-none focus:border-purple mt-2"
                  placeholder="Enter custom point value"
                />
              {/if}
            </div>
            
            <div>
              <label for="time-limit" class="block text-sm font-medium text-gray-300 mb-2">Time Limit (seconds)</label>
              <input id="time-limit"
                type="number"
                bind:value={editingQuestion.timeLimit}
                min="10"
                max="300"
                class="w-full px-3 py-2 bg-surface text-highlight border border-border rounded-lg focus:outline-none focus:border-purple"
              />
            </div>
          </div>
          
          <div>
            <label class="flex items-center gap-3">
              <input
                type="checkbox"
                bind:checked={editingQuestion.isDoubleJeopardy}
                class="w-4 h-4 text-dark-purple bg-dark-bg border-gray-600 rounded focus:ring-dark-purple"
              />
              <span class="text-gray-200">Daily Double</span>
            </label>
          </div>
          
          <div class="flex gap-3">
            <button
              type="button"
              onclick={cancelEditingQuestion}
              class="flex-1 py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 py-2 px-4 bg-dark-purple text-white rounded-lg hover:bg-dark-purple-hover transition-all duration-200"
            >
              Save Question
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Template Modal -->
  {#if showTemplateModal}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-gradient-card border border-dark-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-dark-dropdown">
        <h2 class="text-xl font-bold text-gray-200 mb-4">Choose a Template</h2>
        <div class="grid gap-4">
          {#each getGameTemplates() as template}
            <div class="card-dark hover:border-dark-purple transition-all duration-300">
              <h3 class="text-lg font-semibold text-gray-200 mb-2">{template.name}</h3>
              <p class="text-gray-400 text-sm mb-3">{template.description}</p>
              <div class="text-gray-400 text-sm mb-3">
                <span>Categories: {template.categories.length}</span>
                <span class="mx-2">•</span>
                <span>Questions: {template.categories.reduce((sum, cat) => sum + cat.questions.length, 0)}</span>
              </div>
              <button
                onclick={() => handleApplyTemplate(template)}
                class="btn-primary"
              >
                Apply Template
              </button>
            </div>
          {/each}
        </div>
        <div class="mt-4">
          <button
            onclick={() => showTemplateModal = false}
            class="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>