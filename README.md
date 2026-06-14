# Family Gym Tracker

Aplicação web **mobile-first** (PWA) para acompanhamento de treinos de academia,
com múltiplos perfis de usuário (estilo Netflix), histórico de cargas, gráficos de
evolução, timer de descanso e progressão inteligente.

Stack: **React + TypeScript + Vite + SCSS + React Router + React Query + Zustand + Recharts**, backend **Supabase (PostgreSQL)**.

---

## 1. Pré-requisitos

- Node.js 18+ e npm
- Uma conta gratuita no [Supabase](https://supabase.com)

## 2. Configurar o Supabase

1. Crie um projeto novo em https://supabase.com.
2. Abra **SQL Editor** e cole/rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
   Isso cria as tabelas, índices, o usuário **Admin** (já vem criado) e as policies de acesso.
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

Abra o endereço que o Vite imprimir (ex.: http://localhost:5173).
Se o `.env` não estiver configurado, o app mostra uma tela de setup explicando o que falta.

## 4. Senhas

O app **não guarda as senhas em texto puro** — apenas o hash SHA-256 (em `src/lib/crypto.ts`)
é comparado no cliente.

- **Senha de acesso da família** (primeira tela, obrigatória): `Family123@`
- **Senha do Admin** (perfil que pode ver/editar tudo): `AdministratorAccess3103@`

Para trocar uma senha, gere o novo hash e substitua a constante correspondente:

```bash
node -e "console.log(require('crypto').createHash('sha256').update('NOVA_SENHA').digest('hex'))"
```

## 5. Fluxo do app

1. **Portão de senha** — sem a senha da família, o app não abre.
2. **Seleção de perfil** — escolha um perfil ou crie um novo (CRUD completo de perfis).
   O perfil **Admin** pede a senha de admin.
3. **App do usuário** — dashboard, treinos, histórico e estatísticas, isolados por perfil.

## 6. Funcionalidades

- Dias de treino (CRUD) + duplicação de treino
- Exercícios com carga, descanso personalizado e observações
- Checkbox de conclusão com persistência da sessão (localStorage) e reset rápido
- Ao concluir todos os exercícios → registra uma execução e alimenta os gráficos
- Timer de descanso por exercício (play/pause/restart, ±15s, som + vibração + destaque)
- Histórico de cargas + gráficos de evolução (Recharts)
- Dashboard (próximo treino, treinos no mês, maior evolução, tempo estimado, sequência)
- Estatísticas (volume total, mais executado, dias seguidos)
- Progressão inteligente (sugere aumentar a carga após 3 execuções iguais)
- Biblioteca de exercícios favoritos
- Exportação JSON / CSV
- PWA instalável (manifest + service worker)

## 7. Deploy na Vercel

1. Suba o projeto num repositório Git.
2. Na Vercel, importe o repo (framework detectado: **Vite**).
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Build command `npm run build`, output `dist`. Deploy.

## 8. Estrutura

```
src/
  components/   # UI reutilizável (Modal, Timer, Chart, ExerciseCard, nav...)
  hooks/        # React Query (users, workouts, exercises, sessions, history, library)
  lib/          # supabase, api (repositório), crypto, stats, export, queryClient
  pages/        # Gate, Profiles, Dashboard, Workouts, WorkoutDetail, History, Stats
  store/        # Zustand (auth, sessão de treino, toast)
  styles/       # SCSS (tokens da paleta, mixins, global, componentes)
supabase/schema.sql
```

## Observação de segurança

Este app usa um **portão de senha compartilhado no cliente** (não usa Supabase Auth).
Para uso familiar com a `anon key`, as policies liberam leitura/escrita via `anon`.
Para maior isolamento, ajuste as RLS policies em `supabase/schema.sql`.
