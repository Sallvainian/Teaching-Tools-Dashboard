# Tailwind CSS Quick Reference

## Installation

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```css
/* app.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Layout

```html
<!-- Display -->
<div class="block">Block</div>
<div class="inline">Inline</div>
<div class="inline-block">Inline-block</div>
<div class="flex">Flex</div>
<div class="grid">Grid</div>
<div class="hidden">Hidden</div>

<!-- Position -->
<div class="static">Static</div>
<div class="relative">Relative</div>
<div class="absolute">Absolute</div>
<div class="fixed">Fixed</div>
<div class="sticky">Sticky</div>

<!-- Position Placement -->
<div class="top-0">Top 0</div>
<div class="right-0">Right 0</div>
<div class="bottom-0">Bottom 0</div>
<div class="left-0">Left 0</div>
<div class="inset-0">All sides 0</div>

<!-- Z-Index -->
<div class="z-0">z-0</div>
<div class="z-10">z-10</div>
<div class="z-50">z-50</div>
```

## Flexbox

```html
<!-- Direction -->
<div class="flex flex-row">Row (default)</div>
<div class="flex flex-col">Column</div>
<div class="flex flex-row-reverse">Row reverse</div>
<div class="flex flex-col-reverse">Column reverse</div>

<!-- Wrap -->
<div class="flex flex-wrap">Wrap</div>
<div class="flex flex-nowrap">No wrap</div>

<!-- Justify Content (main axis) -->
<div class="flex justify-start">Start</div>
<div class="flex justify-center">Center</div>
<div class="flex justify-end">End</div>
<div class="flex justify-between">Space between</div>
<div class="flex justify-around">Space around</div>
<div class="flex justify-evenly">Space evenly</div>

<!-- Align Items (cross axis) -->
<div class="flex items-start">Start</div>
<div class="flex items-center">Center</div>
<div class="flex items-end">End</div>
<div class="flex items-stretch">Stretch</div>
<div class="flex items-baseline">Baseline</div>

<!-- Gap -->
<div class="flex gap-4">1rem gap</div>
<div class="flex gap-x-4">1rem horizontal gap</div>
<div class="flex gap-y-4">1rem vertical gap</div>

<!-- Child Flex -->
<div class="flex-1">Flex grow/shrink</div>
<div class="flex-auto">Auto sizing</div>
<div class="flex-none">No grow/shrink</div>
<div class="grow">Grow</div>
<div class="grow-0">Don't grow</div>
<div class="shrink">Shrink</div>
<div class="shrink-0">Don't shrink</div>
```

## Grid

```html
<!-- Grid Template Columns -->
<div class="grid grid-cols-1">1 column</div>
<div class="grid grid-cols-3">3 columns</div>
<div class="grid grid-cols-12">12 columns</div>
<div class="grid grid-cols-[200px_1fr_2fr]">Custom columns</div>

<!-- Grid Column Span -->
<div class="col-span-1">Span 1</div>
<div class="col-span-3">Span 3</div>
<div class="col-span-full">Full width</div>
<div class="col-start-2 col-end-4">From 2 to 4</div>

<!-- Grid Template Rows -->
<div class="grid grid-rows-3">3 rows</div>
<div class="grid grid-rows-[200px_1fr_auto]">Custom rows</div>

<!-- Grid Row Span -->
<div class="row-span-1">Span 1 row</div>
<div class="row-span-3">Span 3 rows</div>
<div class="row-start-2 row-end-4">From row 2 to 4</div>

<!-- Grid Gap -->
<div class="grid gap-4">1rem gap</div>
<div class="grid gap-x-4">1rem horizontal gap</div>
<div class="grid gap-y-4">1rem vertical gap</div>
```

## Spacing

```html
<!-- Padding -->
<div class="p-4">All sides</div>
<div class="pt-4">Top</div>
<div class="pr-4">Right</div>
<div class="pb-4">Bottom</div>
<div class="pl-4">Left</div>
<div class="px-4">Horizontal</div>
<div class="py-4">Vertical</div>

<!-- Margin -->
<div class="m-4">All sides</div>
<div class="mt-4">Top</div>
<div class="mr-4">Right</div>
<div class="mb-4">Bottom</div>
<div class="ml-4">Left</div>
<div class="mx-4">Horizontal</div>
<div class="my-4">Vertical</div>
<div class="mx-auto">Horizontal center</div>

<!-- Space Between -->
<div class="space-x-4">Horizontal space</div>
<div class="space-y-4">Vertical space</div>
```

## Sizing

```html
<!-- Width -->
<div class="w-0">0</div>
<div class="w-1">0.25rem</div>
<div class="w-4">1rem</div>
<div class="w-16">4rem</div>
<div class="w-1/2">50%</div>
<div class="w-1/3">33.33%</div>
<div class="w-full">100%</div>
<div class="w-screen">100vw</div>
<div class="w-min">min-content</div>
<div class="w-max">max-content</div>
<div class="w-fit">fit-content</div>
<div class="w-auto">auto</div>
<div class="w-[500px]">500px</div>

