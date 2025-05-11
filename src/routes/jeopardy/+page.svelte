```svelte
<script lang="ts">
	import { jeopardyStore } from '$lib/stores/jeopardy';
	import { onDestroy } from 'svelte';

	// Access the store
	const {
		getGames,
		getActiveGame,
		getActiveQuestion,
		getLeadingTeam,
		editMode,
		timerActive,
		timerSeconds,
		wagerAmount,
		createGame,
		updateGame,
		updateGameSettings,
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
		startTimer,
		stopTimer,
		setWagerAmount,
		addTeam,
		updateTeam,
		deleteTeam,
		updateTeamScore,
		resetAllScores,
		resetGameBoard,
		importGameData,
		exportGameData,
		getGameTemplates,
		applyGameTemplate
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
		pointValue: 100,
		isDoubleJeopardy: false,
		timeLimit: 30
	};

	// Import/export state
	let importError = '';
	let importSuccess = false;
	let exportSuccess = false;

	// Current question display state
	let showAnswer = false;
	let selectedTeamId = '';
	let wagerInputValue = '0';
	let timerIntervalId: number | null = null;
	let remainingSeconds = 30;
	let timerDisplay = '';

	// Game templates
	const templates = getGameTemplates();

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
	interface Question {
  id: string;
  text: string;
  answer: string;
  pointValue: number;
  isDoubleJeopardy?: boolean;
  timeLimit?: number;
}

function openEditQuestion(categoryId: string, question?: Question | null): void {
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

	// Save question edits
	function handleSaveQuestion() {
		const game = $getActiveGame;
		if (!game) return;

		if (editingQuestion.questionId) {
			// Update existing question
			updateQuestion(game.id, editingQuestion.categoryId, editingQuestion.questionId, {
				text: editingQuestion.text,
				answer: editingQuestion.answer,
				pointValue: editingQuestion.pointValue,
				isDoubleJeopardy: editingQuestion.isDoubleJeopardy,
				timeLimit: editingQuestion.timeLimit
			});
		} else {
			// Add new question
			addQuestion(
				game.id,
				editingQuestion.categoryId,
				editingQuestion.text,
				editingQuestion.answer,
				editingQuestion.pointValue,
				editingQuestion.isDoubleJeopardy,
				editingQuestion.timeLimit
			);
		}

		// Reset editing state
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
			pointValue: 100,
			isDoubleJeopardy: false,
			timeLimit: 30
		};
	}

	// Add a new team
	function handleAddTeam() {
		const game = $getActiveGame;
		if (game && newTeamName.trim()) {
			addTeam(game.id, newTeamName.trim(), newTeamColor);
			newTeamName = '';
			newTeamColor = '#' + Math.floor(Math.random() * 16777215).toString(16); // Random color
		}
	}

	// Open a question in play mode
	function handleOpenQuestion(categoryId: string, questionId: string) {
		const game = $getActiveGame;
		if (!game) return;

		const category = game.categories.find((c) => c.id === categoryId);
		if (!category) return;

		const question = category.questions.find((q) => q.id === questionId);
		if (!question || question.isAnswered) return;

		setActiveQuestion(questionId);
		showAnswer = false;
		selectedTeamId = '';

		// If it's a double jeopardy question, set the wager to the question's point value
		if (question.isDoubleJeopardy) {
			wagerInputValue = question.pointValue.toString();
		} else {
			wagerInputValue = '0';
		}

		// Setup timer if question has a time limit
		if (question.timeLimit && question.timeLimit > 0) {
			startQuestionTimer(question.timeLimit);
		} else if (game.settings?.defaultTimeLimit && game.settings.useTimer) {
			startQuestionTimer(game.settings.defaultTimeLimit);
		}
	}

	// Timer functionality
	function startQuestionTimer(seconds: number) {
		remainingSeconds = seconds;
		updateTimerDisplay();

		// Clear any existing timer
		if (timerIntervalId !== null) {
			clearInterval(timerIntervalId);
		}

		// Start a new timer
		timerIntervalId = setInterval(() => {
			remainingSeconds--;
			updateTimerDisplay();

			if (remainingSeconds <= 0) {
				clearInterval(timerIntervalId);
				timerIntervalId = null;
				// Maybe play a sound or show a message that time is up
			}
		}, 1000) as unknown as number;
	}

	function updateTimerDisplay() {
		const minutes = Math.floor(remainingSeconds / 60);
		const seconds = remainingSeconds % 60;
		timerDisplay = `${minutes.toString().padStart(1, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	function handleWagerSubmit() {
		const wager = parseInt(wagerInputValue, 10);
		if (isNaN(wager) || wager < 0) {
			return;
		}

		setWagerAmount(wager);
	}

	// Cleanup timer on component destroy
	onDestroy(() => {
		if (timerIntervalId !== null) {
			clearInterval(timerIntervalId);
		}
	});

	// Award points to a team
	function handleAwardPoints() {
		const game = $getActiveGame;
		const question = $getActiveQuestion;

		if (!game || !question || !selectedTeamId) return;

		// If this is a double jeopardy question, use the wager amount instead
		const pointsToAward = question.isDoubleJeopardy ? $wagerAmount : question.pointValue;

		updateTeamScore(game.id, selectedTeamId, pointsToAward);
		markQuestionAnswered(game.id, question.categoryId, question.id);
		setActiveQuestion(null);

		// Clear timer if active
		if (timerIntervalId !== null) {
			clearInterval(timerIntervalId);
			timerIntervalId = null;
		}
	}

	// Deduct points from a team
	function handleDeductPoints() {
		const game = $getActiveGame;
		const question = $getActiveQuestion;

		if (!game || !question || !selectedTeamId) return;

		// If this is a double jeopardy question, use the wager amount instead
		const pointsToDeduct = question.isDoubleJeopardy ? $wagerAmount : question.pointValue;

		updateTeamScore(game.id, selectedTeamId, -pointsToDeduct);
		markQuestionAnswered(game.id, question.categoryId, question.id);
		setActiveQuestion(null);

		// Clear timer if active
		if (timerIntervalId !== null) {
			clearInterval(timerIntervalId);
			timerIntervalId = null;
		}
	}

	// Toggle between edit and play mode
	function toggleMode() {
		setEditMode(!$editMode);
	}

	// Reset the game for a new round
	function handleResetGame() {
		const game = $getActiveGame;
		if (!game) return;

		if (
			confirm(
				'Are you sure you want to reset the game? This will clear all scores and mark all questions as unanswered.'
			)
		) {
			resetAllScores(game.id);
			resetGameBoard(game.id);
		}
	}

	// Update game settings
	function handleUpdateSettings(settings: import('$lib/types/jeopardy').GameSettings) {
		const game = $getActiveGame;
		if (!game) return;

		updateGameSettings(game.id, settings);
	}

	// Apply game template
	function handleApplyTemplate(templateId: string) {
		const game = $getActiveGame;
		if (!game) return;

		const success = applyGameTemplate(game.id, templateId);
		if (success) {
			importSuccess = true;
			setTimeout(() => {
				importSuccess = false;
			}, 3000);
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

	// Handle JSON export
	function handleExportJSON() {
		const game = $getActiveGame;
		if (!game) return;

		const jsonData = exportGameData(game.id);
		if (!jsonData) return;

		// Create a downloadable blob
		const blob = new Blob([jsonData], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		// Create a link and click it to trigger download
		const a = document.createElement('a');
		a.href = url;
		a.download = `${game.name.replace(/\s+/g, '_')}_jeopardy.json`;
		document.body.appendChild(a);
		a.click();

		// Cleanup
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		exportSuccess = true;
		setTimeout(() => {
			exportSuccess = false;
		}, 3000);
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
		'#F97316' // Orange
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
						<div
							class="bg-dark-surface border border-dark-border rounded-lg p-4 hover:border-dark-purple transition"
						>
							<h3 class="text-white font-medium mb-2">{game.name}</h3>
							<div class="text-dark-muted text-sm mb-3">
								<div>{game.categories.length} Categories</div>
								<div>{game.teams.length} Teams</div>
								<div class="text-xs mt-1">
									Last played: {new Date(game.lastModified).toLocaleDateString()}
								</div>
							</div>
							<div class="flex justify-between mt-4">
								<button
									on:click={() => {
										setActiveGame(game.id);
										setEditMode(false);
									}}
									class="text-sm px-3 py-1 bg-dark-highlight text-dark-purple rounded hover:bg-dark-lavender transition"
								>
									Play
								</button>
								<button
									on:click={() => {
										setActiveGame(game.id);
										setEditMode(true);
									}}
									class="text-sm px-3 py-1 bg-dark-card text-gray-300 rounded hover:bg-dark-accent hover:text-white transition"
								>
									Edit
								</button>
								<button
									on:click={() => {
										if (confirm('Are you sure you want to delete this game?')) deleteGame(game.id);
									}}
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
			<div
				class="bg-dark-surface border-2 border-dark-purple rounded-xl p-10 mb-4 text-center min-h-[300px] flex flex-col justify-center relative"
			>
				{#if timerIntervalId !== null}
					<div class="absolute top-4 right-4 bg-dark-card px-3 py-1 rounded-lg text-xl font-mono">
						{timerDisplay}
					</div>
				{/if}

				{#if $getActiveQuestion.isDoubleJeopardy}
					<div
						class="absolute top-4 left-4 bg-dark-highlight px-3 py-1 rounded-lg text-dark-purple font-bold"
					>
						Double Jeopardy
					</div>
				{/if}

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
						on:click={() => (showAnswer = !showAnswer)}
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

			<!-- Double Jeopardy Wager -->
			{#if $getActiveQuestion.isDoubleJeopardy}
				<div class="bg-dark-card border border-dark-border rounded-xl p-6 shadow-dark-card mb-4">
					<h3 class="text-lg font-semibold text-white mb-4 text-center">Double Jeopardy Wager</h3>

					<div class="flex flex-col items-center">
						<div class="flex items-center gap-3 mb-4">
							<input
								type="number"
								bind:value={wagerInputValue}
								min="0"
								max={Math.max($getActiveQuestion.pointValue * 2, 1000)}
								class="bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple w-32 text-center"
							/>

							<button
								on:click={handleWagerSubmit}
								class="px-4 py-3 bg-dark-highlight text-dark-purple font-medium rounded-lg hover:bg-dark-lavender transition"
							>
								Set Wager
							</button>
						</div>

						<p class="text-dark-muted text-sm">
							Current wager: <span class="text-white font-medium">{$wagerAmount}</span> points
						</p>
					</div>
				</div>
			{/if}

			<!-- Team Scoring -->
			<div class="bg-dark-card border border-dark-border rounded-xl p-6 shadow-dark-card">
				<h3 class="text-lg font-semibold text-white mb-4 text-center">
					Award Points ({$getActiveQuestion.isDoubleJeopardy
						? $wagerAmount
						: $getActiveQuestion.pointValue})
				</h3>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
					{#each $getActiveGame.teams as team}
						<button
							class="p-4 rounded-lg text-white flex items-center justify-between transition-all"
							style="background-color: {team.color}; opacity: {selectedTeamId === team.id
				? '1'
				: '0.6'};"
							on:click={() => (selectedTeamId = team.id)}
						>
							<span class="font-medium">{team.name}</span>
							<span class="bg-dark-surface bg-opacity-30 px-3 py-1 rounded-full">{team.score}</span>
						</button>
					{/each}
				</div>


				<div class="flex justify-center gap-4 mt-6">
					<button
						on:click={handleAwardPoints}
						disabled={!selectedTeamId || ($getActiveQuestion.isDoubleJeopardy && $wagerAmount <= 0)}
						class="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Correct (+{$getActiveQuestion.isDoubleJeopardy
							? $wagerAmount
							: $getActiveQuestion.pointValue})
					</button>

					<button
						on:click={handleDeductPoints}
						disabled={!selectedTeamId || ($getActiveQuestion.isDoubleJeopardy && $wagerAmount <= 0)}
						class="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Incorrect (-{$getActiveQuestion.isDoubleJeopardy
							? $wagerAmount
							: $getActiveQuestion.pointValue})
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

				<!-- Game Settings -->
				<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
					<h2 class="text-lg font-semibold text-white mb-4">Game Settings</h2>
					<div class="space-y-4">
						<div class="flex items-center">
							<label class="flex items-center">
								<input
									type="checkbox"
									checked={$getActiveGame.settings?.useTimer || false}
									on:change={(e) => handleUpdateSettings({ useTimer: e.target.checked })}
									class="h-4 w-4 bg-dark-surface border-dark-border text-dark-purple focus:ring-dark-purple rounded"
								/>
								<span class="ml-2 text-white">Use timer for questions by default</span>
							</label>
						</div>

						<div>
							<label
								for="default-time-limit"
								class="block text-sm text-dark-lavender font-medium mb-2"
							>
								Default time limit (seconds)
							</label>
							<input
								id="default-time-limit"
								type="number"
								value={$getActiveGame.settings?.defaultTimeLimit || 30}
								on:change={(e) =>
									handleUpdateSettings({ defaultTimeLimit: parseInt(e.target.value) })}
								min="5"
								max="300"
								step="5"
								class="w-full md:w-1/3 bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
							/>
						</div>
					</div>
				</div>

				<!-- Game Templates -->
				<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
					<h2 class="text-lg font-semibold text-white mb-4">Game Templates</h2>
					<div class="space-y-4">
						<p class="text-dark-muted text-sm">
							Apply a pre-made template with categories and questions to get started quickly.
						</p>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
							{#each templates as template}
								<div
									class="bg-dark-surface rounded-lg p-4 border border-dark-border hover:border-dark-purple transition"
								>
									<h3 class="text-white font-medium">{template.name}</h3>
									<p class="text-dark-muted text-sm mb-3">{template.description}</p>
									<p class="text-xs text-dark-muted mb-3">
										{template.categories.length} categories,
										{template.categories.reduce((acc, cat) => acc + cat.questions.length, 0)} questions
									</p>
									<button
										on:click={() => handleApplyTemplate(template.id)}
										class="w-full py-2 bg-dark-highlight text-dark-purple font-medium rounded hover:bg-dark-lavender transition mt-auto"
									>
										Apply Template
									</button>
								</div>
							{/each}
						</div>

						{#if importSuccess}
							<div
								class="p-3 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg text-green-400 text-sm"
							>
								Template applied successfully!
							</div>
						{/if}
					</div>
				</div>

				<!-- Import/Export JSON -->
				<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
					<h2 class="text-lg font-semibold text-white mb-4">Import/Export Questions</h2>
					<div class="space-y-5">
						<!-- Import Section -->
						<div>
							<h3 class="text-white font-medium mb-2">Import from JSON</h3>
							<p class="text-dark-muted text-sm mb-3">
								Import categories and questions from a JSON file.
							</p>

							<div class="flex flex-col gap-3">
								<input
									id="jsonFile"
									type="file"
									accept=".json,application/json"
									on:change={handleImportJSON}
									class="bg-dark-surface text-white border border-dark-border rounded-lg p-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-dark-highlight file:text-dark-purple hover:file:bg-dark-lavender"
								/>
							</div>

							{#if importError}
								<div
									class="p-3 mt-3 bg-red-900 bg-opacity-30 border border-red-600 rounded-lg text-red-400 text-sm"
								>
									{importError}
								</div>
							{/if}

							{#if importSuccess}
								<div
									class="p-3 mt-3 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg text-green-400 text-sm"
								>
									Import successful! Categories and questions have been added.
								</div>
							{/if}
						</div>

						<!-- Export Section -->
						<div class="pt-4 border-t border-dark-border">
							<h3 class="text-white font-medium mb-2">Export to JSON</h3>
							<p class="text-dark-muted text-sm mb-3">
								Export your game's categories and questions to a JSON file for backup or sharing.
							</p>

							<button
								on:click={handleExportJSON}
								class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded hover:bg-dark-lavender transition"
							>
								Export Game
							</button>

							{#if exportSuccess}
								<div
									class="p-3 mt-3 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg text-green-400 text-sm"
								>
									Game exported successfully!
								</div>
							{/if}
						</div>

						<div class="mt-4 text-dark-muted text-xs">
							<p class="font-semibold">JSON format:</p>
							<pre class="bg-dark-surface p-2 rounded-lg mt-1 overflow-auto">
{`{
  "categories": [
    {
      "name": "Category Name",
      "questions": [
        {
          "text": "Question text",
          "answer": "Answer text",
          "pointValue": 100,
          "isDoubleJeopardy": false,
          "timeLimit": 30
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
							<div
								class="flex items-center justify-between bg-dark-surface p-3 rounded-lg"
								style="border-left: 4px solid {team.color};"
							>
								<div class="flex items-center">
									<div
										class="w-4 h-4 rounded-full mr-3"
										style="background-color: {team.color};"
									/>
									<span class="font-medium text-white">{team.name}</span>
								</div>
								<div class="flex items-center">
									<span class="text-dark-muted mr-4">Score: {team.score}</span>
									<button
										on:click={() => {
                                                                                        if (confirm('Are you sure you want to delete this team?'))
                                                                                                deleteTeam($getActiveGame.id, team.id);
                                                                                }}
										class="text-gray-400 hover:text-red-500 transition"
									>
										Delete
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Right Columns: Categories and Questions -->
			<div class="lg:col-span-2 space-y-6">
				{#if $getActiveGame.categories.length === 0}
					<!-- Empty State -->
					<div
						class="bg-dark-card border border-dark-border p-8 rounded-xl shadow-dark-card flex flex-col items-center
  justify-center text-center"
					>
						<h3 class="text-white font-medium text-xl mb-2">No Categories Yet</h3>
						<p class="text-dark-muted mb-6">
							Add categories and questions to build your Jeopardy game.
						</p>
						<p class="text-dark-lavender mb-4">
							Tip: Use the Game Templates to quickly create a game with pre-made categories and questions.
						</p>
					</div>
				{:else}
					<!-- Categories and Questions -->
					{#each $getActiveGame.categories as category}
						<div class="bg-dark-card border border-dark-border rounded-xl shadow-dark-card">
							<div
								class="p-4 border-b border-dark-border flex justify-between items-center bg-dark-surface rounded-t-xl"
							>
								<h3 class="text-white font-medium">{category.name}</h3>
								<div class="flex gap-2">
									<button
										on:click={() => openEditQuestion(category.id)}
										class="text-sm px-3 py-1 bg-dark-highlight text-dark-purple rounded hover:bg-dark-lavender transition"
									>
										Add Question
									</button>
									<button
										on:click={() => {
                                                                                        if (
                                                                                                confirm('Are you sure you want to delete this category and all its questions?')
                                                                                        )
                                                                                                deleteCategory($getActiveGame.id, category.id);
                                                                                }}
										class="text-sm px-3 py-1 bg-dark-card text-gray-300 rounded hover:bg-red-500 hover:text-white transition"
									>
										Delete
									</button>
								</div>
							</div>

							<div class="p-4 space-y-3">
								{#if category.questions.length === 0}
									<p class="text-dark-muted text-center py-4">No questions in this category yet</p>
								{:else}
									{#each category.questions as question, index}
										<div
											class="bg-dark-surface border border-dark-border p-3 rounded-lg hover:border-dark-purple transition"
										>
											<div class="flex justify-between items-start mb-2">
												<div>
													<div class="text-white font-medium mb-1 line-clamp-2">
														{question.text}
													</div>
													<div class="text-dark-muted text-sm line-clamp-1">
														Answer: {question.answer}
													</div>
												</div>
												<div
													class="ml-4 px-3 py-1 bg-dark-highlight text-dark-purple font-medium rounded text-sm"
												>
													{question.pointValue} pts
												</div>
											</div>

											<div class="flex items-center justify-between text-xs mt-3">
												<div class="flex gap-2 text-dark-muted">
													{#if question.isDoubleJeopardy}
                                                                                                                <span class="bg-dark-highlight bg-opacity-30 px-2 py-0.5 rounded text-dark-purple">
                                                                                                                        Double Jeopardy
                                                                                                                </span>
													{/if}
													{#if question.timeLimit}
                                                                                                                <span class="bg-dark-surface bg-opacity-70 px-2 py-0.5 rounded border border-dark-border">
                                                                                                                        {question.timeLimit}s
                                                                                                                </span>
													{/if}
												</div>
												<div>
													<button
														on:click={() => openEditQuestion(category.id, question)}
														class="text-gray-400 hover:text-white transition px-2"
													>
														Edit
													</button>
												</div>
											</div>
										</div>
									{/each}
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{:else}
		<!-- Game Play Mode -->
		<div class="space-y-8">
			<!-- Game Header -->
			<div class="flex flex-col md:flex-row justify-between items-center bg-dark-card border border-dark-border
   p-4 rounded-xl shadow-dark-card">
				<div>
					<h2 class="text-xl font-bold text-white">{$getActiveGame.name}</h2>
				</div>

				<div class="flex gap-3 mt-4 md:mt-0">
					<button
						on:click={toggleMode}
						class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded hover:bg-dark-lavender
  transition"
					>
						Edit Game
					</button>

					<button
						on:click={handleResetGame}
						class="px-4 py-2 bg-dark-card text-gray-300 rounded hover:bg-dark-accent hover:text-white transition"
					>
						Reset Board
					</button>
				</div>
			</div>

			<!-- Team Scoreboard -->
			{#if $getActiveGame.teams.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
					{#each $getActiveGame.teams as team}
						<div
							class="p-4 rounded-lg text-white flex items-center justify-between transition-all shadow-md"
							style="background-color: {team.color};"
						>
							<span class="font-bold text-lg">{team.name}</span>
							<span class="bg-dark-surface bg-opacity-30 px-4 py-2 text-xl font-mono rounded-lg">{team.score}</span>
						</div>
					{/each}
				</div>

				{#if $getLeadingTeam}
					<div class="text-center text-dark-muted mb-6">
						Leading: <span class="text-white font-medium">{$getLeadingTeam.name}</span> with {$getLeadingTeam.score}
						points
					</div>
				{/if}
			{:else}
				<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card text-center">
					<p class="text-dark-muted mb-4">No teams yet. Add teams in Edit mode.</p>
					<button
						on:click={toggleMode}
						class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded hover:bg-dark-lavender
  transition"
					>
						Go to Edit Mode
					</button>
				</div>
			{/if}

			<!-- Game Board -->
			{#if $getActiveGame.categories.length > 0}
				<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
						{#each $getActiveGame.categories as category}
							<div class="space-y-2">
								<!-- Category Header -->
								<div class="bg-dark-highlight text-dark-purple font-bold p-3 text-center rounded-lg min-h-[60px] flex
  items-center justify-center">
									{category.name}
								</div>

								<!-- Questions -->
								{#each category.questions as question}
									<button
										on:click={() => handleOpenQuestion(category.id, question.id)}
										disabled={question.isAnswered}
										class="w-full bg-dark-surface border border-dark-border hover:border-dark-purple p-3 h-16 rounded-lg
  transition font-bold flex items-center justify-center disabled:opacity-40
  disabled:hover:border-dark-border"
										class:bg-dark-highlight={question.isDoubleJeopardy && !question.isAnswered}
										class:text-dark-purple={question.isDoubleJeopardy && !question.isAnswered}
									>
										{#if question.isAnswered}
											&nbsp;
										{:else}
											{question.pointValue}
										{/if}
									</button>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card text-center">
					<p class="text-dark-muted mb-4">No categories or questions yet. Add them in Edit mode.</p>
					<button
						on:click={toggleMode}
						class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded hover:bg-dark-lavender
  transition"
					>
						Go to Edit Mode
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>