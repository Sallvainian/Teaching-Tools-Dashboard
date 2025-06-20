import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// Create admin client with service role key
const supabaseAdmin = createClient(
	PUBLIC_SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
);

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		// Get the authorization header
		const authHeader = request.headers.get('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			throw error(401, 'Missing or invalid authorization header');
		}

		const token = authHeader.split(' ')[1];

		// Verify the JWT token and get user
		const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
		
		if (userError || !user) {
			throw error(401, 'Invalid token or user not found');
		}

		// Delete all related data first (app_users table will cascade via foreign keys)
		// The RLS policies will ensure only the user's own data is deleted
		
		// Delete user's profile data from app_users table
		const { error: profileDeleteError } = await supabaseAdmin
			.from('app_users')
			.delete()
			.eq('id', user.id);

		if (profileDeleteError) {
			console.error('Error deleting profile:', profileDeleteError);
			// Continue with auth deletion even if profile deletion fails
		}

		// Delete the authentication user (this will cascade delete related auth data)
		const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

		if (authDeleteError) {
			console.error('Error deleting auth user:', authDeleteError);
			throw error(500, `Failed to delete user: ${authDeleteError.message}`);
		}

		return json({ success: true, message: 'Account deleted successfully' });

	} catch (err) {
		console.error('Account deletion error:', err);
		
		if (err && typeof err === 'object' && 'status' in err) {
			// Re-throw SvelteKit errors
			throw err;
		}
		
		throw error(500, 'Internal server error during account deletion');
	}
};