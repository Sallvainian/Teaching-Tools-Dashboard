import { writable } from 'svelte/store';
import type { LogEntry, LogEntryFilters } from '$lib/types/log-entries';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'teaching-tools-log-entries';
const TABLE_NAME = 'log_entries';

interface LogEntriesState {
  logs: LogEntry[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

function createLogEntriesStore() {
  // Initial state
  const initialData: LogEntriesState = {
    logs: [],
    loaded: false,
    loading: false,
    error: null
  };

  const { subscribe, update } = writable<LogEntriesState>(initialData);

  // Load data from Supabase
  const loadFromSupabase = async () => {
    update(state => ({ ...state, loading: true, error: null }));
    
    try {
      // Dynamically import supabase client
      const { supabase } = await import('$lib/supabaseClient');
      
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      update(state => ({ 
        ...state, 
        logs: data || [], 
        loaded: true,
        loading: false
      }));
      
      // Also update localStorage as fallback
      if (typeof window !== 'undefined' && data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      // Failed to load log entries from Supabase: error
      
      // Fall back to localStorage if Supabase fails
      if (typeof window !== 'undefined') {
        try {
          const storedData = localStorage.getItem(STORAGE_KEY);
          if (storedData) {
            const logs = JSON.parse(storedData);
            update(state => ({ 
              ...state, 
              logs, 
              loaded: true,
              loading: false,
              error: 'Failed to fetch from Supabase. Using cached data.' 
            }));
            return; // Exit early if we have localStorage data
          }
        } catch (localError) {
          // Failed to load log entries from localStorage: localError
        }
      }
      
      update(state => ({ 
        ...state, 
        loading: false, 
        error: 'Failed to load log entries. Check your connection.' 
      }));
    }
  };

  // CRUD operations
  return {
    subscribe,
    
    // Initialize the store
    init: () => {
      void loadFromSupabase(); // void operator to explicitly ignore the promise
    },
    
    // Get all logs
    getLogs: () => {
      let result: LogEntry[] = [];
      const unsubscribe = subscribe(state => {
        result = state.logs;
      });
      unsubscribe();
      return result;
    },

    // Get a single log by ID
    getLog: (id: string) => {
      let result: LogEntry | undefined;
      const unsubscribe = subscribe(state => {
        result = state.logs.find(log => log.id === id);
      });
      unsubscribe();
      return result;
    },

    // Add a new log
    addLog: async (log: Omit<LogEntry, 'id'>) => {
      const newLog: LogEntry = {
        ...log,
        id: uuidv4()
      };
      
      // Optimistic update
      update(state => ({
        ...state,
        logs: [...state.logs, newLog]
      }));
      
      try {
        // Dynamically import supabase client
        const { supabase } = await import('$lib/supabaseClient');
        
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert(newLog)
          .select()
          .single();
          
        if (error) throw error;
        
        // Update with server data
        if (data) {
          update(state => ({
            ...state,
            logs: state.logs.map(l => l.id === newLog.id ? data : l)
          }));
        }
        
        // Update localStorage
        const unsubscribe = subscribe(state => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.logs));
          }
        });
        unsubscribe();
        
      } catch (error) {
        // Failed to add log entry to Supabase: error
        // Keep the optimistic update for UX
        
        // Make sure localStorage is updated
        const unsubscribe = subscribe(state => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.logs));
          }
        });
        unsubscribe();
      }
    },

    // Update an existing log
    updateLog: async (id: string, updatedLog: Partial<LogEntry>) => {
      // Optimistic update
      update(state => ({
        ...state,
        logs: state.logs.map(log => 
          log.id === id ? { ...log, ...updatedLog } : log
        )
      }));
      
      try {
        // Dynamically import supabase client
        const { supabase } = await import('$lib/supabaseClient');
        
        const { error } = await supabase
          .from(TABLE_NAME)
          .update(updatedLog)
          .eq('id', id);
          
        if (error) throw error;
        
        // Update localStorage
        const unsubscribe = subscribe(state => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.logs));
          }
        });
        unsubscribe();
        
      } catch (error) {
        // Failed to update log entry in Supabase: error
        // Keep the optimistic update
        
        // Make sure localStorage is updated
        const unsubscribe = subscribe(state => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.logs));
          }
        });
        unsubscribe();
      }
    },

    // Delete a log
    deleteLog: async (id: string) => {
      // Optimistic update
      update(state => ({
        ...state,
        logs: state.logs.filter(log => log.id !== id)
      }));
      
      try {
        // Dynamically import supabase client
        const { supabase } = await import('$lib/supabaseClient');
        
        const { error } = await supabase
          .from(TABLE_NAME)
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        // Update localStorage
        const unsubscribe = subscribe(state => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.logs));
          }
        });
        unsubscribe();
        
      } catch (error) {
        // Failed to delete log entry from Supabase: error
        // Keep the optimistic update
        
        // Make sure localStorage is updated
        const unsubscribe = subscribe(state => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.logs));
          }
        });
        unsubscribe();
      }
    },

    // Filter logs based on search criteria
    filterLogs: (filters: LogEntryFilters) => {
      let result: LogEntry[] = [];
      
      // Helper function to apply filters
      function applyFilters(log: LogEntry): boolean {
        // Search query filter
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          
          // Helper function to check if a tag contains the search query
          function tagContainsQuery(tag: string): boolean {
            return tag.toLowerCase().includes(query);
          }
          
          // Check if student name, log entry, or any tag matches the query
          const studentMatch = log.student.toLowerCase().includes(query);
          const logEntryMatch = log.log_entry.toLowerCase().includes(query);
          const tagMatch = log.tags.some(tagContainsQuery);
          
          const matchesSearch = studentMatch || logEntryMatch || tagMatch;
          
          if (!matchesSearch) return false;
        }

        // Date range filters
        if (filters.dateFrom && new Date(log.date) < new Date(filters.dateFrom)) {
          return false;
        }

        if (filters.dateTo && new Date(log.date) > new Date(filters.dateTo)) {
          return false;
        }

        // Student filter
        if (filters.student && log.student !== filters.student) {
          return false;
        }

        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
          // Helper function to check if a tag matches the filter tag (case insensitive)
          function tagMatches(logTag: string, filterTag: string): boolean {
            return logTag.toLowerCase() === filterTag.toLowerCase();
          }
          
          // Helper function to check if any log tag matches a specific filter tag
          function hasTagMatch(filterTag: string): boolean {
            return log.tags.some(logTag => tagMatches(logTag, filterTag));
          }
          
          // Check if any filter tag matches any log tag
          const hasMatchingTag = filters.tags.some(hasTagMatch);
          
          if (!hasMatchingTag) return false;
        }

        return true;
      }
      
      // Apply filters to all logs
      const unsubscribe = subscribe(state => {
        result = state.logs.filter(applyFilters);
      });
      unsubscribe();
      
      return result;
    },

    // Get unique values for filtering
    getUniqueStudents: () => {
      let result: string[] = [];
      const unsubscribe = subscribe(state => {
        const allStudents = [...new Set(state.logs.map(log => log.student))];
        // Create a new array and sort it to avoid mutating the original
        result = [...allStudents].sort((a, b) => 
          a.localeCompare(b, undefined, { sensitivity: 'base' })
        );
      });
      unsubscribe();
      return result;
    },

    getUniqueTags: () => {
      let result: string[] = [];
      const unsubscribe = subscribe(state => {
        const allTags = state.logs.flatMap(log => log.tags);
        const uniqueTags = [...new Set(allTags)];
        // Create a new array and sort it to avoid mutating the original
        result = [...uniqueTags].sort((a, b) => 
          a.localeCompare(b, undefined, { sensitivity: 'base' })
        );
      });
      unsubscribe();
      return result;
    },

    // Clear all logs
    clearAll: async () => {
      update(state => ({ ...state, logs: [], error: null }));
      
      try {
        // Dynamically import supabase client
        const { supabase } = await import('$lib/supabaseClient');
        
        const { error } = await supabase
          .from(TABLE_NAME)
          .delete()
          .gte('id', '0'); // Delete all
          
        if (error) throw error;
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        // Failed to clear log entries from Supabase: error
        
        // Make sure localStorage is cleared anyway
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    },
    
    // Reload logs from Supabase
    refresh: () => {
      void loadFromSupabase(); // void operator to explicitly ignore the promise
    }
  };
}

export const logEntriesStore = createLogEntriesStore();