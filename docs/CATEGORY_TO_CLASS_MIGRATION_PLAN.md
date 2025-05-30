# Category to Class Migration Plan

## Overview
This document outlines the complete migration plan to fix the terminology confusion where "categories" were incorrectly used instead of "classes" in the gradebook system, while preserving legitimate uses of "categories" in game modules.

## Current State Analysis

### Legitimate "Category" Uses (DO NOT CHANGE)
These are correct uses of the term "category" and should remain unchanged:

1. **Jeopardy Game System**
   - `/src/lib/types/jeopardy.ts` - Game categories for questions
   - `/src/lib/stores/jeopardy.ts` - Jeopardy category management
   - `/src/routes/jeopardy/` - All Jeopardy-related files
   - Database tables: `game_categories`, `jeopardy_categories`

2. **Scattergories Game System**
   - `/src/routes/scattergories/` - Game category lists
   - `/src/lib/stores/scattergories.ts` - Scattergories category data

3. **Log Entries System**
   - `/src/lib/types/log-entries.ts` - Behavior categories (positive/negative)
   - `/src/lib/stores/log-entries.ts` - Category filter for log types

### Incorrect "Category" Uses (MUST CHANGE)
These are instances where "category" is incorrectly used to mean "class":

1. **Database Schema**
   - Table: `categories` → Should use `classes` table instead
   - Table: `category_students` → Should use `class_students` table instead
   - Column: `assignments.category_id` → Should be `assignments.class_id`
   - Column: `grades.category_id` → References assignments table (indirect)

2. **TypeScript Types**
   - `/src/lib/types/database.ts` - `Category` interface → `Class` interface
   - `/src/lib/types/gradebook.ts` - All category-related types

3. **UI Components**
   - `/src/routes/classes/+page.svelte` - Still uses categories terminology
   - `/src/lib/components/ClassList.svelte` - Mixed terminology

## Migration Steps

### Phase 1: TypeScript Type Updates ✓ COMPLETED
- [x] Update gradebook store to use class terminology
- [x] Update gradebook page component

### Phase 2: Remaining TypeScript Updates (TODO)
1. Update `/src/lib/types/database.ts`:
   - Rename `Category` interface to `Class`
   - Update all references to use new interface name

2. Update `/src/lib/types/gradebook.ts`:
   - Change all category-related type names to class-related names
   - Ensure compatibility with existing database column names

### Phase 3: UI Component Updates (TODO)
1. `/src/routes/classes/+page.svelte`:
   - Update all category references to class
   - Fix import statements and function calls

2. `/src/lib/components/ClassList.svelte`:
   - Standardize terminology throughout component
   - Update props and event handlers

### Phase 4: Database Migration (TODO)
1. Create comprehensive migration script:
   - Add `class_id` column to `assignments` table
   - Copy data from `category_id` to `class_id`
   - Update foreign key constraints
   - Drop old `category_id` column after verification

2. Clean up obsolete tables:
   - Archive data from `categories` table
   - Archive data from `category_students` table
   - Drop tables after verification

### Phase 5: Testing & Verification (TODO)
1. Test gradebook functionality:
   - Create new classes
   - Assign students to classes
   - Create assignments for classes
   - Enter and modify grades

2. Verify game systems still work:
   - Jeopardy categories function correctly
   - Scattergories categories unchanged
   - Log entry categories work as expected

## Implementation Priority

1. **High Priority**
   - TypeScript type definitions (prevents runtime errors)
   - Database column migration (data integrity)
   - Core UI components (user-facing functionality)

2. **Medium Priority**
   - Component prop names and internal variables
   - Migration scripts and documentation

3. **Low Priority**
   - Code comments and documentation
   - Variable names in non-critical paths

## Rollback Plan

If issues arise during migration:

1. **Database Rollback**
   ```sql
   -- Restore original column if needed
   ALTER TABLE assignments 
   ADD COLUMN category_id UUID REFERENCES classes(id);
   
   -- Copy data back
   UPDATE assignments 
   SET category_id = class_id;
   
   -- Restore foreign key
   ALTER TABLE assignments
   DROP COLUMN class_id;
   ```

2. **Code Rollback**
   - Git revert to previous commit
   - Restore TypeScript type definitions
   - Re-deploy previous version

## Success Criteria

- [ ] Zero TypeScript errors after migration
- [ ] All gradebook functionality works correctly
- [ ] Game systems remain unaffected
- [ ] No references to "category" in gradebook context
- [ ] Database schema uses correct terminology
- [ ] All tests pass

## Notes

- The `classes` table already exists and is being used
- The `class_students` junction table is already created and functional
- Foreign key constraints have been updated to reference `classes(id)`
- The gradebook store and main page have been updated
- Import/export functionality uses correct terminology

This migration maintains backward compatibility while fixing the fundamental terminology issue that was causing confusion throughout the codebase.