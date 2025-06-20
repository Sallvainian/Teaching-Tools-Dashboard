// Test script to verify the fixes for authStore.update and chat store supabase initialization

console.log('🧪 Testing fixes...\n');

// Test 1: Check if authStore has update method
try {
    const { authStore } = await import('./src/lib/stores/auth.js');
    console.log('✅ authStore imported successfully');
    console.log('✅ authStore.update method exists:', typeof authStore.update === 'function');
    
    if (typeof authStore.update === 'function') {
        console.log('✅ authStore.update is a function - this should fix the "authStore.update is not a function" error');
    } else {
        console.log('❌ authStore.update is not a function');
    }
} catch (error) {
    console.log('❌ Error importing authStore:', error.message);
}

console.log('');

// Test 2: Check if chatStore has setSupabaseClient method
try {
    const { chatStore } = await import('./src/lib/stores/chat.js');
    console.log('✅ chatStore imported successfully');
    console.log('✅ chatStore.setSupabaseClient method exists:', typeof chatStore.setSupabaseClient === 'function');
    
    if (typeof chatStore.setSupabaseClient === 'function') {
        console.log('✅ chatStore.setSupabaseClient is a function - this should fix the "supabase is not defined" errors');
        
        // Test setting a mock supabase client
        const mockSupabase = { from: () => ({ select: () => ({}) }) };
        chatStore.setSupabaseClient(mockSupabase);
        console.log('✅ Successfully set mock supabase client');
    } else {
        console.log('❌ chatStore.setSupabaseClient is not a function');
    }
} catch (error) {
    console.log('❌ Error importing chatStore:', error.message);
}

console.log('\n🎉 Fix verification complete!');