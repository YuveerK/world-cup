# React + Vite Frontend Architecture Guide

**Project context:** This guide is tailored for a React/Vite-style frontend like your current predictions application. The uploaded `PredictionsPage` file currently contains one large page component plus many nested UI sections such as authentication, summary cards, winner picker, match controls, prediction cards, score inputs, account profile, account security, and account deletion. The goal is to move from a large page file into a maintainable, feature-first architecture.

**Recommended default:** Use a **feature-first architecture** with a small `app/` layer for bootstrapping, shared reusable UI in `components/`, business/domain functionality in `features/`, and framework-agnostic helpers in `lib/`.

---

## 1. Main goals

A good folder structure should make the codebase easier to:

1. Find: developers should know where a file belongs without guessing.
2. Change: editing one feature should not require touching unrelated folders.
3. Test: business logic, formatting, validation, and UI behavior should be testable in isolation.
4. Scale: adding features should not turn `pages/`, `components/`, or `utils/` into dumping grounds.
5. Review: pull requests should show clearly what feature or layer changed.
6. Refactor: large components should be split without changing behavior.

---

## 2. Architecture summary

Use these boundaries:

| Layer | Purpose | Examples |
|---|---|---|
| `app/` | Application bootstrap and global providers | router, query client, auth provider, app shell |
| `features/` | Business/domain features | predictions, auth, leaderboard, account, matches |
| `components/` | Truly reusable UI components | Button, Input, EmptyState, LoadingPanel, Modal |
| `lib/` | Shared framework-agnostic utilities | API client, date formatting, error helpers, storage |
| `routes/` or feature `pages/` | Route-level page components | PredictionsPage, LoginPage, LeaderboardPage |
| `types/` | Global/shared TypeScript types only | ApiError, PaginatedResponse, ID |
| `test/` | Test setup and shared test utilities | renderWithProviders, mock server handlers |

### Key rule

Do not split by technical type first, like this:

```txt
src/
  components/
  hooks/
  services/
  utils/
  types/
```

That layout looks clean at the beginning, but in a real app it often becomes hard to know which hook, service, type, and component belong together.

Prefer this:

```txt
src/
  features/
    predictions/
      components/
      hooks/
      api/
      utils/
      types.ts
```

This keeps feature-related code close together.

---

## 3. Recommended root structure

For a single Vite frontend app:

```txt
prediction-league/
  public/
    favicon.svg
    robots.txt

  src/
    app/
    assets/
    components/
    features/
    lib/
    routes/
    styles/
    test/
    types/

    main.tsx
    vite-env.d.ts

  .env.example
  .gitignore
  eslint.config.js
  index.html
  package.json
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  vite.config.ts
  vitest.config.ts
```

### Root file purposes

| File/folder | Purpose |
|---|---|
| `public/` | Static files served directly. Do not import from here in React components. |
| `src/` | All application source code. |
| `src/main.tsx` | React entry point. Keep it tiny. |
| `index.html` | Vite HTML entry point. |
| `vite.config.ts` | Vite build/dev/test-adjacent config. |
| `vitest.config.ts` | Test config if you keep it separate from `vite.config.ts`. |
| `eslint.config.js` | Flat ESLint config. |
| `.env.example` | Safe example env vars. Never include secrets. |

---

## 4. Recommended `src/` structure

```txt
src/
  app/
    App.tsx
    providers/
      AppProviders.tsx
      QueryProvider.tsx
      RouterProvider.tsx
    router/
      router.tsx
      routePaths.ts
    config/
      env.ts
    layout/
      AppLayout.tsx
      Sidebar.tsx
      Header.tsx

  assets/
    images/
    icons/

  components/
    ui/
      Button/
        Button.tsx
        Button.test.tsx
        index.ts
      Input/
        Input.tsx
        Input.test.tsx
        index.ts
      Select/
        Select.tsx
        index.ts
      Badge/
        Badge.tsx
        index.ts
    feedback/
      EmptyState.tsx
      LoadingPanel.tsx
      LoadingRows.tsx
      ErrorState.tsx
    data-display/
      StatCard.tsx
      ScoreBadge.tsx
    layout/
      Panel.tsx
      PageHeader.tsx

  features/
    auth/
    predictions/
    matches/
    leaderboard/
    account/

  lib/
    api/
      apiClient.ts
      apiErrors.ts
      http.ts
    date/
      formatDate.ts
      formatTime.ts
    storage/
      storage.ts
    utils/
      cn.ts
      number.ts

  routes/
    HomeRoute.tsx
    PredictionsRoute.tsx
    LeaderboardRoute.tsx
    NotFoundRoute.tsx

  styles/
    globals.css
    tailwind.css

  test/
    setupTests.ts
    renderWithProviders.tsx
    fixtures/
      matches.ts
      users.ts

  types/
    api.ts
    common.ts
```

---

## 5. Feature folder structure

Each feature should own its components, hooks, API calls, types, validation, constants, and utilities.

Recommended feature template:

```txt
features/
  feature-name/
    api/
      featureApi.ts
      featureKeys.ts
    components/
      FeatureCard/
        FeatureCard.tsx
        FeatureCard.test.tsx
        index.ts
    hooks/
      useFeature.ts
    pages/
      FeaturePage.tsx
    schemas/
      featureSchema.ts
    utils/
      featureFormatters.ts
      featureSelectors.ts
    constants.ts
    types.ts
    index.ts
```

### What belongs in each subfolder?

