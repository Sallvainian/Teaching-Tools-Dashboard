import { describe, test, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { jeopardyStore } from './jeopardy';

// Mock the supabaseService
vi.mock('$lib/services/supabaseService', () => ({
  supabaseService: {
    getItems: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn()
  }
}));

// Mock model converters
vi.mock('$lib/utils/modelConverters', () => ({
  dbGameToAppGame: vi.fn((game, categories, questions) => ({
    id: game.id,
    name: game.name,
    description: game.description,
    isPublic: game.is_public,
    createdBy: game.created_by,
    categories: categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      orderIndex: cat.order_index,
      questions: questions
        .filter(q => q.category_id === cat.id)
        .map(q => ({
          id: q.id,
          categoryId: q.category_id,
          question: q.question,
          answer: q.answer,
          pointValue: q.point_value,
          isDoubleJeopardy: q.is_double_jeopardy
        }))
    }))
  })),
  appGameToDbGame: vi.fn((game) => ({
    game: {
      id: game.id,
      name: game.name,
      description: game.description,
      is_public: game.isPublic,
      created_by: game.createdBy
    },
    categories: game.categories.map(cat => ({
      id: cat.id,
      game_id: game.id,
      name: cat.name,
      order_index: cat.orderIndex
    })),
    questions: game.categories.flatMap(cat => 
      cat.questions.map(q => ({
        id: q.id,
        category_id: cat.id,
        question: q.question,
        answer: q.answer,
        point_value: q.pointValue,
        is_double_jeopardy: q.isDoubleJeopardy
      }))
    )
  }))
}));

import { supabaseService } from '$lib/services/supabaseService';

