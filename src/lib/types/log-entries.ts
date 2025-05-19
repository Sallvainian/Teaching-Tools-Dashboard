export interface LogEntry {
  id: string;
  date: string;
  student: string;
  log_entry: string;
  actions: string | null;
  follow_up: string | null;
  tags: string[];
}

export interface LogEntryFilters {
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
  student?: string;
  tags?: string[];
}