| Folder/file | Use it for |
|---|---|
| `api/` | HTTP calls, query keys, mutation functions, server-state helpers. |
| `components/` | UI pieces that belong mainly to this feature. |
| `hooks/` | Feature-specific hooks that coordinate state, queries, and actions. |
| `pages/` | Route-level feature pages. These should mostly compose components. |
| `schemas/` | Validation schemas, form schemas, API response parsing schemas. |
| `utils/` | Pure helper functions related only to this feature. |
| `constants.ts` | Feature constants such as statuses, labels, tabs, limits. |
| `types.ts` | Feature-specific TypeScript types. |
| `index.ts` | Public exports for the feature. |

---

## 6. Recommended structure for your current predictions page

Your current page can be split like this:

```txt
src/
  features/
    predictions/
      pages/
        PredictionsPage.tsx

      components/
        PredictionsShell/
          PredictionsShell.tsx
          index.ts

        SummaryStrip/
          SummaryStrip.tsx
          SummaryCard.tsx
          index.ts

        WinnerPicker/
          WinnerPicker.tsx
          WinnerPicker.test.tsx
          index.ts

        MatchControls/
          MatchControls.tsx
          MatchControls.test.tsx
          index.ts

        PredictionCard/
          PredictionCard.tsx
          PredictionCard.test.tsx
          ScoreInputGroup.tsx
          TeamBlock.tsx
          PredictionPoints.tsx
          PredictionSummary.tsx
          index.ts

      hooks/
        usePredictionsPage.ts
        usePredictionDrafts.ts
        usePredictionFilters.ts
        useWinnerPick.ts

      api/
        predictionsApi.ts
        predictionsQueries.ts
        predictionsKeys.ts

      utils/
        predictionScoring.ts
        predictionDisplay.ts
        matchSorting.ts
        matchStatus.ts

      constants.ts
      types.ts
      index.ts

    auth/
      components/
        AuthCard/
          AuthCard.tsx
          index.ts
      hooks/
        useAuthForm.ts
      api/
        authApi.ts
      types.ts
      index.ts

    account/
      components/
        AccountProfilePanel/
          AccountProfilePanel.tsx
          index.ts
        AccountSecurityPanel/
          AccountSecurityPanel.tsx
          index.ts
        AccountDangerPanel/
          AccountDangerPanel.tsx
          index.ts
      hooks/
        useAccountForms.ts
      api/
        accountApi.ts
      types.ts
      index.ts

    leaderboard/
      components/
        LeaderboardPanel/
          LeaderboardPanel.tsx
          index.ts
      api/
        leaderboardApi.ts
        leaderboardQueries.ts
      types.ts
      index.ts

    matches/
      components/
        Flag/
          Flag.tsx
          index.ts
        MatchScoreBadge/
          MatchScoreBadge.tsx
          index.ts
      utils/
        matchFormatters.ts
        matchStatus.ts
      types.ts
      index.ts
```

### Why this split works

| Current concern | New home |
|---|---|
| `PredictionsPage` layout | `features/predictions/pages/PredictionsPage.tsx` |
| `UnauthedView` | `features/auth/components/AuthCard/AuthCard.tsx` or `features/predictions/components/PredictionsGuestView/` |
| `SummaryStrip` | `features/predictions/components/SummaryStrip/` |
| `WinnerPicker` | `features/predictions/components/WinnerPicker/` |
| `MatchControls` | `features/predictions/components/MatchControls/` |
| `PredictionCard` | `features/predictions/components/PredictionCard/` |
| `TeamBlock`, `ScoreInputGroup` | subcomponents inside `PredictionCard/` unless reused elsewhere |
| `AccountProfilePanel` | `features/account/components/AccountProfilePanel/` |
| `AccountSecurityPanel` | `features/account/components/AccountSecurityPanel/` |
| `AccountDangerPanel` | `features/account/components/AccountDangerPanel/` |
| `Flag` | `features/matches/components/Flag/` if football/match-specific; `components/ui/Flag/` only if generic |
| `formatDate`, `formatTime` | `lib/date/` if generic; feature utils if match-specific |
| `displayStatus`, `scoreText` | `features/matches/utils/` or `features/predictions/utils/` |

---

## 7. A cleaner `PredictionsPage.tsx`

The route/page component should become a composition layer. It should not contain all rendering details, API logic, sorting logic, form logic, and account logic.

Example:

```tsx
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { AccountDangerPanel } from '@/features/account';
import { AuthCard } from '@/features/auth';
import { LeaderboardPanel } from '@/features/leaderboard';
import {
  MatchControls,
  PredictionCard,
  SummaryStrip,
  WinnerPicker,
  usePredictionsPage,
} from '@/features/predictions';

export function PredictionsPage() {
  const vm = usePredictionsPage();

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
      <section className="space-y-6">
        {vm.notice}

        {!vm.isAuthed ? (
          <AuthCard {...vm.auth} />
        ) : (
          <>
            <SummaryStrip {...vm.summary} />
            <WinnerPicker {...vm.winnerPicker} />
            <MatchControls {...vm.controls} />

            {vm.loading ? (
              <LoadingPanel label="Loading fixtures" />
            ) : vm.visibleFixtures.length ? (
              <div className="grid gap-4">
                {vm.visibleFixtures.map((match) => (
                  <PredictionCard
                    key={match.id}
                    match={match}
                    draft={vm.getDraft(match.id)}
                    prediction={vm.getPrediction(match.id)}
                    points={vm.getPoints(match.id)}
                    saving={vm.isSavingMatch(match.id)}
                    onDraftChange={vm.updateDraft}
                    onSave={vm.savePrediction}
                    onViewStats={vm.onViewStats}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No matches found" detail="Adjust the search or status filter." />
            )}
          </>
        )}
      </section>

      <aside className="space-y-6">
        {/* sidebar components */}
        {vm.isAuthed && <AccountDangerPanel {...vm.accountDanger} />}
        <LeaderboardPanel {...vm.leaderboardPanel} />
      </aside>
    </main>
  );
}
```

