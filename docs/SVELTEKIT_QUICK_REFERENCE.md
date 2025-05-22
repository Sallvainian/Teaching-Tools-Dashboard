# SvelteKit Quick Reference

## Project Setup

```bash
npx sv create my-app
cd my-app
npm install
npm run dev            # Start dev server (http://localhost:5173)
npm run build          # Build for production
npm run preview        # Preview the build
```

## File Structure

```
src/
├── lib/                # Shared code (importable via $lib)
│   ├── components/     # Reusable components
│   └── server/         # Server-only code
├── routes/             # File-based routing
│   ├── +page.svelte    # Root page component
│   ├── +page.js        # Universal load function
│   ├── +page.server.js # Server-only load function
│   ├── +layout.svelte  # Root layout component
│   ├── +layout.js      # Universal layout load function
│   ├── +error.svelte   # Error component
│   └── +server.js      # API endpoint
└── app.html            # HTML template
```

## Routing

### Basic Pages

```
/                   → src/routes/+page.svelte
/about              → src/routes/about/+page.svelte
/settings/profile   → src/routes/settings/profile/+page.svelte
```

### Dynamic Routes

```
/blog/hello-world   → src/routes/blog/[slug]/+page.svelte
/product/123        → src/routes/product/[id]/+page.svelte
```

### Route Groups

```
/admin/users        → src/routes/(admin)/users/+page.svelte
/admin/settings     → src/routes/(admin)/settings/+page.svelte
```

### REST Endpoints

```
GET /api/users      → src/routes/api/users/+server.js (export function GET)
POST /api/users     → src/routes/api/users/+server.js (export function POST)
```

## Data Loading

### Universal Load (Client & Server)

```js
// src/routes/products/[id]/+page.js
/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch }) {
  const res = await fetch(`/api/products/${params.id}`);
  return { product: await res.json() };
}
```

### Server-Only Load

```js
// src/routes/products/[id]/+page.server.js
import * as db from '$lib/server/database';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  return { product: await db.getProduct(params.id) };
}
```

### Accessing Load Data in Component

```svelte
<!-- src/routes/products/[id]/+page.svelte -->
<script>
  /** @type {import('./$types').PageProps} */
  let { data } = $props();
</script>

<h1>{data.product.name}</h1>
<p>{data.product.description}</p>
```

### Accessing Parent Data

```js
/** @type {import('./$types').PageLoad} */
export async function load({ parent }) {
  const parentData = await parent();
  return { 
    // Use parentData here
  };
}
```

## Forms and Actions

### Defining Form Actions

```js
// src/routes/login/+page.server.js
import { fail, redirect } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username');
    const password = data.get('password');
    
    // Validation and authentication
    if (/* invalid */) {
      return fail(400, { error: 'Invalid credentials' });
    }
    
    // Success
    cookies.set('sessionid', 'value');
    redirect(303, '/dashboard');
  }
};
```

### Using Forms in Components

```svelte
<script>
  import { enhance } from '$app/forms';
  /** @type {import('./$types').PageProps} */
  let { form } = $props();
</script>

<form method="POST" use:enhance>
  <input name="username">
  <input name="password" type="password">
  <button>Login</button>
  
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
</form>
```

## API Routes

### GET Endpoint

```js
// src/routes/api/products/+server.js
import { json } from '@sveltejs/kit';
import * as db from '$lib/server/database';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const limit = Number(url.searchParams.get('limit') || '10');
  const products = await db.getProducts(limit);
  return json(products);
}
```

### POST Endpoint

```js
// src/routes/api/products/+server.js
import { json } from '@sveltejs/kit';
import * as db from '$lib/server/database';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  const product = await request.json();
  const id = await db.createProduct(product);
  return json({ id }, { status: 201 });
}
```

## Environment Variables

```js
// Public (client & server)
import { PUBLIC_API_URL } from '$env/static/public';

// Private (server only)
import { DATABASE_URL } from '$env/static/private';

// Dynamic public (runtime)
import { env } from '$env/dynamic/public';
console.log(env.PUBLIC_RUNTIME_VAR);

// Dynamic private (runtime)
import { env } from '$env/dynamic/private';
console.log(env.RUNTIME_VAR);
```

## Layouts

### Basic Layout

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  let { children } = $props();
</script>

<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
</nav>

<main>
  {@render children()}
</main>

<footer>© 2025</footer>
```

### Layout with Data

```js
// src/routes/+layout.js
/** @type {import('./$types').LayoutLoad} */
export function load() {
  return { user: { name: 'Alice' } };
}
```

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  /** @type {import('./$types').LayoutProps} */
  let { data, children } = $props();
</script>

<header>Hello, {data.user.name}</header>
{@render children()}
```

## Server Hooks

```js
// src/hooks.server.js
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  // Before response
  const sessionid = event.cookies.get('sessionid');
  event.locals.user = sessionid ? await getUser(sessionid) : null;

  // Generate response
  const response = await resolve(event);

  // After response
  response.headers.set('x-processed-by', 'sveltekit');

  return response;
}
```

## Error Handling

### Expected Errors

```js
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export function load({ params }) {
  if (!validId(params.id)) {
    error(400, 'Invalid ID format');
  }
  
  const product = getProduct(params.id);
  if (!product) {
    error(404, 'Product not found');
  }
  
  return { product };
}
```

### Custom Error Page

```svelte
<!-- src/routes/+error.svelte -->
<script>
  import { page } from '$app/state';
</script>

<h1>Error {page.status}</h1>
<p>{page.error.message}</p>
```

## TypeScript Support

```ts
// Type import example for a page component
<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>
```

## Deployment Configuration

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    // Other options...
  }
};

export default config;
```

## Common Adapters

- `@sveltejs/adapter-auto`: Auto-detect environment
- `@sveltejs/adapter-node`: Node.js server
- `@sveltejs/adapter-static`: Static site generation
- `@sveltejs/adapter-vercel`: Vercel deployment
- `@sveltejs/adapter-netlify`: Netlify deployment
- `@sveltejs/adapter-cloudflare`: Cloudflare Pages