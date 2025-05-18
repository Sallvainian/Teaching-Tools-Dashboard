<script lang="ts">
  import { observationLogStore } from '$lib/stores/observation-log';
  import { observationReasons, studentMoods } from '$lib/types/observation-log';
  import type { ObservationReason, StudentMood } from '$lib/types/observation-log';
  
  // Props for edit mode
  export let editMode = false;
  export let logId: string | null = null;
  
  let studentName = '';
  let date = new Date().toISOString().slice(0, 10); // Today's date in YYYY-MM-DD format
  let reason: ObservationReason = 'Behavioral Concern';
  let notes = '';
  let mood: StudentMood = 'Unknown';
  let followUpActions = '';
  let followUpDate = '';
  let resolved = false;
  
  // Form validation
  let errors = {
    studentName: '',
    notes: ''
  };
  
  // Load data if in edit mode
  $: if (editMode && logId) {
    const log = observationLogStore.getLogById(logId);
    if (log) {
      studentName = log.studentName;
      date = log.date;
      reason = log.reason as ObservationReason;
      notes = log.notes;
      mood = (log.mood as StudentMood) || 'Unknown';
      followUpActions = log.followUpActions || '';
      followUpDate = log.followUpDate || '';
      resolved = log.resolved;
    }
  }
  
  function validateForm() {
    let valid = true;
    
    // Reset errors
    errors = {
      studentName: '',
      notes: ''
    };
    
    if (!studentName.trim()) {
      errors.studentName = 'Student name is required';
      valid = false;
    }
    
    if (!notes.trim()) {
      errors.notes = 'Notes are required';
      valid = false;
    }
    
    return valid;
  }
  
  function handleSubmit() {
    if (!validateForm()) return;
    
    if (editMode && logId) {
      // Update existing log
      observationLogStore.updateLog(logId, {
        studentName,
        studentId: 'student-' + Date.now().toString(), // Generate a temp ID if needed
        date,
        reason,
        notes,
        mood,
        followUpActions: followUpActions || undefined,
        followUpDate: followUpDate || undefined,
        resolved
      });
    } else {
      // Create new log
      observationLogStore.addLog({
        studentName,
        studentId: 'student-' + Date.now().toString(), // Generate a temp ID
        date,
        reason,
        notes,
        mood,
        followUpActions: followUpActions || undefined,
        followUpDate: followUpDate || undefined,
        resolved
      });
      
      // Reset form for new entries
      if (!editMode) {
        notes = '';
        followUpActions = '';
        followUpDate = '';
        resolved = false;
        // Keep student name and date for convenience when adding multiple logs
      }
    }
    
    // Dispatch event for parent components
    dispatch('save');
  }
  
  function cancel() {
    dispatch('cancel');
  }
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="bg-dark-card rounded-lg p-6 shadow-dark-card max-w-2xl mx-auto border border-dark-border">
  <h2 class="text-xl font-bold text-dark-highlight mb-4">
    {editMode ? 'Edit Behavior Log' : 'New Behavior Log'}
  </h2>
  
  <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
    <!-- Student Name -->
    <div>
      <label for="studentName" class="block text-sm font-medium text-gray-300">
        Student Name *
      </label>
      <input
        type="text"
        id="studentName"
        bind:value={studentName}
        class="mt-1 block w-full rounded-md bg-dark-surface border-dark-border text-white focus:ring-dark-purple focus:border-dark-purple"
        placeholder="Enter student name"
      />
      {#if errors.studentName}
        <p class="mt-1 text-sm text-red-500">{errors.studentName}</p>
      {/if}
    </div>
    
    <!-- Date -->
    <div>
      <label for="date" class="block text-sm font-medium text-gray-300">
        Date
      </label>
      <input
        type="date"
        id="date"
        bind:value={date}
        class="mt-1 block w-full rounded-md bg-dark-surface border-dark-border text-white focus:ring-dark-purple focus:border-dark-purple"
      />
    </div>
    
    <!-- Reason -->
    <div>
      <label for="reason" class="block text-sm font-medium text-gray-300">
        Reason
      </label>
      <select
        id="reason"
        bind:value={reason}
        class="mt-1 block w-full rounded-md bg-dark-surface border-dark-border text-white focus:ring-dark-purple focus:border-dark-purple"
      >
        {#each observationReasons as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </div>
    
    <!-- Notes -->
    <div>
      <label for="notes" class="block text-sm font-medium text-gray-300">
        Notes *
      </label>
      <textarea
        id="notes"
        bind:value={notes}
        rows="4"
        class="mt-1 block w-full rounded-md bg-dark-surface border-dark-border text-white focus:ring-dark-purple focus:border-dark-purple"
        placeholder="Enter detailed observation notes"
      ></textarea>
      {#if errors.notes}
        <p class="mt-1 text-sm text-red-500">{errors.notes}</p>
      {/if}
    </div>
    
    <!-- Mood -->
    <div>
      <label for="mood" class="block text-sm font-medium text-gray-300">
        Student Mood
      </label>
      <select
        id="mood"
        bind:value={mood}
        class="mt-1 block w-full rounded-md bg-dark-surface border-dark-border text-white focus:ring-dark-purple focus:border-dark-purple"
      >
        {#each studentMoods as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </div>
    
    <!-- Follow-up Actions -->
    <div>
      <label for="followUpActions" class="block text-sm font-medium text-gray-300">
        Follow-up Actions
      </label>
      <textarea
        id="followUpActions"
        bind:value={followUpActions}
        rows="2"
        class="mt-1 block w-full rounded-md bg-dark-surface border-dark-border text-white focus:ring-dark-purple focus:border-dark-purple"
        placeholder="Enter any follow-up actions needed"
      ></textarea>
    </div>
    
    <!-- Follow-up Date -->
    <div>
      <label for="followUpDate" class="block text-sm font-medium text-gray-300">
        Follow-up Date
      </label>
      <input
        type="date"
        id="followUpDate"
        bind:value={followUpDate}
        class="mt-1 block w-full rounded-md bg-dark-surface border-dark-border text-white focus:ring-dark-purple focus:border-dark-purple"
      />
    </div>
    
    <!-- Resolved Status -->
    <div class="flex items-center">
      <input
        type="checkbox"
        id="resolved"
        bind:checked={resolved}
        class="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
      />
      <label for="resolved" class="ml-2 block text-sm text-gray-300">
        Mark as resolved
      </label>
    </div>
    
    <!-- Submit/Cancel Buttons -->
    <div class="flex justify-end space-x-3 pt-4">
      <button
        type="button"
        onclick={cancel}
        class="px-4 py-2 bg-dark-accent text-white rounded-md hover:bg-dark-muted focus:outline-none focus:ring-2 focus:ring-dark-border"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="px-4 py-2 bg-dark-purple text-white rounded-md hover:bg-dark-accent focus:outline-none focus:ring-2 focus:ring-dark-highlight"
      >
        {editMode ? 'Update' : 'Save'}
      </button>
    </div>
  </form>
</div>