The page becomes easier to read because `usePredictionsPage()` prepares the view model, and the page mostly describes the layout.

---

## 8. Component file structure patterns

For simple components:

```txt
components/
  feedback/
    EmptyState.tsx
    LoadingPanel.tsx
```

For components with tests, subcomponents, styles, or stories:

```txt
PredictionCard/
  PredictionCard.tsx
  PredictionCard.test.tsx
  PredictionCard.stories.tsx
  PredictionPoints.tsx
  PredictionSummary.tsx
  ScoreInputGroup.tsx
  TeamBlock.tsx
  index.ts
```

### Recommended component rules

1. One main component per file.
2. Keep tiny helper subcomponents in the same folder, not necessarily the same file.
3. Keep feature-specific components inside the feature.
4. Only move components to `src/components/` after they are reused by more than one feature.
5. Avoid huge barrel files that export everything from the entire app.
6. Use local `index.ts` files for component folders to keep imports clean.

Example:

```ts
// features/predictions/components/PredictionCard/index.ts
export { PredictionCard } from './PredictionCard';
```

Then import like:

```ts
import { PredictionCard } from '@/features/predictions/components/PredictionCard';
```

Or expose it through the feature public API:

```ts
// features/predictions/index.ts
export { PredictionCard } from './components/PredictionCard';
export { MatchControls } from './components/MatchControls';
export { WinnerPicker } from './components/WinnerPicker';
export { usePredictionsPage } from './hooks/usePredictionsPage';
```

---

## 9. Public API rule for feature folders

Each feature should decide what other features are allowed to import.

Recommended:

```txt
features/predictions/index.ts
```

```ts
export { PredictionsPage } from './pages/PredictionsPage';
export { PredictionCard } from './components/PredictionCard';
export { usePredictionsPage } from './hooks/usePredictionsPage';
export type { Prediction, PredictionDraft, PredictionPoints } from './types';
```

Other features should import from the feature entry point where possible:

```ts
import { PredictionCard } from '@/features/predictions';
```

Avoid this from outside the feature:

```ts
import { calculatePredictionPoints } from '@/features/predictions/utils/internal/scoring/privateScoringHelper';
```

### Why

This prevents unrelated areas of the app from depending on internal implementation details. It makes refactors safer because you can rearrange internal files without breaking the rest of the app.

---

## 10. Naming conventions

| Item | Convention | Example |
|---|---|---|
| Components | `PascalCase.tsx` | `PredictionCard.tsx` |
| Hooks | `useSomething.ts` | `usePredictionDrafts.ts` |
| Types | `types.ts` or `*.types.ts` | `types.ts`, `prediction.types.ts` |
| Constants | `constants.ts` | `constants.ts` |
| Utilities | `camelCase.ts` or domain name | `matchStatus.ts`, `predictionScoring.ts` |
| Tests | `*.test.ts` / `*.test.tsx` | `PredictionCard.test.tsx` |
| Test fixtures | `*.fixture.ts` or plural nouns | `matches.ts`, `users.ts` |
| API modules | `featureApi.ts` | `predictionsApi.ts` |
| Query modules | `featureQueries.ts` | `predictionsQueries.ts` |
| Query keys | `featureKeys.ts` | `predictionsKeys.ts` |

Recommended file naming for your app:

```txt
prediction.types.ts      # domain types
prediction.schema.ts     # validation schema
predictionScoring.ts     # pure scoring logic
predictionDisplay.ts     # labels/text shown in UI
predictionsApi.ts        # HTTP functions
predictionsQueries.ts    # useQuery/useMutation hooks
predictionsKeys.ts       # query key factory
```

---

## 11. Import aliases

Use path aliases to avoid long relative imports.

Example `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@app/*": ["src/app/*"],
      "@components/*": ["src/components/*"],
      "@features/*": ["src/features/*"],
      "@lib/*": ["src/lib/*"]
    }
  }
}
```

Example `vite.config.ts`:

```ts
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },
});
```

Use aliases for cross-folder imports. Use relative imports for files in the same folder.

Good:

```ts
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/date/formatDate';
import { TeamBlock } from './TeamBlock';
```

Avoid:

```ts
import { Button } from '../../../../components/ui/Button';
```

---

## 12. State management architecture

Split state into categories. This prevents one giant state solution from handling everything.

| State type | Examples | Recommended home |
|---|---|---|
| Server state | fixtures, predictions, leaderboard, user profile | TanStack Query or route loaders |
| Local UI state | selected tab, open modal, search text | component state or feature hook |
| Form state | login form, prediction draft inputs, password forms | local state, React Hook Form, or reducer |
| Derived state | visible fixtures, current rank, total points | selectors/useMemo/pure functions |
| Global app state | auth session, theme, feature flags | context, small store, or query cache |

### Recommended approach for this app

1. Use **TanStack Query** or equivalent for server state.
2. Use local `useState` for small UI state.
3. Use `useReducer` when multiple state fields change together.
4. Use Context only for app-wide state that many components genuinely need.
5. Avoid Redux at first unless global client state becomes complex.
6. If Redux is introduced, use Redux Toolkit and feature folders.

### Example: query key factory

```ts
// features/predictions/api/predictionsKeys.ts
export const predictionsKeys = {
  all: ['predictions'] as const,
  lists: () => [...predictionsKeys.all, 'list'] as const,
  byUser: (userId: string) => [...predictionsKeys.lists(), { userId }] as const,
  byMatch: (matchId: string) => [...predictionsKeys.all, 'match', matchId] as const,
};
```

### Example: API functions

