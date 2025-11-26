# Slop Cultivator

A tower defense game with RPG elements built with React, TypeScript, and Supabase. Players defend a castle from waves of enemies by deploying cultivators with unique abilities, stats, and equipment.

## Features

- **Mobile Cultivators**: Deploy units that can move within zones (not static towers)
- **RPG Mechanics**: Stats, skills, equipment, and progression systems
- **Wave-Based Combat**: Increasing difficulty with multiple enemy types
- **Authentication**: OAuth support with guest mode and data migration
- **Leaderboards**: Global score tracking with authenticated persistence
- **Admin Tool**: Separate development tool for managing game data

## Tech Stack

- **Frontend**: React 18.3 + TypeScript 5.5 + Vite 5.4
- **Styling**: Tailwind CSS 3.4 + Radix UI
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Testing**: Playwright + fast-check

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
# Start game (port 5173)
npm run dev

# Start admin tool (port 5177)
npm run dev:admin
```

### Building

```bash
# Build game
npm run build

# Build admin tool
npm run build:admin
```

## Project Structure

```
game/           # Main game application
admin/          # Admin development tool
shared/         # Shared code (types, utilities)
supabase/       # Backend (migrations, functions)
tests/          # Playwright tests
docs/           # Documentation
```

See [docs/README.md](docs/README.md) for detailed documentation.

## Development

- **Game URL**: http://localhost:5173
- **Admin URL**: http://localhost:5177
- **Path Alias**: `@/` maps to `game/`

### Important Notes

- Restart dev server after changing config files (tailwind.config.js, vite.config.ts)
- Use `formatNumber()` utility for all numeric stat displays
- All UI changes must be tested (see docs/ui-testing-workflow-update.md)

## Testing

```bash
# Run all tests
npm run test:all

# Run visual tests
npm run test:visual

# Run accessibility tests
npm run test:a11y
```

## License

This project includes components from [shadcn/ui](https://ui.shadcn.com/) used under MIT license.

Photos from [Unsplash](https://unsplash.com) used under their license.
