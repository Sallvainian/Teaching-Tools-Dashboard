// src/lib/types/jeopardy.ts
export interface Question {
	id: string;
	text: string;
	answer: string;
	pointValue: number;
	isAnswered: boolean;
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
	categories: Category[];
	teams: Team[];
	dateCreated: string;
	lastModified: string;
}