```ts
// features/predictions/api/predictionsApi.ts
import { apiClient } from '@/lib/api/apiClient';
import type { Prediction, PredictionDraft } from '../types';

export async function getPredictions() {
  return apiClient.get<Prediction[]>('/predictions');
}

export async function savePrediction(matchId: string, draft: PredictionDraft) {
  return apiClient.post<Prediction>(`/matches/${matchId}/prediction`, draft);
}
```

### Example: query hooks

```ts
// features/predictions/api/predictionsQueries.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPredictions, savePrediction } from './predictionsApi';
import { predictionsKeys } from './predictionsKeys';

export function usePredictionsQuery() {
  return useQuery({
    queryKey: predictionsKeys.lists(),
    queryFn: getPredictions,
  });
}

export function useSavePredictionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, draft }: { matchId: string; draft: PredictionDraft }) =>
      savePrediction(matchId, draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: predictionsKeys.all });
    },
  });
}
```

---

## 13. Hook patterns

Custom hooks should hide orchestration, not hide simple one-liners for no reason.

### Good hook candidates in your app

```txt
usePredictionsPage.ts      # prepares all page-level view model data
usePredictionDrafts.ts     # manages score draft state by match ID
usePredictionFilters.ts    # query/status filtering and visible fixtures
useWinnerPick.ts           # winner pick state + save action
useAccountForms.ts         # username/password/delete forms
useAuthForm.ts             # login/signup form state and submit
```

### Example: `usePredictionFilters`

```ts
import { useMemo, useState } from 'react';
import type { Match } from '@/features/matches';
import { displayStatus, teamName } from '@/features/matches/utils/matchFormatters';

export type StatusFilter = 'ALL' | 'UPCOMING' | 'LIVE' | 'FINISHED';

export function usePredictionFilters(fixtures: Match[]) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const visibleFixtures = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return fixtures.filter((match) => {
      const matchesStatus =
        statusFilter === 'ALL' || displayStatus(match) === statusFilter;

      const searchableText = [
        teamName(match.home),
        teamName(match.away),
        match.group,
        match.stage,
        match.city,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [fixtures, query, statusFilter]);

  return {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    visibleFixtures,
  };
}
```

### Hook rules

1. Hooks should return named values, not huge arrays.
2. Hooks should not return unstable objects if performance matters. Use `useMemo` or split hooks when needed.
3. Keep API mutations inside query/mutation hooks or use-case hooks.
4. Keep pure calculations in utilities, then call those utilities from hooks.
5. Avoid putting JSX inside hooks.

---

## 14. Component patterns

### 14.1 Page component

Purpose: layout and route-level composition.

Should contain:

- page layout
- feature components
- route params
- route-level loading/error states

Should avoid:

- long sort/filter functions
- raw API calls
- large form logic
- deeply nested repeated JSX

### 14.2 Container/view-model hook

Purpose: prepare data and actions for the page.

Example:

```ts
export function usePredictionsPage() {
  const predictionsQuery = usePredictionsQuery();
  const fixturesQuery = useFixturesQuery();
  const leaderboardQuery = useLeaderboardQuery();
  const filters = usePredictionFilters(fixturesQuery.data ?? []);
  const drafts = usePredictionDrafts();

  return {
    loading: predictionsQuery.isLoading || fixturesQuery.isLoading,
    visibleFixtures: filters.visibleFixtures,
    query: filters.query,
    setQuery: filters.setQuery,
    drafts,
  };
}
```

### 14.3 Presentational component

Purpose: receive props and render UI.

Good:

```tsx
export function MatchControls({
  query,
  statusFilter,
  loading,
  onQueryChange,
  onStatusFilterChange,
  onRefresh,
}: MatchControlsProps) {
  return (
    <div className="panel p-4">
      {/* render controls */}
    </div>
  );
}
```

Avoid:

```tsx
export function MatchControls() {
  const { data } = useQuery(...);
  const [query, setQuery] = useState('');
  // too coupled if this component should only render controls
}
```

A component can use hooks, but the more reusable it should be, the less it should know about APIs and app state.

---

## 15. API layer pattern

Create one small generic client, then feature-specific API modules.

```txt
lib/
  api/
    apiClient.ts
    apiErrors.ts
    http.ts

features/
  predictions/
    api/
      predictionsApi.ts
      predictionsQueries.ts
      predictionsKeys.ts
```

### Example: `apiClient.ts`

```ts
import { env } from '@/app/config/env';
import { ApiError } from './apiErrors';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
```

### API layer rules

1. Components should not call `fetch` directly.
2. API functions should not render toast messages directly.
3. API functions should return typed data or throw typed errors.
4. Feature query hooks should own caching and invalidation.
5. Mutations should invalidate the smallest sensible query key.

---

## 16. TypeScript pattern

If the project is still JavaScript, migrate gradually:

1. Rename leaf utility files from `.js` to `.ts` first.
2. Rename simple components from `.jsx`/`.js` to `.tsx`.
3. Add feature `types.ts` files.
4. Type API responses.
5. Type props for all extracted components.
6. Enable stricter TypeScript settings after the app compiles.

Example feature types:

```ts
// features/matches/types.ts
export type MatchStatus = 'UPCOMING' | 'LIVE' | 'FINISHED';

export type Team = {
  id?: string;
  name: string;
  abbreviation?: string;
  flagUrl?: string;
};

export type Match = {
  id: string;
  date: string;
  status: MatchStatus;
  minute?: number;
  group?: string;
  stage?: string;
  city?: string;
  home: Team;
  away: Team;
  homeScore?: number | null;
  awayScore?: number | null;
};
```

```ts
// features/predictions/types.ts
export type PredictionDraft = {
  ht_home?: string;
  ht_away?: string;
  ft_home?: string;
  ft_away?: string;
};

export type Prediction = {
  matchId: string;
  ht_home?: number | null;
  ht_away?: number | null;
  ft_home: number;
  ft_away: number;
};

export type PredictionPoints = {
  ht_pts: number;
  ft_pts: number;
  closest_pts: number;
  outcome_pts: number;
};
```

