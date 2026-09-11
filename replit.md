# BARBER APP

Aplicativo mobile-first para barbeiros organizarem a rotina da barbearia com menos esforço.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/barber-app/app/` — rotas Expo Router para autenticação, configuração inicial, dashboard, agenda, clientes e configurações.
- `artifacts/barber-app/contexts/AppContext.tsx` — estado persistido localmente para o bootstrap do produto.
- `artifacts/barber-app/constants/colors.ts` — tokens visuais da identidade escura do BARBER APP.
- `artifacts/barber-app/assets/images/icon.png` — ícone da aplicação.
- `artifacts/api-server/` — API compartilhada preparada para as próximas etapas de persistência no servidor.

## Architecture decisions

- Expo Router organiza as telas por grupos de autenticação, configuração inicial e áreas principais.
- Clerk é o provedor de autenticação; o fluxo nativo usa telas próprias compatíveis com Expo Go.
- O primeiro bootstrap usa AsyncStorage para manter a configuração da barbearia e os agendamentos entre sessões, sem dados de demonstração.
- A agenda já possui uma entrada manual funcional e está preparada para migrar a mesma regra de disponibilidade para o backend.

## Product

O produto começa com cadastro/login, configuração da barbearia, dashboard diário, agenda, criação de agendamento, clientes e configurações de serviços/horário. A experiência usa uma linguagem escura, objetiva e premium, com foco em uso rápido no celular.

## User preferences

- O usuário quer um produto real e evolutivo, não uma demonstração visual descartável.
- A prioridade de experiência é bonito, simples e rápido, evitando aparência de sistema administrativo antigo.

## Gotchas

- O fluxo Expo injeta `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` no comando do workflow; não hardcode chaves no código.
- O preview web mostra o fluxo de autenticação; para validar o comportamento nativo, usar o preview no celular via Expo Go.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
