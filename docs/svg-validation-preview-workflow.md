# SVG Validation and Preview Workflow

This document explains how to validate SVG assets and use the preview page for visual verification.

## Asset Preview Page

### Accessing the Preview Page

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:5173/asset-preview`

The preview page displays all assets organized by category with visual indicators for their status.

### Preview Page Features

- **Category Grouping**: Assets are organized by type (UI, Weapons, Skills, etc.)
- **Multi-Size Display**: Each asset is shown at 24x24, 48x48, and 64x64 pixels
- **Status Indicators**: Visual distinction between pending (gray) and ready (full color) assets
- **Asset Information**: Shows asset name, key, and current status
- **Overall Stats**: Header displays total ready/pending/total counts

### Using the Preview Page

1. **Locate Your Asset**: Find your asset in the appropriate category section
2. **Check All Sizes**: Verify the asset looks correct at 24x24, 48x48, and 64x64
3. **Compare with Neighbors**: Ensure visual consistency with other assets in the category
4. **Check Status Badge**: Confirm the status shows correctly (pending vs ready)

## Review Checklist

Before marking an asset as `'ready'`, verify all of the following:

### ✅ Size Verification
- [ ] Asset is readable at 24x24 pixels
- [ ] Asset scales cleanly to 48x48 pixels
- [ ] Asset scales cleanly to 64x64 pixels
- [ ] No pixelation or blurring at any size
- [ ] Important details remain visible at smallest size

### ✅ Color Compliance
- [ ] All fill colors are from the approved palette
- [ ] All stroke colors are from the approved palette
- [ ] No unapproved hex values (check with validation tests)
- [ ] Colors match the intended category (e.g., gold for accents)

### ✅ ViewBox Validation
- [ ] ViewBox is exactly `0 0 24 24`
- [ ] SVG includes `width="24"` and `height="24"` attributes
- [ ] Content fits within the viewBox boundaries

### ✅ Visual Consistency
- [ ] Style matches existing ready assets (sword, spear, inventory)
- [ ] Similar level of detail and complexity
- [ ] Consistent lighting direction (top-left)
- [ ] Appropriate use of highlights and shadows

### ✅ Technical Quality
- [ ] SVG is valid XML
- [ ] No embedded images or external references
- [ ] No complex filters that may not render consistently
- [ ] File size is reasonable (< 5KB for simple icons)

## Automated Validation Tests

The project includes automated tests that validate SVG assets:

### Running Validation Tests

```bash
# Run all SVG validation tests
npx playwright test tests/svg-validation.spec.ts --reporter=list

# Run asset manifest tests
npx playwright test tests/asset-manifest-helper-functions.spec.ts --reporter=list

# Run path validation tests
npx playwright test tests/asset-manifest-path-validation.spec.ts --reporter=list
```

### What the Tests Check

| Test File | What It Validates |
|-----------|-------------------|
| `svg-validation.spec.ts` | ViewBox format, color palette compliance |
| `asset-manifest-helper-functions.spec.ts` | Asset entry completeness, fallback resolution |
| `asset-manifest-path-validation.spec.ts` | Directory path format, category organization |

### Property-Based Tests

The validation system uses property-based testing to verify:

1. **Property 7: ViewBox Consistency** - All ready SVGs have `viewBox="0 0 24 24"`
2. **Property 8: Color Palette Compliance** - All colors are from the approved palette

## Troubleshooting Common SVG Issues

### Issue: Asset Appears Blurry

**Cause**: ViewBox doesn't match content dimensions or content extends beyond viewBox.

**Solution**:
1. Ensure viewBox is `0 0 24 24`
2. Verify all paths and shapes fit within 0-24 coordinate range
3. Check that no transforms are scaling content unexpectedly

### Issue: Colors Don't Match Preview

**Cause**: Using colors not in the approved palette.

**Solution**:
1. Run the color validation test to identify invalid colors
2. Replace with nearest approved palette color
3. See [Color Palette](./svg-asset-creation-guide.md#color-palette) for approved values

### Issue: Asset Too Complex at Small Size

**Cause**: Too much detail for 24x24 display.

**Solution**:
1. Simplify shapes - use fewer path points
2. Increase stroke widths for visibility
3. Remove fine details that disappear at small sizes
4. Focus on the most recognizable silhouette

### Issue: SVG Not Rendering

**Cause**: Invalid SVG syntax or missing namespace.

**Solution**:
1. Ensure SVG has `xmlns="http://www.w3.org/2000/svg"`
2. Validate XML syntax (check for unclosed tags)
3. Remove any unsupported elements or attributes
4. Test in browser directly before adding to project

### Issue: Asset Shows Fallback Emoji Instead of SVG

**Cause**: Status not updated or file path incorrect.

**Solution**:
1. Verify the SVG file exists at the path specified in manifest
2. Check that status is set to `'ready'` in `asset-manifest.ts`
3. Ensure file name matches the path exactly (case-sensitive)
4. Restart dev server if changes aren't reflected

### Issue: Validation Test Fails for ViewBox

**Cause**: ViewBox format doesn't match expected `0 0 24 24`.

**Solution**:
1. Open SVG file and check viewBox attribute
2. Common mistakes:
   - `viewBox="0, 0, 24, 24"` (commas instead of spaces)
   - `viewBox="0 0 48 48"` (wrong dimensions)
   - Missing viewBox entirely
3. Correct to: `viewBox="0 0 24 24"`

### Issue: Validation Test Fails for Colors

**Cause**: Using hex colors not in the approved palette.

**Solution**:
1. Run test to see which colors are invalid
2. Map invalid colors to nearest approved palette color:
   - Generic gray → `#B8C4D0` (steel light)
   - Generic brown → `#8B5A2B` (leather primary)
   - Generic gold → `#DAA520` (gold primary)
   - Generic red → `#8B0000` (crimson)
3. Update SVG with corrected colors

## Visual Regression Testing

The project uses Playwright for visual regression testing of the asset preview page.

### Running Visual Tests

```bash
npx playwright test tests/asset-preview-visual.spec.ts --reporter=list
```

### Updating Baseline Screenshots

When intentionally changing asset appearance:

```bash
npx playwright test tests/asset-preview-visual.spec.ts --update-snapshots
```

### What Visual Tests Catch

- Unintended changes to existing assets
- Layout issues in the preview grid
- Rendering differences across browsers
- Size/scaling problems

## Related Documentation

- [SVG Asset Creation Guide](./svg-asset-creation-guide.md)
- [Asset Priority List](./svg-asset-priority-list.md)
