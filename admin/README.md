# Slop Cultivator - Admin Tool

Development tool for tweaking game parameters in real-time.

## Features

- **People Editor**: Create and manage Person Types (races) that can serve as defenders or attackers
- **Waves Editor**: Configure wave compositions with specific Person Types, spawn counts, and timing
- **Item Editor**: Create and balance items with custom effects
- **Skill Editor**: Configure skill bonuses and requirements
- **Map Editor**: Adjust board dimensions and spawn points
- **Tiles Editor**: Manage tile types and their properties

### Legacy Editors (Deprecated)
- **Cultivator Editor**: ⚠️ Deprecated - Use People Editor instead
- **Enemy Editor**: ⚠️ Deprecated - Use People Editor instead

## Setup

### 1. Get Your Supabase Service Role Key

The admin tool requires the service role key to bypass Row Level Security policies.

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Project Settings** > **API**
4. Copy the `service_role` key (NOT the `anon` key)

⚠️ **WARNING**: The service role key bypasses all security. Never expose it to end users or commit it to git!

### 2. Add to Environment Variables

Add the service role key to your `.env.local` file:

```bash
# Your existing Supabase config
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Admin Tool Only - DO NOT COMMIT
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Running the Admin Tool

### Development Mode
```bash
npm run dev:admin
```
The admin tool will run on `http://localhost:5177` (different port from game)

### Build for Production
```bash
npm run build:admin
```

## Usage

1. **Edit Parameters**: Use the UI to modify game values
2. **Export Config**: Click "Export Config" to download JSON files
3. **Test in Game**: Changes are saved to localStorage and can be tested immediately
4. **Share Configs**: Export JSON files to share with team or backup

## Data Storage

The admin tool now uses **Supabase** for persistent storage:

- **Person Types**: Stored in `person_types` table with defender/attacker configurations
- **Wave Configurations**: Stored in `wave_configurations` table with spawn definitions
- **Items**: Item effects and drop rates (localStorage)
- **Skills**: Skill bonuses and requirements (localStorage)
- **Maps**: Map layouts and tile configurations (Supabase)

### Migration from Old System

The old cultivator and enemy systems have been replaced by the unified Person Type system:
- Old cultivator types (sword, palm, arrow, lightning) → Person Types with `defenderConfig`
- Old enemy types (demon, shadow, beast, etc.) → Person Types with `attackerConfig`
- Hardcoded wave spawning → Data-driven Wave Configurations

## Security

⚠️ **Important**: The admin tool is excluded from production builds.

- Admin tool runs on separate domain/port
- Not included in APK/EXE builds
- Only accessible during development

## Architecture

```
admin/
├── index.html          # Admin entry point
├── main.tsx           # Admin React root
├── AdminApp.tsx       # Main admin interface
└── components/        # Editor components
    ├── PersonTypeEditor.tsx      # NEW: Person Type CRUD
    ├── PersonTypeList.tsx        # NEW: Person Type list view
    ├── WaveConfigEditor.tsx      # NEW: Wave configuration editor
    ├── WaveConfigList.tsx        # NEW: Wave list view
    ├── CultivatorEditor.tsx      # DEPRECATED
    ├── EnemyEditor.tsx           # DEPRECATED
    ├── ItemEditor.tsx
    ├── SkillEditor.tsx
    ├── MapEditor.tsx
    └── TileEditor.tsx

shared/
├── types/
│   └── person-types.ts           # NEW: Person Type & Wave Config types
└── utils/
    ├── person-type-service.ts    # NEW: Load Person Types from Supabase
    ├── person-type-admin-service.ts  # NEW: Admin CRUD operations
    ├── wave-config-service.ts    # NEW: Load Wave Configs from Supabase
    ├── wave-config-admin-service.ts  # NEW: Admin CRUD operations
    ├── person-type-adapters.ts   # NEW: Convert old formats to new
    ├── cultivator-generator.ts   # NEW: Random cultivator generation
    └── config-loader.ts          # Shared config utilities

game/
└── utils/            # Game data
    ├── cultivator.ts             # DEPRECATED (see DEPRECATED_README.md)
    ├── enemy-codex.ts            # DEPRECATED (see DEPRECATED_README.md)
    ├── cultivator-builds.ts      # DEPRECATED (needs refactoring)
    ├── items.ts
    ├── skills.ts
    └── ...
```

## Development Workflow

1. Run game: `npm run dev` (port 5173)
2. Run admin: `npm run dev:admin` (port 5177)
3. Edit Person Types and Wave Configurations in admin tool
4. Changes are saved to Supabase immediately
5. Refresh game to load new configurations

### Working with Person Types

1. Navigate to "People" tab
2. Create new Person Type or edit existing
3. Toggle between Defender/Attacker mode
4. Set base stats and role-specific configurations
5. Save to Supabase

### Working with Wave Configurations

1. Navigate to "Waves" tab
2. Select wave number to configure
3. Add spawn groups with Person Types (attackers only)
4. Set spawn counts and timing
5. Save to Supabase

## Tips

- **Balance Testing**: Use calculated stats (DPS, Cost/DPS) to balance cultivators
- **Enemy Scaling**: Preview scaled stats at different waves
- **Item Effects**: Combine flat bonuses and multipliers for interesting items
- **Export Often**: Save your work by exporting configs regularly

## Future Enhancements

- [ ] Live preview of changes in game
- [ ] Undo/redo functionality
- [ ] Config version control
- [ ] Balance suggestions/warnings
- [ ] Visual map editor with drag-and-drop
- [ ] Skill tree visualization
- [ ] Item set bonus editor
