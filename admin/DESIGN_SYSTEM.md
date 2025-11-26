# Admin Tool Design System

## Overview
Reusable UI components ensure consistent styling across all editors.

## Components

### FormInput
```tsx
<FormInput
  label="Name"
  type="text"
  value={value}
  onChange={handler}
/>
```
- Dark background (#020617)
- White text (#ffffff)
- Emerald borders
- Consistent padding and sizing

### FormTextarea
```tsx
<FormTextarea
  label="Description"
  value={value}
  onChange={handler}
  rows={3}
/>
```
- Same styling as FormInput
- For multi-line text

### FormSelect
```tsx
<FormSelect
  label="Type"
  value={value}
  onChange={handler}
>
  <option>Option 1</option>
</FormSelect>
```
- Dark theme with colorScheme: 'dark'
- Consistent with inputs

### Button
```tsx
<Button variant="success" onClick={handler}>
  Save
</Button>
```
- Variants: primary, success, danger
- Xianxia themed colors

## Usage
Import from `./ui`:
```tsx
import { FormInput, FormTextarea, FormSelect, Button } from './ui';
```

## Benefits
1. **Consistency** - All forms look the same
2. **Accessibility** - Inline styles ensure visibility
3. **Maintainability** - Change once, apply everywhere
4. **Testing** - Fix once, all editors fixed

## Next Steps
1. Update all editors to use design system components
2. Run accessibility tests
3. All tabs will pass automatically
