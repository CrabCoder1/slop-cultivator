# Vercel Deployment Guide

## Overview

Slop Cultivator is deployed as two separate Vercel projects:
- **Game**: Main tower defense game application
- **Admin Tool**: Development tool for managing game configuration

## Live URLs

### Production (Custom Domain)
- **Game**: https://slop.crabcode.foo
- **Admin Tool**: https://admin.crabcode.foo

### Vercel Default URLs
- **Game**: https://slop-cultivator-game.vercel.app
- **Admin Tool**: https://slop-cultivator-admin.vercel.app

## Project Structure

Both projects are deployed from the same monorepo but use different build configurations:

### Game Project
- **Project Name**: `slop-cultivator-game`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Entry Point**: `index.html`
- **Config**: `vercel.json`

### Admin Project
- **Project Name**: `slop-cultivator-admin`
- **Build Command**: `npm run build:admin`
- **Output Directory**: `dist-admin`
- **Entry Point**: `admin/index.html`
- **Config**: `vercel-admin.json`

## Deployment Configuration

### vercel.json (Game)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### vercel-admin.json (Admin)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build:admin",
  "outputDirectory": "dist-admin",
  "framework": "vite"
}
```

## Build Process

Both projects skip TypeScript type checking during build to avoid blocking deployment on non-critical type errors:

```json
"build": "vite build",
"build:admin": "vite build --mode admin"
```

Type checking is still enforced during local development.

## Manual Deployment

### Prerequisites
```bash
npm install -g vercel
vercel login
```

### Deploy Game
```bash
vercel link --yes --project slop-cultivator-game
vercel --prod --yes
```

### Deploy Admin Tool
```bash
vercel link --yes --project slop-cultivator-admin
copy vercel-admin.json vercel.json
vercel --prod --yes
copy vercel.json vercel-admin.json  # Restore admin config
```

## Automatic Deployment

Both projects can be configured for automatic deployment via GitHub integration:
1. Connect your GitHub repository in Vercel dashboard
2. Pushes to `main` branch will trigger automatic deployments
3. Each project will build using its respective configuration

## Environment Variables

Environment variables are managed through Vercel dashboard:
- Navigate to Project Settings → Environment Variables
- Add Supabase credentials and other secrets
- Variables are automatically injected during build

## Troubleshooting

### Both URLs showing same content
If both URLs show the same app, the `.vercel` folder is linked to the wrong project:
```bash
vercel link --yes --project slop-cultivator-game
vercel --prod --yes
```

### Build failures
Check build logs in Vercel dashboard. Common issues:
- Missing dependencies in `package.json`
- TypeScript errors (should be skipped but may indicate real issues)
- Environment variables not set

### Port conflicts during local testing
The projects use fixed ports:
- Game: `localhost:5173`
- Admin: `localhost:5177`

These ports are only for local development and don't affect Vercel deployment.

## Custom Domain Configuration

The project uses custom domains from Porkbun:

### Current Setup
- **Domain**: `crabcode.foo`
- **Game Subdomain**: `slop.crabcode.foo`
- **Admin Subdomain**: `admin.crabcode.foo`

### DNS Configuration (Porkbun)
Both subdomains use CNAME records pointing to Vercel's DNS:

| Type  | Host  | Answer                              | TTL |
|-------|-------|-------------------------------------|-----|
| CNAME | slop  | 07e94d50f6f68b79.vercel-dns-017.com | 600 |
| CNAME | admin | 11edd9feafbf7d96.vercel-dns-017.com | 600 |

**Note**: CNAME records are preferred over A records as they automatically follow Vercel's infrastructure changes.

### Adding Domains to Vercel
Domains were added using Vercel CLI:

```bash
# Add game domain
vercel link --yes --project slop-cultivator-game
vercel domains add slop.crabcode.foo

# Add admin domain
vercel link --yes --project slop-cultivator-admin
vercel domains add admin.crabcode.foo
```

### SSL Certificates
- Automatically provisioned by Vercel
- Renewed automatically
- HTTPS enforced by default

### Verification
After adding DNS records, Vercel automatically verifies domain ownership. You'll receive an email when verification completes (usually 5-30 minutes).
