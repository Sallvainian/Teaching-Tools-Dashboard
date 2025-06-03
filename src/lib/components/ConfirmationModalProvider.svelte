<script lang="ts">
	import { onMount } from 'svelte';
	import { confirmationStore } from '$lib/stores/confirmationModal';
	import ConfirmationModal from './ConfirmationModal.svelte';

	// State from store
	let isOpen = $state(false);
	let title = $state('Confirm Action');
	let message = $state('Are you sure you want to proceed?');
	let confirmText = $state('Confirm');
	let cancelText = $state('Cancel');
	let confirmButtonClass = $state('bg-purple hover:bg-purple/90');
	let cancelButtonClass = $state('bg-surface hover:bg-surface/80');
	let onConfirm = $state(() => {});
	let onCancel = $state(() => {});

	// Subscribe to store changes
	onMount(() => {
		const unsubscribe = confirmationStore.subscribe((state) => {
			isOpen = state.isOpen;
			title = state.options.title || 'Confirm Action';
			message = state.options.message;
			confirmText = state.options.confirmText || 'Confirm';
			cancelText = state.options.cancelText || 'Cancel';
			confirmButtonClass = state.options.confirmButtonClass || 'bg-purple hover:bg-purple/90';
			cancelButtonClass = state.options.cancelButtonClass || 'bg-surface hover:bg-surface/80';
			onConfirm = state.options.onConfirm;
			onCancel = state.options.onCancel || (() => {});
		});

		return unsubscribe;
	});

	// Handle confirm action
	function handleConfirm() {
		onConfirm();
		confirmationStore.close();
	}

	// Handle cancel action
	function handleCancel() {
		onCancel();
		confirmationStore.close();
	}
</script>

<ConfirmationModal
	bind:isOpen
	bind:title
	bind:message
	bind:confirmText
	bind:cancelText
	bind:confirmButtonClass
	bind:cancelButtonClass
	onConfirm={handleConfirm}
	onCancel={handleCancel}
/>