<script lang="ts">
	interface Props {
		type?: 'text' | 'card' | 'table' | 'avatar' | 'button';
		lines?: number;
		class?: string;
	}

	let { type = 'text', lines = 1, class: className = '' }: Props = $props();
</script>

{#if type === 'text'}
	<div class="animate-pulse {className}">
  {#each Array(lines) as _, i (i)}
			<div
				class="h-4 bg-surface rounded mb-2"
				style="width: {i === lines - 1 ? '60%' : '100%'}"
			></div>
		{/each}
	</div>
{:else if type === 'card'}
	<div class="animate-pulse bg-card rounded-xl shadow-card p-6 border border-border {className}">
		<div class="h-6 bg-surface rounded w-3/4 mb-4"></div>
		<div class="space-y-2">
			<div class="h-4 bg-surface rounded"></div>
			<div class="h-4 bg-surface rounded w-5/6"></div>
		</div>
		<div class="flex gap-2 mt-4">
			<div class="h-9 bg-surface rounded-lg w-20"></div>
			<div class="h-9 bg-surface rounded-lg w-20"></div>
		</div>
	</div>
{:else if type === 'table'}
	<div class="animate-pulse {className}">
		<div class="table-container">
			<table class="table">
				<thead class="table-header">
					<tr>
						{#each Array(4) as _, i (i)}
							<th class="table-header-cell">
								<div class="h-4 bg-surface rounded w-20"></div>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody class="table-body">
					{#each Array(5) as _, i (i)}
						<tr class="table-row">
							{#each Array(4) as _, j (j)}
								<td class="table-cell">
									<div class="h-4 bg-surface rounded"></div>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{:else if type === 'avatar'}
	<div class="animate-pulse {className}">
		<div class="h-10 w-10 bg-surface rounded-full"></div>
	</div>
{:else if type === 'button'}
	<div class="animate-pulse {className}">
		<div class="h-10 bg-surface rounded-lg w-24"></div>
	</div>
{/if}
