---
name: project-conventions
description: DreamCar project patterns, conventions, and architectural decisions
user-invocable: false
---

# DreamCar Project Conventions

## API Routes

- All API routes live in `src/app/api/` using Next.js App Router conventions
- Validate all request bodies with Zod schemas from `src/lib/schemas.ts` or `src/lib/api-schemas.ts`
- Return `NextResponse.json()` with appropriate status codes
- Use `try/catch` with structured error responses: `{ error: string }`

## OpenAI / Azure OpenAI

- Import `openai` (the lazy proxy) from `@/lib/openai` — never instantiate `new OpenAI()` directly
- Use `getModel()` from `@/lib/llmModels` to resolve model/deployment names
- The singleton handles Azure vs vanilla OpenAI transparently
- Check `isLLMConfigured()` before calling LLM endpoints to fail gracefully

## Database (Prisma)

- Import `prisma` from `@/lib/prisma` — singleton instance
- Schema lives in `prisma/schema.prisma`
- Use `cuid()` for IDs, `camelCase` for fields, `PascalCase` for models
- Always include `createdAt`/`updatedAt` on new models
- Run `prisma generate` after schema changes

## Validation

- Use Zod for all external input validation
- Coerce numeric inputs with `z.coerce.number()`
- Define schemas in `src/lib/schemas.ts` (form schemas) or `src/lib/api-schemas.ts` (API schemas)
- Export inferred types alongside schemas: `export type X = z.infer<typeof xSchema>`

## Components

- UI primitives in `src/components/ui/` (button, card, input, label, skeleton)
- Use `class-variance-authority` for component variants
- Use `cn()` from `@/lib/utils` for className merging (clsx + tailwind-merge)
- Icons from `lucide-react`

## Styling

- Tailwind CSS for all styling
- Global styles in `src/app/globals.css`
- Prefer Tailwind utilities over custom CSS

## Testing

- Tests mirror `src/` structure in `tests/`
- Use Vitest with `globals: true` (no need to import `describe`, `it`, `expect`)
- Use `_resetForTests()` helpers where singletons need clearing between tests
- Mock environment variables with `vi.stubEnv()`

## Caching

- Redis caching is optional — always handle the no-Redis case
- Use helpers from `@/lib/cache` for cache operations
- Cache keys should be deterministic (use `@/utils/hash` for content-based keys)
