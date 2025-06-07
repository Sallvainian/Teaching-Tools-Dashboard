<script lang="ts">
	import { authStore, user } from '$lib/stores/auth';
	import { supabase } from '$lib/supabaseClient';
	import type { User } from '@supabase/supabase-js';

	let fullName = $state(($user as User | null)?.user_metadata?.full_name || '');
	let avatarUrl = $state(($user as User | null)?.user_metadata?.avatar_url || '');
	let loading = $state(false);
	let uploadingAvatar = $state(false);
	let error = $state('');
	let success = $state(false);
	let avatarPreview = $state<string | null>(null);
	let fileInput: HTMLInputElement;

	function getInitials(name: string): string {
		if (!name) return 'U';
		return name
			.split(' ')
			.map(word => word[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	async function handleAvatarUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (!file) return;

		// Validate file
		if (!file.type.startsWith('image/')) {
			error = 'Please select an image file';
			return;
		}

		if (file.size > 5 * 1024 * 1024) { // 5MB limit
			error = 'Image file must be less than 5MB';
			return;
		}

		uploadingAvatar = true;
		error = '';

		try {
			const fileExt = file.name.split('.').pop();
			const userId = ($user as User | null)?.id;
			if (!userId) throw new Error('User not authenticated');

			const fileName = `${userId}-${Date.now()}.${fileExt}`;
			const filePath = `${userId}/${fileName}`;

			// Upload to dedicated avatars bucket (public)
			const { error: uploadError } = await supabase.storage
				.from('avatars')
				.upload(filePath, file, {
					cacheControl: '3600',
					upsert: true
				});

			if (uploadError) throw uploadError;

			// Get public URL from public avatars bucket
			const { data: { publicUrl } } = supabase.storage
				.from('avatars')
				.getPublicUrl(filePath);

			avatarUrl = publicUrl;
			
			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				avatarPreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);

		} catch (err: unknown) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'Failed to upload avatar';
			}
		} finally {
			uploadingAvatar = false;
		}
	}

	async function removeAvatar() {
		avatarUrl = '';
		avatarPreview = null;
		if (fileInput) {
			fileInput.value = '';
		}
		await handleSubmit();
	}

	async function handleSubmit() {
		if (!fullName) {
			error = 'Please enter your name';
			return;
		}

		loading = true;
		error = '';
		success = false;

		try {
			const result = await authStore.updateUserProfile({
				full_name: fullName,
				avatar_url: avatarUrl || null
			});
			
			if (result) {
				success = true;
			} else {
				error = 'Failed to update profile';
			}
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

		<!-- Profile Picture Section -->
		<div class="mb-6">
			<label for="avatarUpload" class="block text-sm font-medium mb-3 text-text-base">Profile Picture</label>
			<div class="flex items-center gap-4">
				<!-- Avatar Display -->
				<div class="relative">
					{#if avatarPreview || avatarUrl}
						<img
							src={avatarPreview || avatarUrl}
							alt="Profile"
							class="w-20 h-20 rounded-full object-cover border-2 border-border"
						/>
					{:else}
						<div class="w-20 h-20 rounded-full bg-purple text-highlight flex items-center justify-center text-xl font-semibold border-2 border-border">
							{getInitials(fullName || ($user as User | null)?.email || '')}
						</div>
					{/if}
					
					{#if uploadingAvatar}
						<div class="absolute inset-0 bg-bg-base/80 rounded-full flex items-center justify-center">
							<div class="loading loading-spinner loading-sm"></div>
						</div>
					{/if}
				</div>

				<!-- Upload Controls -->
				<div class="flex-1">
					<input
						bind:this={fileInput}
						type="file"
						accept="image/*"
						onchange={handleAvatarUpload}
						class="hidden"
						id="avatarUpload"
					/>
					<div class="flex flex-col gap-2">
						<button
							type="button"
							onclick={() => fileInput.click()}
							disabled={uploadingAvatar}
							class="btn btn-outline btn-sm"
						>
							{uploadingAvatar ? 'Uploading...' : 'Choose Photo'}
						</button>
						{#if avatarUrl || avatarPreview}
							<button
								type="button"
								onclick={removeAvatar}
								disabled={uploadingAvatar}
								class="btn btn-ghost btn-sm text-error"
							>
								Remove
							</button>
						{/if}
					</div>
				</div>
			</div>
			<p class="text-sm text-muted mt-2">Supported formats: JPG, PNG, GIF. Max size: 5MB</p>
		</div>

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
				class="btn btn-primary w-full"
				type="submit"
				disabled={loading || uploadingAvatar}
			>
				{#if loading}
					<span class="loading loading-spinner loading-sm mr-2"></span>
					Updating...
				{:else}
					Update Profile
				{/if}
			</button>
		</div>
	</form>
</div>
