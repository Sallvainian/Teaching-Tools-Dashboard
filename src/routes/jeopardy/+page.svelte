<script lang="ts">
  import { jeopardyStore } from '$lib/stores/jeopardy';
  import { onMount } from 'svelte';
  import { nanoid } from 'nanoid';

  // Access the store
  const {
    getGames,
    getActiveGame,
    getActiveQuestion,
    getLeadingTeam,
    editMode,
    createGame,
    updateGame,
    deleteGame,
    setActiveGame,
    setEditMode,
    addCategory,
    updateCategory,
    deleteCategory,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    markQuestionAnswered,
    setActiveQuestion,
    addTeam,
    updateTeam,
    deleteTeam,
    updateTeamScore,
    resetAllScores,
    resetGameBoard,
    importGameData
  } = jeopardyStore;

  // Game creation/edit state
  let newGameName = '';
  let newCategoryName = '';
  let newTeamName = '';
  let newTeamColor = '#3B82F6';
  
  // Question editing state
  let editingQuestion = {
    categoryId: '',
    questionId: '',
    text: '',
    answer: '',
    pointValue: 100
  };
  
  // Import state
  let importError = '';
  let importSuccess = false;
  
  // Current question display state
  let showAnswer = false;
  let selectedTeamId = '';
  
  // Create a new game
  function handleCreateGame() {
    if (newGameName.trim()) {
      const gameId = createGame(newGameName.trim());
      setActiveGame(gameId);
      setEditMode(true);
      newGameName = '';
    }
  }
  
  // Add a new category to the active game
  function handleAddCategory() {
    const game = $getActiveGame;
    if (game && newCategoryName.trim()) {
      addCategory(game.id, newCategoryName.trim());
      newCategoryName = '';
    }
  }
  
  // Edit a question
  function openEditQuestion(categoryId: string, question = null) {
    if (question) {
      editingQuestion = {
        categoryId,
        questionId: question.id,
        text: question.text,
        answer: question.answer,
        pointValue: question.pointValue
      };
    } else {
      editingQuestion = {
        categoryId,
        questionId: '',
        text: '',
        answer: '',
        pointValue: 100
      };
    }
  }
  
  // Save question edits
  function handleSaveQuestion() {
    const game = $getActiveGame;
    if (!game) return;
    
    if (editingQuestion.questionId) {
      // Update existing question
      updateQuestion(
        game.id, 
        editingQuestion.categoryId, 
        editingQuestion.questionId, 
        {
          text: editingQuestion.text,
          answer: editingQuestion.answer,
          pointValue: editingQuestion.pointValue
        }
      );
    } else {
      // Add new question
      addQuestion(
        game.id,
        editingQuestion.categoryId,
        editingQuestion.text,
        editingQuestion.answer,
        editingQuestion.pointValue
      );
    }
    
    // Reset editing state
    editingQuestion = {
      categoryId: '',
      questionId: '',
      text: '',
      answer: '',
      pointValue: 100
    };
  }
  
  // Delete a question
  function handleDeleteQuestion() {
    const game = $getActiveGame;
    if (!game || !editingQuestion.questionId) return;
    
    deleteQuestion(game.id, editingQuestion.categoryId, editingQuestion.questionId);
    
    // Reset editing state
    editingQuestion = {
      categoryId: '',
      questionId: '',
      text: '',
      answer: '',
      pointValue: 100
    };
  }
  
  // Add a new team
  function handleAddTeam() {
    const game = $getActiveGame;
    if (game && newTeamName.trim()) {
      addTeam(game.id, newTeamName.trim(), newTeamColor);
      newTeamName = '';
      newTeamColor = '#' + Math.floor(Math.random()*16777215).toString(16); // Random color
    }
  }
  
  // Open a question in play mode
  function handleOpenQuestion(categoryId: string, questionId: string) {
    const game = $getActiveGame;
    if (!game) return;
    
    const category = game.categories.find(c => c.id === categoryId);
    if (!category) return;
    
    const question = category.questions.find(q => q.id === questionId);
    if (!question || question.isAnswered) return;
    
    setActiveQuestion(questionId);
    showAnswer = false;
    selectedTeamId = '';
  }
  
  // Award points to a team
  function handleAwardPoints() {
    const game = $getActiveGame;
    const question = $getActiveQuestion;
    
    if (!game || !question || !selectedTeamId) return;
    
    updateTeamScore(game.id, selectedTeamId, question.pointValue);
    markQuestionAnswered(game.id, question.categoryId, question.id);
    setActiveQuestion(null);
  }
  
  // Deduct points from a team
  function handleDeductPoints() {
    const game = $getActiveGame;
    const question = $getActiveQuestion;
    
    if (!game || !question || !selectedTeamId) return;
    
    updateTeamScore(game.id, selectedTeamId, -question.pointValue);
    markQuestionAnswered(game.id, question.categoryId, question.id);
    setActiveQuestion(null);
  }
  
  // Toggle between edit and play mode
  function toggleMode() {
    setEditMode(!$editMode);
  }
  
  // Reset the game for a new round
  function handleResetGame() {
    const game = $getActiveGame;
    if (!game) return;
    
    if (confirm('Are you sure you want to reset the game? This will clear all scores and mark all questions as unanswered.')) {
      resetAllScores(game.id);
      resetGameBoard(game.id);
    }
  }
  
  // Handle JSON import
  function handleImportJSON(event: Event) {
    importError = '';
    importSuccess = false;
    
    const game = $getActiveGame;
    if (!game) return;
    
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      importError = 'Please select a valid JSON file';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Attempt to import
        const success = importGameData(game.id, jsonData);
        
        if (success) {
          importSuccess = true;
          setTimeout(() => {
            importSuccess = false;
          }, 3000);
        } else {
          importError = 'Failed to import. Invalid data format.';
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        importError = 'Invalid JSON format';
      }
      
      // Reset the file input
      input.value = '';
    };
    
    reader.onerror = () => {
      importError = 'Error reading file';
    };
    
    reader.readAsText(file);
  }
  
  // Standard Jeopardy values
  const pointValues = [100, 200, 300, 400, 500];
  
  // Team colors for selection
  const teamColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red 
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316'  // Orange
  ];
  
  // Get predefined point value for position
  function getPointValueForPosition(index: number): number {
    return pointValues[index] || 100;
  }
