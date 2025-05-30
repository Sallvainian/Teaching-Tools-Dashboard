export function clearSupabaseAuthStorage() {
	if (typeof window === 'undefined') return;

	const keysToRemove: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (
			key &&
			(key.includes('supabase') || key.includes('sb-') || key === 'teacher-dashboard-auth')
		) {
			keysToRemove.push(key);
		}
	}
	keysToRemove.forEach((key) => {
		localStorage.removeItem(key);
	});

	for (let i = 0; i < sessionStorage.length; i++) {
		const key = sessionStorage.key(i);
		if (key && (key.includes('supabase') || key.includes('sb-'))) {
			sessionStorage.removeItem(key);
		}
	}
}
