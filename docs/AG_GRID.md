# AG Grid Integration with Svelte 5

This guide provides detailed information about integrating AG Grid with Svelte 5, including best practices, common issues, and implementation examples specific to the Teacher Dashboard application.

## Available Libraries

There are three main libraries for integrating AG Grid with Svelte 5:

1. **ag-grid-svelte5** by JohnMaher1

   - Original wrapper for AG Grid with Svelte 5
   - More basic implementation
   - Default export: `import AgGridSvelte from 'ag-grid-svelte5';`

2. **ag-grid-svelte5-extended** by bn-l

   - Built on top of ag-grid-svelte5
   - Adds support for Svelte components as cell renderers
   - Better reactive data updates
   - Named export: `import { AgGrid } from 'ag-grid-svelte5-extended';`
   - Current version: 0.0.13

3. **@opliko/ag-grid-svelte5-extended** by oplik0
   - Fork of bn-l's version
   - Further enhancements to performance
   - More recent updates
   - Current version: 0.0.14

**Our project now uses: ag-grid-svelte5**

## Project Setup

### Dependencies

```json
"dependencies": {
  "@ag-grid-community/client-side-row-model": "^32.3.5",
  "@ag-grid-community/styles": "^32.3.5",
  "@ag-grid-community/core": "^32.3.5",
  "@ag-grid-community/theming": "^32.3.5",
  "ag-grid-svelte5": "^1.0.3"
}
```

### Module Registration

AG Grid requires explicit module registration. We have created the file:

```typescript
// src/lib/ag-grid-modules.ts
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';

// Export the module for direct import
export const clientSideRowModelModule = ClientSideRowModelModule;

// Register modules globally
ModuleRegistry.registerModules([ClientSideRowModelModule]);
```

### CSS Import

We import the required CSS in our app.css file:

```css
/* AG Grid CSS imports - must be at the very top */
@import '@ag-grid-community/styles/ag-grid.css';
@import '@ag-grid-community/styles/ag-theme-alpine.css';
```

And in the layout component, we register modules and set theme mode:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  // Import AG Grid modules (registers modules globally)
  import '$lib/ag-grid-modules';
  import { onMount } from 'svelte';

  // Set AG Grid dark mode attribute
  onMount(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-ag-theme-mode', 'dark');
  });
</script>
```

## Theming System

AG Grid provides a robust theming system with built-in themes and color schemes. Prefer using these over custom CSS when possible.

### Available Themes

AG Grid offers several built-in themes:

- **Alpine** (`ag-theme-alpine`) - Modern, clean look (recommended)
- **Balham** (`ag-theme-balham`) - Business-like appearance
- **Material** (`ag-theme-material`) - Google Material design
- **Quartz** (`ag-theme-quartz`) - Latest theme with a modern appearance (v32+)

### Color Schemes

Each theme comes with light and dark variants, plus additional color schemes:

- **Alpine**: light, dark
- **Balham**: light, dark
- **Material**: light, dark
- **Quartz**: light, dark, plus additional schemes:
  - Fresh (light or dark)
  - Warm (light or dark)
  - Cool (light or dark)
  - Strong (light or dark)

### Setting Theme and Color Scheme

There are three ways to set the theme and color scheme:

#### 1. Using Grid Class and Attribute

```html
<div class="ag-theme-alpine" data-ag-theme-mode="dark">
  <AgGridSvelte {...props} />
</div>
```

#### 2. Using the `theme` Property

```javascript
import { themeAlpine } from '@ag-grid-community/theming';

const darkTheme = themeAlpine.withParams({
  colorScheme: 'dark',
});

// Then in your component:
<AgGridSvelte theme={darkTheme} {...props} />;
```

#### 3. Using Specific Color Schemes

```javascript
import { themeAlpine, colorSchemeDarkWarm } from '@ag-grid-community/theming';

const customTheme = themeAlpine.withParams({
  colorScheme: colorSchemeDarkWarm,
});

// Then in your component:
<AgGridSvelte theme={customTheme} {...props} />;
```

### Theme Overrides

For specific customizations, you can override theme parameters:

```javascript
import { themeAlpine } from '@ag-grid-community/theming';

const customTheme = themeAlpine.withParams({
  colorScheme: 'dark',
  accentColor: '#8b5cf6', // Purple accent
  backgroundColor: '#121212', // Darker background
  headerFontSize: 14,
  borders: true,
});

// Then in your component:
<AgGridSvelte theme={customTheme} {...props} />;
```

## Recommended Implementation

For Teacher Dashboard, we recommend using the **Alpine** theme with the **DarkWarm** color scheme:

```javascript
import AgGridSvelte from 'ag-grid-svelte5';
import { themeAlpine, colorSchemeDarkWarm } from '@ag-grid-community/theming';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';

// Create custom theme
const darkTheme = themeAlpine.withParams({
  colorScheme: colorSchemeDarkWarm,
  // Optional overrides
  accentColor: '#8b5cf6', // Purple accent to match our UI
  headerFontSize: 14
});

// Define modules
const modules = [ClientSideRowModelModule];