</script>

<div class="mb-8">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-2xl font-bold text-white mb-1">Jeopardy</h1>
      <p class="text-dark-muted">Create and play Jeopardy-style quiz games</p>
    </div>
    
    <div class="flex gap-3">
      {#if $getActiveGame}
        <button 
          on:click={toggleMode}
          class="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white transition"
        >
          {$editMode ? 'Play Game' : 'Edit Game'}
        </button>
        
        <button 
          on:click={handleResetGame}
          class="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white transition"
        >
          Reset Game
        </button>
      {/if}
    </div>
  </div>

  {#if !$getActiveGame}
    <!-- Game Selection Screen -->
    <div class="bg-dark-card border border-dark-border p-6 rounded-xl mb-8 shadow-dark-card">
      <h2 class="text-lg font-semibold text-white mb-4">Create New Game</h2>
      <div class="flex gap-4">
        <input
          type="text"
          placeholder="Enter game name"
          bind:value={newGameName}
          class="flex-grow bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple placeholder:text-dark-muted"
        />
        <button 
          on:click={handleCreateGame}
          class="px-4 py-3 bg-dark-highlight text-dark-purple font-medium rounded-lg hover:bg-dark-lavender transition focus:ring-2 focus:ring-offset-2 focus:ring-dark-purple"
        >
          Create Game
        </button>
      </div>
    </div>

    {#if $getGames.length > 0}
      <div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
        <h2 class="text-lg font-semibold text-white mb-4">Your Games</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {#each $getGames as game}
            <div class="bg-dark-surface border border-dark-border rounded-lg p-4 hover:border-dark-purple transition">
              <h3 class="text-white font-medium mb-2">{game.name}</h3>
              <div class="text-dark-muted text-sm mb-3">
                <div>{game.categories.length} Categories</div>
                <div>{game.teams.length} Teams</div>
                <div class="text-xs mt-1">Last played: {new Date(game.lastModified).toLocaleDateString()}</div>
              </div>
              <div class="flex justify-between mt-4">
                <button 
                  on:click={() => { setActiveGame(game.id); setEditMode(false); }}
                  class="text-sm px-3 py-1 bg-dark-highlight text-dark-purple rounded hover:bg-dark-lavender transition"
                >
                  Play
                </button>
                <button 
                  on:click={() => { setActiveGame(game.id); setEditMode(true); }}
                  class="text-sm px-3 py-1 bg-dark-card text-gray-300 rounded hover:bg-dark-accent hover:text-white transition"
                >
                  Edit
                </button>
                <button 
                  on:click={() => { if(confirm('Are you sure you want to delete this game?')) deleteGame(game.id); }}
                  class="text-sm px-3 py-1 bg-dark-card text-gray-300 rounded hover:bg-red-500 hover:text-white transition"
                >
                  Delete
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {:else if $getActiveQuestion}
    <!-- Question Display Mode -->
    <div class="flex flex-col">
      <!-- Current Question -->
      <div class="bg-dark-surface border-2 border-dark-purple rounded-xl p-10 mb-8 text-center min-h-[300px] flex flex-col justify-center">
        <div class="text-xl md:text-2xl lg:text-3xl text-white font-medium mb-8">
          {$getActiveQuestion.text}
        </div>
        
        {#if showAnswer}
          <div class="text-xl md:text-2xl text-dark-highlight font-medium mb-4">
            {$getActiveQuestion.answer}
          </div>
        {/if}
        
        <div class="flex justify-center mt-4">
          <button 
            on:click={() => showAnswer = !showAnswer}
            class="px-4 py-2 bg-dark-card text-gray-300 rounded-lg hover:bg-dark-accent hover:text-white transition mx-2"
          >
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </button>
          
          <button 
            on:click={() => setActiveQuestion(null)}
            class="px-4 py-2 bg-dark-card text-gray-300 rounded-lg hover:bg-dark-accent hover:text-white transition mx-2"
          >
            Back to Board
          </button>
        </div>
      </div>
      
      <!-- Team Scoring -->
      <div class="bg-dark-card border border-dark-border rounded-xl p-6 shadow-dark-card">
        <h3 class="text-lg font-semibold text-white mb-4 text-center">Award Points ({$getActiveQuestion.pointValue})</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {#each $getActiveGame.teams as team}
            <button 
              class="p-4 rounded-lg text-white flex items-center justify-between transition-all"
              style="background-color: {team.color}; opacity: {selectedTeamId === team.id ? '1' : '0.6'};"
              on:click={() => selectedTeamId = team.id}
            >
              <span class="font-medium">{team.name}</span>
              <span class="bg-dark-surface bg-opacity-30 px-3 py-1 rounded-full">{team.score}</span>
            </button>
          {/each}
        </div>
        
        <div class="flex justify-center gap-4 mt-6">
          <button 
            on:click={handleAwardPoints}
            disabled={!selectedTeamId}
            class="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Correct (+{$getActiveQuestion.pointValue})
          </button>
          
          <button 
            on:click={handleDeductPoints}
            disabled={!selectedTeamId}
            class="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Incorrect (-{$getActiveQuestion.pointValue})
          </button>
        </div>
      </div>
    </div>
  {:else if $editMode}
    <!-- Game Editor Mode -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Game Setup -->
      <div class="space-y-6">
        <!-- Game Info -->
        <div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
          <h2 class="text-lg font-semibold text-white mb-4">Game: {$getActiveGame.name}</h2>
          <div class="flex justify-between">
            <button 
              on:click={() => setActiveGame(null)}
              class="px-4 py-2 bg-dark-surface text-gray-300 rounded hover:bg-dark-accent hover:text-white transition"
            >
              Back to Games
            </button>
            <button 
              on:click={toggleMode}
              class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded hover:bg-dark-lavender transition"
            >
              Play Game
            </button>
          </div>
        </div>
        
        <!-- Import JSON -->
        <div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
          <h2 class="text-lg font-semibold text-white mb-4">Import Questions</h2>
          <div class="space-y-4">
            <p class="text-dark-muted text-sm">
              Import categories and questions from a JSON file. The JSON must include an array of categories with questions.
            </p>
            
            <div class="flex flex-col gap-3">
              <label for="jsonFile" class="text-white text-sm font-medium">
                Select JSON File
              </label>
              <input
                id="jsonFile"
                type="file"
                accept=".json,application/json"
                on:change={handleImportJSON}
                class="bg-dark-surface text-white border border-dark-border rounded-lg p-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-dark-highlight file:text-dark-purple hover:file:bg-dark-lavender"
              />
            </div>
            
            {#if importError}
              <div class="p-3 bg-red-900 bg-opacity-30 border border-red-600 rounded-lg text-red-400 text-sm">
                {importError}
              </div>
            {/if}
            
            {#if importSuccess}
              <div class="p-3 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg text-green-400 text-sm">
                Import successful! Categories and questions have been added.
              </div>
            {/if}
            
            <div class="mt-4 text-dark-muted text-xs">
              <p class="font-semibold">Expected JSON format:</p>
              <pre class="bg-dark-surface p-2 rounded-lg mt-1 overflow-auto">
{`{
  "categories": [
    {
      "name": "Category Name",
      "questions": [
        {
          "text": "Question text",
          "answer": "Answer text",
          "pointValue": 100
        }
      ]
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </div>
        
        <!-- Add Category -->
        <div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
          <h2 class="text-lg font-semibold text-white mb-4">Add Category</h2>
          <div class="flex gap-2">
            <input
              type="text"
              placeholder="Category name"
              bind:value={newCategoryName}
              class="flex-grow bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple placeholder:text-dark-muted"
            />
            <button 
              on:click={handleAddCategory}
              class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded-lg hover:bg-dark-lavender transition"
            >
              Add
            </button>
          </div>
        </div>
        
        <!-- Teams Management -->
        <div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
          <h2 class="text-lg font-semibold text-white mb-4">Teams</h2>
          
          <!-- Add Team Form -->
          <div class="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Team name"
              bind:value={newTeamName}
              class="flex-grow bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple placeholder:text-dark-muted"
            />
            <div class="relative">
              <input 
                type="color" 
                bind:value={newTeamColor}
                class="w-12 h-12 rounded-lg cursor-pointer border border-dark-border"
              />
            </div>
            <button 
              on:click={handleAddTeam}
              class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded-lg hover:bg-dark-lavender transition"
            >
              Add
            </button>
          </div>
          
          <!-- Team List -->
          <div class="space-y-3 mt-4">
            {#each $getActiveGame.teams as team}
              <div class="flex items-center justify-between p-3 rounded-lg" style="background-color: {team.color};">
                <span class="font-medium text-white">{team.name}</span>
                <button 
                  on:click={() => deleteTeam($getActiveGame.id, team.id)}
                  class="text-white opacity-70 hover:opacity-100"
                >
                  &times;
                </button>
              </div>
            {/each}
            
            {#if $getActiveGame.teams.length === 0}
              <p class="text-dark-muted text-center py-2">No teams added yet</p>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Right Column: Categories & Questions -->
      <div class="lg:col-span-2">
        {#if editingQuestion.categoryId}
          <!-- Question Editor -->
          <div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card mb-6">
            <h2 class="text-lg font-semibold text-white mb-4">
              {editingQuestion.questionId ? 'Edit Question' : 'Add Question'}
            </h2>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm text-dark-lavender font-medium mb-2">Question Text</label>
                <textarea
                  bind:value={editingQuestion.text}
                  rows="3"
                  class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
                  placeholder="Enter the question"
                ></textarea>
              </div>
              
              <div>
                <label class="block text-sm text-dark-lavender font-medium mb-2">Answer</label>
                <input
                  type="text"
                  bind:value={editingQuestion.answer}
                  class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
                  placeholder="Enter the answer"
                />
              </div>
              
              <div>
                <label class="block text-sm text-dark-lavender font-medium mb-2">Point Value</label>
                <select
                  bind:value={editingQuestion.pointValue}
                  class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
                >
                  {#each pointValues as value}
                    <option value={value}>{value}</option>
                  {/each}
                </select>
              </div>
              
              <div class="flex justify-between pt-4">
                <button 
                  on:click={() => editingQuestion.categoryId = ''}
                  class="px-4 py-2 bg-dark-surface text-gray-300 rounded hover:bg-dark-accent hover:text-white transition"
                >
                  Cancel
                </button>
                
                {#if editingQuestion.questionId}
                  <button 
                    on:click={handleDeleteQuestion}
                    class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                {/if}
                
                <button 
                  on:click={handleSaveQuestion}
                  class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded hover:bg-dark-lavender transition"
                >
                  Save Question
                </button>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Categories & Questions Grid -->
        <div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
          <h2 class="text-lg font-semibold text-white mb-6">Categories & Questions</h2>
          
          {#if $getActiveGame.categories.length === 0}
            <div class="bg-dark-surface rounded-lg p-8 text-center">
              <p class="text-dark-muted">No categories added yet. Add your first category to start building your game.</p>
            </div>
          {:else}
            <div class="grid" style="grid-template-columns: repeat({$getActiveGame.categories.length}, minmax(150px, 1fr));">
              <!-- Category Headers -->
              {#each $getActiveGame.categories as category}
                <div class="p-3 bg-dark-accent font-medium text-white text-center border-r border-dark-border">
                  <div class="flex justify-between items-center">
                    <button 
                      class="text-xs opacity-70 hover:opacity-100" 
                      on:click={() => deleteCategory($getActiveGame.id, category.id)}
                    >
                      &times;
                    </button>
                    <span class="truncate">{category.name}</span>
                    <span></span>
                  </div>
                </div>
              {/each}
              
              <!-- Questions Grid -->
              {#each [...Array(5).keys()] as rowIndex}
                {#each $getActiveGame.categories as category}
                  {#if category.questions[rowIndex]}
                    <!-- Existing question cell -->
                    <button 
                      class="p-4 bg-dark-surface border border-dark-border text-white text-center hover:bg-dark-accent transition"
                      on:click={() => openEditQuestion(category.id, category.questions[rowIndex])}
                    >
                      ${category.questions[rowIndex].pointValue}
                    </button>
                  {:else}
                    <!-- Empty question cell -->
                    <button 
                      class="p-4 bg-dark-surface border border-dark-border text-dark-muted text-center hover:bg-dark-accent hover:text-white transition"
                      on:click={() => openEditQuestion(category.id)}
                    >
                      + ${getPointValueForPosition(rowIndex)}
                    </button>
                  {/if}
                {/each}
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <!-- Game Play Mode -->
    <div class="mb-8">
      <!-- Scoreboard -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {#each $getActiveGame.teams as team}
          <div class="p-4 rounded-lg flex items-center justify-between transition-all" 
               style="background-color: {team.color}; {team.id === $getLeadingTeam?.id ? 'box-shadow: 0 0 15px ' + team.color + ';' : ''}">
            <span class="font-medium text-white">{team.name}</span>
            <span class="bg-dark-surface bg-opacity-30 px-3 py-1 rounded-full text-white font-bold">
              {team.score}
            </span>
          </div>
        {/each}
      </div>
      
      <!-- Game Board -->
      <div class="bg-dark-surface border-2 border-dark-border rounded-xl p-4 shadow-lg">
        {#if $getActiveGame.categories.length === 0}
          <div class="p-8 text-center">
            <p class="text-dark-muted">This game has no categories yet. Switch to Edit Mode to build your game.</p>
          </div>
        {:else}
          <div class="grid" style="grid-template-columns: repeat({$getActiveGame.categories.length}, minmax(120px, 1fr));">
            <!-- Category Headers -->
            {#each $getActiveGame.categories as category}
              <div class="p-3 bg-dark-accent font-medium text-white text-center border-r border-dark-border">
                <span class="truncate">{category.name}</span>
              </div>
            {/each}
            
            <!-- Questions Grid -->
            {#each [...Array(5).keys()] as rowIndex}
              {#each $getActiveGame.categories as category}
                {#if category.questions[rowIndex]}
                  {#if category.questions[rowIndex].isAnswered}
                    <!-- Answered question cell -->
                    <div class="p-6 sm:p-8 md:p-10 border border-dark-border bg-dark-card bg-opacity-50 flex items-center justify-center">
                      <span class="text-dark-muted">✓</span>
                    </div>
                  {:else}
                    <!-- Available question cell -->
                    <button 
                      class="p-6 sm:p-8 md:p-10 border border-dark-border bg-dark-highlight text-dark-purple font-bold text-xl sm:text-2xl md:text-3xl hover:bg-dark-lavender transition"
                      on:click={() => handleOpenQuestion(category.id, category.questions[rowIndex].id)}
                    >
                      ${category.questions[rowIndex].pointValue}
                    </button>
                  {/if}
                {:else}
                  <!-- Empty question cell -->
                  <div class="p-6 sm:p-8 md:p-10 border border-dark-border bg-dark-card bg-opacity-60">
                  </div>
                {/if}
              {/each}
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>