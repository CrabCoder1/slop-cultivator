# Slop Cultivator Documentation

This directory contains documentation for the Slop Cultivator game.

## Architecture Documentation

### People/Race System
- **[Migration Guide](people-race-system-migration.md)** - Complete guide to the Person Type system migration
- **[Database Schema](database-schema.md)** - Database tables, columns, and queries
- **[Creating Person Types](guide-creating-person-types.md)** - Step-by-step guide for designers
- **[Configuring Waves](guide-configuring-waves.md)** - Wave composition and balance guide

### Admin Tool
- **[Admin README](../admin/README.md)** - Admin tool features and usage

### Legacy Systems
- **[Deprecated Files](../figma%20v183/utils/DEPRECATED_README.md)** - Old cultivator and enemy systems

## Feature Documentation

### Completed Features
- **[Admin Color System](admin-color-system.md)** - Color palette and theming
- **[Admin Color Update Summary](admin-color-update-summary.md)** - Color system changes
- **[Admin Component Consistency](admin-component-consistency.md)** - Component standards
- **[Admin Layout Update](admin-layout-update.md)** - Layout improvements
- **[Admin Selectable Card Component](admin-selectable-card-component.md)** - Card component design
- **[Map System Refactor](map-system-refactor.md)** - Map loading system changes
- **[UI Testing Workflow Update](ui-testing-workflow-update.md)** - Testing guidelines

### Post-Mortems
- **[Testing Incident Post-Mortem](post-mortem-testing-incident.md)** - Lessons learned from testing issues

## Quick Links

### For Game Designers
1. Start with [Creating Person Types](guide-creating-person-types.md)
2. Then read [Configuring Waves](guide-configuring-waves.md)
3. Use the Admin Tool to create content

### For Developers
1. Read [Migration Guide](people-race-system-migration.md) for architecture overview
2. Check [Database Schema](database-schema.md) for data structures
3. Review service files in `shared/utils/`

### For QA/Testing
1. Review [UI Testing Workflow](ui-testing-workflow-update.md)
2. Check test files in `tests/` directory
3. Run integration tests for new features

## Documentation Standards

- Use Markdown format
- Include code examples
- Add diagrams where helpful
- Keep guides practical and actionable
- Update when features change