### Type rules

1. Use `type` for unions and object models unless your team prefers `interface`.
2. Do not use `any` unless there is a documented reason.
3. Type component props explicitly.
4. Keep API response types close to the feature API.
5. Keep global types rare.
6. Prefer domain names: `Match`, `Team`, `Prediction`, not `Data`, `Item`, `Response`.

---

## 17. Validation and schemas

For forms and API boundaries, add schemas.

Recommended structure:

```txt
features/
  auth/
    schemas/
      loginSchema.ts
  predictions/
    schemas/
      predictionDraftSchema.ts
  account/
    schemas/
      passwordSchema.ts
```

Example:

```ts
import { z } from 'zod';

export const predictionDraftSchema = z.object({
  ht_home: z.coerce.number().int().min(0).optional(),
  ht_away: z.coerce.number().int().min(0).optional(),
  ft_home: z.coerce.number().int().min(0),
  ft_away: z.coerce.number().int().min(0),
});

export type PredictionDraftInput = z.infer<typeof predictionDraftSchema>;
```

Use schemas when:

- accepting user input
- parsing backend responses
- validating route params
- validating environment variables

---

## 18. Environment config

Recommended:

```txt
src/
  app/
    config/
      env.ts
```

```ts
// app/config/env.ts
const required = (key: string, value: string | undefined) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

export const env = {
  apiBaseUrl: required('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};
```

Example `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Important rule: client-side Vite env variables are public if they use the `VITE_` prefix. Do not put database passwords, private API keys, or server secrets in Vite client env variables.

---

## 19. Routing architecture

Recommended:

```txt
app/
  router/
    router.tsx
    routePaths.ts

routes/
  PredictionsRoute.tsx
  LeaderboardRoute.tsx
  NotFoundRoute.tsx
```

Example:

```tsx
// app/router/routePaths.ts
export const routePaths = {
  home: '/',
  predictions: '/predictions',
  leaderboard: '/leaderboard',
  account: '/account',
} as const;
```

```tsx
// app/router/router.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { AppLayout } from '@/app/layout/AppLayout';
import { routePaths } from './routePaths';

const PredictionsRoute = lazy(() => import('@/routes/PredictionsRoute'));
const LeaderboardRoute = lazy(() => import('@/routes/LeaderboardRoute'));

export const router = createBrowserRouter([
  {
    path: routePaths.home,
    element: <AppLayout />,
    children: [
      {
        path: routePaths.predictions,
        element: (
          <Suspense fallback={<LoadingPanel label="Loading predictions" />}>
            <PredictionsRoute />
          </Suspense>
        ),
      },
      {
        path: routePaths.leaderboard,
        element: (
          <Suspense fallback={<LoadingPanel label="Loading leaderboard" />}>
            <LeaderboardRoute />
          </Suspense>
        ),
      },
    ],
  },
]);
```

If you use React Router data/framework mode, route modules can also own loading, actions, revalidation, and error boundaries.

---

## 20. Styling architecture

For Tailwind-style projects, keep styling simple and predictable.

Recommended:

```txt
styles/
  globals.css
  tailwind.css

components/
  ui/
    Button/
      Button.tsx
```

### Styling rules

1. Keep one-off layout classes in the component.
2. Extract repeated class combinations into reusable components.
3. Use a small `cn()` helper for conditional class names.
4. Avoid putting hundreds of custom classes in global CSS.
5. Keep design tokens consistent: spacing, radius, border, shadow, text sizes.
6. Do not create a generic component too early. Extract only after repeated usage.

Example `cn()` helper:

```ts
// lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Example UI component:

```tsx
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variantClassName[variant],
        className,
      )}
      {...props}
    />
  );
}
```

---

## 21. Utility function rules

Utilities should be pure and easy to test.

Good utility:

```ts
export function outcomeLabel(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) return 'Home win';
  if (homeScore < awayScore) return 'Away win';
  return 'Draw';
}
```

Avoid utility functions that secretly depend on UI state, browser globals, or API calls.

### Where utilities should live

| Utility | Home |
|---|---|
| `formatDate`, `formatTime` | `lib/date/` if generic |
| `teamName` | `features/matches/utils/` |
| `scoreText` | `features/matches/utils/` |
| `isPredictionLocked` | `features/predictions/utils/` or `features/matches/utils/` depending on ownership |
| `outcomeLabel` | `features/predictions/utils/` if prediction-specific |
| `numberOrBlank` | `lib/utils/number.ts` if generic |

---

## 22. Testing structure

Recommended:

```txt
src/
  test/
    setupTests.ts
    renderWithProviders.tsx
    fixtures/
      matches.ts
      predictions.ts
      users.ts

  features/
    predictions/
      components/
        PredictionCard/
          PredictionCard.test.tsx
      hooks/
        usePredictionFilters.test.ts
      utils/
        predictionScoring.test.ts
```

### What to test

| Code | Test type |
|---|---|
| pure scoring logic | unit tests |
| match filtering/sorting | unit tests |
| form validation | unit tests |
| `PredictionCard` behavior | component tests |
| login/signup flow | integration tests |
| full route navigation | end-to-end tests when needed |

### Testing principles

1. Test behavior, not implementation details.
2. Prefer user-visible queries for component tests.
3. Test pure functions heavily because they are cheap to test.
4. Mock network at the API boundary, not inside every component.
5. Add regression tests before refactoring risky logic.

Example pure utility test:

