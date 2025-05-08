// src/lib/stores/jeopardy.ts
import { writable, derived, get } from 'svelte/store';
import { nanoid } from 'nanoid';
import type { JeopardyGame, Category, Question, Team } from '$lib/types/jeopardy';

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
  
  // Store for temporary holding of new game being created
  const draftGame = writable<JeopardyGame | null>(null);
  
  // Derived stores
  const getGames = derived(games, ($games) => $games);
  
  const getActiveGame = derived([games, activeGameId], ([$games, $activeId]) => {
    return $activeId ? $games.find(g => g.id === $activeId) || null : null;
  });
  
  const getActiveQuestion = derived([getActiveGame, activeQuestionId], ([$game, $questionId]) => {
    if (!$game || !$questionId) return null;
    
    for (const category of $game.categories) {
      const question = category.questions.find(q => q.id === $questionId);
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
    const gameId = nanoid();
    const newGame: JeopardyGame = {
      id: gameId,
      name,
      categories: [],
      teams: [],
      dateCreated: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    games.update(games => [...games, newGame]);
    return gameId;
  }
  
  function updateGame(game: JeopardyGame): void {
    game.lastModified = new Date().toISOString();
    games.update(games => 
      games.map(g => g.id === game.id ? game : g)
    );
  }
  
  function deleteGame(gameId: string): void {
    games.update(games => games.filter(g => g.id !== gameId));
    
    // Reset active game if it was deleted
    activeGameId.update(id => id === gameId ? null : id);
  }
  
  function setActiveGame(gameId: string | null): void {
    activeGameId.set(gameId);
  }
  
  function setEditMode(isEditing: boolean): void {
    editMode.set(isEditing);
  }
  
  // Category functions
  function addCategory(gameId: string, name: string): string {
    const categoryId = nanoid();
    const newCategory: Category = {
      id: categoryId,
      name,
      questions: []
    };
    
    games.update(games => {
      return games.map(game => {
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
    games.update(games => {
      return games.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            categories: game.categories.map(cat => {
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
    games.update(games => {
      return games.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            categories: game.categories.filter(cat => cat.id !== categoryId),
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
    question: string, 
    answer: string, 
    pointValue: number
  ): string {
    const questionId = nanoid();
    const newQuestion: Question = {
      id: questionId,
      text: question,
      answer,
      pointValue,
      isAnswered: false
    };
    
    games.update(games => {
      return games.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            categories: game.categories.map(cat => {
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
    games.update(games => {
      return games.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            categories: game.categories.map(cat => {
              if (cat.id === categoryId) {
                return {
                  ...cat,
                  questions: cat.questions.map(q => {
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
    games.update(games => {
      return games.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            categories: game.categories.map(cat => {
              if (cat.id === categoryId) {
                return {
                  ...cat,
                  questions: cat.questions.filter(q => q.id !== questionId)
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
  }
  
  // Team functions
  function addTeam(gameId: string, name: string, color: string = '#3B82F6'): string {
    const teamId = nanoid();
    const newTeam: Team = {
      id: teamId,
      name,
      score: 0,
      color
    };
    
    games.update(games => {
      return games.map(game => {
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
    games.update(games => {
      return games.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            teams: game.teams.map(team => {
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
    games.update(games => {
      return games.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            teams: game.teams.filter(team => team.id !== teamId),
            lastModified: new Date().toISOString()
          };
        }
        return game;
      });
    });
  }
  
  function updateTeamScore(gameId: string, teamId: string, points: number): void {
    const game = get(games).find(g => g.id === gameId);
    if (!game) return;
    
    const team = game.teams.find(t => t.id === teamId);
    if (!team) return;
    
    const newScore = team.score + points;
    
    updateTeam(gameId, teamId, { score: newScore });
  }
  
  function resetAllScores(gameId: string): void {
    games.update(games => {
      return games.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            teams: game.teams.map(team => ({
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
    games.update(games => {
      return games.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            categories: game.categories.map(cat => ({
              ...cat,
              questions: cat.questions.map(q => ({
                ...q,
                isAnswered: false
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
  function importGameData(gameId: string, jsonData: any): boolean {
    try {
      // Validate the required structure
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error('Invalid JSON format');
      }
      
      // Check for categories array
      if (!Array.isArray(jsonData.categories)) {
        throw new Error('JSON must contain a categories array');
      }
      
      const categories = jsonData.categories.map((cat: any) => {
        // Validate category structure
        if (!cat.name || typeof cat.name !== 'string') {
          throw new Error('Each category must have a name property');
        }
        
        // Validate questions array
        if (!Array.isArray(cat.questions)) {
          throw new Error('Each category must have a questions array');
        }
        
        const categoryId = nanoid();
        
        // Process questions
        const questions = cat.questions.map((q: any) => {
          // Validate question structure
          if (!q.text || typeof q.text !== 'string') {
            throw new Error('Each question must have a text property');
          }
          
          if (!q.answer || typeof q.answer !== 'string') {
            throw new Error('Each question must have an answer property');
          }
          
          if (!q.pointValue || typeof q.pointValue !== 'number') {
            throw new Error('Each question must have a pointValue property (number)');
          }
          
          return {
            id: nanoid(),
            text: q.text,
            answer: q.answer,
            pointValue: q.pointValue,
            isAnswered: false
          };
        });
        
        return {
          id: categoryId,
          name: cat.name,
          questions
        };
      });
      
      // Update the game with the imported data
      games.update(games => {
        return games.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              categories,
              lastModified: new Date().toISOString()
            };
          }
          return game;
        });
      });
      
      return true;
    } catch (error) {
      console.error('Error importing game data:', error);
      return false;
    }
  }

  return {
    games,
    activeGameId,
    activeQuestionId,
    editMode,
    draftGame,
    getGames,
    getActiveGame,
    getActiveQuestion,
    getLeadingTeam,
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
    clearAllData,
    importGameData
  };
}

export const jeopardyStore = createJeopardyStore();