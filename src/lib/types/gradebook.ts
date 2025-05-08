export interface Student {
	id: string;
	name: string;
}
export interface Category {
	id: string;
	name: string;
	studentIds: string[];
}
export interface Assignment {
	id: string;
	name: string;
	maxPoints: number;
	categoryId: string;
}
export interface Grade {
	studentId: string;
	assignmentId: string;
	points: number;
}