```ts
import { describe, expect, it } from 'vitest';
import { outcomeLabel } from './predictionDisplay';

describe('outcomeLabel', () => {
  it('returns Home win when home score is higher', () => {
    expect(outcomeLabel(2, 1)).toBe('Home win');
  });

  it('returns Away win when away score is higher', () => {
    expect(outcomeLabel(0, 1)).toBe('Away win');
  });

  it('returns Draw when scores are equal', () => {
    expect(outcomeLabel(1, 1)).toBe('Draw');
  });
});
```

Example component test:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MatchControls } from './MatchControls';

describe('MatchControls', () => {
  it('calls onQueryChange when the user searches', async () => {
    const onQueryChange = vi.fn();

    render(
      <MatchControls
        query=""
        statusFilter="ALL"
        loading={false}
        onQueryChange={onQueryChange}
        onStatusFilterChange={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    await userEvent.type(screen.getByPlaceholderText(/search teams/i), 'Brazil');

    expect(onQueryChange).toHaveBeenCalled();
  });
});
```

---

## 23. Error handling pattern

Use consistent error handling across the app.

Recommended:

```txt
lib/
  api/
    apiErrors.ts
components/
  feedback/
    ErrorState.tsx
app/
  router/
    ErrorBoundary.tsx
```

Example:

```ts
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  static async fromResponse(response: Response) {
    let details: unknown;

    try {
      details = await response.json();
    } catch {
      details = undefined;
    }

    return new ApiError(response.statusText || 'Request failed', response.status, details);
  }
}
```

UI pattern:

```tsx
if (query.isError) {
  return (
    <ErrorState
      title="Could not load predictions"
      detail="Please refresh and try again."
      onRetry={() => query.refetch()}
    />
  );
}
```

Rules:

1. Show friendly messages to users.
2. Log technical details for developers.
3. Do not expose stack traces in the UI.
4. Centralize API error parsing.
5. Give retry options for recoverable failures.

---

## 24. Performance patterns

Start with clean code first. Optimize only where the app actually needs it.

Useful patterns:

1. Use route-level lazy loading for large routes.
2. Use `useMemo` for expensive derived lists such as filtered fixtures.
3. Use `React.memo` only for components that re-render often with stable props.
4. Keep lists keyed by stable IDs.
5. Avoid recreating large maps repeatedly inside render if the data is large.
6. Split large route bundles.
7. Keep images optimized and sized correctly.

In your current page, good candidates for derived memoization are:

- `visibleFixtures`
- `predictionsByMatch`
- `pointsByMatch`
- `showcaseMatches`
- current leaderboard rank
- total points calculation

Example:

```ts
const predictionsByMatch = useMemo(() => {
  return new Map(predictions.map((prediction) => [prediction.matchId, prediction]));
}, [predictions]);
```

---

## 25. Accessibility patterns

Recommended rules:

1. Use semantic elements: `main`, `section`, `article`, `aside`, `form`, `button`.
2. Every input needs a visible label or an accessible label.
3. Use `aria-live` for notices/toasts that should be announced.
4. Keep focus states visible.
5. Disable buttons only when necessary; explain why if unclear.
6. Use real buttons for actions, links for navigation.
7. Make loading and error states screen-reader friendly.

Your current code already uses semantic elements like `main`, `section`, `aside`, `article`, and `form`. Keep that pattern.

---

## 26. Security and account patterns

For frontend structure:

1. Never store raw passwords in long-lived state.
2. Clear password forms after successful submission.
3. Keep delete-account flows explicit and hard to trigger accidentally.
4. Do not put secrets in Vite client env variables.
5. Use `credentials: 'include'` only when your backend cookie/CORS setup supports it correctly.
6. Avoid logging auth responses, tokens, passwords, or private user data.
7. Keep auth API calls in `features/auth/api/`.
8. Keep account API calls in `features/account/api/`.

Suggested account split:

```txt
features/account/
  components/
    AccountProfilePanel/
    AccountSecurityPanel/
    AccountDangerPanel/
  hooks/
    useProfileForm.ts
    usePasswordForm.ts
    useDeleteAccountForm.ts
  api/
    accountApi.ts
  schemas/
    updateUsernameSchema.ts
    updatePasswordSchema.ts
    deleteAccountSchema.ts
```

---

## 27. Linting and formatting

Recommended tooling:

- ESLint for code quality rules.
- TypeScript ESLint for TypeScript-specific linting.
- Prettier for formatting.
- Husky/lint-staged if you want checks before commit.

Suggested scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 28. Refactoring plan for your current file

Do this in small steps so the app keeps working.

### Step 1: Create the new folders

Create:

```txt
src/features/predictions/
src/features/auth/
src/features/account/
src/features/leaderboard/
src/features/matches/
src/components/feedback/
src/lib/date/
src/lib/utils/
```

### Step 2: Move generic shared components first

Move existing shared components:

```txt
components/EmptyState.tsx       -> components/feedback/EmptyState.tsx
components/LoadingPanel.tsx     -> components/feedback/LoadingPanel.tsx
components/ConnectionPanel.tsx  -> components/feedback or app/layout depending on purpose
components/LeaderboardPanel.tsx -> features/leaderboard/components/LeaderboardPanel/
components/Flag.tsx             -> features/matches/components/Flag/
```

Update imports after each move.

### Step 3: Extract pure utilities

Move match and prediction display helpers:

```txt
lib/utils.ts -> split into:
  lib/date/formatDate.ts
  lib/date/formatTime.ts
  lib/utils/number.ts
  features/matches/utils/matchStatus.ts
  features/matches/utils/matchFormatters.ts
  features/predictions/utils/predictionDisplay.ts
```

Add tests for these before changing behavior.

### Step 4: Extract small components from `PredictionsPage`

Extract in this order:

1. `ScoreInputGroup`
2. `TeamBlock`
3. `PredictionCard`
4. `MatchControls`
5. `WinnerPicker`
6. `SummaryStrip`
7. account panels
8. unauthenticated auth view

This order works because smaller leaf components are easier to move first.

### Step 5: Add prop types

After each component is moved, add explicit prop types.

Example:

```ts
type ScoreInputGroupProps = {
  label: string;
  homeValue: string | number;
  awayValue: string | number;
  onHome: (value: string) => void;
  onAway: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
};
```

### Step 6: Extract hooks

Create:

```txt
features/predictions/hooks/usePredictionDrafts.ts
features/predictions/hooks/usePredictionFilters.ts
features/predictions/hooks/useWinnerPick.ts
features/predictions/hooks/usePredictionsPage.ts
```

Move stateful logic into these hooks once components are extracted.

### Step 7: Add API modules

Create:

```txt
features/predictions/api/predictionsApi.ts
features/predictions/api/predictionsQueries.ts
features/predictions/api/predictionsKeys.ts
```

Move HTTP calls out of page-level code.

### Step 8: Reduce `PredictionsPage` to layout

The final `PredictionsPage` should ideally be under 150 lines. If it grows beyond that again, check whether new UI sections should become feature components.

### Step 9: Add tests around critical behavior

Start with:

- score/outcome label helpers
- lock/unlock prediction logic
- fixture filtering
- `PredictionCard` save/update/locked behavior
- account password form validation

### Step 10: Remove dead imports and duplicate utilities

After all moves are complete, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

---

## 29. Example final feature tree after refactor

```txt
src/
  app/
    App.tsx
    providers/
      AppProviders.tsx
      QueryProvider.tsx
    router/
      router.tsx
      routePaths.ts
    config/
      env.ts

  components/
    feedback/
      EmptyState.tsx
      ErrorState.tsx
      LoadingPanel.tsx
      LoadingRows.tsx
    ui/
      Button/
        Button.tsx
        index.ts
      Input/
        Input.tsx
        index.ts
      Select/
        Select.tsx
        index.ts

  features/
    account/
      api/
        accountApi.ts
        accountQueries.ts
      components/
        AccountDangerPanel/
          AccountDangerPanel.tsx
          index.ts
        AccountProfilePanel/
          AccountProfilePanel.tsx
          index.ts
        AccountSecurityPanel/
          AccountSecurityPanel.tsx
          index.ts
      hooks/
        useAccountForms.ts
      schemas/
        accountSchemas.ts
      types.ts
      index.ts

    auth/
      api/
        authApi.ts
        authQueries.ts
      components/
        AuthCard/
          AuthCard.tsx
          index.ts
      hooks/
        useAuthForm.ts
      schemas/
        authSchemas.ts
      types.ts
      index.ts

    leaderboard/
      api/
        leaderboardApi.ts
        leaderboardQueries.ts
      components/
        LeaderboardPanel/
          LeaderboardPanel.tsx
          index.ts
      types.ts
      index.ts

    matches/
      api/
        matchesApi.ts
        matchesQueries.ts
        matchesKeys.ts
      components/
        Flag/
          Flag.tsx
          index.ts
        MatchScoreBadge/
          MatchScoreBadge.tsx
          index.ts
      utils/
        matchFormatters.ts
        matchSorting.ts
        matchStatus.ts
      types.ts
      index.ts

    predictions/
      api/
        predictionsApi.ts
        predictionsKeys.ts
        predictionsQueries.ts
      components/
        MatchControls/
          MatchControls.tsx
          MatchControls.test.tsx
          index.ts
        PredictionCard/
          PredictionCard.tsx
          PredictionCard.test.tsx
          PredictionPoints.tsx
          PredictionSummary.tsx
          ScoreInputGroup.tsx
          TeamBlock.tsx
          index.ts
        SummaryStrip/
          SummaryCard.tsx
          SummaryStrip.tsx
          index.ts
        WinnerPicker/
          WinnerPicker.tsx
          WinnerPicker.test.tsx
          index.ts
      hooks/
        usePredictionDrafts.ts
        usePredictionFilters.ts
        usePredictionsPage.ts
        useWinnerPick.ts
      pages/
        PredictionsPage.tsx
      schemas/
        predictionSchemas.ts
      utils/
        predictionDisplay.ts
        predictionScoring.ts
      constants.ts
      types.ts
      index.ts

  lib/
    api/
      apiClient.ts
      apiErrors.ts
    date/
      formatDate.ts
      formatTime.ts
    utils/
      cn.ts
      number.ts

  routes/
    PredictionsRoute.tsx
    LeaderboardRoute.tsx
    NotFoundRoute.tsx

  styles/
    globals.css

  test/
    setupTests.ts
    renderWithProviders.tsx
    fixtures/
      matches.ts
      predictions.ts
      users.ts

  main.tsx
  vite-env.d.ts
```

---

## 30. Import direction rules

Use one-way imports to avoid circular dependencies.

Recommended dependency direction:

```txt
app -> routes -> features -> components -> lib
```

Allowed examples:

```ts
// route imports feature page
import { PredictionsPage } from '@/features/predictions';

// feature imports shared UI
import { EmptyState } from '@/components/feedback/EmptyState';

// feature imports lib helper
import { formatDate } from '@/lib/date/formatDate';
```

Avoid:

```ts
// shared lib should not know about a feature
import { Prediction } from '@/features/predictions';

// generic Button should not import app auth state
import { useAuth } from '@/features/auth';
```

### Rule of thumb

Lower-level folders should not import higher-level folders.

`lib/` should be boring and reusable.

---

## 31. When to create shared components

Do not move everything to `components/` immediately.

Use this decision rule:

| Situation | Keep in feature? | Move to shared? |
|---|---:|---:|
| Used by one feature only | Yes | No |
| Uses domain words like match, prediction, fixture | Yes | Usually no |
| Generic UI like Button/Input/Modal | No | Yes |
| Used by three or more features | Maybe | Yes |
| Has no business logic | Maybe | Yes |
| Needs feature API/data | Yes | No |

Examples:

- `PredictionCard` belongs in `features/predictions`.
- `Flag` belongs in `features/matches` if it expects a `Team` object.
- `Button` belongs in `components/ui`.
- `LoadingPanel` belongs in `components/feedback`.

---

## 32. Patterns to avoid

### Avoid: giant page files

Problem:

```txt
PredictionsPage.tsx  // 700+ lines
```

Better:

```txt
PredictionsPage.tsx
PredictionCard.tsx
MatchControls.tsx
WinnerPicker.tsx
usePredictionsPage.ts
```

### Avoid: generic `utils.ts` dumping ground

Problem:

```txt
lib/utils.ts
```

Better:

```txt
lib/date/formatDate.ts
lib/utils/number.ts
features/matches/utils/matchStatus.ts
features/predictions/utils/predictionScoring.ts
```

### Avoid: prop drilling through many layers

If `PredictionsPage` passes 30+ props into child components, create a view-model hook and split components by responsibility.

### Avoid: global state for everything

Do not put search text, one modal state, or one form draft into Redux/global context unless multiple distant parts of the app need it.

### Avoid: premature atomic design

Atomic design can work, but many projects overdo it. For this app, feature-first folders plus a small shared UI library is simpler and easier to maintain.

---

## 33. Suggested PR plan

If this were a real codebase PR sequence, split it like this:

### PR 1: Create structure and aliases

- Add `src/app`, `src/features`, `src/lib`, `src/components/feedback`.
- Add path aliases.
- Move no behavior yet.

### PR 2: Move shared UI components

- Move `EmptyState`, `LoadingPanel`, `LoadingRows`, `ConnectionPanel` if generic.
- Update imports.

### PR 3: Extract match utilities

- Split `lib/utils` into date, match, and prediction utilities.
- Add tests for current behavior.

### PR 4: Extract prediction card components

- Move `ScoreInputGroup`, `TeamBlock`, `PredictionCard`.
- Add prop types.

### PR 5: Extract page controls

- Move `SummaryStrip`, `WinnerPicker`, `MatchControls`.
- Add tests for controls and winner picker.

### PR 6: Extract account/auth panels

- Move account panels into `features/account`.
- Move unauthenticated view into `features/auth` or `features/predictions` guest view.

### PR 7: Extract hooks

- Add `usePredictionDrafts`, `usePredictionFilters`, `usePredictionsPage`.
- Reduce `PredictionsPage` to composition.

### PR 8: Add API/query layer

- Move API calls to feature API modules.
- Add query keys and mutation invalidation.

### PR 9: TypeScript hardening

- Add strict prop types.
- Add API response types.
- Remove `any`.

---

## 34. Review checklist

Before merging a feature, check:

- [ ] Is the file in the correct feature folder?
- [ ] Is the page component mostly composition?
- [ ] Are pure helpers outside JSX files?
- [ ] Are feature-specific helpers inside the feature?
- [ ] Are shared components truly shared?
- [ ] Are API calls outside components?
- [ ] Are server-state calls cached consistently?
- [ ] Are mutation success paths invalidating or updating the right data?
- [ ] Are forms validated?
- [ ] Are error and loading states covered?
- [ ] Are important utilities tested?
- [ ] Are imports one-directional?
- [ ] Are env variables safe for the client?
- [ ] Does `npm run lint` pass?
- [ ] Does `npm run typecheck` pass?
- [ ] Does `npm run build` pass?

---

## 35. Final recommendation

For your current app, the best structure is:

```txt
src/app              # bootstrapping, providers, router, env
src/features         # auth, account, predictions, matches, leaderboard
src/components       # generic reusable UI only
src/lib              # generic helpers and API client
src/routes           # lazy route wrappers
src/test             # setup and shared test helpers
```

The biggest immediate win is to split the current large `PredictionsPage` into:

1. A small page component.
2. Feature components.
3. Feature hooks.
4. Pure utilities.
5. API/query modules.
6. Types and schemas.
7. Tests for critical behavior.

This keeps the project simple now, but gives it enough structure to grow without becoming messy.

---

## 36. Sources consulted

- [React docs: Create user interfaces from components](https://react.dev/)
- [React docs: Scaling up with reducer and context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [React docs: Extracting state logic into a reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
- [React docs: lazy](https://react.dev/reference/react/lazy)
- [Vite docs: Getting started](https://vite.dev/guide/)
- [Vite docs: Building for production](https://vite.dev/guide/build)
- [Vite docs: Env variables and modes](https://vite.dev/guide/env-and-mode)
- [Vite docs: Dependency pre-bundling](https://vite.dev/guide/dep-pre-bundling)
- [React Router docs](https://reactrouter.com/)
- [React Router docs: Route object](https://reactrouter.com/start/data/route-object)
- [TanStack Query docs: Query invalidation](https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation)
- [TanStack Query docs: Invalidations from mutations](https://tanstack.com/query/v5/docs/framework/react/guides/invalidations-from-mutations)
- [Redux docs: Style guide](https://redux.js.org/style-guide/)
- [Redux docs: Code structure FAQ](https://redux.js.org/faq/code-structure)
- [Vitest docs](https://vitest.dev/)
- [Testing Library docs: Guiding principles](https://testing-library.com/docs/guiding-principles/)
- [TypeScript ESLint docs: Getting started](https://typescript-eslint.io/getting-started/)

Accessed: 2026-06-12.
