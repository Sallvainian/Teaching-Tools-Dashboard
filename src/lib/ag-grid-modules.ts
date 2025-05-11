// src/lib/ag-grid-modules.ts
/**
 * This file registers AG Grid modules globally so they're available to all grid instances.
 * Import this file in your root layout component to ensure modules are registered
 * before any grids are rendered.
 */
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';

// Export the module for direct import if needed
export const clientSideRowModelModule = ClientSideRowModelModule;

// Register modules globally
ModuleRegistry.registerModules([ClientSideRowModelModule]);
