export interface StudentObservationLog {
  id: string;
  studentName: string;
  date: string; // ISO date string
  reason: string;
  notes: string;
  mood?: string;
  followUpActions?: string;
  followUpDate?: string;
  resolved: boolean;
  createdAt: string; // ISO date-time string
  updatedAt: string; // ISO date-time string
}

// Pre-defined reasons for observation logs
export type ObservationReason = 
  | 'Behavioral Concern'
  | 'Academic Performance'
  | 'Social Interaction'
  | 'Emotional Well-being'
  | 'Attendance Issue'
  | 'Achievement'
  | 'Parent Communication'
  | 'Other';

export const observationReasons: ObservationReason[] = [
  'Behavioral Concern',
  'Academic Performance',
  'Social Interaction',
  'Emotional Well-being',
  'Attendance Issue',
  'Achievement',
  'Parent Communication',
  'Other'
];

// Student mood options
export type StudentMood =
  | 'Happy'
  | 'Calm'
  | 'Anxious'
  | 'Frustrated'
  | 'Sad'
  | 'Angry'
  | 'Distracted'
  | 'Engaged'
  | 'Unknown';

export const studentMoods: StudentMood[] = [
  'Happy',
  'Calm', 
  'Anxious',
  'Frustrated',
  'Sad',
  'Angry',
  'Distracted',
  'Engaged',
  'Unknown'
];

// Search and filter options
export interface ObservationLogFilters {
  studentName?: string;
  startDate?: string;
  endDate?: string;
  reason?: ObservationReason;
  resolved?: boolean;
}