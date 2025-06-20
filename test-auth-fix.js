// Simple test to validate the auth store import works
import { isAuthenticated } from './src/lib/stores/auth.js';

console.log('✅ isAuthenticated store imported successfully');
console.log('Store type:', typeof isAuthenticated);
console.log('Store has subscribe method:', typeof isAuthenticated.subscribe === 'function');dddd1d