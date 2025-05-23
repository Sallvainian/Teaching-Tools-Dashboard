<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { createEventDispatcher } from 'svelte';
  
  let { 
    gameId,
    isOpen
  } = $props<{
    gameId: string;
    isOpen: boolean;
  }>();
  
  const dispatch = createEventDispatcher();
  
  interface Student {
    id: string;
    email: string;
    full_name: string;
  }
  
  let students = $state<Student[]>([]);
  let selectedStudents = $state<string[]>([]);
  let isLoading = $state(false);
  let error = $state('');
  
  $effect(() => {
    if (isOpen) {
      loadStudents();
    }
  });
  
  async function loadStudents() {
    isLoading = true;
    error = '';
    
    try {
      const { supabase } = await import('$lib/supabaseClient');
      const user = $authStore.user;
      
      if (!user) return;
      
      // Get students connected to this teacher
      const { data, error: fetchError } = await supabase
        .from('student_teachers')
        .select(`
          student_id,
          app_users!student_teachers_student_id_fkey (
            id,
            email,
            full_name
          )
        `)
        .eq('teacher_id', user.id);
      
      if (fetchError) throw fetchError;
      
      if (data) {
        students = data.flatMap(d => d.app_users).filter(Boolean) as Student[];
      }
      
      // Get currently shared students
      const { data: sharedData, error: sharedError } = await supabase
        .from('shared_games')
        .select('shared_with_id')
        .eq('game_id', gameId);
      
      if (sharedError) throw sharedError;
      
      if (sharedData) {
        selectedStudents = sharedData.map(s => s.shared_with_id);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load students';
    } finally {
      isLoading = false;
    }
  }
  
  async function saveSharing() {
    isLoading = true;
    error = '';
    
    try {
      const { supabase } = await import('$lib/supabaseClient');
      
      // Remove existing shares
      const { error: deleteError } = await supabase
        .from('shared_games')
        .delete()
        .eq('game_id', gameId);
      
      if (deleteError) throw deleteError;
      
      // Add new shares
      if (selectedStudents.length > 0) {
        const shares = selectedStudents.map(studentId => ({
          game_id: gameId,
          shared_with_id: studentId,
          permission: 'play'
        }));
        
        const { error: insertError } = await supabase
          .from('shared_games')
          .insert(shares);
        
        if (insertError) throw insertError;
      }
      
      dispatch('save');
      close();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save sharing settings';
    } finally {
      isLoading = false;
    }
  }
  
  function toggleStudent(studentId: string) {
    if (selectedStudents.includes(studentId)) {
      selectedStudents = selectedStudents.filter(id => id !== studentId);
    } else {
      selectedStudents = [...selectedStudents, studentId];
    }
  }
  
  function close() {
    dispatch('close');
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-dark-surface rounded-lg p-6 max-w-md w-full mx-4">
      <h2 class="text-xl font-semibold text-dark-highlight mb-4">Share Game</h2>
      
      {#if error}
        <div class="alert alert-error mb-4">
          <p>{error}</p>
        </div>
      {/if}
      
      {#if isLoading}
        <div class="flex justify-center py-8">
          <span class="loading loading-spinner loading-md"></span>
        </div>
      {:else if students.length === 0}
        <p class="text-gray-400 py-4">No students enrolled in your classes.</p>
      {:else}
        <div class="space-y-2 max-h-64 overflow-y-auto mb-6">
          {#each students as student (student.id)}
            <label class="flex items-center gap-3 p-2 hover:bg-dark-hover rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStudents.includes(student.id)}
                onchange={() => toggleStudent(student.id)}
                class="checkbox checkbox-primary"
              />
              <div>
                <p class="text-dark-text">{student.full_name}</p>
                <p class="text-sm text-gray-400">{student.email}</p>
              </div>
            </label>
          {/each}
        </div>
      {/if}
      
      <div class="flex gap-4">
        <button
          onclick={close}
          class="btn btn-ghost flex-1"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onclick={saveSharing}
          class="btn btn-primary flex-1"
          disabled={isLoading || students.length === 0}
        >
          Save
        </button>
      </div>
    </div>
  </div>
{/if}