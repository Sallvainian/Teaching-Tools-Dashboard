// src/lib/stores/jeopardy.ts
import { writable, derived, get } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import type {
	JeopardyGame,
	Category,
	Question,
	Team,
	GameSettings,
	GameTemplate
} from '$lib/types/jeopardy';

// Function to load data from localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
	if (typeof window === 'undefined') return defaultValue;

	try {
		const stored = localStorage.getItem(`jeopardy_${key}`);
		return stored ? JSON.parse(stored) : defaultValue;
	} catch (e) {
		console.error(`Error loading ${key} from localStorage:`, e);
		return defaultValue;
	}
}

// Function to save data to localStorage
function saveToStorage<T>(key: string, value: T): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(`jeopardy_${key}`, JSON.stringify(value));
	} catch (e) {
		console.error(`Error saving ${key} to localStorage:`, e);
	}
}

function createJeopardyStore() {
	// Initialize stores with data from localStorage
	const games = writable<JeopardyGame[]>(loadFromStorage('games', []));
	const activeGameId = writable<string | null>(loadFromStorage('activeGameId', null));
	const activeQuestionId = writable<string | null>(null);
	const editMode = writable<boolean>(true);
	const timerActive = writable<boolean>(false);
	const timerSeconds = writable<number>(30);
	const wagerAmount = writable<number>(0);

	// Store for temporary holding of new game being created
	const draftGame = writable<JeopardyGame | null>(null);

	// Derived stores
	const getGames = derived(games, ($games) => $games);

	const getActiveGame = derived([games, activeGameId], ([$games, $activeId]) => {
		return $activeId ? $games.find((g) => g.id === $activeId) || null : null;
	});

	const getActiveQuestion = derived([getActiveGame, activeQuestionId], ([$game, $questionId]) => {
		if (!$game || !$questionId) return null;

		for (const category of $game.categories) {
			const question = category.questions.find((q) => q.id === $questionId);
			if (question) return { ...question, categoryId: category.id, categoryName: category.name };
		}

		return null;
	});

	const getLeadingTeam = derived(getActiveGame, ($game) => {
		if (!$game || $game.teams.length === 0) return null;

		return [...$game.teams].sort((a, b) => b.score - a.score)[0];
	});

	// Game management functions
	function createGame(name: string): string {
		const gameId = uuidv4();
		const newGame: JeopardyGame = {
			id: gameId,
			name,
			categories: [],
			teams: [],
			dateCreated: new Date().toISOString(),
			lastModified: new Date().toISOString(),
			settings: {
				defaultTimeLimit: 30,
				useTimer: true,
				readingTime: 5,
				autoShowAnswer: true,
				timerSize: 'large',
				allowWagers: true
			}
		};

		games.update((games) => [...games, newGame]);
		return gameId;
	}

	function updateGame(game: JeopardyGame): void {
		game.lastModified = new Date().toISOString();
		games.update((games) => games.map((g) => (g.id === game.id ? game : g)));
	}

	function updateGameSettings(gameId: string, settings: Partial<GameSettings>): void {
		games.update((games) => {
			return games.map((game) => {
				if (game.id === gameId) {
					return {
						...game,
						settings: {
							...game.settings,
							...settings
						},
						lastModified: new Date().toISOString()
					};
				}
				return game;
			});
		});
	}

	function deleteGame(gameId: string): void {
		games.update((games) => games.filter((g) => g.id !== gameId));

		// Reset active game if it was deleted
		activeGameId.update((id) => (id === gameId ? null : id));
	}

	function setActiveGame(gameId: string | null): void {
		activeGameId.set(gameId);
	}

	function setEditMode(isEditing: boolean): void {
		editMode.set(isEditing);
	}

	// Category functions
	function addCategory(gameId: string, name: string): string {
		const categoryId = uuidv4();
		const newCategory: Category = {
			id: categoryId,
			name,
			questions: []
		};

		games.update((games) => {
			return games.map((game) => {
				if (game.id === gameId) {
					return {
						...game,
						categories: [...game.categories, newCategory],
						lastModified: new Date().toISOString()
					};
				}
				return game;
			});
		});

		return categoryId;
	}

	function updateCategory(gameId: string, categoryId: string, name: string): void {
		games.update((games) => {
			return games.map((game) => {
				if (game.id === gameId) {
					return {
						...game,
						categories: game.categories.map((cat) => {
							if (cat.id === categoryId) {
								return { ...cat, name };
							}
							return cat;
						}),
						lastModified: new Date().toISOString()
					};
				}
				return game;
			});
		});
	}

	function deleteCategory(gameId: string, categoryId: string): void {
		games.update((games) => {
			return games.map((game) => {
				if (game.id === gameId) {
					return {
						...game,
						categories: game.categories.filter((cat) => cat.id !== categoryId),
						lastModified: new Date().toISOString()
					};
				}
				return game;
			});
		});
	}

	// Question functions
	function addQuestion(
		gameId: string,
		categoryId: string,
		questionText: string,
		answer: string,
		pointValue: number,
		isDoubleJeopardy: boolean = false,
		timeLimit?: number
	): string {
		const questionId = uuidv4();
		const newQuestion: Question = {
			id: questionId,
			text: questionText,
			answer,
			pointValue,
			isAnswered: false,
			isDoubleJeopardy,
			timeLimit
		};

		games.update((games) => {
			return games.map((game) => {
				if (game.id === gameId) {
					return {
						...game,
						categories: game.categories.map((cat) => {
							if (cat.id === categoryId) {
								return {
									...cat,
									questions: [...cat.questions, newQuestion]
								};
							}
							return cat;
						}),
						lastModified: new Date().toISOString()
					};
				}
				return game;
			});
		});

		return questionId;
	}

	function updateQuestion(
		gameId: string,
		categoryId: string,
		questionId: string,
		updates: Partial<Question>
	): void {
		games.update((games) => {
			return games.map((game) => {
				if (game.id === gameId) {
					return {
						...game,
						categories: game.categories.map((cat) => {
							if (cat.id === categoryId) {
								return {
									...cat,
									questions: cat.questions.map((q) => {
										if (q.id === questionId) {
											return { ...q, ...updates };
										}
										return q;
									})
								};
							}
							return cat;
						}),
						lastModified: new Date().toISOString()
					};
				}
				return game;
			});
		});
	}

	function deleteQuestion(gameId: string, categoryId: string, questionId: string): void {
		games.update((games) => {
			return games.map((game) => {
				if (game.id === gameId) {
					return {
						...game,
						categories: game.categories.map((cat) => {
							if (cat.id === categoryId) {
								return {
									...cat,
									questions: cat.questions.filter((q) => q.id !== questionId)
								};
							}
							return cat;
						}),
						lastModified: new Date().toISOString()
					};
				}
				return game;
			});
		});
	}

	function markQuestionAnswered(gameId: string, categoryId: string, questionId: string): void {
		updateQuestion(gameId, categoryId, questionId, { isAnswered: true });
	}

	function setActiveQuestion(questionId: string | null): void {
		activeQuestionId.set(questionId);
		// Reset timer and wager when changing questions
		if (questionId === null) {
			timerActive.set(false);
			wagerAmount.set(0);
		}
	}

	// Timer functions
	function startTimer(seconds: number): void {
		timerSeconds.set(seconds);
		timerActive.set(true);
	}

	function stopTimer(): void {
		timerActive.set(false);
	}

	function setWagerAmount(amount: number): void {
		wagerAmount.set(amount);
	}

	// Team functions
	function addTeam(gameId: string, name: string, color: string = '#3B82F6'): string {
		const teamId = uuidv4();
		const newTeam: Team = {
			id: teamId,
			name,
			score: 0,
			color
		};

		games.update((games) => {
			return games.map((game) => {
				if (game.id === gameId) {
					return {
						...game,
						teams: [...game.teams, newTeam],
						lastModified: new Date().toISOString()
					};
				}
				return game;
			});
		});

		return teamId;
	}

	function updateTeam(gameId: string, teamId: string, updates: Partial<Team>): void {
		games.update((games) => {
			return games.map((game) => {
				if (game.id === gameId) {
					return {
						...game,
						teams: game.teams.map((team) => {
							if (team.id === teamId) {
								return { ...team, ...updates };
							}
							return team;
						}),
						lastModified: new Date().toISOString()
					};
				}
				return game;
			});
		});
	}

	function deleteTeam(gameId: string, teamId: string): void {
		games.update((games) => {
			return games.map((game) => {
				if (game.id === gameId) {
					return {
						...game,
						teams: game.teams.filter((team) => team.id !== teamId),
						lastModified: new Date().toISOString()
					};
				}
				return game;
			});
		});
	}

	function updateTeamScore(gameId: string, teamId: string, points: number): void {
		const game = get(games).find((g) => g.id === gameId);
		if (!game) return;

		const team = game.teams.find((t) => t.id === teamId);
		if (!team) return;

		const newScore = team.score + points;

		updateTeam(gameId, teamId, { score: newScore });
	}

	function resetAllScores(gameId: string): void {
		games.update((games) => {
			return games.map((game) => {
				if (game.id === gameId) {
					return {
						...game,
						teams: game.teams.map((team) => ({
							...team,
							score: 0
						})),
						lastModified: new Date().toISOString()
					};
				}
				return game;
			});
		});
	}

	// Reset all questions to unanswered
	function resetGameBoard(gameId: string): void {
		games.update((games) => {
			return games.map((game) => {
				if (game.id === gameId) {
					return {
						...game,
						categories: game.categories.map((cat) => ({
							...cat,
							questions: cat.questions.map((q) => ({
								...q,
								isAnswered: false,
								wager: undefined
							}))
						})),
						lastModified: new Date().toISOString()
					};
				}
				return game;
			});
		});
	}

	// Clear all data
	function clearAllData(): void {
		games.set([]);
		activeGameId.set(null);
		activeQuestionId.set(null);

		// Clear localStorage
		if (typeof window !== 'undefined') {
			localStorage.removeItem('jeopardy_games');
			localStorage.removeItem('jeopardy_activeGameId');
		}
	}

	// Subscribe to store changes to save to localStorage
	games.subscribe(($games) => saveToStorage('games', $games));
	activeGameId.subscribe(($id) => saveToStorage('activeGameId', $id));

	// Import game data from JSON
	function getBooleanFromJson(value: unknown, defaultValue: boolean): boolean {
		if (typeof value === 'boolean') {
			return value;
		}
		return defaultValue;
	}

	function getOptionalNumberFromJson(value: unknown): number | undefined {
		if (typeof value === 'number') {
			return value;
		}
		return undefined;
	}

// Placeholder for the Svelte store 'games'
// const games = writable<JeopardyGame[]>([]);

	function importGameData(gameId: string, jsonData: Record<string, unknown>): boolean {
		try {
			// Validate the required structure
			if (!jsonData || typeof jsonData !== 'object') {
				console.error('Invalid JSON format: jsonData is not an object or is null/undefined.');
				return false;
			}

			// Check for categories array
			if (!Array.isArray(jsonData.categories)) {
				console.error('Invalid JSON format: "categories" property is missing or not an array.');
				return false;
			}

			// Process categories
			const categories: Category[] = (jsonData.categories as Array<Record<string, unknown>>).map((cat, catIndex) => {
				// Validate category structure
				if (!cat || typeof cat !== 'object') {
					console.error(`Invalid category format at index ${catIndex}: not an object.`);
					return null; // Will filter out invalid categories
				}
				if (!cat.name || typeof cat.name !== 'string') {
					console.error(`Invalid category at index ${catIndex}: "name" property is missing or not a string.`);
					return null; // Will filter out invalid categories
				}

				// Validate questions array
				if (!Array.isArray(cat.questions)) {
					console.error(`Invalid category "${cat.name}": "questions" property is missing or not an array.`);
					return null; // Will filter out invalid categories
				}

				const categoryId = uuidv4(); // Using UUID for ID generation

				// Process questions
				const questions: Question[] = (cat.questions as Array<Record<string, unknown>>).map((q, qIndex) => {
					if (!q || typeof q !== 'object') {
						console.error(`Invalid question format at index ${qIndex} in category "${cat.name}": not an object.`);
						return null; // Will filter out invalid questions
					}
					// Validate question structure
					if (!q.text || typeof q.text !== 'string') {
						console.error(`Invalid question at index ${qIndex} in category "${cat.name}": "text" property is missing or not a string.`);
						return null; // Will filter out invalid questions
					}

					if (!q.answer || typeof q.answer !== 'string') {
						console.error(`Invalid question "${q.text}": "answer" property is missing or not a string.`);
						return null; // Will filter out invalid questions
					}

					if (q.pointValue === undefined || typeof q.pointValue !== 'number' || isNaN(q.pointValue)) {
						console.error(`Invalid question "${q.text}": "pointValue" property is missing or not a valid number.`);
						return null; // Will filter out invalid questions
					}

					// **Corrected and robust handling for isDoubleJeopardy and timeLimit**
					const isDoubleJeopardy = getBooleanFromJson(q.isDoubleJeopardy, false);
					const timeLimit = getOptionalNumberFromJson(q.timeLimit);

					// Optional: Add warnings if you want to know if a default was applied due to wrong type
					if (q.isDoubleJeopardy !== undefined && typeof q.isDoubleJeopardy !== 'boolean') {
						console.warn(`Warning for question "${q.text}": isDoubleJeopardy was not a boolean (received ${typeof q.isDoubleJeopardy}), defaulting to ${isDoubleJeopardy}.`);
					}
					if (q.timeLimit !== undefined && typeof q.timeLimit !== 'number') {
						console.warn(`Warning for question "${q.text}": timeLimit was not a number (received ${typeof q.timeLimit}), defaulting to undefined.`);
					}

					return {
						id: uuidv4(), // Using UUID for ID generation
						text: q.text as string, // Safe due to prior validation
						answer: q.answer as string, // Safe due to prior validation
						pointValue: q.pointValue as number, // Safe due to prior validation
						isAnswered: false,
						isDoubleJeopardy: isDoubleJeopardy,
						timeLimit: timeLimit
					} as Question;
				}).filter((q): q is Question => q !== null); // Type predicate to ensure non-null values

				return {
					id: categoryId,
					name: cat.name as string, // Safe due to prior validation
					questions
				} as Category;
			}).filter((c): c is Category => c !== null); // Type predicate to ensure non-null values

			// Update the game with the imported data
			// 'games' here refers to your Svelte store
			games.update((currentGamesList) => { // Renamed parameter to avoid conflict with outer 'games' store
				return currentGamesList.map((game) => {
					if (game.id === gameId) {
						return {
							...game,
							categories: categories, // 'categories' is the fully processed, correctly typed array from above
							lastModified: new Date().toISOString()
						};
					}
					return game;
				});
			});

			console.log(`Game data successfully imported for game ID: ${gameId}`);
			return true;
		} catch (error) {
			// Log the error if it's an instance of Error, otherwise log a generic message
			if (error instanceof Error) {
				console.error('Error importing game data:', error.message, error.stack);
			} else {
				console.error('An unknown error occurred during game data import:', error);
			}
			return false;
		}
	}

	// Export game data to JSON
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

	// Game template functions
	const templates: GameTemplate[] = [
		{
			id: 'math',
			name: 'Math',
			description: 'Basic math questions for elementary students',
			categories: [
				{
					name: 'Addition',
					questions: [
						{
							text: 'What is 5 + 7?',
							answer: '12',
							pointValue: 100
						},
						{
							text: 'What is 14 + 19?',
							answer: '33',
							pointValue: 200
						},
						{
							text: 'What is 25 + 36?',
							answer: '61',
							pointValue: 300
						},
						{
							text: 'What is 123 + 456?',
							answer: '579',
							pointValue: 400,
							isDoubleJeopardy: true
						}
					]
				},
				{
					name: 'Subtraction',
					questions: [
						{
							text: 'What is 10 - 3?',
							answer: '7',
							pointValue: 100
						},
						{
							text: 'What is 25 - 13?',
							answer: '12',
							pointValue: 200
						},
						{
							text: 'What is 50 - 26?',
							answer: '24',
							pointValue: 300
						},
						{
							text: 'What is 100 - 64?',
							answer: '36',
							pointValue: 400
						}
					]
				},
				{
					name: 'Multiplication',
					questions: [
						{
							text: 'What is 3 × 4?',
							answer: '12',
							pointValue: 100
						},
						{
							text: 'What is 7 × 8?',
							answer: '56',
							pointValue: 200
						},
						{
							text: 'What is 12 × 5?',
							answer: '60',
							pointValue: 300
						},
						{
							text: 'What is 14 × 9?',
							answer: '126',
							pointValue: 400,
							isDoubleJeopardy: true
						}
					]
				}
			]
		},
		{
			id: 'science',
			name: 'Science',
			description: 'Basic science facts for elementary students',
			categories: [
				{
					name: 'Animals',
					questions: [
						{
							text: 'What animal is known as the king of the jungle?',
							answer: 'Lion',
							pointValue: 100
						},
						{
							text: 'What is the largest animal on Earth?',
							answer: 'Blue Whale',
							pointValue: 200
						},
						{
							text: 'What type of animal is a komodo dragon?',
							answer: 'Lizard/Reptile',
							pointValue: 300
						},
						{
							text: 'Which bird is known for its ability to mimic human speech?',
							answer: 'Parrot',
							pointValue: 400
						}
					]
				},
				{
					name: 'The Solar System',
					questions: [
						{
							text: 'What is the closest planet to the Sun?',
							answer: 'Mercury',
							pointValue: 100
						},
						{
							text: 'What planet is known for its rings?',
							answer: 'Saturn',
							pointValue: 200
						},
						{
							text: 'What is the largest planet in our solar system?',
							answer: 'Jupiter',
							pointValue: 300
						},
						{
							text: 'What is the name of the galaxy we live in?',
							answer: 'Milky Way',
							pointValue: 400,
							isDoubleJeopardy: true
						}
					]
				}
			]
		}
	];

	function getGameTemplates(): GameTemplate[] {
		return templates;
	}

	function applyGameTemplate(gameId: string, templateId: string): boolean {
		const template = templates.find((t) => t.id === templateId);
		if (!template) return false;

		const templateData = {
			categories: template.categories
		};

		return importGameData(gameId, templateData);
	}

	return {
		games,
		activeGameId,
		activeQuestionId,
		editMode,
		timerActive,
		timerSeconds,
		wagerAmount,
		draftGame,
		getGames,
		getActiveGame,
		getActiveQuestion,
		getLeadingTeam,
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
		clearAllData,
		importGameData,
		exportGameData,
		getGameTemplates,
		applyGameTemplate
	};
}

export const jeopardyStore = createJeopardyStore();