<!-- Height -->
<div class="h-0">0</div>
<div class="h-1">0.25rem</div>
<div class="h-4">1rem</div>
<div class="h-16">4rem</div>
<div class="h-1/2">50%</div>
<div class="h-full">100%</div>
<div class="h-screen">100vh</div>
<div class="h-min">min-content</div>
<div class="h-max">max-content</div>
<div class="h-fit">fit-content</div>
<div class="h-auto">auto</div>
<div class="h-[500px]">500px</div>

<!-- Width & Height Together -->
<div class="size-4">1rem square</div>
<div class="size-16">4rem square</div>
<div class="size-full">100% square</div>
<div class="size-[200px]">200px square</div>

<!-- Min/Max -->
<div class="min-w-0">min-width: 0</div>
<div class="min-h-screen">min-height: 100vh</div>
<div class="max-w-md">max-width: 28rem</div>
<div class="max-h-screen">max-height: 100vh</div>
```

## Typography

```html
<!-- Font Family -->
<p class="font-sans">Sans-serif</p>
<p class="font-serif">Serif</p>
<p class="font-mono">Monospace</p>

<!-- Font Size -->
<p class="text-xs">Extra small</p>
<p class="text-sm">Small</p>
<p class="text-base">Base</p>
<p class="text-lg">Large</p>
<p class="text-xl">Extra large</p>
<p class="text-2xl">2xl</p>
<p class="text-[32px]">Custom size</p>

<!-- Font Weight -->
<p class="font-thin">Thin</p>
<p class="font-normal">Normal</p>
<p class="font-medium">Medium</p>
<p class="font-semibold">Semibold</p>
<p class="font-bold">Bold</p>
<p class="font-black">Black</p>

<!-- Text Color -->
<p class="text-black">Black</p>
<p class="text-white">White</p>
<p class="text-blue-500">Blue-500</p>
<p class="text-[#1a2b3c]">Custom color</p>

<!-- Text Alignment -->
<p class="text-left">Left</p>
<p class="text-center">Center</p>
<p class="text-right">Right</p>
<p class="text-justify">Justify</p>

<!-- Line Height -->
<p class="leading-none">None</p>
<p class="leading-tight">Tight</p>
<p class="leading-normal">Normal</p>
<p class="leading-loose">Loose</p>
<p class="text-lg/7">text-lg with line height 1.75rem</p>

<!-- Letter Spacing -->
<p class="tracking-tighter">Tighter</p>
<p class="tracking-normal">Normal</p>
<p class="tracking-wider">Wider</p>

<!-- Text Decoration -->
<p class="underline">Underline</p>
<p class="line-through">Line through</p>
<p class="no-underline">No underline</p>

<!-- Text Transform -->
<p class="uppercase">Uppercase</p>
<p class="lowercase">Lowercase</p>
<p class="capitalize">Capitalize</p>
<p class="normal-case">Normal case</p>
```

## Colors & Backgrounds

```html
<!-- Text Color -->
<p class="text-blue-500">Blue text</p>
<p class="text-red-700">Dark red text</p>

<!-- Background Color -->
<div class="bg-green-200">Light green bg</div>
<div class="bg-purple-600">Purple bg</div>

<!-- Opacity -->
<div class="text-blue-500/75">75% opacity text</div>
<div class="bg-black/50">50% opacity bg</div>

<!-- Gradient -->
<div class="bg-gradient-to-r from-cyan-500 to-blue-500">Gradient</div>
<div class="bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500">3-color gradient</div>
```

## Borders

```html
<!-- Border Width -->
<div class="border">All sides (1px)</div>
<div class="border-2">All sides (2px)</div>
<div class="border-t">Top</div>
<div class="border-r">Right</div>
<div class="border-b">Bottom</div>
<div class="border-l">Left</div>
<div class="border-[3px]">Custom width</div>

<!-- Border Color -->
<div class="border border-blue-500">Blue border</div>
<div class="border border-[#ff00cc]">Custom color</div>

<!-- Border Style -->
<div class="border border-solid">Solid</div>
<div class="border border-dashed">Dashed</div>
<div class="border border-dotted">Dotted</div>
<div class="border border-double">Double</div>

<!-- Border Radius -->
<div class="rounded">Small radius (0.25rem)</div>
<div class="rounded-md">Medium radius (0.375rem)</div>
<div class="rounded-lg">Large radius (0.5rem)</div>
<div class="rounded-xl">Extra large radius (0.75rem)</div>
<div class="rounded-2xl">2xl radius (1rem)</div>
<div class="rounded-full">Full radius (9999px)</div>
<div class="rounded-[12px]">Custom radius</div>

