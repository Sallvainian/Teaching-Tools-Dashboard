// src/lib/types/jeopardy.ts
export interface Question {
  id: string;
  text: string;
  answer: string;
  pointValue: number;
  isAnswered: boolean;
  isDoubleJeopardy?: boolean;
  wager?: number;
  timeLimit?: number; // Time limit in seconds
}

export interface Category {
  id: string;
  name: string;
  questions: Question[];
}

export interface Team {
  id: string;
  name: string;
  score: number;
  color: string; // CSS color for the team
}

export interface JeopardyGame {
  id: string;
  name: string;
  description?: string;
  categories: Category[];
  teams: Team[];
  dateCreated: string;
  lastModified: string;
  settings?: GameSettings;
}

export type TimerSize = 'large' | 'medium' | 'small';

export interface GameSettings {
  defaultTimeLimit?: number; // Default time limit in seconds for questions
  useTimer?: boolean; // Whether to use timer by default
  readingTime?: number; // Reading time in seconds before countdown starts (default 5)
  autoShowAnswer?: boolean; // Whether to automatically show answer when timer expires
  timerSize?: TimerSize; // Size of the timer display (large, medium, small)
  allowWagers?: boolean; // Whether to allow wagers for double jeopardy
}

export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  categories: {
    name: string;
    questions: {
      text: string;
      answer: string;
      pointValue: number;
      isDoubleJeopardy?: boolean;
    }[];
  }[];
}
