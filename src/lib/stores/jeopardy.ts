// src/lib/stores/jeopardy.ts
import { writable, derived, get } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import { supabaseService } from '$lib/services/supabaseService';
import { authStore } from './auth';
import type { User } from '@supabase/supabase-js';
import type {
	JeopardyGame,
	Category,
	Question,
	Team,
	GameSettings,
	GameTemplate
} from '$lib/types/jeopardy';

function createJeopardyStore() {
	// Core state stores
	const games = writable<JeopardyGame[]>([]);
	const activeGameId = writable<string | null>(null);
	const activeQuestionId = writable<string | null>(null);
	const wagerAmount = writable<number>(0);
	const loading = writable<boolean>(false);
	const error = writable<string | null>(null);
	const dataLoaded = writable<boolean>(false);

	// Derived stores
	const getGames = derived(games, ($games) => $games);

	const getActiveGame = derived([games, activeGameId], ([$games, $activeGameId]) => {
		if (!$activeGameId) return null;
		return $games.find((game) => game.id === $activeGameId) || null;
	});

	const getActiveQuestion = derived(
		[getActiveGame, activeQuestionId],
		([$activeGame, $activeQuestionId]) => {
			if (!$activeGame || !$activeQuestionId) return null;

			for (const category of $activeGame.categories) {
				const question = category.questions.find((q) => q.id === $activeQuestionId);
				if (question) {
					return {
						...question,
						categoryId: category.id,
						categoryName: category.name
					};
				}
			}
			return null;
		}
	);

	const getLeadingTeam = derived(getActiveGame, ($activeGame) => {
		if (!$activeGame || $activeGame.teams.length === 0) return null;
		return $activeGame.teams.reduce(
			(leader, team) => (team.score > leader.score ? team : leader),
			$activeGame.teams[0]
		);
	});

	// Helper function to get current user
	async function getCurrentUser(): Promise<User | null> {
		const { user } = get(authStore);
		return user;
	}

	// Load all games for the current user
	async function loadAllGames() {
		loading.set(true);
		error.set(null);

		try {
			const user = await getCurrentUser();
			if (!user) {
				games.set([]);
				return;
			}

			// Load games
			const dbGames = await supabaseService.getItems('games', {
				filters: { user_id: user.id }
			});

			// Load all related data and construct full game objects
			const fullGames: JeopardyGame[] = [];

			for (const dbGame of dbGames) {
				// Load categories for this game
				const categories = await supabaseService.getItems('game_categories', {
					filters: { game_id: dbGame.id }
				});

				// Load questions for all categories
				const fullCategories: Category[] = [];
				for (const cat of categories) {
					const questions = await supabaseService.getItems('questions', {
						filters: { category_id: cat.id }
					});

					fullCategories.push({
						id: cat.id,
						name: cat.category_name,
						questions: questions.map((q) => ({
							id: q.id,
							text: q.question_text,
							answer: q.answer_text,
							pointValue: q.point_value,
							isDoubleJeopardy: q.is_double_jeopardy || false,
							isAnswered: q.answered || false,
							timeLimit: q.time_limit ?? 30
						}))
					});
				}

				// Extract teams from settings (since teams table doesn't exist)
				const gameSettings = dbGame.settings as Record<string, unknown>;
				const teams = (gameSettings?.teams ?? []) as Team[];
				const settings = gameSettings?.gameSettings ?? {
					useTimer: true,
					timerSize: 'large' as const,
					defaultTimeLimit: 30,
					readingTime: 5,
					autoShowAnswer: false
				};

				fullGames.push({
					id: dbGame.id,
					name: dbGame.name,
					dateCreated: dbGame.created_at ?? new Date().toISOString(),
					categories: fullCategories,
					teams: teams,
					settings: settings,
					lastModified: dbGame.last_modified ?? dbGame.created_at ?? new Date().toISOString()
				});
			}

			games.set(fullGames);
		} catch (err: unknown) {
			console.error('Error loading games:', err);
			error.set(err instanceof Error ? err.message : 'Failed to load games');
		} finally {
			loading.set(false);
		}
	}

	// Ensure data is loaded before using the store
	async function ensureDataLoaded() {
		if (get(dataLoaded)) return;
		await loadAllGames();
		dataLoaded.set(true);
	}

	// Save or update a game in Supabase
	async function saveGameToSupabase(game: JeopardyGame) {
		try {
			const user = await getCurrentUser();
			if (!user) throw new Error('User not authenticated');

			// Save or update the main game record
			const gameData = {
				name: game.name,
				settings: JSON.parse(JSON.stringify({
					gameSettings: game.settings,
					teams: game.teams
				})),
				last_modified: new Date().toISOString(),
				is_public: false,
				owner_role: 'teacher' as const
			};

			let savedGame;

			// Check if game exists in database first
			let gameExistsInDb = false;
			if (game.id && game.id !== 'new') {
				try {
					const existingGame = await supabaseService.getItems('games', {
						filters: { id: game.id }
					});
					gameExistsInDb = existingGame.length > 0;
				} catch (_e) {
					gameExistsInDb = false;
				}
			}

			if (gameExistsInDb) {
				// Update existing game
				savedGame = await supabaseService.updateItem('games', game.id, gameData);
			} else {
				// Insert new game
				const newGameData = {
					...gameData,
					user_id: user.id,
					id: game.id || uuidv4()
				};
				savedGame = await supabaseService.insertItem('games', newGameData);
			}

			if (!savedGame) throw new Error('Failed to save game');

			// Save categories
			for (let i = 0; i < game.categories.length; i++) {
				const cat = game.categories[i];
				const categoryData = {
					game_id: savedGame.id,
					category_name: cat.name,
					order_index: i
				};

				let savedCategory;

				// Check if category exists in database
				let categoryExistsInDb = false;
				if (cat.id && cat.id !== 'new') {
					try {
						const existingCategory = await supabaseService.getItems('game_categories', {
							filters: { id: cat.id }
						});
						categoryExistsInDb = existingCategory.length > 0;
					} catch (_e) {
						categoryExistsInDb = false;
					}
				}

				if (categoryExistsInDb) {
					savedCategory = await supabaseService.updateItem('game_categories', cat.id, categoryData);
				} else {
					savedCategory = await supabaseService.insertItem('game_categories', {
						...categoryData,
						id: cat.id || uuidv4()
					});
				}

				if (!savedCategory) continue;

				// Save questions
				for (let j = 0; j < cat.questions.length; j++) {
					const q = cat.questions[j];
					const questionData = {
						category_id: savedCategory.id,
						question_text: q.text,
						answer_text: q.answer,
						point_value: q.pointValue,
						order_index: j,
						answered: q.isAnswered,
						is_double_jeopardy: q.isDoubleJeopardy
					};

					// Check if question exists in database
					let questionExistsInDb = false;
					if (q.id && q.id !== 'new') {
						try {
							const existingQuestion = await supabaseService.getItems('questions', {
								filters: { id: q.id }
							});
							questionExistsInDb = existingQuestion.length > 0;
						} catch (_e) {
							questionExistsInDb = false;
						}
					}

					if (questionExistsInDb) {
						await supabaseService.updateItem('questions', q.id, questionData);
					} else {
						await supabaseService.insertItem('questions', {
							...questionData,
							id: q.id || uuidv4()
						});
					}
				}
			}

			return savedGame.id;
		} catch (err: unknown) {
			console.error('🚨 Error saving game:', err);
			console.error('🚨 Error details:', JSON.stringify(err, null, 2));
			throw err;
		}
	}

	// Game CRUD operations
	function createGame(name: string): string {
		const gameId = uuidv4();
		const newGame: JeopardyGame = {
			id: gameId,
			name,
			dateCreated: new Date().toISOString(),
			categories: [],
			teams: [],
			settings: {
				useTimer: true,
				timerSize: 'large' as const,
				defaultTimeLimit: 30,
				readingTime: 5,
				autoShowAnswer: false
			},
			lastModified: new Date().toISOString()
		};

		games.update((g) => [...g, newGame]);
		setActiveGame(gameId);

		// Save to Supabase asynchronously
		saveGameToSupabase(newGame).catch((err) => {
			console.error('Error saving new game:', err);
		});

		return gameId;
	}

	async function deleteGame(gameId: string): Promise<void> {
		try {
			await supabaseService.deleteItem('games', gameId);
			games.update((g) => g.filter((game) => game.id !== gameId));

			if (get(activeGameId) === gameId) {
				activeGameId.set(null);
			}
		} catch (err: unknown) {
			if (err instanceof Error) {
				error.set(err.message || 'Failed to delete game');
			} else {
				error.set('An unknown error occurred while deleting the game.');
			}
		}
	}

	// Category operations
	function addCategory(gameId: string, categoryName: string): void {
		const newCategory: Category = {
			id: uuidv4(),
			name: categoryName,
			questions: []
		};

		games.update((allGames) =>
			allGames.map((game) =>
				game.id === gameId
					? {
							...game,
							categories: [...game.categories, newCategory],
							lastModified: new Date().toISOString()
						}
					: game
			)
		);

		// Save to Supabase asynchronously
		const game = get(games).find((g) => g.id === gameId);
		if (game) {
			saveGameToSupabase(game).catch((err) => {
				console.error('Error saving game after adding category:', err);
			});
		}
	}

	function deleteCategory(categoryId: string): void {
		games.update((allGames) =>
			allGames.map((game) => ({
				...game,
				categories: game.categories.filter((cat) => cat.id !== categoryId),
				lastModified: new Date().toISOString()
			}))
		);

		// Delete from Supabase asynchronously
		supabaseService.deleteItem('game_categories', categoryId).catch((err) => {
			console.error('Error deleting category from Supabase:', err);
		});
	}

	// Question operations
	function addQuestion(categoryId: string, question: Omit<Question, 'id'>): void {
		const newQuestion: Question = {
			id: uuidv4(),
			...question,
			isAnswered: false
		};

		games.update((allGames) =>
			allGames.map((game) => ({
				...game,
				categories: game.categories.map((cat) =>
					cat.id === categoryId ? { ...cat, questions: [...cat.questions, newQuestion] } : cat
				),
				lastModified: new Date().toISOString()
			}))
		);

		// Save to Supabase asynchronously
		const game = get(games).find((g) => g.categories.some((c) => c.id === categoryId));
		if (game) {
			saveGameToSupabase(game).catch((err) => {
				console.error('Error saving game after adding question:', err);
			});
		}
	}

	function updateQuestion(
		categoryId: string,
		questionId: string,
		updatedQuestion: Partial<Question>
	): void {
		games.update((allGames) =>
			allGames.map((game) => ({
				...game,
				categories: game.categories.map((cat) =>
					cat.id === categoryId
						? {
								...cat,
								questions: cat.questions.map((q) =>
									q.id === questionId ? { ...q, ...updatedQuestion } : q
								)
							}
						: cat
				),
				lastModified: new Date().toISOString()
			}))
		);

		// Update in Supabase asynchronously
		const game = get(games).find((g) => g.categories.some((c) => c.id === categoryId));
		if (game) {
			saveGameToSupabase(game).catch((err) => {
				console.error('Error saving game after updating question:', err);
			});
		}
	}

	function deleteQuestion(categoryId: string, questionId: string): void {
		games.update((allGames) =>
			allGames.map((game) => ({
				...game,
				categories: game.categories.map((cat) =>
					cat.id === categoryId
						? { ...cat, questions: cat.questions.filter((q) => q.id !== questionId) }
						: cat
				),
				lastModified: new Date().toISOString()
			}))
		);

		// Delete from Supabase asynchronously
		supabaseService.deleteItem('questions', questionId).catch((err) => {
			console.error('Error deleting question from Supabase:', err);
		});
	}

	// Team operations
	function addTeam(gameId: string, teamName: string): void {
		const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
		const existingColors =
			get(games)
				.find((g) => g.id === gameId)
				?.teams.map((t) => t.color) || [];

		const availableColors = colors.filter((c) => !existingColors.includes(c));
		const teamColor = availableColors[0] || colors[Math.floor(Math.random() * colors.length)];

		const newTeam: Team = {
			id: uuidv4(),
			name: teamName,
			score: 0,
			color: teamColor
		};

		games.update((allGames) =>
			allGames.map((game) =>
				game.id === gameId
					? { ...game, teams: [...game.teams, newTeam], lastModified: new Date().toISOString() }
					: game
			)
		);

		// Save to Supabase asynchronously
		const game = get(games).find((g) => g.id === gameId);
		if (game) {
			saveGameToSupabase(game).catch((_err) => {
				console.error('Error saving game after adding team');
			});
		}
	}

	function deleteTeam(teamId: string): void {
		games.update((allGames) =>
			allGames.map((game) => ({
				...game,
				teams: game.teams.filter((team) => team.id !== teamId),
				lastModified: new Date().toISOString()
			}))
		);

		// Save game after team deletion
		const game = get(games).find((g) => g.teams.some((t) => t.id === teamId));
		if (game) {
			saveGameToSupabase(game).catch((_err) => {
				console.error('Error saving game after deleting team');
			});
		}
	}

	function updateTeamScore(teamId: string, points: number): void {
		games.update((allGames) =>
			allGames.map((game) => ({
				...game,
				teams: game.teams.map((team) =>
					team.id === teamId ? { ...team, score: team.score + points } : team
				),
				lastModified: new Date().toISOString()
			}))
		);

		// Update in Supabase asynchronously
		const game = get(games).find((g) => g.teams.some((t) => t.id === teamId));
		if (game) {
			saveGameToSupabase(game).catch((_err) => {
				console.error('Error saving game after updating team score');
			});
		}
	}

	// Settings operations
	function updateGameSettings(gameId: string, settings: Partial<GameSettings>): void {
		games.update((allGames) =>
			allGames.map((game) =>
				game.id === gameId
					? {
							...game,
							settings: { ...game.settings, ...settings },
							lastModified: new Date().toISOString()
						}
					: game
			)
		);

		// Save to Supabase asynchronously
		const game = get(games).find((g) => g.id === gameId);
		if (game) {
			saveGameToSupabase(game).catch((_err) => {
				console.error('Error saving game after updating settings');
			});
		}
	}

	// Game state operations
	function setActiveGame(gameId: string | null): void {
		activeGameId.set(gameId);
	}

	function setActiveQuestion(
		question: (Question & { categoryId: string; categoryName: string }) | null
	): void {
		activeQuestionId.set(question?.id ?? null);
	}

	function markQuestionAnswered(categoryId: string, questionId: string): void {
		games.update((allGames) =>
			allGames.map((game) => ({
				...game,
				categories: game.categories.map((cat) =>
					cat.id === categoryId
						? {
								...cat,
								questions: cat.questions.map((q) =>
									q.id === questionId ? { ...q, isAnswered: true } : q
								)
							}
						: cat
				),
				lastModified: new Date().toISOString()
			}))
		);

		// Update in Supabase asynchronously
		const game = get(games).find((g) => g.categories.some((c) => c.id === categoryId));
		if (game) {
			saveGameToSupabase(game).catch((_err) => {
				console.error('Error saving game after marking question answered');
			});
		}
	}

	function setWagerAmount(amount: number): void {
		wagerAmount.set(amount);
	}

	// Reset operations
	function resetAllScores(): void {
		games.update((allGames) =>
			allGames.map((game) => ({
				...game,
				teams: game.teams.map((team) => ({ ...team, score: 0 })),
				lastModified: new Date().toISOString()
			}))
		);

		// Update in Supabase asynchronously
		const game = get(getActiveGame);
		if (game) {
			saveGameToSupabase(game).catch((_err) => {
				console.error('Error saving game after resetting scores');
			});
		}
	}

	function resetGameBoard(): void {
		games.update((allGames) =>
			allGames.map((game) => ({
				...game,
				categories: game.categories.map((cat) => ({
					...cat,
					questions: cat.questions.map((q) => ({ ...q, isAnswered: false }))
				})),
				teams: game.teams.map((team) => ({ ...team, score: 0 })),
				lastModified: new Date().toISOString()
			}))
		);

		// Update in Supabase asynchronously
		const game = get(getActiveGame);
		if (game) {
			saveGameToSupabase(game).catch((_err) => {
				console.error('Error saving game after resetting board');
			});
		}
	}

	// Import/Export operations
	function importGameData(gameId: string, jsonData: Record<string, unknown>): boolean {
		try {
			// Validate the required structure
			if (!jsonData || typeof jsonData !== 'object') {
				return false;
			}

			// Check for categories array
			if (!Array.isArray(jsonData.categories)) {
				return false;
			}

			const categories: Category[] = [];

			for (const catData of jsonData.categories) {
				if (!catData.name || !Array.isArray(catData.questions)) {
					continue;
				}

				const questions: Question[] = [];

				for (const qData of catData.questions) {
					if (!qData.text || !qData.answer || typeof qData.pointValue !== 'number') {
						continue;
					}

					questions.push({
						id: uuidv4(),
						text: qData.text,
						answer: qData.answer,
						pointValue: qData.pointValue,
						isDoubleJeopardy: Boolean(qData.isDoubleJeopardy),
						isAnswered: false,
						timeLimit: typeof qData.timeLimit === 'number' ? qData.timeLimit : undefined
					});
				}

				categories.push({
					id: uuidv4(),
					name: catData.name,
					questions
				});
			}

			// Update the game with imported data
			games.update((allGames) =>
				allGames.map((game) =>
					game.id === gameId
						? { ...game, categories, lastModified: new Date().toISOString() }
						: game
				)
			);

			// Save to Supabase asynchronously
			const game = get(games).find((g) => g.id === gameId);
			if (game) {
				saveGameToSupabase(game).catch((_err) => {
					console.error('Error saving game after import');
				});
			}

			return true;
		} catch (_error) {
			return false;
		}
	}

	function exportGameData(gameId: string): string {
		const game = get(games).find((g) => g.id === gameId);
		if (!game) return '';

		const exportData = {
			name: game.name,
			categories: game.categories.map((cat) => ({
				name: cat.name,
				questions: cat.questions.map((q) => ({
					text: q.text,
					answer: q.answer,
					pointValue: q.pointValue,
					isDoubleJeopardy: q.isDoubleJeopardy,
					timeLimit: q.timeLimit
				}))
			}))
		};

		return JSON.stringify(exportData, null, 2);
	}

	// Game Templates
	function getGameTemplates(): GameTemplate[] {
		return [
			{
				id: 'science',
				name: 'Science Trivia',
				description: 'A collection of science questions across various topics',
				categories: [
					{
						name: 'Biology',
						questions: [
							{
								text: 'What is the largest organ in the human body?',
								answer: 'Skin',
								pointValue: 100
							},
							{
								text: 'How many chambers does a human heart have?',
								answer: 'Four',
								pointValue: 200
							},
							{
								text: 'What is the process by which plants make their own food?',
								answer: 'Photosynthesis',
								pointValue: 300
							},
							{
								text: 'What is the powerhouse of the cell?',
								answer: 'Mitochondria',
								pointValue: 400
							},
							{
								text: 'What type of blood cells carry oxygen?',
								answer: 'Red blood cells',
								pointValue: 500
							}
						]
					},
					{
						name: 'Chemistry',
						questions: [
							{ text: 'What is the chemical symbol for gold?', answer: 'Au', pointValue: 100 },
							{
								text: 'What is the most abundant element in the universe?',
								answer: 'Hydrogen',
								pointValue: 200
							},
							{ text: 'What is the pH of pure water?', answer: '7', pointValue: 300 },
							{
								text: 'What are the three states of matter?',
								answer: 'Solid, liquid, gas',
								pointValue: 400
							},
							{ text: 'What is the chemical formula for water?', answer: 'H2O', pointValue: 500 }
						]
					}
				]
			},
			{
				id: 'history',
				name: 'World History',
				description: 'Historical events and figures from around the world',
				categories: [
					{
						name: 'Ancient History',
						questions: [
							{
								text: 'Which ancient wonder of the world still stands today?',
								answer: 'Great Pyramid of Giza',
								pointValue: 100
							},
							{ text: 'Who was the first emperor of Rome?', answer: 'Augustus', pointValue: 200 },
							{ text: 'What year did the Roman Empire fall?', answer: '476 AD', pointValue: 300 },
							{ text: 'Which civilization built Machu Picchu?', answer: 'Inca', pointValue: 400 },
							{ text: 'Who wrote "The Art of War"?', answer: 'Sun Tzu', pointValue: 500 }
						]
					}
				]
			}
		];
	}

	function applyGameTemplate(gameId: string, templateId: string): void {
		const template = getGameTemplates().find((t) => t.id === templateId);
		if (!template) return;

		const categories: Category[] = template.categories.map((cat) => ({
			id: uuidv4(),
			name: cat.name,
			questions: cat.questions.map((q) => ({
				id: uuidv4(),
				...q,
				isDoubleJeopardy: false,
				isAnswered: false
			}))
		}));

		games.update((allGames) =>
			allGames.map((game) =>
				game.id === gameId ? { ...game, categories, lastModified: new Date().toISOString() } : game
			)
		);

		// Save to Supabase asynchronously
		const game = get(games).find((g) => g.id === gameId);
		if (game) {
			saveGameToSupabase(game).catch((_err) => {
				console.error('Error saving game after applying template');
			});
		}
	}

	// Return public API
	return {
		// Stores
		subscribe: games.subscribe,
		getGames,
		getActiveGame,
		getActiveQuestion,
		getLeadingTeam,
		wagerAmount,
		loading: { subscribe: loading.subscribe },
		error: { subscribe: error.subscribe },

		// Data loading
		ensureDataLoaded,
		loadAllGames,

		// Game CRUD
		createGame,
		deleteGame,

		// Category operations
		addCategory,
		deleteCategory,

		// Question operations
		addQuestion,
		updateQuestion,
		deleteQuestion,

		// Team operations
		addTeam,
		deleteTeam,
		updateTeamScore,

		// Settings
		updateGameSettings,

		// Game state
		setActiveGame,
		setActiveQuestion,
		markQuestionAnswered,
		setWagerAmount,

		// Reset operations
		resetAllScores,
		resetGameBoard,

		// Import/Export
		importGameData,
		exportGameData,

		// Templates
		getGameTemplates,
		applyGameTemplate
	};
}

export const jeopardyStore = createJeopardyStore();
