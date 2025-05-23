import { describe, test, expect } from 'vitest';
import {
  dbStudentToAppStudent,
  appStudentToDbStudent,
  dbCategoryToAppCategory,
  appCategoryToDbCategory,
  dbAssignmentToAppAssignment,
  appAssignmentToDbAssignment,
  dbGradeToAppGrade,
  appGradeToDbGrade,
  dbObservationLogToAppLogEntry,
  appLogEntryToDbObservationLog,
  dbGameToAppGame,
  appGameToDbGame,
  dbQuestionToAppQuestion,
  appQuestionToDbQuestion
} from './modelConverters';

describe('modelConverters', () => {
  describe('Student converters', () => {
    test('dbStudentToAppStudent should convert correctly', () => {
      const dbStudent = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        join_code: 'ABC123',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user123'
      };

      const appStudent = dbStudentToAppStudent(dbStudent);

      expect(appStudent).toEqual({
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        joinCode: 'ABC123'
      });
    });

    test('appStudentToDbStudent should convert correctly', () => {
      const appStudent = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        joinCode: 'ABC123'
      };

      const dbStudent = appStudentToDbStudent(appStudent);

      expect(dbStudent).toEqual({
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        join_code: 'ABC123'
      });
    });

    test('should handle null join_code', () => {
      const dbStudent = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        join_code: null,
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user123'
      };

      const appStudent = dbStudentToAppStudent(dbStudent);

      expect(appStudent.joinCode).toBeUndefined();
    });
  });

  describe('Category converters', () => {
    test('dbCategoryToAppCategory should convert correctly', () => {
      const dbCategory = {
        id: '456',
        name: 'Homework',
        weight: 0.3,
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user123'
      };

      const appCategory = dbCategoryToAppCategory(dbCategory);

      expect(appCategory).toEqual({
        id: '456',
        name: 'Homework',
        weight: 0.3
      });
    });

    test('appCategoryToDbCategory should convert correctly', () => {
      const appCategory = {
        id: '456',
        name: 'Homework',
        weight: 0.3
      };

      const dbCategory = appCategoryToDbCategory(appCategory);

      expect(dbCategory).toEqual({
        id: '456',
        name: 'Homework',
        weight: 0.3
      });
    });
  });

  describe('Assignment converters', () => {
    test('dbAssignmentToAppAssignment should convert correctly', () => {
      const dbAssignment = {
        id: '789',
        name: 'Math HW 1',
        category_id: 'cat123',
        total_points: 100,
        due_date: '2024-12-31',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user123'
      };

      const appAssignment = dbAssignmentToAppAssignment(dbAssignment);

      expect(appAssignment).toEqual({
        id: '789',
        name: 'Math HW 1',
        categoryId: 'cat123',
        totalPoints: 100,
        dueDate: '2024-12-31'
      });
    });

    test('should handle null due_date', () => {
      const dbAssignment = {
        id: '789',
        name: 'Math HW 1',
        category_id: 'cat123',
        total_points: 100,
        due_date: null,
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user123'
      };

      const appAssignment = dbAssignmentToAppAssignment(dbAssignment);

      expect(appAssignment.dueDate).toBeNull();
    });
  });

  describe('Grade converters', () => {
    test('dbGradeToAppGrade should convert correctly', () => {
      const dbGrade = {
        id: '999',
        student_id: 'student123',
        assignment_id: 'assign123',
        points_earned: 95,
        comments: 'Great work!',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user123'
      };

      const appGrade = dbGradeToAppGrade(dbGrade);

      expect(appGrade).toEqual({
        id: '999',
        studentId: 'student123',
        assignmentId: 'assign123',
        pointsEarned: 95,
        comments: 'Great work!'
      });
    });

    test('should handle null comments', () => {
      const dbGrade = {
        id: '999',
        student_id: 'student123',
        assignment_id: 'assign123',
        points_earned: 95,
        comments: null,
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user123'
      };

      const appGrade = dbGradeToAppGrade(dbGrade);

      expect(appGrade.comments).toBeNull();
    });
  });

  describe('ObservationLog converters', () => {
    test('dbObservationLogToAppLogEntry should convert correctly', () => {
      const dbLog = {
        id: '111',
        student_id: 'student123',
        observer_name: 'Teacher Name',
        observation_date: '2024-01-15',
        behavior_type: 'positive',
        behavior_description: 'Helped classmate',
        context: 'During math class',
        action_taken: 'Praised student',
        follow_up_required: true,
        created_at: '2024-01-15T10:00:00Z',
        user_id: 'user123'
      };

      const appLogEntry = dbObservationLogToAppLogEntry(dbLog);

      expect(appLogEntry).toEqual({
        id: '111',
        studentId: 'student123',
        observerName: 'Teacher Name',
        observationDate: '2024-01-15',
        behaviorType: 'positive',
        behaviorDescription: 'Helped classmate',
        context: 'During math class',
        actionTaken: 'Praised student',
        followUpRequired: true
      });
    });

    test('should handle optional fields', () => {
      const dbLog = {
        id: '111',
        student_id: 'student123',
        observer_name: 'Teacher Name',
        observation_date: '2024-01-15',
        behavior_type: 'neutral',
        behavior_description: 'Arrived late',
        context: null,
        action_taken: null,
        follow_up_required: false,
        created_at: '2024-01-15T10:00:00Z',
        user_id: 'user123'
      };

      const appLogEntry = dbObservationLogToAppLogEntry(dbLog);

      expect(appLogEntry.context).toBeUndefined();
      expect(appLogEntry.actionTaken).toBeUndefined();
      expect(appLogEntry.followUpRequired).toBe(false);
    });
  });

  describe('Game converters', () => {
    test('dbGameToAppGame should convert correctly with categories', () => {
      const dbGame = {
        id: 'game123',
        name: 'Science Jeopardy',
        description: 'Test your science knowledge',
        is_public: true,
        created_by: 'user123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      };

      const dbCategories = [
        {
          id: 'cat1',
          game_id: 'game123',
          name: 'Biology',
          order_index: 0
        }
      ];

      const dbQuestions = [
        {
          id: 'q1',
          category_id: 'cat1',
          question: 'What is photosynthesis?',
          answer: 'Process by which plants make food',
          point_value: 100,
          is_double_jeopardy: false
        }
      ];

      const appGame = dbGameToAppGame(dbGame, dbCategories, dbQuestions);

      expect(appGame).toEqual({
        id: 'game123',
        name: 'Science Jeopardy',
        description: 'Test your science knowledge',
        isPublic: true,
        createdBy: 'user123',
        categories: [
          {
            id: 'cat1',
            name: 'Biology',
            orderIndex: 0,
            questions: [
              {
                id: 'q1',
                categoryId: 'cat1',
                question: 'What is photosynthesis?',
                answer: 'Process by which plants make food',
                pointValue: 100,
                isDoubleJeopardy: false
              }
            ]
          }
        ]
      });
    });

    test('appGameToDbGame should separate game, categories, and questions', () => {
      const appGame = {
        id: 'game123',
        name: 'Math Jeopardy',
        description: 'Test your math skills',
        isPublic: false,
        createdBy: 'user456',
        categories: [
          {
            id: 'cat1',
            name: 'Algebra',
            orderIndex: 0,
            questions: [
              {
                id: 'q1',
                categoryId: 'cat1',
                question: 'Solve for x: 2x + 5 = 15',
                answer: 'x = 5',
                pointValue: 200,
                isDoubleJeopardy: false
              }
            ]
          }
        ]
      };

      const { game, categories, questions } = appGameToDbGame(appGame);

      expect(game).toEqual({
        id: 'game123',
        name: 'Math Jeopardy',
        description: 'Test your math skills',
        is_public: false,
        created_by: 'user456'
      });

      expect(categories).toEqual([
        {
          id: 'cat1',
          game_id: 'game123',
          name: 'Algebra',
          order_index: 0
        }
      ]);

      expect(questions).toEqual([
        {
          id: 'q1',
          category_id: 'cat1',
          question: 'Solve for x: 2x + 5 = 15',
          answer: 'x = 5',
          point_value: 200,
          is_double_jeopardy: false
        }
      ]);
    });
  });

  describe('Question converters', () => {
    test('dbQuestionToAppQuestion should convert correctly', () => {
      const dbQuestion = {
        id: 'q123',
        category_id: 'cat456',
        question: 'What is the capital of France?',
        answer: 'Paris',
        point_value: 300,
        is_double_jeopardy: true
      };

      const appQuestion = dbQuestionToAppQuestion(dbQuestion);

      expect(appQuestion).toEqual({
        id: 'q123',
        categoryId: 'cat456',
        question: 'What is the capital of France?',
        answer: 'Paris',
        pointValue: 300,
        isDoubleJeopardy: true
      });
    });

    test('appQuestionToDbQuestion should convert correctly', () => {
      const appQuestion = {
        id: 'q123',
        categoryId: 'cat456',
        question: 'What is 2 + 2?',
        answer: '4',
        pointValue: 100,
        isDoubleJeopardy: false
      };

      const dbQuestion = appQuestionToDbQuestion(appQuestion);

      expect(dbQuestion).toEqual({
        id: 'q123',
        category_id: 'cat456',
        question: 'What is 2 + 2?',
        answer: '4',
        point_value: 100,
        is_double_jeopardy: false
      });
    });
  });

  describe('Edge cases', () => {
    test('should handle undefined optional fields', () => {
      const appStudent = {
        id: '123',
        name: 'Jane Doe',
        email: 'jane@example.com'
      };

      const dbStudent = appStudentToDbStudent(appStudent);

      expect(dbStudent.join_code).toBeUndefined();
    });

    test('should preserve all required fields', () => {
      const dbGrade = {
        id: '999',
        student_id: 'student123',
        assignment_id: 'assign123',
        points_earned: 0, // Test zero value
        comments: null,
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user123'
      };

      const appGrade = dbGradeToAppGrade(dbGrade);
      const dbGradeConverted = appGradeToDbGrade(appGrade);

      expect(dbGradeConverted.points_earned).toBe(0);
      expect(dbGradeConverted.student_id).toBe('student123');
      expect(dbGradeConverted.assignment_id).toBe('assign123');
    });
  });
});