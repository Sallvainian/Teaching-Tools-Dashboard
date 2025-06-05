<script lang="ts">
	import type { FileMetadata, FileShareWithDetails } from '$lib/types/files';
	import { filesActions } from '$lib/stores/files';

	interface Props {
		isOpen: boolean;
		file: FileMetadata | null;
		existingShares?: FileShareWithDetails[];
		onClose: () => void;
	}

	let { isOpen = $bindable(false), file, existingShares = [], onClose }: Props = $props();

	let email = $state('');
	let permission = $state<'view' | 'edit' | 'delete'>('view');
	let expiresIn = $state<number | null>(null); // Days until expiration
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	async function handleShare() {
		if (!file || !email.trim()) {
			error = 'Please enter an email address';
			return;
		}

		isLoading = true;
		error = null;
		successMessage = null;

		try {
			// Calculate expiration date if specified
			const expiresAt = expiresIn
				? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
				: null;

			// Use the fileService directly for the actual sharing operation
		const { fileService } = await import('$lib/services/fileService');
		await fileService.shareFile(file.id, email, permission, expiresAt);

			successMessage = `File shared with ${email}`;
			email = '';

			// Refresh shares list if needed
			// You might want to emit an event or callback here
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to share file';
		} finally {
			isLoading = false;
		}
	}

	async function handleRevokeShare(shareId: string) {
		if (!confirm('Are you sure you want to revoke this share?')) return;

		try {
			await filesActions.revokeShare(shareId);
			// Refresh shares list
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to revoke share';
		}
	}

	function formatExpirationDate(dateStr: string | null): string {
		if (!dateStr) return 'Never';
		const date = new Date(dateStr);
		const now = new Date();
		if (date < now) return 'Expired';

		const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		if (days === 1) return '1 day';
		if (days < 30) return `${days} days`;

		const months = Math.floor(days / 30);
		return months === 1 ? '1 month' : `${months} months`;
	}
</script>

{#if isOpen && file}
	<div class="fixed inset-0 bg-bg-base backdrop-blur-sm flex items-center justify-center z-50 p-4">
		<div class="bg-card border border-border rounded-lg max-w-2xl w-full">
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border border-border">
				<div>
					<h3 class="text-lg font-bold text-highlight">Share File</h3>
					<p class="text-sm text-text-base mt-1">{file.name}</p>
				</div>
				<button
					class="p-2 text-text-base hover:text-text-hover rounded-lg hover:bg-surface transition-colors"
					onclick={onClose}
					aria-label="Close share modal"
				>
					<svg
						class="w-5 h-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="p-4 space-y-4">
				{#if error}
					<div class="p-3 bg-error border border-error/50 rounded-lg text-error">
						{error}
					</div>
				{/if}

				{#if successMessage}
					<div class="p-3 bg-success border border-success/50 rounded-lg text-success">
						{successMessage}
					</div>
				{/if}

				<!-- Share form -->
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleShare();
					}}
					class="space-y-4"
				>
					<div>
						<label for="email" class="block text-sm font-medium text-text-base mb-2">
							Share with (email)
						</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="user@example.com"
							class="w-full px-3 py-2 bg-surface text-text-base border border-border rounded-lg focus:outline-none focus:border-purple"
							required
						/>
					</div>

					<div>
						<span id="permission-label" class="block text-sm font-medium text-text-base mb-2">
							Permission
						</span>
						<div role="group" aria-labelledby="permission-label" class="flex gap-2">
							<button
								type="button"
								class={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
									permission === 'view'
										? 'bg-purple text-highlight border-purple'
										: 'bg-surface text-text-base border-border hover:border-purple'
								}`}
								onclick={() => (permission = 'view')}
							>
								<svg
									class="w-4 h-4 inline mr-2"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
									<circle cx="12" cy="12" r="3"></circle>
								</svg>
								View
							</button>
							<button
								type="button"
								class={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
									permission === 'edit'
										? 'bg-purple text-highlight border-purple'
										: 'bg-surface text-text-base border-border hover:border-purple'
								}`}
								onclick={() => (permission = 'edit')}
							>
								<svg
									class="w-4 h-4 inline mr-2"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M12 20h9"></path>
									<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
								</svg>
								Edit
							</button>
							<button
								type="button"
								class={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
									permission === 'delete'
										? 'bg-purple text-highlight border-purple'
										: 'bg-surface text-text-base border-border hover:border-purple'
								}`}
								onclick={() => (permission = 'delete')}
							>
								<svg
									class="w-4 h-4 inline mr-2"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<polyline points="3 6 5 6 21 6"></polyline>
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
								</svg>
								Delete
							</button>
						</div>
					</div>

					<div>
						<label for="expiration" class="block text-sm font-medium text-text-base mb-2">
							Expiration (optional)
						</label>
						<select
							id="expiration"
							bind:value={expiresIn}
							class="w-full px-3 py-2 bg-surface text-text-base border border-border rounded-lg focus:outline-none focus:border-purple"
						>
							<option value={null}>Never expire</option>
							<option value={1}>1 day</option>
							<option value={7}>1 week</option>
							<option value={30}>1 month</option>
							<option value={90}>3 months</option>
							<option value={365}>1 year</option>
						</select>
					</div>

					<button
						type="submit"
						disabled={isLoading || !email.trim()}
						class="w-full btn btn-primary"
					>
						{#if isLoading}
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Sharing...
						{:else}
							<svg
								class="w-4 h-4 mr-2"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
								<polyline points="16 6 12 2 8 6"></polyline>
								<line x1="12" y1="2" x2="12" y2="15"></line>
							</svg>
							Share File
						{/if}
					</button>
				</form>

				<!-- Existing shares -->
				{#if existingShares.length > 0}
					<div class="pt-4 border-t border border-border">
						<h4 class="text-sm font-medium text-text-base mb-3">Shared with</h4>
						<div class="space-y-2">
							{#each existingShares as share (share.id)}
								<div class="flex items-center justify-between p-3 bg-surface rounded-lg">
									<div class="flex items-center gap-3">
										<div
											class="w-8 h-8 rounded-full bg-purple-bg flex items-center justify-center text-purple font-medium"
										>
											{share.shared_with_user?.email?.[0]?.toUpperCase() || '?'}
										</div>
										<div>
											<p class="text-text-base font-medium">
												{share.shared_with_user?.full_name ||
													share.shared_with_user?.email ||
													share.shared_with}
											</p>
											<p class="text-sm text-muted">
												{share.permission} • Expires: {formatExpirationDate(share.expires_at)}
											</p>
										</div>
									</div>
									<button
										onclick={() => handleRevokeShare(share.id)}
										class="p-2 text-error hover:bg-error rounded-lg transition-colors"
										title="Revoke access"
										aria-label="Revoke access"
									>
										<svg
											class="w-4 h-4"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<line x1="18" y1="6" x2="6" y2="18"></line>
											<line x1="6" y1="6" x2="18" y2="18"></line>
										</svg>
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
