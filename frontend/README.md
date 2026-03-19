# AI360 Frontend

React 18 + TypeScript single-page application for the AI360 organization intelligence platform.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| Tailwind CSS | Styling (design system from UI/UX spec) |
| React Router v6 | Client-side routing with code splitting |
| Recharts | Charts (share price, sentiment, growth) |
| react-force-graph-2d | Knowledge graph visualization |
| Heroicons | Icon library |
| clsx | Conditional CSS class merging |
| date-fns | Date formatting |

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (port 3000, proxies /api to localhost:8000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── common/          # Shared UI components
│   │   ├── Modal.tsx
│   │   ├── DataTable.tsx
│   │   ├── Pagination.tsx
│   │   ├── StatCard.tsx
│   │   ├── SearchBar.tsx
│   │   ├── OrgCard.tsx
│   │   ├── Tabs.tsx
│   │   ├── FilterBar.tsx
│   │   ├── SentimentBadge.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── RoleBadge.tsx
│   │   ├── EmptyState.tsx
│   │   └── ConfirmDialog.tsx
│   └── layout/          # Shell layout
│       ├── AppShell.tsx
│       ├── TopBar.tsx
│       ├── Sidebar.tsx
│       ├── NotificationPanel.tsx
│       └── ToastContainer.tsx
├── contexts/            # React Context providers
│   ├── AuthContext.tsx
│   ├── NotificationContext.tsx
│   ├── CreditContext.tsx
│   └── ToastContext.tsx
├── hooks/
│   └── useToast.ts
├── pages/
│   ├── SearchPage.tsx          # S1: Landing + S2: Search Results
│   ├── MyRequestsPage.tsx      # S11: Analysis Requests
│   ├── ComparePage.tsx         # S9: Compare Organizations
│   ├── CreditsPage.tsx         # S14: Credits Dashboard
│   ├── NotificationPrefsPage.tsx # S15: Notification Settings
│   ├── ProfilePage.tsx         # User Profile
│   ├── org/                    # Organization context
│   │   ├── OrgLayout.tsx       # Shared header + tabs + export modal
│   │   ├── OrgOverviewPage.tsx # S3: Dashboard overview
│   │   ├── OrgNewsPage.tsx     # S4: News feed
│   │   ├── OrgAnalysisPage.tsx # S5: Growth analysis
│   │   ├── OrgGraphPage.tsx    # S6: Knowledge graph
│   │   ├── OrgAnnualReportsPage.tsx # S7: Annual reports
│   │   └── OrgChatPage.tsx     # S8: AI Chat
│   └── admin/                  # Admin-only pages
│       ├── AdminOrgsPage.tsx   # S16-S17: Org management
│       ├── AdminUsersPage.tsx  # S18: Users & roles
│       ├── AdminSettingsPage.tsx # S19: Platform settings
│       ├── AdminDataSourcesPage.tsx # S20: Data sources
│       ├── AdminSeedPage.tsx   # S21: Seed pipeline
│       └── AdminPricingPage.tsx # S22: Credit pricing
├── services/
│   └── api.ts           # API client for all backend services
├── types/
│   └── index.ts         # TypeScript interfaces
├── App.tsx              # Router configuration
├── main.tsx             # Entry point
└── index.css            # Tailwind directives
```

## Screens (22 total)

| Screen | Route | Roles |
|--------|-------|-------|
| Landing / Search | `/` | All |
| Search Results | `/search?q=...` | All |
| Org Dashboard | `/org/:id` | All |
| Org News | `/org/:id/news` | All |
| Org Analysis | `/org/:id/analysis` | All |
| Org Graph | `/org/:id/graph` | All |
| Org Annual Reports | `/org/:id/annual-reports` | All |
| Org Chat | `/org/:id/chat` | Analyst, Admin |
| Compare | `/compare` | Analyst, Admin |
| My Requests | `/requests` | Analyst, Admin |
| Credits | `/credits` | All |
| Notification Prefs | `/settings/notifications` | All |
| Profile | `/profile` | All |
| Admin: Organizations | `/admin/organizations` | Admin |
| Admin: Users | `/admin/users` | Admin |
| Admin: Settings | `/admin/settings` | Admin |
| Admin: Data Sources | `/admin/data-sources` | Admin |
| Admin: Seed Pipeline | `/admin/seed` | Admin |
| Admin: Credit Pricing | `/admin/pricing` | Admin |

## Design System

Based on the AI360 UI/UX Specification (`docs/ui-ux-specification.md`):

- **Primary color**: Indigo-600 (`#4F46E5`)
- **Typography**: Inter (UI) + JetBrains Mono (code/tickers)
- **Icons**: Heroicons (outline, 20-24px)
- **Cards**: White, rounded-xl, border-slate-200, shadow-sm
- **Responsive**: Collapsible sidebar at < 1024px

## API Integration

All API calls go through `src/services/api.ts`. In development, Vite proxies `/api/*` to `http://localhost:8000` (the API Gateway).

The API client expects the Gateway to set user context headers (`X-User-Id`, `X-User-Role`, etc.) after SSO authentication.
