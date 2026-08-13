Note that the project is not finished

# Tutor AI

Tutor AI is a notebook-based study workspace for learning from your own material. Users can
organize PDF sources into notebooks, label each source with topics, and ask an AI tutor questions
grounded in those files.

The application runs on Cloudflare Workers. It combines a TanStack Start frontend with a stateful
Cloudflare agent, D1 for application and chat data, and R2 for uploaded PDFs.

## Features

- GitHub sign-in with Better Auth but will have actual auth in the future
- Per-user notebooks and PDF source libraries
- User-defined source topics that help the tutor select relevant files
- Source-aware tutoring with tools that list and read notebook PDFs
- Persistent chat threads with generated titles, renaming, and deletion
- A choice of tutor models and reasoning levels
- Resizable source, chat, and study-tool panels

The Exam, Quiz, and Flashcards controls in the Studio panel are currently placeholders for future
study tools.

## Architecture

| Area              | Implementation                                               |
| ----------------- | ------------------------------------------------------------ |
| Web application   | React 19, TanStack Start, TanStack Router, and Vite          |
| UI                | Tailwind CSS and shadcn/ui components                        |
| Tutor             | Cloudflare Agents SDK and `@cloudflare/think`                |
| Model access      | Vercel AI Gateway through the AI SDK                         |
| Authentication    | Better Auth with GitHub OAuth                                |
| Relational data   | Cloudflare D1 with Drizzle ORM                               |
| File storage      | Cloudflare R2                                                |
| Stateful sessions | Cloudflare Durable Objects with chat history persisted to D1 |

Each chat addresses a `TutorAgent` by notebook and session ID. When a question depends on the
notebook material, the agent first lists the available sources, uses filenames and topics to find
the relevant PDFs, and then reads those files before answering.

## Local development

### Prerequisites

- Node.js and pnpm 11
- A GitHub OAuth app
- A Vercel AI Gateway API key

For local authentication, configure the GitHub OAuth callback URL as:

```text
http://localhost:3000/api/auth/callback/github
```

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env.local` with the application secrets:

   ```dotenv
   BETTER_AUTH_URL=http://localhost:3000
   BETTER_AUTH_SECRET=replace-with-a-long-random-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   AI_GATEWAY_API_KEY=your-ai-gateway-api-key
   ```

3. Apply the D1 migrations to the local database:

   ```bash
   pnpm db:migrate
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

The app is available at [http://localhost:3000](http://localhost:3000). Wrangler keeps local D1,
R2, and Durable Object state under `.wrangler/`.

## Commands

| Command                  | Purpose                                               |
| ------------------------ | ----------------------------------------------------- |
| `pnpm dev`               | Start the local development server on port 3000       |
| `pnpm build`             | Create a production build                             |
| `pnpm preview`           | Preview the production build locally                  |
| `pnpm test`              | Run the Vitest test suite                             |
| `pnpm check`             | Run formatting, linting, and type checks              |
| `pnpm db:generate`       | Generate a Drizzle migration from schema changes      |
| `pnpm db:migrate`        | Apply D1 migrations locally                           |
| `pnpm db:migrate:remote` | Apply D1 migrations to the configured remote database |
| `pnpm db:studio`         | Open Drizzle Studio                                   |
| `pnpm deploy`            | Build and deploy the Worker with Wrangler             |

## Deployment

The Worker configuration is in [`wrangler.toml`](./wrangler.toml). Before deploying your own
instance:

1. Create a D1 database and R2 bucket in your Cloudflare account.
2. Update the D1 database ID and resource names in `wrangler.toml`.
3. Configure the environment variables from `.env.local` for the deployed Worker. Set
   `BETTER_AUTH_URL` to the production application URL and update the GitHub OAuth callback URL to
   match.
4. Apply the remote migrations with `pnpm db:migrate:remote`.
5. Run `pnpm deploy`.

The `TutorAgent` Durable Object binding and its initial SQLite migration are already declared in
`wrangler.toml`.

## Project structure

```text
src/
├── components/              Shared shadcn/ui and AI interface components
├── db/                      Drizzle schemas for auth, notebooks, files, and chats
├── lib/                     Auth, server functions, models, and session persistence
├── routes/                  TanStack Router pages and API routes
│   └── agents/              Tutor agent and notebook-file tools
└── server.ts                Cloudflare Worker entry point
drizzle/                     Versioned D1 migrations
wrangler.toml                Worker bindings and deployment configuration
```

## Technology

- [TanStack Start](https://tanstack.com/start)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare Agents](https://developers.cloudflare.com/agents/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Better Auth](https://www.better-auth.com/)
- [AI SDK](https://ai-sdk.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
