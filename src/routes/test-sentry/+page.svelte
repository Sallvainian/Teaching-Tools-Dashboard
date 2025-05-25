<script lang="ts">
	import { onMount } from 'svelte';
	import { trackAsyncOperation, trackUserInteraction, trackDatabaseOperation } from '$lib/utils/performance';
	import * as Sentry from '@sentry/sveltekit';
	
	function throwTestError() {
		trackUserInteraction('click', 'error-button');
		throw new Error('This is a test error for Sentry!');
	}
	
	async function throwAsyncError() {
		trackUserInteraction('click', 'async-error-button');
		await new Promise(resolve => setTimeout(resolve, 100));
		throw new Error('This is an async test error for Sentry!');
	}
	
	function captureMessage() {
		trackUserInteraction('click', 'message-button');
		// You can manually capture messages/errors if needed
		import('@sentry/sveltekit').then(({ captureMessage }) => {
			captureMessage('Test message sent to Sentry', 'info');
		});
	}
	
	// Performance monitoring examples
	async function testSlowOperation() {
		trackUserInteraction('click', 'slow-operation-button');
		
		await trackAsyncOperation(
			'slow-api-call',
			async () => {
				// Simulate a slow API call
				await new Promise(resolve => setTimeout(resolve, 2000));
				return { success: true };
			},
			{ 'api.endpoint': '/test', 'api.type': 'simulation' }
		);
		
		alert('Slow operation completed! Check Sentry performance tab.');
	}
	
	async function testDatabaseOperation() {
		trackUserInteraction('click', 'db-operation-button');
		
		await trackDatabaseOperation(
			'users',
			'select',
			async () => {
				// Simulate database query
				await new Promise(resolve => setTimeout(resolve, 500));
				return [{ id: 1, name: 'Test User' }];
			}
		);
		
		alert('Database operation completed! Check Sentry performance tab.');
	}
	
	function testTransaction() {
		trackUserInteraction('click', 'transaction-button');
		
		// Create a custom transaction
		Sentry.startSpan({
			name: 'Custom User Transaction',
			op: 'ui.action',
			tags: {
				component: 'test-page',
				action: 'custom-transaction'
			}
		}, () => {
			// Simulate some work
			const start = Date.now();
			while (Date.now() - start < 100) {
				// Busy wait for 100ms
			}
			
			// Add breadcrumb
			Sentry.addBreadcrumb({
				message: 'Custom transaction completed',
				level: 'info',
				category: 'user-action'
			});
		});
		
		alert('Custom transaction completed! Check Sentry performance tab.');
	}
</script>

<div class="container mx-auto p-8">
	<h1 class="text-2xl font-bold mb-4">Sentry Test Page</h1>
	
	<div class="space-y-6">
		<div>
			<h2 class="text-xl font-semibold mb-3">Error Tracking</h2>
			<div class="space-y-2">
				<button
					onclick={throwTestError}
					class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mr-2"
				>
					Throw Sync Error
				</button>
				
				<button
					onclick={throwAsyncError}
					class="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 mr-2"
				>
					Throw Async Error
				</button>
				
				<button
					onclick={captureMessage}
					class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
				>
					Send Test Message
				</button>
			</div>
		</div>
		
		<div>
			<h2 class="text-xl font-semibold mb-3">Performance Monitoring</h2>
			<div class="space-y-2">
				<button
					onclick={testSlowOperation}
					class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 mr-2"
				>
					Test Slow API Call (2s)
				</button>
				
				<button
					onclick={testDatabaseOperation}
					class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-2"
				>
					Test Database Operation
				</button>
				
				<button
					onclick={testTransaction}
					class="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 mr-2"
				>
					Test Custom Transaction
				</button>
			</div>
		</div>
	</div>
	
	<div class="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded">
		<h3 class="font-semibold mb-2">What to Check in Sentry:</h3>
		<ul class="text-sm space-y-1">
			<li>🐛 <strong>Issues</strong> - Error tracking and debugging info</li>
			<li>⚡ <strong>Performance</strong> - Transaction traces and Web Vitals</li>
			<li>📹 <strong>Replays</strong> - Session recordings when errors occur</li>
			<li>🚀 <strong>Releases</strong> - Track deployments and related issues</li>
		</ul>
		<p class="text-sm mt-3">
			Visit your 
			<a href="https://sentry.io" target="_blank" class="text-blue-500 underline">
				Sentry dashboard
			</a> to see captured data.
		</p>
	</div>
</div>