<!-- Specific Corners -->
<div class="rounded-t-lg">Top corners</div>
<div class="rounded-r-lg">Right corners</div>
<div class="rounded-b-lg">Bottom corners</div>
<div class="rounded-l-lg">Left corners</div>
<div class="rounded-tl-lg">Top left corner</div>
<div class="rounded-tr-lg">Top right corner</div>
<div class="rounded-bl-lg">Bottom left corner</div>
<div class="rounded-br-lg">Bottom right corner</div>
```

## Effects & Filters

```html
<!-- Shadows -->
<div class="shadow-sm">Small shadow</div>
<div class="shadow">Default shadow</div>
<div class="shadow-md">Medium shadow</div>
<div class="shadow-lg">Large shadow</div>
<div class="shadow-xl">Extra large shadow</div>
<div class="shadow-2xl">2XL shadow</div>
<div class="shadow-inner">Inner shadow</div>
<div class="shadow-none">No shadow</div>

<!-- Opacity -->
<div class="opacity-0">Invisible</div>
<div class="opacity-50">50% opacity</div>
<div class="opacity-100">100% opacity</div>

<!-- Blur -->
<div class="blur-none">No blur</div>
<div class="blur-sm">Small blur</div>
<div class="blur">Default blur</div>
<div class="blur-xl">Extra large blur</div>

<!-- Other Filters -->
<div class="grayscale">Grayscale</div>
<div class="invert">Invert</div>
<div class="sepia">Sepia</div>
<div class="brightness-50">50% brightness</div>
<div class="contrast-125">125% contrast</div>
<div class="hue-rotate-90">90° hue rotate</div>
<div class="saturate-150">150% saturation</div>
```

## Transitions & Animations

```html
<!-- Transition -->
<div class="transition">Default transition</div>
<div class="transition-colors">Color transition</div>
<div class="transition-opacity">Opacity transition</div>
<div class="transition-transform">Transform transition</div>
<div class="transition-all">All transition</div>

<!-- Duration -->
<div class="duration-75">75ms</div>
<div class="duration-100">100ms</div>
<div class="duration-300">300ms</div>
<div class="duration-700">700ms</div>

<!-- Timing Function -->
<div class="ease-linear">Linear</div>
<div class="ease-in">Ease in</div>
<div class="ease-out">Ease out</div>
<div class="ease-in-out">Ease in out</div>

<!-- Animation -->
<div class="animate-spin">Spinning</div>
<div class="animate-ping">Ping</div>
<div class="animate-pulse">Pulsing</div>
<div class="animate-bounce">Bouncing</div>
```

## State Variants

```html
<!-- Hover -->
<div class="hover:bg-blue-700">Hover background</div>
<div class="hover:text-white">Hover text</div>

<!-- Focus -->
<input class="focus:ring focus:ring-blue-500">Focus ring</input>

<!-- Active -->
<button class="active:bg-green-700">Active state</button>

<!-- Disabled -->
<button class="disabled:opacity-50">Disabled state</button>

<!-- Group (parent state affects children) -->
<div class="group hover:bg-blue-100">
  <span class="group-hover:text-blue-500">Changes on parent hover</span>
</div>

<!-- Peer (sibling state affects element) -->
<input class="peer border" />
<p class="peer-focus:text-blue-500">Changes on sibling focus</p>

<!-- Dark Mode -->
<div class="dark:bg-gray-800 dark:text-white">Dark mode styles</div>
```

## Responsive Design

```html
<!-- Breakpoints -->
<div class="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6">
  <!-- Width changes at different breakpoints -->
</div>

<!-- Default breakpoints:
  sm: 640px and up
  md: 768px and up
  lg: 1024px and up
  xl: 1280px and up
  2xl: 1536px and up
-->

<!-- Only show on specific breakpoints -->
<div class="hidden md:block">Only on medium screens and up</div>
<div class="md:hidden">Only on small screens</div>

<!-- Container Queries -->
<div class="@container">
  <div class="flex flex-col @md:flex-row">
    <!-- Layout changes based on container width -->
  </div>
</div>
```

## Arbitrary Values

Use square brackets for custom values:

```html
<!-- Custom sizing -->
<div class="w-[762px] h-[398px]">Custom dimensions</div>

<!-- Custom colors -->
<div class="text-[#1a2b3c] bg-[rgb(255,0,127)]">Custom colors</div>

<!-- Custom spacing -->
<div class="p-[37px] m-[42px]">Custom spacing</div>

<!-- Custom transforms -->
<div class="rotate-[17deg] translate-x-[123px]">Custom transforms</div>
```

## Configuration (tailwind.config.js)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Files to scan for classes
  content: ["./src/**/*.{html,js,svelte,ts}"],
  
  // Dark mode setting
  darkMode: 'class', // 'media' or 'class'
  
  // Theme customization
  theme: {
    // Overrides default values
    screens: {
      sm: '480px',
      md: '768px',
      // ...
    },
    
    // Extends default values 
    extend: {
      colors: {
        'brand': {
          light: '#f7fafc',
          DEFAULT: '#1a202c',
          dark: '#0f172a',
        }
      },
      spacing: {
        '128': '32rem',
      }
    }
  },
  
  // Add custom plugins
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```