export interface LogEntry {
  id: string;
  observer: string;
  date: string;
  student: string;
  subject: string | null;
  objective: string | null;
  observation: string;
  actions: string | null;
  follow_up: string | null;
  tags: string[] | null;
}

export interface LogEntryFilters {
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
  student?: string;
  tags?: string[];
}