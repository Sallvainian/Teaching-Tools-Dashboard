// src/lib/stores/jeopardy-supabase.ts
import { writable, derived, get } from 'svelte/store';
import type { JeopardyGame, Category, Question, Team, GameSettings, GameTemplate } from '$lib/types/jeopardy';
import * as db from '$lib/services/database';

function createJeopardyStore() {
  // Initialize stores
  const games = writable<JeopardyGame[]>([]);
  const activeGameId = writable<string | null>(null);
  const activeQuestionId = writable<string | null>(null);
  const editMode = writable<boolean>(true);
  const timerActive = writable<boolean>(false);
  const timerSeconds = writable<number>(30);
  const wagerAmount = writable<number>(0);
  const isLoading = writable<boolean>(true);
  const error = writable<string | null>(null);

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

  // Initialize by loading data from database
  async function initialize() {
    // Skip if we're on the server (no window object)
    if (typeof window === 'undefined') {
      return;
    }

    isLoading.set(true);
    error.set(null);

    try {
      // Load games from database
      const dbGames = await db.fetchJeopardyGames();

      if (Array.isArray(dbGames) && dbGames.length > 0) {
        // Transform to our internal format
        const transformedGames: JeopardyGame[] = await Promise.all(
          dbGames.map(async (game) => {
            try {
              // Get full game with nested data
              const fullGame = await db.getJeopardyGame(game.id);

              if (!fullGame) {
                return null;
              }

              return {
                id: fullGame.id,
                name: fullGame.name,
                categories: Array.isArray(fullGame.categories)
                  ? fullGame.categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    questions: Array.isArray(cat.questions)
                      ? cat.questions.map(q => ({
                        id: q.id,
                        text: q.text,
                        answer: q.answer,
                        pointValue: q.point_value,
                        isAnswered: q.is_answered,
                        isDoubleJeopardy: q.is_double_jeopardy,
                        timeLimit: q.time_limit
                      }))
                      : []
                  }))
                  : [],
                teams: Array.isArray(fullGame.teams)
                  ? fullGame.teams.map(team => ({
                    id: team.id,
                    name: team.name,
                    score: team.score,
                    color: team.color
                  }))
                  : [],
                dateCreated: fullGame.created_at,
                lastModified: fullGame.updated_at,
                settings: fullGame.settings
              };
            } catch (err) {
              console.error(`Error loading game ${game.id}:`, err);
              return null;
            }
          })
        );

        // Filter out null values (failed game loads)
        games.set(transformedGames.filter(Boolean) as JeopardyGame[]);
      }

      // Load active game ID from localStorage for UI state persistence
      try {
        const storedGameId = localStorage.getItem('jeopardy_activeGameId');
        if (storedGameId) {
          activeGameId.set(JSON.parse(storedGameId));
        }
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }

    } catch (err) {
      console.error("Error initializing jeopardy store:", err);
      error.set("Failed to load jeopardy games");
    } finally {
      isLoading.set(false);
    }
  }

  // Game management functions
  async function createGame(name: string): Promise<string> {
    try {
      const newGame = await db.createJeopardyGame(name);
      
      if (newGame) {
        games.update(games => [...games, {
          id: newGame.id,
          name: newGame.name,
          categories: [],
          teams: [],
          dateCreated: newGame.created_at,
          lastModified: newGame.updated_at,
          settings: newGame.settings
        }]);
        
        return newGame.id;
      }
      
      throw new Error("Failed to create game");
    } catch (err) {
      console.error("Error creating game:", err);
      error.set("Failed to create game");
      return "";
    }
  }

  async function updateGame(game: JeopardyGame): Promise<void> {
    try {
      const updatedGame = await db.updateJeopardyGame(game.id, {
        name: game.name,
        settings: game.settings
      });
      
      if (updatedGame) {
        games.update(games => games.map(g => g.id === game.id ? {
          ...g,
          name: updatedGame.name,
          settings: updatedGame.settings,
          lastModified: updatedGame.updated_at
        } : g));
      }
    } catch (err) {
      console.error("Error updating game:", err);
      error.set("Failed to update game");
    }
  }

  async function updateGameSettings(gameId: string, settings: Partial<GameSettings>): Promise<void> {
    try {
      const currentGame = get(games).find(g => g.id === gameId);
      if (!currentGame) throw new Error("Game not found");
      
      const updatedSettings = {
        ...currentGame.settings,
        ...settings
      };
      
      const updatedGame = await db.updateJeopardyGame(gameId, {
        settings: updatedSettings
      });
      
      if (updatedGame) {
        games.update(games => games.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              settings: updatedSettings,
              lastModified: updatedGame.updated_at
            };
          }
          return game;
        }));
      }
    } catch (err) {
      console.error("Error updating game settings:", err);
      error.set("Failed to update game settings");
    }
  }

  async function deleteGame(gameId: string): Promise<void> {
    try {
      const success = await db.deleteJeopardyGame(gameId);
      
      if (success) {
        games.update(games => games.filter(g => g.id !== gameId));
        
        // If this was the active game, reset the active game
        activeGameId.update(id => id === gameId ? null : id);
      }
    } catch (err) {
      console.error("Error deleting game:", err);
      error.set("Failed to delete game");
    }
  }

  function setActiveGame(gameId: string | null): void {
    activeGameId.set(gameId);
    
    // Save to localStorage for UI state persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('jeopardy_activeGameId', JSON.stringify(gameId));
    }
  }

  function setEditMode(isEditing: boolean): void {
    editMode.set(isEditing);
  }

  // Category functions
  async function addCategory(gameId: string, name: string): Promise<string> {
    try {
      const newCategory = await db.addJeopardyCategory(gameId, name);
      
      if (newCategory) {
        games.update(games => games.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              categories: [...game.categories, {
                id: newCategory.id,
                name: newCategory.name,
                questions: []
              }],
              lastModified: new Date().toISOString()
            };
          }
          return game;
        }));
        
        return newCategory.id;
      }
      
      throw new Error("Failed to add category");
    } catch (err) {
      console.error("Error adding category:", err);
      error.set("Failed to add category");
      return "";
    }
  }

  async function updateCategory(gameId: string, categoryId: string, name: string): Promise<void> {
    try {
      const updatedCategory = await db.updateJeopardyCategory(categoryId, name);
      
      if (updatedCategory) {
        games.update(games => games.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              categories: game.categories.map(cat => {
                if (cat.id === categoryId) {
                  return { ...cat, name: updatedCategory.name };
                }
                return cat;
              }),
              lastModified: new Date().toISOString()
            };
          }
          return game;
        }));
      }
    } catch (err) {
      console.error("Error updating category:", err);
      error.set("Failed to update category");
    }
  }

  async function deleteCategory(gameId: string, categoryId: string): Promise<void> {
    try {
      const success = await db.deleteJeopardyCategory(categoryId);
      
      if (success) {
        games.update(games => games.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              categories: game.categories.filter(cat => cat.id !== categoryId),
              lastModified: new Date().toISOString()
            };
          }
          return game;
        }));
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      error.set("Failed to delete category");
    }
  }

  // Question functions
  async function addQuestion(
    gameId: string,
    categoryId: string,
    text: string,
    answer: string,
    pointValue: number,
    isDoubleJeopardy: boolean = false,
    timeLimit?: number
  ): Promise<string> {
    try {
      const newQuestion = await db.addJeopardyQuestion(
        categoryId,
        text,
        answer,
        pointValue,
        isDoubleJeopardy,
        timeLimit
      );
      
      if (newQuestion) {
        games.update(games => games.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              categories: game.categories.map(cat => {
                if (cat.id === categoryId) {
                  return {
                    ...cat,
                    questions: [...cat.questions, {
                      id: newQuestion.id,
                      text: newQuestion.text,
                      answer: newQuestion.answer,
                      pointValue: newQuestion.point_value,
                      isAnswered: newQuestion.is_answered,
                      isDoubleJeopardy: newQuestion.is_double_jeopardy,
                      timeLimit: newQuestion.time_limit
                    }]
                  };
                }
                return cat;
              }),
              lastModified: new Date().toISOString()
            };
          }
          return game;
        }));
        
        return newQuestion.id;
      }
      
      throw new Error("Failed to add question");
    } catch (err) {
      console.error("Error adding question:", err);
      error.set("Failed to add question");
      return "";
    }
  }

  async function updateQuestion(
    gameId: string,
    categoryId: string,
    questionId: string,
    updates: Partial<Question>
  ): Promise<void> {
    try {
      const updatedQuestion = await db.updateJeopardyQuestion(questionId, updates);
      
      if (updatedQuestion) {
        games.update(games => games.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              categories: game.categories.map(cat => {
                if (cat.id === categoryId) {
                  return {
                    ...cat,
                    questions: cat.questions.map(q => {
                      if (q.id === questionId) {
                        return {
                          ...q,
                          text: updates.text !== undefined ? updates.text : q.text,
                          answer: updates.answer !== undefined ? updates.answer : q.answer,
                          pointValue: updates.pointValue !== undefined ? updates.pointValue : q.pointValue,
                          isAnswered: updates.isAnswered !== undefined ? updates.isAnswered : q.isAnswered,
                          isDoubleJeopardy: updates.isDoubleJeopardy !== undefined ? updates.isDoubleJeopardy : q.isDoubleJeopardy,
                          timeLimit: updates.timeLimit !== undefined ? updates.timeLimit : q.timeLimit
                        };
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
        }));
      }
    } catch (err) {
      console.error("Error updating question:", err);
      error.set("Failed to update question");
    }
  }

  async function deleteQuestion(gameId: string, categoryId: string, questionId: string): Promise<void> {
    try {
      const success = await db.deleteJeopardyQuestion(questionId);
      
      if (success) {
        games.update(games => games.map(game => {
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
        }));
      }
    } catch (err) {
      console.error("Error deleting question:", err);
      error.set("Failed to delete question");
    }
  }

  async function markQuestionAnswered(gameId: string, categoryId: string, questionId: string): Promise<void> {
    try {
      const updatedQuestion = await db.updateJeopardyQuestion(questionId, { isAnswered: true });
      
      if (updatedQuestion) {
        games.update(games => games.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              categories: game.categories.map(cat => {
                if (cat.id === categoryId) {
                  return {
                    ...cat,
                    questions: cat.questions.map(q => {
                      if (q.id === questionId) {
                        return { ...q, isAnswered: true };
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
        }));
      }
    } catch (err) {
      console.error("Error marking question answered:", err);
      error.set("Failed to mark question answered");
    }
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
  async function addTeam(gameId: string, name: string, color: string = '#3B82F6'): Promise<string> {
    try {
      const newTeam = await db.addJeopardyTeam(gameId, name, color);
      
      if (newTeam) {
        games.update(games => games.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              teams: [...game.teams, {
                id: newTeam.id,
                name: newTeam.name,
                score: newTeam.score,
                color: newTeam.color
              }],
              lastModified: new Date().toISOString()
            };
          }
          return game;
        }));
        
        return newTeam.id;
      }
      
      throw new Error("Failed to add team");
    } catch (err) {
      console.error("Error adding team:", err);
      error.set("Failed to add team");
      return "";
    }
  }

  async function updateTeam(gameId: string, teamId: string, updates: Partial<Team>): Promise<void> {
    try {
      const updatedTeam = await db.updateJeopardyTeam(teamId, updates);
      
      if (updatedTeam) {
        games.update(games => games.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              teams: game.teams.map(team => {
                if (team.id === teamId) {
                  return {
                    ...team,
                    name: updates.name !== undefined ? updates.name : team.name,
                    score: updates.score !== undefined ? updates.score : team.score,
                    color: updates.color !== undefined ? updates.color : team.color
                  };
                }
                return team;
              }),
              lastModified: new Date().toISOString()
            };
          }
          return game;
        }));
      }
    } catch (err) {
      console.error("Error updating team:", err);
      error.set("Failed to update team");
    }
  }

  async function deleteTeam(gameId: string, teamId: string): Promise<void> {
    try {
      const success = await db.deleteJeopardyTeam(teamId);
      
      if (success) {
        games.update(games => games.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              teams: game.teams.filter(team => team.id !== teamId),
              lastModified: new Date().toISOString()
            };
          }
          return game;
        }));
      }
    } catch (err) {
      console.error("Error deleting team:", err);
      error.set("Failed to delete team");
    }
  }

  async function updateTeamScore(gameId: string, teamId: string, points: number): Promise<void> {
    try {
      const game = get(games).find(g => g.id === gameId);
      if (!game) throw new Error("Game not found");
      
      const team = game.teams.find(t => t.id === teamId);
      if (!team) throw new Error("Team not found");
      
      const newScore = team.score + points;
      
      const updatedTeam = await db.updateJeopardyTeam(teamId, { score: newScore });
      
      if (updatedTeam) {
        games.update(games => games.map(game => {
          if (game.id === gameId) {
            return {
              ...game,
              teams: game.teams.map(team => {
                if (team.id === teamId) {
                  return { ...team, score: newScore };
                }
                return team;
              }),
              lastModified: new Date().toISOString()
            };
          }
          return game;
        }));
      }
    } catch (err) {
      console.error("Error updating team score:", err);
      error.set("Failed to update team score");
    }
  }

  async function resetAllScores(gameId: string): Promise<void> {
    try {
      const game = get(games).find(g => g.id === gameId);
      if (!game) throw new Error("Game not found");
      
      // Update all teams in parallel
      await Promise.all(
        game.teams.map(team => db.updateJeopardyTeam(team.id, { score: 0 }))
      );
      
      // Update local store
      games.update(games => games.map(game => {
        if (game.id === gameId) {
          return {
            ...game,
            teams: game.teams.map(team => ({ ...team, score: 0 })),
            lastModified: new Date().toISOString()
          };
        }
        return game;
      }));
    } catch (err) {
      console.error("Error resetting scores:", err);
      error.set("Failed to reset scores");
    }
  }

  async function resetGameBoard(gameId: string): Promise<void> {
    try {
      const success = await db.resetJeopardyGame(gameId);
      
      if (success) {
        // Reload the game since we can't easily update all questions
        initialize();
      }
    } catch (err) {
      console.error("Error resetting game board:", err);
      error.set("Failed to reset game board");
    }
  }

  // Import/Export
  async function importGameData(gameId: string, jsonData: any): Promise<boolean> {
    try {
      const success = await db.importJeopardyData(gameId, jsonData);
      
      if (success) {
        // Reload games since the structure might have changed significantly
        initialize();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Error importing game data:", err);
      error.set("Failed to import game data");
      return false;
    }
  }

  async function exportGameData(gameId: string): string | null {
    try {
      const exportData = await db.exportJeopardyData(gameId);
      return JSON.stringify(exportData, null, 2);
    } catch (err) {
      console.error("Error exporting game data:", err);
      error.set("Failed to export game data");
      return null;
    }
  }

  // Game templates
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

  async function applyGameTemplate(gameId: string, templateId: string): Promise<boolean> {
    const template = templates.find(t => t.id === templateId);
    if (!template) return false;

    const templateData = {
      categories: template.categories
    };

    return importGameData(gameId, templateData);
  }

  // Call initialize when the store is created
  initialize();

  return {
    games,
    activeGameId,
    activeQuestionId,
    editMode,
    timerActive,
    timerSeconds,
    wagerAmount,
    isLoading,
    error,
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
    importGameData,
    exportGameData,
    getGameTemplates,
    applyGameTemplate
  };
}

export const jeopardyStore = createJeopardyStore();