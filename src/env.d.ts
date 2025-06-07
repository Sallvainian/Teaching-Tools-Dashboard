// create src/env.d.ts
declare module '$env/static/public' {
	export const PUBLIC_SUPABASE_URL: string;
	export const PUBLIC_SUPABASE_ANON_KEY: string;
	export const PUBLIC_ANTHROPIC_API_KEY: string;
	export const PUBLIC_GIPHY_API_KEY: string;
}
