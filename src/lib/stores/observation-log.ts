import { writable, derived } from 'svelte/store';
import type { StudentObservationLog, ObservationLogFilters } from '$lib/types/observation-log';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'teaching-tools-observation-logs';

interface ObservationLogState {
  logs: StudentObservationLog[];
  loaded: boolean;
}

function createObservationLogStore() {
  // Load initial data from localStorage
  const initialData: ObservationLogState = {
    logs: [],
    loaded: false
  };

  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      initialData.logs = JSON.parse(storedData);
    }
    initialData.loaded = true;
  } catch (error) {
    console.error('Failed to load observation logs from localStorage:', error);
  }

  const { subscribe, update, set } = writable<ObservationLogState>(initialData);

  // Save to localStorage whenever the store changes
  const saveToLocalStorage = (logs: StudentObservationLog[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save observation logs to localStorage:', error);
    }
  };

  // CRUD operations
  return {
    subscribe,
    
    // Get all logs
    getLogs: () => {
      let result: StudentObservationLog[] = [];
      update(state => {
        result = [...state.logs];
        return state;
      });
      return result;
    },

    // Add new log
    addLog: (log: Omit<StudentObservationLog, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const newLog: StudentObservationLog = {
        ...log,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now
      };

      update(state => {
        const updatedLogs = [...state.logs, newLog];
        saveToLocalStorage(updatedLogs);
        return { ...state, logs: updatedLogs };
      });

      return newLog;
    },

    // Update existing log
    updateLog: (id: string, updates: Partial<Omit<StudentObservationLog, 'id' | 'createdAt'>>) => {
      let updatedLog: StudentObservationLog | null = null;

      update(state => {
        const updatedLogs = state.logs.map(log => {
          if (log.id === id) {
            updatedLog = {
              ...log,
              ...updates,
              updatedAt: new Date().toISOString()
            };
            return updatedLog;
          }
          return log;
        });

        saveToLocalStorage(updatedLogs);
        return { ...state, logs: updatedLogs };
      });

      return updatedLog;
    },

    // Delete log
    deleteLog: (id: string) => {
      update(state => {
        const updatedLogs = state.logs.filter(log => log.id !== id);
        saveToLocalStorage(updatedLogs);
        return { ...state, logs: updatedLogs };
      });
    },

    // Filter logs
    filterLogs: (filters: ObservationLogFilters) => {
      let result: StudentObservationLog[] = [];
      
      update(state => {
        result = state.logs.filter(log => {
          // Filter by student name
          if (filters.studentName && !log.studentName.toLowerCase().includes(filters.studentName.toLowerCase())) {
            return false;
          }
          
          // Filter by date range
          if (filters.startDate && log.date < filters.startDate) {
            return false;
          }
          
          if (filters.endDate && log.date > filters.endDate) {
            return false;
          }
          
          // Filter by reason
          if (filters.reason && log.reason !== filters.reason) {
            return false;
          }
          
          // Filter by resolved status
          if (filters.resolved !== undefined && log.resolved !== filters.resolved) {
            return false;
          }
          
          return true;
        });
        
        return state;
      });
      
      return result;
    },
    
    // Get a single log by ID
    getLogById: (id: string) => {
      let result: StudentObservationLog | undefined;
      
      update(state => {
        result = state.logs.find(log => log.id === id);
        return state;
      });
      
      return result;
    },
    
    // Clear all logs (for testing)
    clearLogs: () => {
      set({ logs: [], loaded: true });
      saveToLocalStorage([]);
    }
  };
}

export const observationLogStore = createObservationLogStore();

// Derived stores
export const allLogs = derived(observationLogStore, $store => $store.logs);
export const logsByStudent = derived(observationLogStore, $store => {
  const byStudent = new Map<string, StudentObservationLog[]>();
  
  $store.logs.forEach(log => {
    if (!byStudent.has(log.studentName)) {
      byStudent.set(log.studentName, []);
    }
    byStudent.get(log.studentName)?.push(log);
  });
  
  return byStudent;
});

export const logsByReason = derived(observationLogStore, $store => {
  const byReason = new Map<string, StudentObservationLog[]>();
  
  $store.logs.forEach(log => {
    if (!byReason.has(log.reason)) {
      byReason.set(log.reason, []);
    }
    byReason.get(log.reason)?.push(log);
  });
  
  return byReason;
});

export const uniqueStudentNames = derived(observationLogStore, $store => {
  return [...new Set($store.logs.map(log => log.studentName))].sort();
});

// Dev/test data initialization
if (import.meta.env.DEV) {
  const testData: StudentObservationLog[] = [
    {
      id: 'test-log-1',
      studentName: 'Emma Johnson',
      date: '2025-05-10',
      reason: 'Academic Performance',
      notes: 'Emma has been struggling with recent math concepts. She had difficulty completing the fractions worksheet and expressed frustration during class. Consider additional support or modified assignments.',
      mood: 'Frustrated',
      followUpActions: 'Schedule meeting with parents to discuss math support options.',
      followUpDate: '2025-05-17',
      resolved: false,
      createdAt: '2025-05-10T14:32:00Z',
      updatedAt: '2025-05-10T14:32:00Z'
    },
    {
      id: 'test-log-2',
      studentName: 'Liam Smith',
      date: '2025-05-12',
      reason: 'Behavioral Concern',
      notes: 'Liam had difficulty staying in his seat during morning work time. He was walking around the classroom and distracting other students. After a brief conversation about expectations, he was able to return to work.',
      mood: 'Distracted',
      followUpActions: 'Implement movement breaks between activities.',
      followUpDate: '',
      resolved: true,
      createdAt: '2025-05-12T10:15:00Z',
      updatedAt: '2025-05-13T08:45:00Z'
    },
    {
      id: 'test-log-3',
      studentName: 'Sophia Martinez',
      date: '2025-05-13',
      reason: 'Achievement',
      notes: 'Sophia showed significant improvement in her reading fluency assessment today. She read 98 words per minute with 97% accuracy, which represents a 20% improvement from her last assessment.',
      mood: 'Happy',
      followUpActions: 'Share progress with parents and provide more challenging reading materials.',
      followUpDate: '2025-05-20',
      resolved: false,
      createdAt: '2025-05-13T15:20:00Z',
      updatedAt: '2025-05-13T15:20:00Z'
    }
  ];

  // Only add test data if the store is empty
  const initialStore = observationLogStore.getLogs();
  if (initialStore.length === 0) {
    testData.forEach(log => {
      observationLogStore.addLog({
        studentName: log.studentName,
        date: log.date,
        reason: log.reason,
        notes: log.notes,
        mood: log.mood,
        followUpActions: log.followUpActions,
        followUpDate: log.followUpDate,
        resolved: log.resolved
      });
    });
  }
}