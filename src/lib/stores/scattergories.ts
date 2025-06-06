import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export type GameState = 'ready' | 'playing' | 'paused' | 'game-over';

export interface Category {
	id: string;
	category: string;
	isCustom?: boolean;
}

interface ScattergoriesState {
	gameState: GameState;
	currentLetter: string;
	timeLimit: number;
	timeRemaining: number;
	numberOfWords: number;
	categories: Category[];
	currentCategories: Category[];
	customCategories: Category[];
	isKidFriendly: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
	{ id: '1', category: 'Things in a kitchen' },
	{ id: '2', category: 'Animals' },
	{ id: '3', category: 'Things that are round' },
	{ id: '4', category: 'Things you find in a school' },
	{ id: '5', category: 'Foods' },
	{ id: '6', category: 'Things that fly' },
	{ id: '7', category: 'Things that are hot' },
	{ id: '8', category: 'Sports' },
	{ id: '9', category: 'Things you wear' },
	{ id: '10', category: 'Movies' },
	{ id: '11', category: 'Board games' },
	{ id: '12', category: 'Things in the bathroom' },
	{ id: '13', category: 'School subjects' },
	{ id: '14', category: 'Song titles' },
	{ id: '15', category: 'Parts of the body' },
	{ id: '16', category: 'Things you shout' },
	{ id: '17', category: 'Things in a park' },
	{ id: '18', category: 'Foreign countries' },
	{ id: '19', category: 'Things you plug in' },
	{ id: '20', category: 'Ice cream flavors' },
	{ id: '21', category: 'Things made of metal' },
	{ id: '22', category: 'Occupations' },
	{ id: '23', category: 'Cartoon characters' },
	{ id: '24', category: 'Types of drinks' },
	{ id: '25', category: 'Musical instruments' },
	{ id: '26', category: 'Things you find at the beach' },
	{ id: '27', category: 'Items in a refrigerator' },
	{ id: '28', category: 'Things with wheels' },
	{ id: '29', category: 'Things that are sticky' },
	{ id: '30', category: 'Board games' },
];

const KID_FRIENDLY_CATEGORIES: Category[] = [
	{ id: 'k1', category: 'Animals' },
	{ id: 'k2', category: 'Foods' },
	{ id: 'k3', category: 'Colors' },
	{ id: 'k4', category: 'Toys' },
	{ id: 'k5', category: 'Things in a classroom' },
	{ id: 'k6', category: 'Cartoon characters' },
	{ id: 'k7', category: 'Things that are soft' },
	{ id: 'k8', category: 'Things you can eat' },
	{ id: 'k9', category: 'Things you wear' },
	{ id: 'k10', category: 'Things that fly' },
	{ id: 'k11', category: 'Things that are round' },
	{ id: 'k12', category: 'Things at a playground' },
	{ id: 'k13', category: 'Things in your bedroom' },
	{ id: 'k14', category: 'Things that make noise' },
	{ id: 'k15', category: 'Things in the sky' },
];

const initialState: ScattergoriesState = {
	gameState: 'ready',
	currentLetter: '',
	timeLimit: 180, // 3 minutes in seconds
	timeRemaining: 180,
	numberOfWords: 12,
	categories: DEFAULT_CATEGORIES,
	currentCategories: [],
	customCategories: [],
	isKidFriendly: false,
};

function createScattergoriesStore() {
	const { subscribe, update } = writable<ScattergoriesState>(initialState);

	let timer: ReturnType<typeof setInterval> | null = null;

	const generateLetter = (): string => {
		// Exclude Q, U, X, Z for better gameplay
		const filteredLetters = 'ABCDEFGHIJKLMNOPRSTUVWY';
		return filteredLetters[Math.floor(Math.random() * filteredLetters.length)];
	};

	const selectRandomCategories = (categories: Category[], count: number): Category[] => {
		const shuffled = [...categories].sort(() => 0.5 - Math.random());
		return shuffled.slice(0, count);
	};

	return {
		subscribe,

		// Game controls
		startGame: () => update(state => {
			if (state.gameState === 'ready') {
				state.currentLetter = generateLetter();
				state.currentCategories = selectRandomCategories(state.categories, state.numberOfWords);
			}
			state.gameState = 'playing';
			state.timeRemaining = state.timeLimit;

			// Start timer (only in browser)
			if (browser) {
				if (timer) clearInterval(timer);
				timer = setInterval(() => {
					update(s => {
						s.timeRemaining--;
						if (s.timeRemaining <= 0) {
							s.gameState = 'game-over';
							if (timer) clearInterval(timer);
						}
						return s;
					});
				}, 1000);
			}

			return state;
		}),

		pauseGame: () => update(state => {
			state.gameState = 'paused';
			if (browser && timer) {
				clearInterval(timer);
				timer = null;
			}
			return state;
		}),

		resetGame: () => update(state => {
			if (browser && timer) {
				clearInterval(timer);
				timer = null;
			}
			return {
				...state,
				gameState: 'ready',
				currentLetter: '',
				timeRemaining: state.timeLimit,
				currentCategories: [],
			};
		}),

		// Letter management
		generateNewLetter: () => update(state => {
			state.currentLetter = generateLetter();
			return state;
		}),

		// Time management
		setTimeLimit: (minutes: number) => update(state => {
			const seconds = minutes * 60;
			state.timeLimit = seconds;
			if (state.gameState === 'ready') {
				state.timeRemaining = seconds;
			}
			return state;
		}),

		// Category management
		setNumberOfWords: (count: number) => update(state => {
			state.numberOfWords = Math.max(1, Math.min(30, count));
			return state;
		}),

		addCustomCategory: (categoryText: string) => {
			if (!categoryText.trim()) return;

			update(state => {
				const newCategory: Category = {
					id: `custom-${Date.now()}`,
					category: categoryText.trim(),
					isCustom: true,
				};
				state.customCategories.push(newCategory);
				state.categories.push(newCategory);
				return state;
			});
		},

		removeCategory: (categoryId: string) => update(state => {
			state.categories = state.categories.filter(c => c.id !== categoryId);
			state.customCategories = state.customCategories.filter(c => c.id !== categoryId);
			return state;
		}),

		toggleKidFriendly: () => update(state => {
			state.isKidFriendly = !state.isKidFriendly;
			if (state.isKidFriendly) {
				state.categories = [...KID_FRIENDLY_CATEGORIES, ...state.customCategories];
			} else {
				state.categories = [...DEFAULT_CATEGORIES, ...state.customCategories];
			}
			return state;
		}),

		removeAllCategories: () => update(state => {
			state.categories = [...state.customCategories];
			return state;
		}),

		resetToDefaults: () => update(state => {
			state.categories = state.isKidFriendly 
				? [...KID_FRIENDLY_CATEGORIES, ...state.customCategories]
				: [...DEFAULT_CATEGORIES, ...state.customCategories];
			return state;
		}),
	};
}

export const scattergories = createScattergoriesStore();

// Derived stores for computed values
export const timeFormatted = derived(scattergories, ($scattergories) => {
	const minutes = Math.floor($scattergories.timeRemaining / 60);
	const seconds = $scattergories.timeRemaining % 60;
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

export const isPlaying = derived(scattergories, ($scattergories) => 
	$scattergories.gameState === 'playing'
);

export const canStart = derived(scattergories, ($scattergories) => 
	$scattergories.categories.length > 0 && $scattergories.gameState !== 'playing'
);
