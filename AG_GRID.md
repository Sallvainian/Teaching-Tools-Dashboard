# AG Grid Integration with Svelte 5

This guide provides detailed information about integrating AG Grid with Svelte 5, including best practices, common issues, and implementation examples specific to the Teacher Dashboard application.

## Available Libraries

There are three main libraries for integrating AG Grid with Svelte 5:

1. **ag-grid-svelte5** by JohnMaher1
   - Original wrapper for AG Grid with Svelte 5
   - More basic implementation
   - Less actively maintained

2. **ag-grid-svelte5-extended** by bn-l
   - Built on top of ag-grid-svelte5
   - Adds support for Svelte components as cell renderers
   - Better reactive data updates
   - Current version: 0.0.13

3. **@opliko/ag-grid-svelte5-extended** by oplik0
   - Fork of bn-l's version
   - Further enhancements to performance
   - More recent updates
   - Current version: 0.0.14

**Our project uses: ag-grid-svelte5-extended**

## Project Setup

### Dependencies

```json
"dependencies": {
  "@ag-grid-community/client-side-row-model": "^32.3.5",
  "@ag-grid-community/styles": "^32.3.5",
  "@ag-grid-community/core": "^32.3.5",
  "ag-grid-svelte5-extended": "^0.0.13"
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

We import the required CSS in our layout file:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  // Import AG Grid modules (registers modules globally)
  import '$lib/ag-grid-modules';
  
  // Import AG Grid CSS early - must come before any grid renders
  import '@ag-grid-community/styles/ag-grid.css';
  import '@ag-grid-community/styles/ag-theme-material.css';
  
  // Set AG Grid dark mode attribute
  onMount(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-ag-theme-mode', 'dark');
  });
</script>
```

### Grid Component Export

We simplify imports by exporting the grid from our lib index:

```typescript
// src/lib/index.ts
import { AgGrid } from 'ag-grid-svelte5-extended';
export { AgGrid as Grid };
```

## Dark Theme Implementation

Our application uses a custom dark theme for AG Grid with three layers of styling:

### 1. Global CSS Variables in app.css

```css
/* AG Grid Dark Theme - Applied globally to all instances */
.ag-theme-material {
  /* Override the white background */
  --ag-background-color: #121212 !important;
  --ag-header-background-color: #1e1e1e !important;
  --ag-odd-row-background-color: #0a0a0a !important;
  --ag-foreground-color: #e0e0e0 !important;
  /* Other theme variables... */
}

/* Force dark backgrounds on all grid elements */
.ag-theme-material .ag-root-wrapper,
.ag-theme-material .ag-root,
/* Other selectors... */ {
  background-color: #121212 !important;
}
```

### 2. Component-Level Styling

Each component that uses a grid can include component-specific styling:

```svelte
<style>
/* Component-specific AG Grid overrides */
:global(.ag-theme-material .ag-cell.editable-cell) {
  background-color: rgba(139, 92, 246, 0.05) !important;
}
</style>
```

### 3. Inline Style Props

For fine-grained control, inline styles can be passed to the grid:

```svelte
<script>
// Custom styles to override the built-in styles
const customStyles = {
  "--ag-background-color": "#121212",
  "--ag-header-background-color": "#1e1e1e",
  "--ag-odd-row-background-color": "#0a0a0a",
  "--ag-foreground-color": "#e0e0e0",
  "--ag-header-foreground-color": "#ffffff",
  "--ag-border-color": "#333333",
  "--ag-row-hover-color": "#2a2a2a"
};
</script>

<AgGrid
  gridClass="ag-theme-material w-full h-full"
  style={customStyles}
  /* Other props... */
/>
```

## Example Implementation: Gradebook

Here's how we implement the Gradebook grid:

### Data and Column Setup

```svelte
<script>
// Data for grid
let rowData = $state(createRowData());

// Basic column definitions
let columnDefs = $state(createColumnDefs());

// Update data when dependencies change
$effect(() => {
  console.log('Effect trigger: students or assignments changed');
  rowData = createRowData();
});

// Create row data from store values
function createRowData() {
  return categoryStudents.map((student) => {
    const row = {
      studentId: student.id,
      student: student.name
    };

    categoryAssignments.forEach((assignment) => {
      const grades = get(gradebookStore.grades);
      const grade = grades.find(
        (g) => g.studentId === student.id && g.assignmentId === assignment.id
      );
      row[assignment.id] = grade ? grade.points : null;
    });

    row['average'] = studentAverageInCategory(student.id, categoryId || '');
    return row;
  });
}

// Create column definitions
function createColumnDefs() {
  const colDefs = [
    {
      headerName: 'Student',
      field: 'student',
      editable: false,
      pinned: 'left',
      minWidth: 180,
      cellStyle: { fontWeight: 'bold' },
      resizable: true,
      lockPosition: true,
      suppressMovable: true
    }
  ];

  // Dynamic column generation based on assignments
  const validAssignments = categoryAssignments.filter((a) => a?.name && a?.id);
  validAssignments.forEach((assignment) => {
    colDefs.push({
      headerName: assignment.name.trim(),
      field: assignment.id.trim(),
      editable: true,
      type: 'numericColumn',
      width: 120,
      cellClass: 'editable-cell',
      headerTooltip: `Max Points: ${assignment.maxPoints}`,
      // Column-specific formatting options...
    });
  });

  // Average column
  colDefs.push({
    headerName: 'Average',
    field: 'average',
    editable: false,
    type: 'numericColumn',
    pinned: 'right',
    lockPosition: true,
    suppressMovable: true,
    valueFormatter: (params) => {
      return params.value ? `${params.value.toFixed(1)}%` : '–';
    },
    cellStyle: {
      color: '#f3e8ff',
      fontWeight: 'bold',
      backgroundColor: 'rgba(99, 102, 241, 0.2)'
    }
  });

  return colDefs;
}
</script>
```

