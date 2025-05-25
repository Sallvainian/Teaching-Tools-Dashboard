#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Read package.json to get version
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const version = packageJson.version;

// Get git commit hash
const gitHash = execSync('git rev-parse --short HEAD').toString().trim();

// Create release name
const releaseName = `${packageJson.name}@${version}-${gitHash}`;

console.log(`Creating Sentry release: ${releaseName}`);

// Set environment variable for the build
process.env.SENTRY_RELEASE = releaseName;

// Run the build
console.log('Building project...');
execSync('pnpm build', { 
  stdio: 'inherit',
  env: { ...process.env, SENTRY_RELEASE: releaseName }
});

console.log(`✅ Release ${releaseName} created successfully!`);
console.log(`View releases at: https://sentry.io/organizations/frank-cottone/releases/`);