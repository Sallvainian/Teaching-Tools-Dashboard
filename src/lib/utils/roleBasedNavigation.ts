import type { User } from '@supabase/supabase-js';

export interface NavigationItem {
	name: string;
	href: string;
	icon: string;
	roles: string[];
	description?: string;
}

export const navigationItems: NavigationItem[] = [
	{
		name: 'Dashboard',
		href: '/dashboard',
		icon: '🏠',
		roles: ['teacher', 'student', 'admin'],
		description: 'Main dashboard overview'
	},
	{
		name: 'Classes',
		href: '/classes',
		icon: '👥',
		roles: ['teacher', 'admin'],
		description: 'Manage classes and students'
	},
	{
		name: 'Student Roster',
		href: '/student-roster',
		icon: '📋',
		roles: ['teacher', 'admin'],
		description: 'View and manage student information'
	},
	{
		name: 'Gradebook',
		href: '/gradebook',
		icon: '📊',
		roles: ['teacher', 'admin'],
		description: 'Grade management and reporting'
	},
	{
		name: 'Log Entries',
		href: '/log-entries',
		icon: '📝',
		roles: ['teacher', 'admin'],
		description: 'Student observation logs'
	},
	{
		name: 'Files',
		href: '/files',
		icon: '📁',
		roles: ['teacher', 'student', 'admin'],
		description: 'File storage and sharing'
	},
	{
		name: 'Jeopardy',
		href: '/jeopardy',
		icon: '🎯',
		roles: ['teacher', 'student', 'admin'],
		description: 'Educational game creation and play'
	},
	{
		name: 'Scattergories',
		href: '/scattergories',
		icon: '🎲',
		roles: ['teacher', 'admin'],
		description: 'Word game for vocabulary building'
	},
	{
		name: 'Lesson Planner',
		href: '/lesson-planner',
		icon: '📚',
		roles: ['teacher', 'admin'],
		description: 'Plan and organize lessons'
	},
	{
		name: 'Chat',
		href: '/chat',
		icon: '💬',
		roles: ['teacher', 'student', 'admin'],
		description: 'Communication platform'
	},
	{
		name: 'Class Dojo Remake',
		href: '/class-dojo-remake',
		icon: '🏆',
		roles: ['teacher', 'admin'],
		description: 'Behavior management system'
	}
];

export const studentNavigationItems: NavigationItem[] = [
	{
		name: 'Student Dashboard',
		href: '/student/dashboard',
		icon: '🏠',
		roles: ['student'],
		description: 'Student main dashboard'
	},
	{
		name: 'My Games',
		href: '/student/games',
		icon: '🎮',
		roles: ['student'],
		description: 'Games created and shared with me'
	},
	{
		name: 'Files',
		href: '/files',
		icon: '📁',
		roles: ['student'],
		description: 'My files and shared files'
	},
	{
		name: 'Chat',
		href: '/chat',
		icon: '💬',
		roles: ['student'],
		description: 'Communication with teachers'
	}
];

/**
 * Filter navigation items based on user role
 */
export function getNavigationForRole(userRole: string): NavigationItem[] {
	if (userRole === 'student') {
		return [
			...studentNavigationItems,
			...navigationItems.filter(
				(item) =>
					item.roles.includes('student') &&
					!studentNavigationItems.some((si) => si.href === item.href)
			)
		];
	}

	return navigationItems.filter((item) => item.roles.includes(userRole));
}

/**
 * Check if user has access to a specific route
 */
export function hasRouteAccess(userRole: string, route: string): boolean {
	const allItems = [...navigationItems, ...studentNavigationItems];
	const item = allItems.find((item) => item.href === route);
	return item ? item.roles.includes(userRole) : false;
}

/**
 * Get appropriate dashboard route for user role
 */
export function getDashboardRoute(userRole: string): string {
	switch (userRole) {
		case 'student':
			return '/student/dashboard';
		case 'teacher':
		case 'admin':
		default:
			return '/dashboard';
	}
}

/**
 * Check if current route should be accessible to user
 */
export function validateRouteAccess(
	userRole: string,
	currentPath: string
): {
	hasAccess: boolean;
	redirectTo?: string;
} {
	// Allow auth routes for everyone
	if (currentPath.startsWith('/auth/')) {
		return { hasAccess: true };
	}

	// Check specific route access
	if (!hasRouteAccess(userRole, currentPath)) {
		return {
			hasAccess: false,
			redirectTo: getDashboardRoute(userRole)
		};
	}

	return { hasAccess: true };
}
