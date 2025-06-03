<script lang="ts">
 import { authStore, user } from '$lib/stores/auth';
 	import type { User } from '@supabase/supabase-js';

 let fullName = $state(($user as User | null)?.user_metadata?.full_name || '');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	async function handleSubmit() {
		if (!fullName) {
			error = 'Please enter your name';
			return;
		}

		loading = true;
		error = '';
		success = false;

		try {
			await authStore.updateUserProfile({
				full_name: fullName
			});
			success = true;
		} catch (err: unknown) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'Failed to update profile';
			}
		} finally {
			loading = false;
		}
	}
</script>

<div class="w-full max-w-md">
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="bg-base-200 rounded-lg px-8 pt-6 pb-8 mb-4 shadow-md"
	>
		<h2 class="text-2xl font-bold mb-6 text-center">Profile</h2>

		{#if error}
			<div class="bg-error/20 text-error px-4 py-3 rounded mb-4" role="alert">
				<p>{error}</p>
			</div>
		{/if}

		{#if success}
			<div class="bg-success/20 text-success px-4 py-3 rounded mb-4" role="alert">
				<p>Profile updated successfully!</p>
			</div>
		{/if}

		<div class="mb-4">
			<label class="block text-sm font-medium mb-2" for="email"> Email </label>
			<input
				value={($user as User | null)?.email || ''}
				class="input input-bordered w-full"
				id="email"
				type="email"
				disabled
			/>
			<p class="text-sm text-base-content/60 mt-1">Email cannot be changed</p>
		</div>

		<div class="mb-6">
			<label class="block text-sm font-medium mb-2" for="fullName"> Full Name </label>
			<input
				bind:value={fullName}
				class="input input-bordered w-full"
				id="fullName"
				type="text"
				placeholder="Full Name"
				required
			/>
		</div>

		<div class="flex items-center justify-between">
			<button
				class="btn btn-primary w-full {loading ? 'loading' : ''}"
				type="submit"
				disabled={loading}
			>
				Update Profile
			</button>
		</div>
	</form>
</div>
