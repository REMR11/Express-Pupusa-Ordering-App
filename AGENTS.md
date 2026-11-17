<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# mcp-parte-01

Demo de checkout móvil para pedir pupusas sin cuenta y retirar en el comal. Interfaz en español, un solo flujo (armar pedido → datos → confirmación), sin backend ni persistencia: el pedido solo vive en estado de React y el modal de confirmación es simulado.

El nombre `mcp-parte-01` viene de la serie de talleres; **no hay servidor MCP implementado en este repo**. Lo relacionado a MCP vive en la configuración de opencode (servidor `stitch` en `opencode.jsonc`).

## Stack

- Next.js 16.4.6 (App Router) + React 19.3, TypeScript estricto, ESM.
- Tailwind CSS 4.3 vía el loader `@tailwindcss/turbopack` (configurado en `next.config.ts`, sin `postcss.config`).
- Fuentes: Epilogue (headlines) y Plus Jakarta Sans (body) con `next/font/google`.
- Iconos: Material Symbols Outlined (cargados por `@import` en `globals.css`).

## Estructura

- `src/app/page.tsx` — server component; solo pasa `PUPUSAS` a la vista.
- `src/components/checkout/checkout-view.tsx` — componente cliente con todo el estado del pedido.
- `src/components/checkout/*.tsx` — piezas de UI (`pupusa-card`, `customer-form`, `cart-bar`, `confirmation-modal`, `radio-group`, `static-sections`, `ui`).
- `src/lib/checkout.ts` — dominio puro: tipos, catálogo `PUPUSAS`, opciones, totales, horarios, validación y formato. La lógica nueva va aquí, no en componentes.
- `src/lib/checkout.test.mts` — tests de esa lógica.
- `src/app/globals.css` — tokens de tema Material 3 (`--color-*`, `--font-*`, `--spacing-*`) en `@theme`; usar esos tokens (`bg-surface`, `text-on-surface-variant`, `gap-space-md`), no colores sueltos.

## Comandos

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run lint     # eslint (flat config, eslint-config-next)
node --test src/lib/checkout.test.mts   # tests (node:test nativo, Node >= 22)
```

No hay script `test` en `package.json`; el comando de arriba es el real.

## Convenciones

- Precios siempre en **centavos** (`priceCents`) y formateados con `money()`; dinero con enteros, nunca floats.
- Fechas/horas con `Intl` (`es-SV`) en `src/lib/checkout.ts`.
- Textos de UI en español; mobile-first, ancho máximo `max-w-lg`.
- Mantener accesibilidad: labels/`htmlFor`, `aria-invalid`, `aria-describedby`, focus visible, botones con `aria-label`, skip link.
- `next.config.ts` ya habilita `cacheComponents`, `partialPrefetching` y Turbopack. Imágenes remotas permitidas solo desde `lh3.googleusercontent.com`; si agregas otro host, añádelo a `images.remotePatterns`.
- Al tocar lógica de `src/lib/checkout.ts`, actualizar/extender `checkout.test.mts`.

## Notas del entorno

- El plugin `.opencode/plugin/block-secrets.ts` bloquea leer `.env*` y `opencode.jsonc` (por read/grep/bash). No intentes leerlos; pide los valores al usuario si hacen falta.
- `.agents/skills/web-design-guidelines` (de vercel-labs) está instalado vía `skills-lock.json` para revisar UI/accesibilidad.