### Grid Options Configuration

```svelte
<script>
// Grid options
const gridOptions = {
  defaultColDef: {
    sortable: true,
    filter: true,
    resizable: true,
    editable: false,
    cellEditor: 'agTextCellEditor',
    cellEditorParams: {
      useFormatter: false
    },
    enableCellChangeFlash: true
  },
  rowSelection: 'multiple',
  undoRedoCellEditing: true,
  enableCellTextSelection: true,
  ensureDomOrder: true,
  enterNavigatesVertically: true,
  enterNavigatesVerticallyAfterEdit: true,
  copyHeadersToClipboard: true,
  clipboardDelimiter: '\t',
  onCellValueChanged,
  // Important for reducing dom updates and improving performance
  getRowId: (params) => params.data.studentId
};

// Cell value changed handler
function onCellValueChanged(params) {
  const { data, colDef, newValue } = params;
  if (colDef.field !== 'student' && colDef.field !== 'average') {
    const studentId = data.studentId;
    const assignmentId = colDef.field;
    const value =
      newValue === null || newValue === undefined || newValue === ''
        ? null
        : parseFloat(newValue);
    if (value === null || !isNaN(value)) {
      recordGrade(studentId, assignmentId, value);
    }
  }
}
</script>
```

### Grid Component Usage

```svelte
<div class="h-[500px] w-full" style="--ag-background-color: #121212; --ag-header-background-color: #1e1e1e; --ag-odd-row-background-color: #0a0a0a; --ag-foreground-color: #e0e0e0;">
  <AgGrid
    gridClass="ag-theme-material w-full h-full"
    {gridOptions}
    {rowData}
    {columnDefs}
    {modules}
    style={customStyles}
  />
</div>
```

## Test Page Implementation

We've created a test page at `/routes/test/+page.svelte` that demonstrates both ways to use AG Grid:

1. With our Grid component wrapper
2. Direct implementation with ag-grid-svelte5-extended

This page is useful for testing new grid features and for providing examples of proper implementation.

## Debugging Tips

For debugging data flow issues, add console logs in key functions:

```typescript
// Update data when dependencies change
$effect(() => {
  console.log('Effect trigger: categoryStudents or assignments changed');
  console.log('Current category:', categoryId);
  console.log('Students in category:', categoryStudents.length);
  console.log('Assignments in category:', categoryAssignments.length);
  
  // Update row data
  rowData = createRowData();
  console.log('Row data updated:', rowData);
});

// Create row data from store values
function createRowData() {
  // Debug current state
  console.log('Creating row data from:', categoryStudents.length, 'students');
  
  // Map students to rows...
  
  console.log('Generated row data:', rows);
  return rows;
}
```

## Common Issues and Solutions

### White Background in Dark Mode

If grid still has a white background despite dark mode settings:

1. Make sure the grid has the right CSS classes:
```html
<AgGrid gridClass="ag-theme-material w-full h-full" ... />
```

2. Ensure dark mode attribute is set:
```typescript
document.documentElement.setAttribute('data-ag-theme-mode', "dark");
```

3. Apply all three layers of styling:
   - Global CSS in app.css
   - Component-specific styles
   - Inline style props

### No Data Appearing

If no data appears in the grid:

1. Check browser console for errors
2. Verify row data is being generated correctly
3. Ensure column definitions match data fields
4. Add debug logs to trace reactivity flow
5. Check that store values are being loaded properly
6. Add sample data generation to verify grid rendering

### Sample Data Generation

For testing, we added sample data generation:

```typescript
// Create sample data if none exists
$effect(() => {
  if (categoryId) {
    // Check if we need to create sample data
    if (categoryStudents.length === 0) {
      console.log('Adding sample students for demo');
      // Create and add sample students...
    }

    if (categoryAssignments.length === 0) {
      console.log('Adding sample assignments for demo');
      // Create sample assignments...
      
      // Add sample grades...
    }
  }
});
```

## Performance Optimization

For better performance:

1. Use `getRowId` to provide stable row IDs:
```typescript
getRowId: (params) => params.data.studentId
```

2. Keep grid size reasonable (500px height is good):
```html
<div class="h-[500px] w-full">
  <AgGrid ... />
</div>
```

3. Update only when needed (using effects to detect changes)

4. Use `enableCellChangeFlash: true` in `defaultColDef` to show changes visually

## Adding New Grids to the Project

When adding a new grid to the project:

1. Import the Grid or AgGrid component
2. Define data and column structure
3. Configure grid options with proper event handlers
4. Apply consistent dark styling using the three-layer approach
5. Use Svelte 5 reactivity with effects to update the grid

## Best Practices

1. **Reactive data updates**: Use `$state` and `$effect` to manage grid data
2. **Dynamic columns**: Generate columns dynamically based on data
3. **Excel-like features**: Enable features that improve usability  
4. **Performance optimization**: Use `getRowId` and minimize rerenders
5. **Consistent styling**: Apply dark theme consistently
6. **Debugging**: Add console logs for troubleshooting
7. **Sample data**: Generate sample data for demonstration and testing

## Extra Resources

- [AG Grid Documentation](https://www.ag-grid.com/documentation)
- [ag-grid-svelte5-extended Documentation](https://github.com/JohnMaher1/ag-grid-svelte5)
- [Demo Grid in Test Page](src/routes/test/+page.svelte)