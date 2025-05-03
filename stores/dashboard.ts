import { defineStore } from 'pinia';

// TypeScript interfaces for strong typing
export interface Card {
  id: string;
  title: string;
  icon: string;
  route: string;
  description?: string;
}

export type ThemeMode = 'light' | 'dark';

export interface DashboardState {
  cards: Card[];
  lastUsedTool: string | null;
  theme: ThemeMode;
}

export const useDashboardStore = defineStore('dashboard', {
  // State
  state: (): DashboardState => ({
    cards: [
      {
        id: 'lesson-planner',
        title: 'Lesson Planner',
        icon: 'i-heroicons-clipboard-document-list',
        route: '/lesson-planner',
        description: 'Plan and organize your lessons',
      },
      {
        id: 'gradebook',
        title: 'Gradebook',
        icon: 'i-heroicons-academic-cap',
        route: '/gradebook',
        description: 'Track student progress and grades',
      },
      {
        id: 'class-dojo-remake',
        title: 'ClassDojo Remake',
        icon: 'i-heroicons-trophy',
        route: '/class-dojo-remake',
        description: 'Manage student behavior and rewards',
      },
      // Add the Jeopardy card back if it was intended to be here
      // {
      //   id: 'jeopardy',
      //   title: 'Jeopardy Game',
      //   icon: 'i-heroicons-puzzle-piece', // Or appropriate icon
      //   route: '/jeopardy',
      //   description: 'Create and play Jeopardy-style review games'
      // }
    ],
    lastUsedTool: null,
    theme: 'light', // Default theme
  }),

  // Getters
  getters: {
    getCardById: (state) => (id: string): Card | undefined => {
      return state.cards.find(card => card.id === id);
    },
    getAllCards: (state): Card[] => state.cards,
    getCurrentTheme: (state): ThemeMode => state.theme,
    getLastUsedTool: (state): string | null => state.lastUsedTool,
  },

  // Actions
  actions: {
    setLastUsedTool(toolId: string): void {
      this.lastUsedTool = toolId;
    },
    toggleTheme(): void {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      // Optional: Apply theme change to the document root if using Tailwind dark mode class strategy
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', this.theme === 'dark');
      }
    },
    setTheme(theme: ThemeMode): void {
      this.theme = theme;
       // Optional: Apply theme change to the document root
       if (typeof document !== 'undefined') {
         document.documentElement.classList.toggle('dark', this.theme === 'dark');
       }
    },
    addCard(card: Card): void {
      const existingCardIndex = this.cards.findIndex(c => c.id === card.id);
      if (existingCardIndex >= 0) {
        // Update existing card if needed
        this.cards[existingCardIndex] = { ...this.cards[existingCardIndex], ...card };
      } else {
        this.cards.push(card);
      }
    },
    removeCard(cardId: string): void {
      this.cards = this.cards.filter(card => card.id !== cardId);
    },
    // Action to initialize theme based on persisted state or system preference
    initializeTheme(): void {
      // Theme is already loaded from persisted state by the plugin if available.
      // Apply the initial theme class to the document root.
      if (typeof document !== 'undefined') {
         document.documentElement.classList.toggle('dark', this.theme === 'dark');
      }
      // Optional: Add logic here to check system preference if no theme is persisted yet
    }
  },

  // Persistence Configuration
  persist: {
    // Only persist these specific paths
    paths: ['lastUsedTool', 'theme'],
  },
});
