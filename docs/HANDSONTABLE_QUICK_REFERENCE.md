# Handsontable Quick Reference Guide

## Basic Usage

```svelte
<script>
  import Handsontable from '$lib/components/Handsontable.svelte';
  
  let data = [
    ['Name', 'Age', 'Country'],
    ['John', 25, 'USA'],
    ['Jane', 30, 'Canada']
  ];
</script>

<Handsontable
  {data}
  colHeaders={true}
  rowHeaders={true}
  height={400}
  settings={{
    contextMenu: true,
    stretchH: 'all'
  }}
  on:afterChange={handleChange}
/>
```

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | Array | Grid data (array of arrays or objects) |
| `colHeaders` | Boolean/Array | Column headers |
| `rowHeaders` | Boolean/Array | Row headers |
| `height` | Number | Grid height in pixels |
| `width` | String/Number | Grid width (default: '100%') |
| `licenseKey` | String | License key (default: 'non-commercial-and-evaluation') |
| `settings` | Object | Additional configuration options |

## Component Events

| Event | Description |
|-------|-------------|
| `afterChange` | Fired after cell data changes |
| `afterSelection` | Fired after cell selection |
| `init` | Fired when Handsontable is initialized |

## Component Methods

```svelte
<script>
  let hotComponent;
  
  function updateGridData() {
    hotComponent.updateData(newData);
  }
  
  function getCurrentData() {
    const data = hotComponent.getData();
    console.log(data);
  }
  
  function refreshGrid() {
    hotComponent.render();
  }
</script>

<Handsontable bind:this={hotComponent} {...props} />
```

## Column Configuration

```javascript
const columns = [
  { 
    data: 'name',         // Field name for object data
    title: 'Name',        // Column header
    type: 'text',         // Cell type
    width: 150,           // Width in pixels
    readOnly: true        // Prevent editing
  },
  { 
    data: 'age',
    title: 'Age',
    type: 'numeric',
    validator: (value, callback) => callback(value >= 0 && value <= 120)
  },
  { 
    data: 'country',
    title: 'Country',
    type: 'dropdown',
    source: ['USA', 'Canada', 'UK', 'Australia']
  }
];
```

## Cell Types

| Type | Description | Options |
|------|-------------|---------|
| `text` | Basic text input | `className`, `readOnly` |
| `numeric` | Number input | `numericFormat`, `min`, `max` |
| `date` | Date picker | `dateFormat`, `correctFormat` |
| `checkbox` | Boolean checkbox | `checkedTemplate`, `uncheckedTemplate` |
| `dropdown` | Select from list | `source`, `strict`, `allowEmpty` |
| `autocomplete` | Text with suggestions | `source`, `strict`, `visibleRows` |
| `password` | Masked input | `hashSymbol`, `hashLength` |

## Events & Hooks

```javascript
// In settings object
{
  afterChange: (changes, source) => {
    if (source !== 'loadData') {
      changes.forEach(([row, prop, oldValue, newValue]) => {
        console.log(`Change: ${oldValue} -> ${newValue}`);
      });
    }
  },
  
  afterSelection: (row, col, row2, col2) => {
    console.log(`Selected: (${row},${col}) to (${row2},${col2})`);
  },
  
  beforeKeyDown: (event) => {
    // Handle key events
  }
}
```

## Data Operations

```javascript
// Update entire dataset
hotInstance.loadData(newData);

// Update a single cell
hotInstance.setDataAtCell(rowIndex, columnIndex, 'New Value');

// Update multiple cells
const changes = [
  [0, 2, 'New Value'],  // [row, col, value]
  [1, 2, 'Another Value']
];
hotInstance.setDataAtCell(changes);

// Get current data
const data = hotInstance.getData();
```

## Performance Tips

1. Use `batch()` for multiple operations:
   ```javascript
   hotInstance.batch(() => {
     // Multiple operations here
     // Only renders once at the end
   });
   ```

2. For large datasets:
   - Enable virtual rendering (default)
   - Consider pagination
   - Load data in chunks
   - Use `asyncRendering: true` option

## Dark Theme Implementation

```javascript
// Add dark theme styles
const darkStyles = `
  .dark-theme .handsontable {
    background-color: #1e1e1e;
    color: #ffffff;
  }
  
  .dark-theme .handsontable th {
    background-color: #2d2d2d;
    color: #e0e0e0;
    border-color: #444444;
  }
  
  .dark-theme .handsontable td {
    background-color: #292929;
    border-color: #444444;
    color: #ffffff;
  }
`;

// Add styles to document
document.head.appendChild(document.createElement('style')).textContent = darkStyles;

// Apply theme to container
container.classList.add('dark-theme');
```

## Common Configurations

### Excel-like Spreadsheet
```javascript
{
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  manualColumnResize: true,
  manualRowResize: true,
  comments: true,
  mergeCells: true,
  columnSorting: true,
  filters: true
}
```

### Data Grid with Fixed Columns
```javascript
{
  rowHeaders: true,
  colHeaders: true,
  fixedColumnsStart: 1,
  stretchH: 'all',
  multiColumnSorting: true,
  filters: true,
  dropdownMenu: true
}
```

### Gradebook Example
```javascript
{
  columns: [
    // Student name column
    { 
      type: 'text',
      readOnly: true,
      className: 'htLeft font-medium'
    },
    // Assignment grade columns
    { 
      type: 'numeric',
      numericFormat: { pattern: '0,0.00' },
      className: 'htCenter',
      validator: (value, callback) => {
        callback(value === null || value === '' || (value >= 0 && value <= maxPoints));
      }
    },
    // Average column with custom rendering
    {
      type: 'numeric',
      readOnly: true,
      className: 'htCenter font-bold',
      renderer: (instance, td, row, col, prop, value) => {
        td.style.backgroundColor = getGradeColor(value);
        td.innerHTML = value ? `${value.toFixed(1)}%` : '—';
        return td;
      }
    }
  ]
}
```