// Then in your component:
<div class="h-[500px]">
  <AgGridSvelte
    {gridOptions}
    {rowData}
    theme={darkTheme}
    {modules}
  />
</div>
```

## Example Implementation: Gradebook

Here's how we implement the Gradebook grid:

### Data and Column Setup

```svelte
<script>
  // Import the correct component
  import AgGridSvelte from 'ag-grid-svelte5';
  import { themeAlpine, colorSchemeDarkWarm } from '@ag-grid-community/theming';
  import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
  import type { GridOptions } from '@ag-grid-community/core';

  // Create theme
  const darkTheme = themeAlpine.withParams({
    colorScheme: colorSchemeDarkWarm,
    accentColor: '#8b5cf6', // Purple accent
    headerFontSize: 14,
    borders: true,
  });

  // Data for grid
  let rowData = $state(createRowData());

  // Basic column definitions
  let columnDefs = $state(createColumnDefs());

  // Define modules
  const modules = [ClientSideRowModelModule];

  // Update data when dependencies change
  $effect(() => {
    if (categoryStudents) {
      const newRowData = createRowData();
      console.log(
        `Updated rowData, students: ${categoryStudents.length}, assignments: ${categoryAssignments.length}`
      );
      rowData = newRowData;
    }
  });

  // Create row data from store values
  function createRowData() {
    // Function implementation...
  }
</script>

<!-- Component usage -->
<div class="h-[500px]">
  <AgGridSvelte {gridOptions} {rowData} theme={darkTheme} {modules} />
</div>
```

### Grid Options Configuration

```svelte
<script>
  // Grid options
  const gridOptions: GridOptions<GradeRow> = {
    columnDefs: createColumnDefs(),
    getRowId: (params) => params.data.studentId,
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      suppressHeaderMenuButton: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      minWidth: 120,
    },
    // Using object format for rowSelection as per recent versions
    rowSelection: { type: 'multiple' },
    undoRedoCellEditing: true,
    enableCellTextSelection: true,
    stopEditingWhenCellsLoseFocus: true,
    onCellValueChanged: (params) => {
      // Handler implementation...
    },
  };
</script>
```

## Common Issues and Solutions

### White Background in Dark Mode

If the grid still has a white background, try these approaches:

1. **Preferred Approach**: Use the theme and colorScheme properties:

   ```javascript
   import { themeAlpine, colorSchemeDarkWarm } from '@ag-grid-community/theming';

   const darkTheme = themeAlpine.withParams({
     colorScheme: colorSchemeDarkWarm,
   });

   <AgGridSvelte theme={darkTheme} {...props} />;
   ```

2. **Alternative Approach**: Use the correct CSS class and attribute:

   ```html
   <div class="ag-theme-alpine" data-ag-theme-mode="dark">
     <AgGridSvelte {...props} />
   </div>
   ```

3. **Last Resort**: Use the CSS Variables approach only if the above methods don't work:
   ```css
   .ag-theme-alpine {
     --ag-background-color: #121212;
     --ag-header-background-color: #1e1e1e;
     --ag-odd-row-background-color: #0a0a0a;
     /* Other variables */
   }
   ```

### No Data Appearing

If no data appears in the grid:

1. Check browser console for errors
2. Verify row data is being generated correctly
3. Ensure column definitions match data fields
4. Add debug logs to trace reactivity flow
5. Check that store values are being loaded properly
6. Add sample data generation to verify grid rendering

## Performance Optimization

For better performance:

1. Use `getRowId` to provide stable row IDs:

   ```typescript
   getRowId: (params) => params.data.studentId;
   ```

2. Use separate effects for row data and column definitions to prevent unnecessary updates

3. Get data from stores once outside of loops to avoid triggering reactivity:

   ```typescript
   // Get grades once outside the loop
   const allGrades = get(gradebookStore.grades);

   // Use the retrieved data inside the loop
   studentData.forEach((student) => {
     const grade = allGrades.find((g) => g.studentId === student.id);
     // ...
   });
   ```

4. Use setTimeout in onMount to defer initial data loading and prevent infinite loops:
   ```typescript
   onMount(() => {
     setTimeout(() => {
       // Load initial data
     }, 0);
   });
   ```

## Best Practices

1. **Preferred Theme Approach**: Use `themeAlpine.withParams({colorScheme: colorSchemeDarkWarm})` rather than CSS variables
2. **Reactive data updates**: Use `$state` and `$effect` with careful dependency tracking
3. **Dynamic columns**: Generate columns dynamically based on data
4. **Modern Grid Options**: Use object notation for properties like rowSelection: `{ type: 'multiple' }`
5. **Performance optimization**: Use `getRowId` and minimize reactivity triggers
6. **Debugging**: Add console logs in effect blocks to trace reactivity flow

## Extra Resources

- [AG Grid Documentation](https://www.ag-grid.com/javascript-data-grid/)
- [AG Grid Theming Overview](https://www.ag-grid.com/javascript-data-grid/theming/)
- [AG Grid Color Schemes](https://www.ag-grid.com/javascript-data-grid/theming-colors/#color-schemes)
- [AG Grid Theme Customization](https://www.ag-grid.com/javascript-data-grid/themes-customizing/)
