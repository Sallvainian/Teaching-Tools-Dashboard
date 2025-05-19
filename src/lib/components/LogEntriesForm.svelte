<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { LogEntry } from '$lib/types/log-entries';
  
  export let editMode = false;
  export let log: LogEntry | undefined = undefined;
  
  const dispatch = createEventDispatcher();
  
  // Define available tag options
  const tagOptions = [
    'Behavioral',
    'Positive',
    'Academic',
    'Social',
    'Attendance',
    'Progress',
    'Intervention'
  ];
  
  // Form fields
  let date = log?.date || new Date().toISOString().slice(0, 10);
  let student = log?.student || '';
  let log_entry = log?.log_entry || '';
  let actions = log?.actions || '';
  let follow_up = log?.follow_up || '';
  let selectedTag = log?.tags && log.tags.length > 0 ? log.tags[0] : '';

  // Form validation
  let errors = {
    student: '',
    log_entry: ''
  };

  function validateForm() {
    let isValid = true;
    errors = {
      student: '',
      log_entry: ''
    };

    if (!student.trim()) {
      errors.student = 'Student name is required';
      isValid = false;
    }

    if (!log_entry.trim()) {
      errors.log_entry = 'Log Entry details are required';
      isValid = false;
    }

    return isValid;
  }

  function handleSave() {
    if (!validateForm()) return;

    const logEntry: Omit<LogEntry, 'id'> = {
      date,
      student: student.trim(),
      log_entry: log_entry.trim(),
      actions: actions.trim() || null,
      follow_up: follow_up.trim() || null,
      tags: selectedTag ? [selectedTag] : []
    };

    dispatch('save', logEntry);
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<form on:submit|preventDefault={handleSave} class="space-y-4">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label for="date" class="block text-sm font-medium text-dark-muted mb-1">
        Date
      </label>
      <input
        id="date"
        type="date"
        bind:value={date}
        class="w-full px-3 py-2 bg-dark-accent border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-purple"
      />
    </div>

    <div>
      <label for="student" class="block text-sm font-medium text-dark-muted mb-1">
        Student Name
      </label>
      <input
        id="student"
        type="text"
        bind:value={student}
        class="w-full px-3 py-2 bg-dark-accent border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-purple"
        placeholder="Enter student name"
      />
      {#if errors.student}
        <p class="text-red-500 text-sm mt-1">{errors.student}</p>
      {/if}
    </div>
  </div>

  <div>
    <label for="log_entry" class="block text-sm font-medium text-dark-muted mb-1">
      Log Entry
    </label>
    <textarea
      id="log_entry"
      bind:value={log_entry}
      rows="4"
      class="w-full px-3 py-2 bg-dark-accent border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-purple"
      placeholder="Describe what you observed..."
    ></textarea>
    {#if errors.log_entry}
      <p class="text-red-500 text-sm mt-1">{errors.log_entry}</p>
    {/if}
  </div>

  <div>
    <label for="actions" class="block text-sm font-medium text-dark-muted mb-1">
      Actions Taken (Optional)
    </label>
    <textarea
      id="actions"
      bind:value={actions}
      rows="2"
      class="w-full px-3 py-2 bg-dark-accent border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-purple"
      placeholder="What actions were taken?"
    ></textarea>
  </div>

  <div>
    <label for="follow_up" class="block text-sm font-medium text-dark-muted mb-1">
      Follow-up (Optional)
    </label>
    <textarea
      id="follow_up"
      bind:value={follow_up}
      rows="2"
      class="w-full px-3 py-2 bg-dark-accent border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-purple"
      placeholder="Any follow-up needed?"
    ></textarea>
  </div>

  <div>
    <label for="tags" class="block text-sm font-medium text-dark-muted mb-1">
      Tags (Optional)
    </label>
    <select
      id="tags"
      bind:value={selectedTag}
      class="w-full px-3 py-2 bg-dark-accent border border-dark-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dark-purple"
    >
      <option value="">Select a tag</option>
      {#each tagOptions as tag}
        <option value={tag}>{tag}</option>
      {/each}
    </select>
  </div>

  <div class="flex justify-end gap-3 pt-4">
    <button
      type="button"
      on:click={handleCancel}
      class="px-4 py-2 text-gray-300 hover:text-white transition-colors"
    >
      Cancel
    </button>
    <button
      type="submit"
      class="px-4 py-2 bg-dark-purple text-white rounded-lg hover:bg-dark-purple-hover transition-colors"
    >
      {editMode ? 'Update' : 'Save'} Entry
    </button>
  </div>
</form>