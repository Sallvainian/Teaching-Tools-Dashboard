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
  
  // Team management
  let newTeamName = $state('');
  let newTeamColor = $state('#3B82F6');
  
  $effect(() => {
    const loadData = async () => {
      await jeopardyStore.ensureDataLoaded();
      setActiveGame(gameId);
      isLoading = false;
    };
    loadData();
  });

  function handleAddCategory(e: Event) {
    e.preventDefault();
    if (newCategoryName.trim() && $getActiveGame) {
      addCategory(newCategoryName.trim());
      newCategoryName = '';
    }
  }

  function handleAddTeam(e: Event) {
    e.preventDefault();
    if (newTeamName.trim() && $getActiveGame) {
      addTeam(newTeamName.trim(), newTeamColor);
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
          editingQuestion.text,
          editingQuestion.answer,
          editingQuestion.pointValue,
          editingQuestion.isDoubleJeopardy,
          editingQuestion.timeLimit
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
          on:click={() => goto('/jeopardy')}
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
        on:click={() => activeTab = 'categories'}
        class="px-4 py-2 {activeTab === 'categories' ? 'bg-dark-purple text-white' : 'bg-dark-purple-bg text-dark-purple-light'} rounded-lg mr-2 hover:bg-dark-purple-hover hover:text-white transition-all duration-200"
      >
        Categories & Questions
      </button>
      <button
        on:click={() => activeTab = 'teams'}
        class="px-4 py-2 {activeTab === 'teams' ? 'bg-dark-purple text-white' : 'bg-dark-purple-bg text-dark-purple-light'} rounded-lg mr-2 hover:bg-dark-purple-hover hover:text-white transition-all duration-200"
      >
        Teams
      </button>
      <button
        on:click={() => activeTab = 'settings'}
        class="px-4 py-2 {activeTab === 'settings' ? 'bg-dark-purple text-white' : 'bg-dark-purple-bg text-dark-purple-light'} rounded-lg mr-2 hover:bg-dark-purple-hover hover:text-white transition-all duration-200"
      >
        Settings
      </button>
      <button
        on:click={() => activeTab = 'import-export'}
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
          <form on:submit={handleAddCategory} class="flex gap-3">
            <input
              type="text"
              bind:value={newCategoryName}
              placeholder="Category name"
              class="flex-1 px-3 py-2 bg-dark-bg text-gray-200 border border-dark-border rounded-lg focus:outline-none focus:border-dark-purple"
              required
            />
            <button type="submit" class="btn-primary">Add Category</button>
          </form>
        </div>

        <!-- Categories List -->
        {#each $getActiveGame.categories as category}
          <div class="card-dark">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-200">{category.name}</h3>
              <button
                on:click={() => deleteCategory(category.id)}
                class="text-dark-error hover:text-dark-error-hover transition-colors"
                aria-label="Delete category"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>

            <!-- Questions Grid -->
            <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {#each category.questions as question}
                <div class="bg-dark-bg border border-dark-border rounded-lg p-3">
                  <div class="flex justify-between items-start mb-2">
                    <div class="text-dark-purple font-bold">${question.pointValue}</div>
                    {#if question.isDoubleJeopardy}
                      <span class="text-xs bg-dark-purple text-white px-2 py-1 rounded">Daily Double</span>
                    {/if}
                  </div>
                  <p class="text-gray-300 text-sm mb-2 line-clamp-2">{question.text}</p>
                  <p class="text-gray-400 text-xs mb-3 line-clamp-1">Answer: {question.answer}</p>
                  <div class="flex gap-2">
                    <button
                      on:click={() => startEditingQuestion(category.id, question)}
                      class="flex-1 text-xs py-1 px-2 bg-dark-purple-bg text-dark-purple-light rounded hover:bg-dark-purple-hover hover:text-white transition-all duration-200"
                    >
                      Edit
                    </button>
                    <button
                      on:click={() => deleteQuestion(category.id, question.id)}
                      class="text-xs py-1 px-2 bg-dark-error text-white rounded hover:bg-dark-error-hover transition-all duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              {/each}
              
              <!-- Add Question Button -->
              <button
                on:click={() => startEditingQuestion(category.id)}
                class="bg-dark-bg border-2 border-dashed border-dark-border rounded-lg p-3 flex items-center justify-center hover:border-dark-purple transition-colors"
                aria-label="Add question"
              >
                <svg class="w-8 h-8 text-dark-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if activeTab === 'teams'}
      <div class="space-y-6">
        <!-- Add Team -->
        <div class="card-dark">
          <h3 class="text-lg font-semibold text-gray-200 mb-4">Add Team</h3>
          <form on:submit={handleAddTeam} class="flex gap-3">
            <input
              type="text"
              bind:value={newTeamName}
              placeholder="Team name"
              class="flex-1 px-3 py-2 bg-dark-bg text-gray-200 border border-dark-border rounded-lg focus:outline-none focus:border-dark-purple"
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
                on:click={() => deleteTeam(team.id)}
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
        <form on:submit={(e) => e.preventDefault()} class="space-y-4">
          <div>
            <label class="flex items-center gap-3">
              <input
                type="checkbox"
                checked={$getActiveGame.settings?.useTimer || false}
                on:change={(e) => updateGameSettings($getActiveGame.id, { ...$getActiveGame.settings, useTimer: e.currentTarget.checked })}
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
                on:change={(e) => updateGameSettings($getActiveGame.id, { ...$getActiveGame.settings, timerSize: e.currentTarget.value })}
                class="w-full px-3 py-2 bg-dark-bg text-gray-200 border border-dark-border rounded-lg focus:outline-none focus:border-dark-purple"
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
                on:change={(e) => updateGameSettings($getActiveGame.id, { ...$getActiveGame.settings, defaultTimeLimit: parseInt(e.currentTarget.value) })}
                min="10"
                max="300"
                class="w-full px-3 py-2 bg-dark-bg text-gray-200 border border-dark-border rounded-lg focus:outline-none focus:border-dark-purple"
              />
            </div>
            
            <div>
              <label for="reading-time" class="block text-sm font-medium text-gray-300 mb-2">Reading Time (seconds)</label>
              <input
                id="reading-time"
                type="number"
                value={$getActiveGame.settings?.readingTime || 5}
                on:change={(e) => updateGameSettings($getActiveGame.id, { ...$getActiveGame.settings, readingTime: parseInt(e.currentTarget.value) })}
                min="0"
                max="30"
                class="w-full px-3 py-2 bg-dark-bg text-gray-200 border border-dark-border rounded-lg focus:outline-none focus:border-dark-purple"
              />
            </div>
            
            <div>
              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={$getActiveGame.settings?.autoShowAnswer || false}
                  on:change={(e) => updateGameSettings($getActiveGame.id, { ...$getActiveGame.settings, autoShowAnswer: e.currentTarget.checked })}
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
          <button on:click={handleExportGame} class="btn-primary">
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
            on:change={handleImportGame}
            class="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-dark-purple file:text-white hover:file:bg-dark-purple-hover"
          />
        </div>

        <!-- Templates -->
        <div class="card-dark">
          <h3 class="text-lg font-semibold text-gray-200 mb-4">Apply Template</h3>
          <p class="text-gray-400 mb-4">Choose a pre-made template to apply to your game</p>
          <button on:click={() => showTemplateModal = true} class="btn-primary">
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
        <form on:submit={handleSaveQuestion} class="space-y-4">
          <div>
            <label for="question-text" class="block text-sm font-medium text-gray-300 mb-2">Question Text</label>
            <textarea
              id="question-text"
              bind:value={editingQuestion.text}
              rows="3"
              class="w-full px-3 py-2 bg-dark-bg text-gray-200 border border-dark-border rounded-lg focus:outline-none focus:border-dark-purple"
              required
            ></textarea>
          </div>
          
          <div>
            <label for="question-answer" class="block text-sm font-medium text-gray-300 mb-2">Answer</label>
            <input
              id="question-answer"
              type="text"
              bind:value={editingQuestion.answer}
              class="w-full px-3 py-2 bg-dark-bg text-gray-200 border border-dark-border rounded-lg focus:outline-none focus:border-dark-purple"
              required
            />
          </div>
          
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label for="point-value" class="block text-sm font-medium text-gray-300 mb-2">Point Value</label>
              <input
                id="point-value"
                type="number"
                bind:value={editingQuestion.pointValue}
                min="100"
                step="100"
                class="w-full px-3 py-2 bg-dark-bg text-gray-200 border border-dark-border rounded-lg focus:outline-none focus:border-dark-purple"
                required
              />
            </div>
            
            <div>
              <label for="time-limit" class="block text-sm font-medium text-gray-300 mb-2">Time Limit (seconds)</label>
              <input id="time-limit"
                type="number"
                bind:value={editingQuestion.timeLimit}
                min="10"
                max="300"
                class="w-full px-3 py-2 bg-dark-bg text-gray-200 border border-dark-border rounded-lg focus:outline-none focus:border-dark-purple"
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
              on:click={cancelEditingQuestion}
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
                on:click={() => handleApplyTemplate(template)}
                class="btn-primary"
              >
                Apply Template
              </button>
            </div>
          {/each}
        </div>
        <div class="mt-4">
          <button
            on:click={() => showTemplateModal = false}
            class="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>