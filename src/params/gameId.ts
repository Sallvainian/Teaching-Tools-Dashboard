import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
  // Allow alphanumeric characters, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(param);
};
