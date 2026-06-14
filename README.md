# Gym Tracker

Aplicação web **mobile-first** (PWA) para acompanhamento de treinos de academia,
com múltiplos perfis de usuário (estilo Netflix), histórico de cargas, gráficos de
evolução, timer de descanso, progressão inteligente e um **painel de administrador**.

Stack: **React + TypeScript + Vite + SCSS + React Router + React Query + Zustand + Recharts**, backend **Supabase (PostgreSQL)**.

---

## 1. Pré-requisitos

- Node.js 18+ e npm
- Uma conta gratuita no [Supabase](https://supabase.com)

## 2. Configurar o Supabase

1. Crie um projeto novo em https://supabase.com.
2. Abra **SQL Editor** e rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
   Isso cria as tabelas, índices, o usuário **Admin** (já vem criado), a tabela
   `app_settings` (onde ficam os hashes das senhas) e as policies de acesso.
   O script é **idempotente** — pode ser executado de novo sem apagar dados.
3. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.

## 3. Configurar o projeto

```bash
cp .env.example .env
# edite .env e preencha:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

npm install
npm run dev
```

Se o `.env` não estiver configurado, o app mostra uma tela de setup explicando o que falta.

## 4. Senhas

O app **não guarda as senhas em texto puro** — apenas o hash SHA-256 é comparado.
Os hashes ficam na tabela `app_settings` (com fallback para os valores padrão em
`src/lib/crypto.ts`).

- **Senha de acesso** (primeira tela, obrigatória): `Family123@`
- **Senha do Admin**: `AdministratorAccess3103@`

As duas podem ser **alteradas dentro do app** pelo Admin (ver abaixo). Para trocar via
código/migração, gere o hash com:

```bash
node -e "console.log(require('crypto').createHash('sha256').update('NOVA_SENHA').digest('hex'))"
```

Em todos os campos de senha há um botão de **mostrar/ocultar** (ícone de olho).

## 5. Fluxo do app

1. **Tela de senha** — sem a senha, o app não abre.
2. **Seleção de perfil** — escolha um perfil ou crie um novo (CRUD completo).
   O perfil **Admin** pede a senha de admin.
3. **App do usuário** — dashboard, treinos, histórico e estatísticas, isolados por perfil.

## 6. Painel de administrador

Ao entrar como **Admin**, aparece um botão de escudo no dashboard que leva ao painel
(`/app/admin`), onde o admin pode:

- **Ver e editar os dados de qualquer perfil** — o botão "Ver dados" entra no perfil
  escolhido (mantendo o modo admin) e dá acesso total aos treinos, exercícios e histórico daquele usuário.
- Criar, editar e excluir usuários.
- **Alterar a senha da aplicação** (a senha da tela inicial).
- **Alterar a senha do administrador**.

## 7. Funcionalidades

- Dias de treino (CRUD) + duplicação de treino
- Exercícios com carga, descanso personalizado e observações
- Checkbox de conclusão com persistência da sessão (localStorage) e reset rápido
- Ao concluir todos os exercícios → registra uma execução e alimenta os gráficos
- Timer de descanso por exercício (play/pause/restart, ±15s, som + vibração + destaque)
- Histórico de treinos realizados (data/hora) + gráficos de evolução de carga (Recharts)
- Dashboard, estatísticas, progressão inteligente, biblioteca de favoritos
- Exportação JSON / CSV
- PWA instalável (manifest + service worker)

## 8. Deploy na Vercel

O projeto já inclui [`vercel.json`](vercel.json) com os rewrites de SPA.

1. Suba o projeto num repositório Git.
2. Na Vercel, importe o repo (framework detectado: **Vite**).
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Deploy. (Build `npm run build`, output `dist` — já definidos no `vercel.json`.)

## 9. Estrutura

```
src/
  components/   # UI reutilizável (Modal, Timer, Chart, ExerciseCard, PasswordInput, nav...)
  hooks/        # React Query (users, workouts, exercises, sessions, history, library, settings)
  lib/          # supabase, api (repositório), crypto, stats, export, queryClient
  pages/        # Gate, Profiles, Dashboard, Workouts, WorkoutDetail, History, Stats, Admin
  store/        # Zustand (auth, sessão de treino, toast)
  styles/       # SCSS (tokens da paleta, mixins, global, componentes)
supabase/schema.sql
vercel.json
```

## Observação de segurança

Este app usa um **portão de senha compartilhado no cliente** (não usa Supabase Auth).
Para uso familiar com a `anon key`, as policies liberam leitura/escrita via `anon`.
Para maior isolamento, ajuste as RLS policies em `supabase/schema.sql`.
