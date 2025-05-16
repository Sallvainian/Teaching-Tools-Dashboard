<script lang="ts">
	import { jeopardyStore } from '$lib/stores/jeopardy';
	import type { Question as GameQuestionType, TimerSize } from '$lib/types/jeopardy';
	import { onDestroy, onMount } from 'svelte';
	import JeopardyTimer from '$lib/components/JeopardyTimer.svelte';
	import LoadingBounce from '$lib/components/LoadingBounce.svelte';

	// Access the store (ensure all used functions are destructured)
	const {
		getGames,
		getActiveGame,
		getActiveQuestion,
		getLeadingTeam,
		editMode,
		wagerAmount,
		createGame,
		updateGameSettings,
		deleteGame,
		setActiveGame,
		setEditMode,
		addCategory,
		deleteCategory,
		addQuestion,
		updateQuestion,
		deleteQuestion,
		markQuestionAnswered,
		setActiveQuestion,
		setWagerAmount,
		addTeam,
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

	interface EditingQuestionState {
		categoryId: string;
		questionId: string;
		text: string;
		answer: string;
		pointValue: number;
		isDoubleJeopardy: boolean;
		timeLimit: number;
	}

	let editingQuestion: EditingQuestionState = {
		categoryId: '',
		questionId: '',
		text: '',
		answer: '',
		pointValue: 100,
		isDoubleJeopardy: false,
		timeLimit: 30
	};

	// Feedback state
	let generalMessage = ''; // For success/error feedback
	let messageIsError = false;

	// Modal state for applying templates in editor
	let showTemplateModal = false;

	function showFeedback(message: string, isError: boolean = false, duration: number = 3000) {
		generalMessage = message;
		messageIsError = isError;
		setTimeout(() => {
			generalMessage = '';
		}, duration);
	}


	// Current question display state
	let showAnswer = false;
	let selectedTeamId = '';
	let wagerInputValue = '0';
	let timerIntervalId: number | null = null;
	let remainingSeconds = 30;
	let timerDisplay = '';
	let isLoading = true;

	// Game templates
	const templates = getGameTemplates();

	// Create a new game
	function handleCreateGame() {
		if (newGameName.trim()) {
			const gameId = createGame(newGameName.trim());
			setActiveGame(gameId);
			setEditMode(true); // Go to edit mode for the new game
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

	function openEditQuestion(categoryId: string, question?: GameQuestionType | null): void {
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

	function _handleSaveQuestion() {
		const game = $getActiveGame;
		if (!game) return;

		if (editingQuestion.questionId) {
			updateQuestion(game.id, editingQuestion.categoryId, editingQuestion.questionId, {
				text: editingQuestion.text,
				answer: editingQuestion.answer,
				pointValue: editingQuestion.pointValue,
				isDoubleJeopardy: editingQuestion.isDoubleJeopardy,
				timeLimit: editingQuestion.timeLimit
			});
		} else {
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
		editingQuestion = { categoryId: '', questionId: '', text: '', answer: '', pointValue: 100, isDoubleJeopardy: false, timeLimit: 30 };
	}

	function _handleDeleteQuestion() {
		const game = $getActiveGame;
		if (!game || !editingQuestion.questionId) return;
		deleteQuestion(game.id, editingQuestion.categoryId, editingQuestion.questionId);
		editingQuestion = { categoryId: '', questionId: '', text: '', answer: '', pointValue: 100, isDoubleJeopardy: false, timeLimit: 30 };
	}

	function handleAddTeam() {
		const game = $getActiveGame;
		if (game && newTeamName.trim()) {
			addTeam(game.id, newTeamName.trim(), newTeamColor);
			newTeamName = '';
			newTeamColor = '#' + ('000000' + Math.floor(Math.random() * 16777215).toString(16)).slice(-6);
		}
	}

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
		wagerInputValue = question.isDoubleJeopardy ? question.pointValue.toString() : '0';

		// Timer is now handled by the JeopardyTimer component
	}

	function startQuestionTimer(seconds: number) {
		remainingSeconds = seconds;
		updateTimerDisplay();
		if (timerIntervalId !== null) clearInterval(timerIntervalId);
		timerIntervalId = setInterval(() => {
			remainingSeconds--;
			updateTimerDisplay();
			if (remainingSeconds <= 0) {
				if (timerIntervalId !== null) clearInterval(timerIntervalId);
				timerIntervalId = null;
			}
		}, 1000);
	}

	function updateTimerDisplay() {
		const minutes = Math.floor(remainingSeconds / 60);
		const currentSeconds = remainingSeconds % 60;
		timerDisplay = `${minutes.toString().padStart(1, '0')}:${currentSeconds.toString().padStart(2, '0')}`;
	}

	function handleWagerSubmit() {
		const wager = parseInt(wagerInputValue, 10);
		if (isNaN(wager) || wager < 0) {
			showFeedback("Invalid wager amount.", true);
			return;
		}
		setWagerAmount(wager);
	}

	onMount(() => {
		// Simulate loading time
		setTimeout(() => {
			isLoading = false;
		}, 500);
	});

	onDestroy(() => {
		if (timerIntervalId !== null) clearInterval(timerIntervalId);
	});

	function handleAwardPoints() {
		const game = $getActiveGame;
		const question = $getActiveQuestion;
		if (!game || !question || !selectedTeamId || !question.categoryId) return;
		const pointsToAward = question.isDoubleJeopardy ? $wagerAmount : question.pointValue;
		updateTeamScore(game.id, selectedTeamId, pointsToAward);
		markQuestionAnswered(game.id, question.categoryId, question.id);
		setActiveQuestion(null);
		if (timerIntervalId !== null) { clearInterval(timerIntervalId); timerIntervalId = null; }
	}

	function handleDeductPoints() {
		const game = $getActiveGame;
		const question = $getActiveQuestion;
		if (!game || !question || !selectedTeamId || !question.categoryId) return;
		const pointsToDeduct = question.isDoubleJeopardy ? $wagerAmount : question.pointValue;
		updateTeamScore(game.id, selectedTeamId, -pointsToDeduct);
		markQuestionAnswered(game.id, question.categoryId, question.id);
		setActiveQuestion(null);
		if (timerIntervalId !== null) { clearInterval(timerIntervalId); timerIntervalId = null; }
	}

	function toggleMode() {
		setEditMode(!$editMode);
	}

	function handleResetGame() {
		const game = $getActiveGame;
		if (!game) return;
		if (confirm('Are you sure you want to reset the game? This will clear all scores and mark all questions as unanswered.')) {
			resetAllScores(game.id);
			resetGameBoard(game.id);
		}
	}

	function handleUseTimerChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if ($getActiveGame) updateGameSettings($getActiveGame.id, { useTimer: target.checked });
	}

	function handleDefaultTimeLimitChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value, 10);
		if (!isNaN(value) && $getActiveGame) {
			updateGameSettings($getActiveGame.id, { defaultTimeLimit: value });
		}
	}

	function handleReadingTimeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value, 10);
		if (!isNaN(value) && $getActiveGame) {
			updateGameSettings($getActiveGame.id, { readingTime: value });
		}
	}

	function handleAutoShowAnswerChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if ($getActiveGame) updateGameSettings($getActiveGame.id, { autoShowAnswer: target.checked });
	}

	function handleTimerSizeChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		if ($getActiveGame) updateGameSettings($getActiveGame.id, { timerSize: target.value as TimerSize });
	}

	// MODIFIED: Apply game template (can now create a new game or apply to existing)
	function handleApplyTemplate(templateId: string) {
		const selectedTemplate = templates.find(t => t.id === templateId);
		if (!selectedTemplate) {
			showFeedback("Selected template not found.", true);
			return; // Return early if template not found
		}

		let gameToApplyId: string;
		let isNewGameFromTemplate = false;
		let proceedWithApplication = true; // Flag to control execution flow

		if (!$getActiveGame) { // Called from initial screen
			const gameNameFromTemplate = `${selectedTemplate.name} (Template)`;
			gameToApplyId = createGame(gameNameFromTemplate);
			setActiveGame(gameToApplyId); // Set active to proceed
			isNewGameFromTemplate = true;
		} else if ($getActiveGame && $editMode) { // Called from editor for an existing game (via modal)
			gameToApplyId = $getActiveGame.id;
			if (!confirm(`Apply template "${selectedTemplate.name}" to the current game "${$getActiveGame.name}"? This will replace existing categories and questions.`)) {
				proceedWithApplication = false; // User cancelled the confirmation
			}
		} else {
			showFeedback("Cannot apply template in the current context.", true);
			return; // Return early for invalid context
		}

		if (!proceedWithApplication) {
			// If user cancelled confirmation when applying to existing game,
			// or if any other reason to not proceed.
			return;
		}

		const success = applyGameTemplate(gameToApplyId, selectedTemplate.id);

		if (success) {
			setEditMode(true); // Enter/stay in edit mode for the (newly) templated game
			showFeedback(`Template "${selectedTemplate.name}" applied successfully!`, false);
		} else {
			showFeedback(`Failed to apply template "${selectedTemplate.name}".`, true);
			if (isNewGameFromTemplate) {
				// If creating a new game from template failed, clean up
				deleteGame(gameToApplyId);
				setActiveGame(null);
				setEditMode(false); // Ensure not stuck in edit mode for a non-existent game
			}
		}
	}


	function handleImportJSON(event: Event) {
		const game = $getActiveGame;
		if (!game) {
			showFeedback('No active game selected to import data into.', true);
			return;
		}
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;
		const file = input.files[0];
		if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
			showFeedback('Please select a valid JSON file.', true);
			return;
		}
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const fileContent = e.target?.result;
				if (typeof fileContent !== 'string') {
					showFeedback('Error reading file content.', true); return;
				}
				const jsonData = JSON.parse(fileContent);
				const success = importGameData(game.id, jsonData);
				if (success) {
					showFeedback('Import successful! Categories and questions have been added.', false);
				} else {
					showFeedback('Failed to import. Invalid data format or see console.', true);
				}
			} catch (error) {
				console.error('Error parsing JSON:', error);
				showFeedback('Invalid JSON format in file.', true);
			}
			if (input) input.value = '';
		};
		reader.onerror = () => showFeedback('Error reading file.', true);
		reader.readAsText(file);
	}

	function handleExportJSON() {
		const game = $getActiveGame;
		if (!game) return;
		const jsonData = exportGameData(game.id);
		if (!jsonData) {
			showFeedback("Failed to export game data.", true);
			return;
		}
		const blob = new Blob([jsonData], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${game.name.replace(/\s+/g, '_') || 'jeopardy_game'}_export.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		showFeedback('Game exported successfully!', false);
	}

</script>

{#if isLoading}
	<div class="flex items-center justify-center min-h-[600px]">
		<LoadingBounce />
	</div>
{:else}
<div class="mb-8">
	<div class="flex justify-between items-center mb-6">
		<div>
			{#if $getActiveQuestion && $getActiveGame}
				<h1 class="text-2xl font-bold text-white mb-1">{$getActiveGame.name}</h1>
				<p class="text-dark-muted">{$getActiveGame.description || 'Playing a quiz game'}</p>
			{:else}
				<h1 class="text-2xl font-bold text-white mb-1">Jeopardy</h1>
				<p class="text-dark-muted">Create and play Jeopardy-style quiz games</p>
			{/if}
		</div>
		<div class="flex gap-3">
			{#if $getActiveGame && !$getActiveQuestion} <button
				onclick={toggleMode}
				class="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white transition"
			>
				{$editMode ? 'Play Game' : 'Edit Game'}
			</button>
				<button
					onclick={handleResetGame}
					class="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white transition"
				>
					Reset Game
				</button>
			{/if}
		</div>
	</div>

	{#if generalMessage}
		<div
			class="p-4 mb-4 rounded-lg text-sm {messageIsError ? 'bg-red-900 bg-opacity-50 border border-red-700 text-red-300' : 'bg-green-900 bg-opacity-50 border border-green-700 text-green-300'}"
			role="alert"
		>
			{generalMessage}
		</div>
	{/if}


	{#if !$getActiveGame}
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
					onclick={handleCreateGame}
					class="px-4 py-3 bg-dark-highlight text-dark-purple font-medium rounded-lg hover:bg-dark-lavender transition focus:ring-2 focus:ring-offset-2 focus:ring-dark-purple"
				>
					Create Game
				</button>
			</div>
		</div>

		{#if templates.length > 0}
			<div class="bg-dark-card border border-dark-border p-6 rounded-xl mb-8 shadow-dark-card">
				<h2 class="text-lg font-semibold text-white mb-4">Or Start with a Template</h2>
				<p class="text-dark-muted text-sm mb-4">
					Select a pre-made template to create a new game with categories and questions.
				</p>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each templates as template (template.id)}
						<div
							class="bg-dark-surface rounded-lg p-4 border border-dark-border hover:border-dark-purple transition flex flex-col"
						>
							<h3 class="text-white font-medium">{template.name}</h3>
							<p class="text-dark-muted text-sm mb-2 flex-grow">{template.description}</p>
							<p class="text-xs text-dark-muted mb-3">
								{template.categories.length} categories,
								{template.categories.reduce((acc, cat) => acc + cat.questions.length, 0)} questions
							</p>
							<button
								onclick={() => handleApplyTemplate(template.id)}
								class="w-full py-2 bg-dark-highlight text-dark-purple font-medium rounded hover:bg-dark-lavender transition mt-auto"
							>
								Use This Template
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if $getGames.length > 0}
			<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
				<h2 class="text-lg font-semibold text-white mb-4">Your Games</h2>
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each $getGames as game (game.id)}
						<div class="bg-dark-surface border border-dark-border rounded-lg p-4 hover:border-dark-purple transition">
							<h3 class="text-white font-medium mb-2">{game.name}</h3>
							<div class="text-dark-muted text-sm mb-3">
								<div>{game.categories.length} Categories</div>
								<div>{game.teams.length} Teams</div>
								<div class="text-xs mt-1">
									Last modified: {new Date(game.lastModified).toLocaleDateString()}
								</div>
							</div>
							<div class="flex justify-between items-center mt-4">
								<button
									onclick={() => { setActiveGame(game.id); setEditMode(false); }}
									class="text-sm px-3 py-1 bg-dark-highlight text-dark-purple rounded hover:bg-dark-lavender transition"
								>
									Play
								</button>
								<button
									onclick={() => { setActiveGame(game.id); setEditMode(true); }}
									class="text-sm px-3 py-1 bg-dark-card text-gray-300 rounded hover:bg-dark-accent hover:text-white transition"
								>
									Edit
								</button>
								<button
									onclick={() => { if (confirm('Are you sure you want to delete this game?')) deleteGame(game.id); }}
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
		<div class="flex flex-col">
			{#if $getActiveGame?.settings?.useTimer && $getActiveGame?.settings?.timerSize !== 'small'}
				<JeopardyTimer 
					readingTime={$getActiveGame.settings.readingTime || 5}
					totalTime={$getActiveQuestion.timeLimit || $getActiveGame.settings.defaultTimeLimit || 30}
					size={$getActiveGame.settings.timerSize || 'large'}
					onTimeExpired={() => {
						if ($getActiveGame.settings.autoShowAnswer) {
							showAnswer = true;
						}
						showFeedback('Time expired!', false, 2000);
					}}
					onReadingComplete={() => {
						// Reading phase complete, main timer starts
					}}
				/>
			{/if}
			<div class="bg-dark-surface border-2 border-dark-purple rounded-xl p-10 mb-4 text-center min-h-[300px] flex flex-col justify-center relative">
				{#if $getActiveGame?.settings?.useTimer && $getActiveGame?.settings?.timerSize === 'small'}
					<JeopardyTimer 
						readingTime={$getActiveGame.settings.readingTime || 5}
						totalTime={$getActiveQuestion.timeLimit || $getActiveGame.settings.defaultTimeLimit || 30}
						size="small"
						position="corner"
						onTimeExpired={() => {
							if ($getActiveGame.settings.autoShowAnswer) {
								showAnswer = true;
							}
							showFeedback('Time expired!', false, 2000);
						}}
						onReadingComplete={() => {
							// Reading phase complete, main timer starts
						}}
					/>
				{/if}
				{#if $getActiveQuestion.isDoubleJeopardy}<div class="absolute top-4 left-4 bg-dark-highlight px-3 py-1 rounded-lg text-dark-purple font-bold">Double Jeopardy</div>{/if}
				{#if $getActiveQuestion.categoryName}
					<div class="mb-6">
						<h3 class="text-lg font-semibold text-dark-highlight">{$getActiveQuestion.categoryName}</h3>
						<p class="text-2xl font-bold text-white mt-1">${$getActiveQuestion.pointValue}</p>
					</div>
				{/if}
				<div class="text-xl md:text-2xl lg:text-3xl text-white font-medium mb-8">{$getActiveQuestion.text}</div>
				{#if showAnswer}<div class="text-xl md:text-2xl text-dark-highlight font-medium mb-4">{$getActiveQuestion.answer}</div>{/if}
				<div class="flex justify-center mt-4">
					<button onclick={() => (showAnswer = !showAnswer)} class="px-4 py-2 bg-dark-card text-gray-300 rounded-lg hover:bg-dark-accent hover:text-white transition mx-2">{showAnswer ? 'Hide Answer' : 'Show Answer'}</button>
					<button onclick={() => setActiveQuestion(null)} class="px-4 py-2 bg-dark-card text-gray-300 rounded-lg hover:bg-dark-accent hover:text-white transition mx-2">Back to Board</button>
				</div>
			</div>
			{#if $getActiveQuestion.isDoubleJeopardy}
				<div class="bg-dark-card border border-dark-border rounded-xl p-6 shadow-dark-card mb-4">
					<h3 class="text-lg font-semibold text-white mb-4 text-center">Double Jeopardy Wager</h3>
					<div class="flex flex-col items-center">
						<div class="flex items-center gap-3 mb-4">
							<input type="number" bind:value={wagerInputValue} min="0" max={Math.max($getActiveQuestion.pointValue * 2, 1000)} class="bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple w-32 text-center"/>
							<button onclick={handleWagerSubmit} class="px-4 py-3 bg-dark-highlight text-dark-purple font-medium rounded-lg hover:bg-dark-lavender transition">Set Wager</button>
						</div>
						<p class="text-dark-muted text-sm">Current wager: <span class="text-white font-medium">{$wagerAmount}</span> points</p>
					</div>
				</div>
			{/if}
			<div class="bg-dark-card border border-dark-border rounded-xl p-6 shadow-dark-card">
				<h3 class="text-lg font-semibold text-white mb-4 text-center">Award Points ({$getActiveQuestion.isDoubleJeopardy ? $wagerAmount : $getActiveQuestion.pointValue})</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
					{#each $getActiveGame.teams as team (team.id)}
						<button class="p-4 rounded-lg text-white flex items-center justify-between transition-all" style="background-color: {team.color}; opacity: {selectedTeamId === team.id ? '1' : '0.6'};" onclick={() => (selectedTeamId = team.id)}>
							<span class="font-medium">{team.name}</span>
							<span class="bg-dark-surface bg-opacity-30 px-3 py-1 rounded-full">{team.score}</span>
						</button>
					{/each}
				</div>
				<div class="flex justify-center gap-4 mt-6">
					<button onclick={handleAwardPoints} disabled={!selectedTeamId || ($getActiveQuestion.isDoubleJeopardy && $wagerAmount <= 0)} class="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed">Correct (+{$getActiveQuestion.isDoubleJeopardy ? $wagerAmount : $getActiveQuestion.pointValue})</button>
					<button onclick={handleDeductPoints} disabled={!selectedTeamId || ($getActiveQuestion.isDoubleJeopardy && $wagerAmount <= 0)} class="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed">Incorrect (-{$getActiveQuestion.isDoubleJeopardy ? $wagerAmount : $getActiveQuestion.pointValue})</button>
				</div>
			</div>
		</div>

	{:else if $editMode}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="space-y-6">
				<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
					<h2 class="text-lg font-semibold text-white mb-4">Game: {$getActiveGame.name}</h2>
					<div class="flex justify-between">
						<button onclick={() => setActiveGame(null)} class="px-4 py-2 bg-dark-surface text-gray-300 rounded hover:bg-dark-accent hover:text-white transition">Back to Games</button>
						<button onclick={toggleMode} class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded hover:bg-dark-lavender transition">Play Game</button>
					</div>
				</div>

				<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
					<h2 class="text-lg font-semibold text-white mb-4">Game Settings</h2>
					<div class="space-y-4">
						<div class="flex items-center">
							<label class="flex items-center cursor-pointer">
								<input type="checkbox" checked={$getActiveGame.settings?.useTimer || false} onchange={handleUseTimerChange} class="h-4 w-4 bg-dark-surface border-dark-border text-dark-purple focus:ring-dark-purple rounded"/>
								<span class="ml-2 text-white">Use timer for questions by default</span>
							</label>
						</div>
						<div>
							<label for="question-time" class="block text-sm text-dark-lavender font-medium mb-2">Question Time (seconds)</label>
							<input id="question-time" type="number" value={$getActiveGame.settings?.defaultTimeLimit || 30} onchange={handleDefaultTimeLimitChange} min="5" max="300" step="5" class="w-full md:w-1/3 bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"/>
							<p class="text-dark-muted text-xs mt-1">Time allowed to answer the question after reading</p>
						</div>
						<div>
							<label for="reading-time" class="block text-sm text-dark-lavender font-medium mb-2">Reading time (seconds)</label>
							<input id="reading-time" type="number" value={$getActiveGame.settings?.readingTime || 5} onchange={handleReadingTimeChange} min="1" max="15" step="1" class="w-full md:w-1/3 bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"/>
							<p class="text-dark-muted text-xs mt-1">Time given to read the question before countdown starts</p>
						</div>
						<div class="flex items-center mt-4">
							<label class="flex items-center cursor-pointer">
								<input type="checkbox" checked={$getActiveGame.settings?.autoShowAnswer || false} onchange={handleAutoShowAnswerChange} class="h-4 w-4 bg-dark-surface border-dark-border text-dark-purple focus:ring-dark-purple rounded"/>
								<span class="ml-2 text-white">Automatically show answer when timer expires</span>
							</label>
						</div>
						<div class="mt-4">
							<label for="timer-size" class="block text-sm text-dark-lavender font-medium mb-2">Timer Size</label>
							<select 
								id="timer-size" 
								value={$getActiveGame.settings?.timerSize || 'large'} 
								onchange={handleTimerSizeChange}
								class="w-full md:w-1/3 bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
							>
								<option value="large">Large (Above question)</option>
								<option value="medium">Medium (Wider bar)</option>
								<option value="small">Small (Corner)</option>
							</select>
							<p class="text-dark-muted text-xs mt-1">Choose how the timer is displayed during questions</p>
						</div>
					</div>
					<div class="mt-6 pt-4 border-t border-dark-border">
						<button
							onclick={() => showTemplateModal = true}
							class="w-full py-2 bg-dark-accent text-white font-medium rounded-lg hover:bg-opacity-80 transition"
						>
							Apply Template from Library...
						</button>
					</div>
				</div>

				<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
					<h2 class="text-lg font-semibold text-white mb-4">Import/Export Questions</h2>
					<div class="space-y-5">
						<div>
							<h3 class="text-white font-medium mb-2">Import from JSON</h3>
							<p class="text-dark-muted text-sm mb-3">Import categories and questions from a JSON file.</p>
							<div class="flex flex-col gap-3">
								<input id="jsonFile" type="file" accept=".json,application/json" onchange={handleImportJSON} class="bg-dark-surface text-white border border-dark-border rounded-lg p-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-dark-highlight file:text-dark-purple hover:file:bg-dark-lavender"/>
							</div>
						</div>
						<div class="pt-4 border-t border-dark-border">
							<h3 class="text-white font-medium mb-2">Export to JSON</h3>
							<p class="text-dark-muted text-sm mb-3">Export your game's categories and questions to a JSON file for backup or sharing.</p>
							<button onclick={handleExportJSON} class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded hover:bg-dark-lavender transition">Export Game</button>
						</div>
						<div class="mt-4 text-dark-muted text-xs">
							<p class="font-semibold">JSON format:</p>
							<pre class="bg-dark-surface p-2 rounded-lg mt-1 overflow-auto">{`{
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
}`}</pre>
						</div>
					</div>
				</div>

				<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
					<h2 class="text-lg font-semibold text-white mb-4">Add Category</h2>
					<div class="flex gap-2">
						<input type="text" placeholder="Category name" bind:value={newCategoryName} class="flex-grow bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple placeholder:text-dark-muted"/>
						<button onclick={handleAddCategory} class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded-lg hover:bg-dark-lavender transition">Add</button>
					</div>
				</div>

				<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
					<h2 class="text-lg font-semibold text-white mb-4">Teams</h2>
					<div class="flex gap-2 mb-4">
						<input type="text" placeholder="Team name" bind:value={newTeamName} class="flex-grow bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple placeholder:text-dark-muted"/>
						<div class="relative"><input type="color" bind:value={newTeamColor} class="w-12 h-12 rounded-lg cursor-pointer border border-dark-border"/></div>
						<button onclick={handleAddTeam} class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded-lg hover:bg-dark-lavender transition">Add</button>
					</div>
					<div class="space-y-3 mt-4">
						{#each $getActiveGame.teams as team (team.id)}
							<div class="flex items-center justify-between bg-dark-surface p-3 rounded-lg" style="border-left: 4px solid {team.color};">
								<div class="flex items-center">
									<div class="w-4 h-4 rounded-full mr-3" style="background-color: {team.color};"></div>
									<span class="font-medium text-white">{team.name}</span>
								</div>
								<div class="flex items-center">
									<span class="text-dark-muted mr-4">Score: {team.score}</span>
									<button onclick={() => { if (confirm('Are you sure you want to delete this team?')) deleteTeam($getActiveGame.id, team.id); }} class="text-gray-400 hover:text-red-500 transition">Delete</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="lg:col-span-2 space-y-6">
				{#if $getActiveGame.categories.length === 0}
					<div class="bg-dark-card border border-dark-border p-8 rounded-xl shadow-dark-card flex flex-col items-center justify-center text-center">
						<h3 class="text-white font-medium text-xl mb-2">No Categories Yet</h3>
						<p class="text-dark-muted mb-6">Add categories and questions to build your Jeopardy game.</p>
						<p class="text-dark-lavender mb-4">Tip: Use the "Apply Template from Library..." button in Game Settings to quickly add content.</p>
					</div>
				{:else}
					{#each $getActiveGame.categories as category (category.id)}
						<div class="bg-dark-card border border-dark-border rounded-xl shadow-dark-card">
							<div class="p-4 border-b border-dark-border flex justify-between items-center bg-dark-surface rounded-t-xl">
								<h3 class="text-white font-medium">{category.name}</h3>
								<div class="flex gap-2">
									<button onclick={() => openEditQuestion(category.id)} class="text-sm px-3 py-1 bg-dark-highlight text-dark-purple rounded hover:bg-dark-lavender transition">Add Question</button>
									<button onclick={() => { if (confirm('Are you sure you want to delete this category and all its questions?')) deleteCategory($getActiveGame.id, category.id); }} class="text-sm px-3 py-1 bg-dark-card text-gray-300 rounded hover:bg-red-500 hover:text-white transition">Delete</button>
								</div>
							</div>
							<div class="p-4 space-y-3">
								{#if category.questions.length === 0}
									<p class="text-dark-muted text-center py-4">No questions in this category yet</p>
								{:else}
									{#each category.questions as question (question.id)}
										<div class="bg-dark-surface border border-dark-border p-3 rounded-lg hover:border-dark-purple transition">
											<div class="flex justify-between items-start mb-2">
												<div>
													<div class="text-white font-medium mb-1 line-clamp-2">{question.text}</div>
													<div class="text-dark-muted text-sm line-clamp-1">Answer: {question.answer}</div>
												</div>
												<div class="ml-4 px-3 py-1 bg-dark-highlight text-dark-purple font-medium rounded text-sm">{question.pointValue} pts</div>
											</div>
											<div class="flex items-center justify-between text-xs mt-3">
												<div class="flex gap-2 text-dark-muted">
													{#if question.isDoubleJeopardy}<span class="bg-dark-highlight bg-opacity-30 px-2 py-0.5 rounded text-dark-purple">Double Jeopardy</span>{/if}
													{#if question.timeLimit}<span class="bg-dark-surface bg-opacity-70 px-2 py-0.5 rounded border border-dark-border">{question.timeLimit}s</span>{/if}
												</div>
												<div><button onclick={() => openEditQuestion(category.id, question)} class="text-gray-400 hover:text-white transition px-2">Edit</button></div>
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

	{:else} <div class="space-y-8">
		<div class="flex flex-col md:flex-row justify-between items-center bg-dark-card border border-dark-border p-4 rounded-xl shadow-dark-card">
			<div><h2 class="text-xl font-bold text-white">{$getActiveGame.name}</h2></div>
			<div class="flex gap-3 mt-4 md:mt-0">
				<button onclick={toggleMode} class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded hover:bg-dark-lavender transition">Edit Game</button>
				<button onclick={handleResetGame} class="px-4 py-2 bg-dark-card text-gray-300 rounded hover:bg-dark-accent hover:text-white transition">Reset Board</button>
			</div>
		</div>
		{#if $getActiveGame.teams.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
				{#each $getActiveGame.teams as team (team.id)}
					<div class="p-4 rounded-lg text-white flex items-center justify-between transition-all shadow-md" style="background-color: {team.color};">
						<span class="font-bold text-lg">{team.name}</span>
						<span class="bg-dark-surface bg-opacity-30 px-4 py-2 text-xl font-mono rounded-lg">{team.score}</span>
					</div>
				{/each}
			</div>
			{#if $getLeadingTeam}<div class="text-center text-dark-muted mb-6">Leading: <span class="text-white font-medium">{$getLeadingTeam.name}</span> with {$getLeadingTeam.score} points</div>{/if}
		{:else}
			<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card text-center">
				<p class="text-dark-muted mb-4">No teams yet. Add teams in Edit mode.</p>
				<button onclick={toggleMode} class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded hover:bg-dark-lavender transition">Go to Edit Mode</button>
			</div>
		{/if}
		{#if $getActiveGame.categories.length > 0}
			<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
					{#each $getActiveGame.categories as category (category.id)}
						<div class="space-y-2">
							<div class="bg-dark-highlight text-dark-purple font-bold p-3 text-center rounded-lg min-h-[60px] flex items-center justify-center">{category.name}</div>
							{#each category.questions as question (question.id)}
								<button
									onclick={() => handleOpenQuestion(category.id, question.id)}
									disabled={question.isAnswered}
									class="w-full bg-dark-surface border border-dark-border hover:border-dark-purple p-3 h-16 rounded-lg transition font-bold flex items-center justify-center disabled:opacity-40 disabled:hover:border-dark-border"
									class:bg-dark-highlight={question.isDoubleJeopardy && !question.isAnswered}
									class:text-dark-purple={question.isDoubleJeopardy && !question.isAnswered}
								>
									{#if question.isAnswered}&nbsp;{:else}{question.pointValue}{/if}
								</button>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card text-center">
				<p class="text-dark-muted mb-4">No categories or questions yet. Add them in Edit mode.</p>
				<button onclick={toggleMode} class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded hover:bg-dark-lavender transition">Go to Edit Mode</button>
			</div>
		{/if}
	</div>
	{/if}
</div>

{#if editingQuestion.categoryId}
	<div class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
		onclick={(e) => { if (e.target === e.currentTarget) editingQuestion = { categoryId: '', questionId: '', text: '', answer: '', pointValue: 100, isDoubleJeopardy: false, timeLimit: 30 }; }}
		onkeydown={(e) => { if (e.key === 'Escape') editingQuestion = { categoryId: '', questionId: '', text: '', answer: '', pointValue: 100, isDoubleJeopardy: false, timeLimit: 30 }; }}
		role="dialog"
		aria-modal="true"
		aria-label="Edit Question"
		tabindex="-1">
		<div role="dialog" tabindex="-1" class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card w-full max-w-xl max-h-[85vh] flex flex-col"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				// Only prevent default for Enter key but not for space
				// This allows space to work in form inputs
				if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
					e.preventDefault();
					e.stopPropagation();
				}
			}}>
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-xl font-semibold text-white">{editingQuestion.questionId ? 'Edit' : 'Add'} Question</h2>
				<button
					onclick={() => editingQuestion = { categoryId: '', questionId: '', text: '', answer: '', pointValue: 100, isDoubleJeopardy: false, timeLimit: 30 }}
					class="text-gray-400 hover:text-white text-2xl leading-none p-1 hover:bg-dark-accent rounded-full w-8 h-8 flex items-center justify-center"
					aria-label="Close modal"
				>&times;</button>
			</div>
			<div class="overflow-y-auto flex-grow pr-2">
				<div class="space-y-4">
					<div>
						<label for="question-text" class="block text-sm text-dark-lavender font-medium mb-2">Question Text</label>
						<textarea 
							id="question-text" 
							bind:value={editingQuestion.text} 
							class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple min-h-[100px]"
							placeholder="Enter the question here..."
						></textarea>
					</div>
					<div>
						<label for="question-answer" class="block text-sm text-dark-lavender font-medium mb-2">Answer</label>
						<input 
							id="question-answer" 
							type="text" 
							bind:value={editingQuestion.answer} 
							class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
							placeholder="Enter the answer here..."
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="question-points" class="block text-sm text-dark-lavender font-medium mb-2">Point Value</label>
							<input 
								id="question-points" 
								type="number"
								min="100"
								step="100" 
								bind:value={editingQuestion.pointValue} 
								class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
							/>
						</div>
						<div>
							<label for="question-time" class="block text-sm text-dark-lavender font-medium mb-2">Time Limit (seconds)</label>
							<input 
								id="question-time" 
								type="number"
								min="5"
								step="5" 
								bind:value={editingQuestion.timeLimit} 
								class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
							/>
						</div>
					</div>
					<div class="flex items-center mt-2">
						<input 
							id="is-double-jeopardy"
							type="checkbox"
							bind:checked={editingQuestion.isDoubleJeopardy}
							class="h-4 w-4 text-dark-purple focus:ring-dark-purple border-dark-border bg-dark-surface rounded"
						/>
						<label for="is-double-jeopardy" class="ml-2 block text-white">
							Double Jeopardy Question
						</label>
					</div>
				</div>
			</div>
			<div class="flex justify-between mt-6 pt-4 border-t border-dark-border">
				{#if editingQuestion.questionId}
					<button
						onclick={_handleDeleteQuestion}
						class="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
					>
						Delete Question
					</button>
				{:else}
					<div></div>
				{/if}
				<div class="flex gap-2">
					<button
						onclick={() => editingQuestion = { categoryId: '', questionId: '', text: '', answer: '', pointValue: 100, isDoubleJeopardy: false, timeLimit: 30 }}
						class="px-4 py-2 bg-dark-surface text-gray-300 rounded-lg hover:bg-dark-accent hover:text-white transition"
					>
						Cancel
					</button>
					<button
						onclick={_handleSaveQuestion}
						class="px-4 py-2 bg-dark-highlight text-dark-purple font-medium rounded-lg hover:bg-dark-lavender transition"
					>
						Save Question
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showTemplateModal && $getActiveGame && $editMode}
	<div class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out" 
    onclick={(e) => { if (e.target === e.currentTarget) showTemplateModal = false; }}
    onkeydown={(e) => { if (e.key === 'Escape') showTemplateModal = false; }}
    role="dialog"
    aria-modal="true"
    aria-label="Template Manager"
    tabindex="-1">
		<div role="button" tabindex="0" class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card w-full max-w-2xl max-h-[85vh] flex flex-col"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        // Execute the same action as the click handler - stop propagation
      }
    }}
    aria-label="Template selection modal"
>
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-xl font-semibold text-white">Apply Template to "{$getActiveGame.name}"</h2>
				<button
					onclick={() => showTemplateModal = false}
					class="text-gray-400 hover:text-white text-2xl leading-none p-1 hover:bg-dark-accent rounded-full w-8 h-8 flex items-center justify-center"
					aria-label="Close modal"
				>&times;</button>
			</div>
			<p class="text-dark-muted text-sm mb-6">
				Select a template from the library. Applying a template will <strong class="text-red-400">replace all existing categories and questions</strong> in the current game. This action cannot be undone.
			</p>
			<div class="overflow-y-auto flex-grow pr-2 space-y-3">
				{#each templates as template (template.id)}
					<div class="bg-dark-surface rounded-lg p-4 border border-dark-border hover:border-dark-purple transition flex flex-col">
						<h3 class="text-white font-medium">{template.name}</h3>
						<p class="text-dark-muted text-sm mb-2 flex-grow">{template.description}</p>
						<p class="text-xs text-dark-muted mb-3">
							{template.categories.length} categories,
							{template.categories.reduce((acc, cat) => acc + cat.questions.length, 0)} questions
						</p>
						<button
							onclick={() => {
            handleApplyTemplate(template.id);
            if (generalMessage) {
                 showTemplateModal = false;
            }
          }}
							class="w-full py-2 bg-dark-highlight text-dark-purple font-medium rounded hover:bg-dark-lavender transition mt-auto"
						>
							Apply This Template
						</button>
					</div>
				{/each}
				{#if templates.length === 0}
					<p class="text-dark-muted text-center py-4">No templates available in the library.</p>
				{/if}
			</div>
			<div class="mt-6 text-right">
				<button
					onclick={() => showTemplateModal = false}
					class="px-4 py-2 bg-dark-surface text-gray-300 rounded-lg hover:bg-dark-accent hover:text-white transition"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
{/if}