describe('jeopardyStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    jeopardyStore.resetStore();
  });

  test('should have initial state', () => {
    const state = get(jeopardyStore);
    expect(state.games).toEqual([]);
    expect(state.currentGame).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.currentTeam).toBeNull();
    expect(state.gameState).toBe('setup');
  });

  test('loadGames should fetch and set games', async () => {
    const mockGames = [
      { id: 'game1', name: 'Test Game 1', description: 'Description 1', is_public: true, created_by: 'user1' }
    ];
    const mockCategories = [
      { id: 'cat1', game_id: 'game1', name: 'Category 1', order_index: 0 }
    ];
    const mockQuestions = [
      { 
        id: 'q1', 
        category_id: 'cat1', 
        question: 'Test Question', 
        answer: 'Test Answer', 
        point_value: 100, 
        is_double_jeopardy: false 
      }
    ];

    vi.mocked(supabaseService.getItems)
      .mockResolvedValueOnce(mockGames)
      .mockResolvedValueOnce(mockCategories)
      .mockResolvedValueOnce(mockQuestions);

    await jeopardyStore.loadGames();

    const state = get(jeopardyStore);
    expect(state.games).toHaveLength(1);
    expect(state.games[0].name).toBe('Test Game 1');
    expect(state.games[0].categories).toHaveLength(1);
    expect(state.games[0].categories[0].questions).toHaveLength(1);
    expect(state.loading).toBe(false);
  });

  test('createGame should create a new game', async () => {
    const newGame = {
      name: 'New Game',
      description: 'New game description',
      isPublic: true,
      createdBy: 'user123',
      categories: []
    };

    const mockCreatedGame = {
      id: 'game2',
      name: 'New Game',
      description: 'New game description',
      is_public: true,
      created_by: 'user123'
    };

    vi.mocked(supabaseService.createItem).mockResolvedValue(mockCreatedGame);

    const createdGame = await jeopardyStore.createGame(newGame);

    expect(supabaseService.createItem).toHaveBeenCalledWith('games', {
      name: 'New Game',
      description: 'New game description',
      is_public: true,
      created_by: 'user123'
    });
    expect(createdGame.id).toBe('game2');
  });

  test('updateGame should update existing game', async () => {
    // Setup initial game
    const initialGame = {
      id: 'game1',
      name: 'Original Name',
      description: 'Original description',
      isPublic: true,
      createdBy: 'user123',
      categories: []
    };

    // Add game to store
    const state = get(jeopardyStore);
    state.games.push(initialGame);

    // Update game
    const updates = { name: 'Updated Name' };
    const mockUpdatedGame = {
      id: 'game1',
      name: 'Updated Name',
      description: 'Original description',
      is_public: true,
      created_by: 'user123'
    };

    vi.mocked(supabaseService.updateItem).mockResolvedValue(mockUpdatedGame);

    await jeopardyStore.updateGame('game1', updates);

    expect(supabaseService.updateItem).toHaveBeenCalledWith('games', 'game1', updates);
    const updatedState = get(jeopardyStore);
    expect(updatedState.games[0].name).toBe('Updated Name');
  });

  test('deleteGame should remove game and associated data', async () => {
    // Setup game with categories and questions
    const game = {
      id: 'game1',
      name: 'Game to Delete',
      description: 'Will be deleted',
      isPublic: false,
      createdBy: 'user123',
      categories: [
        {
          id: 'cat1',
          name: 'Category 1',
          orderIndex: 0,
          questions: [
            {
              id: 'q1',
              categoryId: 'cat1',
              question: 'Question 1',
              answer: 'Answer 1',
              pointValue: 100,
              isDoubleJeopardy: false
            }
          ]
        }
      ]
    };

    const state = get(jeopardyStore);
    state.games.push(game);

    vi.mocked(supabaseService.deleteItem).mockResolvedValue(undefined);

    await jeopardyStore.deleteGame('game1');

    // Verify deletions were called
    expect(supabaseService.deleteItem).toHaveBeenCalledWith('questions', 'q1');
    expect(supabaseService.deleteItem).toHaveBeenCalledWith('game_categories', 'cat1');
    expect(supabaseService.deleteItem).toHaveBeenCalledWith('games', 'game1');

    // Verify game was removed from store
    const updatedState = get(jeopardyStore);
    expect(updatedState.games).toHaveLength(0);
  });

  test('addCategory should add category to game', async () => {
    const game = {
      id: 'game1',
      name: 'Test Game',
      description: 'Test',
      isPublic: true,
      createdBy: 'user123',
      categories: []
    };

    const state = get(jeopardyStore);
    state.games.push(game);

    const newCategory = { name: 'New Category' };
    const mockCreatedCategory = {
      id: 'cat2',
      game_id: 'game1',
      name: 'New Category',
      order_index: 0
    };

    vi.mocked(supabaseService.createItem).mockResolvedValue(mockCreatedCategory);

    await jeopardyStore.addCategory('game1', newCategory);

    expect(supabaseService.createItem).toHaveBeenCalledWith('game_categories', {
      game_id: 'game1',
      name: 'New Category',
      order_index: 0
    });

    const updatedState = get(jeopardyStore);
    expect(updatedState.games[0].categories).toHaveLength(1);
    expect(updatedState.games[0].categories[0].name).toBe('New Category');
  });

  test('addQuestion should add question to category', async () => {
    const game = {
      id: 'game1',
      name: 'Test Game',
      description: 'Test',
      isPublic: true,
      createdBy: 'user123',
      categories: [
        {
          id: 'cat1',
          name: 'Category 1',
          orderIndex: 0,
          questions: []
        }
      ]
    };

    const state = get(jeopardyStore);
    state.games.push(game);

    const newQuestion = {
      question: 'New Question',
      answer: 'New Answer',
      pointValue: 200,
      isDoubleJeopardy: false
    };

    const mockCreatedQuestion = {
      id: 'q2',
      category_id: 'cat1',
      question: 'New Question',
      answer: 'New Answer',
      point_value: 200,
      is_double_jeopardy: false
    };

    vi.mocked(supabaseService.createItem).mockResolvedValue(mockCreatedQuestion);

    await jeopardyStore.addQuestion('game1', 'cat1', newQuestion);

    expect(supabaseService.createItem).toHaveBeenCalledWith('questions', {
      category_id: 'cat1',
      question: 'New Question',
      answer: 'New Answer',
      point_value: 200,
      is_double_jeopardy: false
    });

    const updatedState = get(jeopardyStore);
    expect(updatedState.games[0].categories[0].questions).toHaveLength(1);
    expect(updatedState.games[0].categories[0].questions[0].question).toBe('New Question');
  });

  test('selectGame should set current game', () => {
    const game = {
      id: 'game1',
      name: 'Selected Game',
      description: 'Test',
      isPublic: true,
      createdBy: 'user123',
      categories: []
    };

    const state = get(jeopardyStore);
    state.games.push(game);

    jeopardyStore.selectGame('game1');

    const updatedState = get(jeopardyStore);
    expect(updatedState.currentGame).toEqual(game);
  });

  test('game state transitions should work correctly', () => {
    // Start game
    jeopardyStore.startGame();
    let state = get(jeopardyStore);
    expect(state.gameState).toBe('playing');

    // End game
    jeopardyStore.endGame();
    state = get(jeopardyStore);
    expect(state.gameState).toBe('ended');

    // Reset game
    jeopardyStore.resetGame();
    state = get(jeopardyStore);
    expect(state.gameState).toBe('setup');
  });

  test('setCurrentTeam should update current team', () => {
    const team = { id: 'team1', name: 'Team A', score: 0 };
    
    jeopardyStore.setCurrentTeam(team);
    
    const state = get(jeopardyStore);
    expect(state.currentTeam).toEqual(team);
  });

  test('error handling should update error state', async () => {
    const errorMessage = 'Failed to load games';
    vi.mocked(supabaseService.getItems).mockRejectedValue(new Error(errorMessage));

    await jeopardyStore.loadGames();

    const state = get(jeopardyStore);
    expect(state.error).toBe(errorMessage);
    expect(state.loading).toBe(false);
  });

  test('should handle localStorage fallback', async () => {
    // Mock localStorage data
    const localGames = [
      {
        id: 'local-game1',
        name: 'Local Game',
        description: 'From localStorage',
        isPublic: false,
        createdBy: 'user123',
        categories: []
      }
    ];

    global.localStorage.setItem('jeopardy_games', JSON.stringify(localGames));
    global.localStorage.setItem('jeopardy_game_categories', JSON.stringify([]));
    global.localStorage.setItem('jeopardy_questions', JSON.stringify([]));

    // Make supabase fail
    vi.mocked(supabaseService.getItems).mockRejectedValue(new Error('Network error'));

    await jeopardyStore.loadGames();

    const state = get(jeopardyStore);
    expect(state.games).toHaveLength(1);
    expect(state.games[0].name).toBe('Local Game');
  });

  test('updateQuestion should update specific question', async () => {
    const game = {
      id: 'game1',
      name: 'Test Game',
      description: 'Test',
      isPublic: true,
      createdBy: 'user123',
      categories: [
        {
          id: 'cat1',
          name: 'Category 1',
          orderIndex: 0,
          questions: [
            {
              id: 'q1',
              categoryId: 'cat1',
              question: 'Original Question',
              answer: 'Original Answer',
              pointValue: 100,
              isDoubleJeopardy: false
            }
          ]
        }
      ]
    };

    const state = get(jeopardyStore);
    state.games.push(game);

    const updates = { question: 'Updated Question' };
    const mockUpdatedQuestion = {
      id: 'q1',
      category_id: 'cat1',
      question: 'Updated Question',
      answer: 'Original Answer',
      point_value: 100,
      is_double_jeopardy: false
    };

    vi.mocked(supabaseService.updateItem).mockResolvedValue(mockUpdatedQuestion);

    await jeopardyStore.updateQuestion('game1', 'cat1', 'q1', updates);

    expect(supabaseService.updateItem).toHaveBeenCalledWith('questions', 'q1', updates);
    
    const updatedState = get(jeopardyStore);
    expect(updatedState.games[0].categories[0].questions[0].question).toBe('Updated Question');
  });
});