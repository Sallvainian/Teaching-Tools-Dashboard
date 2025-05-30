export interface Student {
	id: string;
	name: string;
}

// Renamed from Category to Class - represents a class that students attend
export interface Class {
	id: string;
	name: string;
	studentIds: string[];
}

export interface Assignment {
	id: string;
	name: string;
	maxPoints: number;
	classId: string; // Renamed from categoryId to classId
}

export interface Grade {
	studentId: string;
	assignmentId: string;
	points: number;
}
