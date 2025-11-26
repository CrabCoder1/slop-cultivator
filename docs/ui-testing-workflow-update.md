# UI Testing Workflow Update

## Overview
Updated `.kiro/steering/ui-testing-workflow.md` to reflect comprehensive testing strategy developed during admin tool development.

## Major Additions

### 1. Expanded Test File Locations
Added categorization:
- **Visual & Styling Tests**: Background colors, theme, item selectors
- **Component Usage Tests**: Verify common component usage
- **Accessibility Tests**: Full accessibility audit

### 2. Testing Strategy Section
New comprehensive strategies:
- **Component Consistency Testing**: Verify all tabs use components consistently
- **Design System Verification**: Check components are actually used
- **Accessibility Testing**: Use axe-core for automated testing
- **Visual Regression Testing**: Test selected vs unselected states

### 3. Five Testing Patterns
Documented proven patterns:
1. **Basic Visual Verification**: Single element style checking
2. **Multi-Tab Consistency Testing**: Verify styling across all tabs
3. **Selected vs Unselected State Testing**: Interactive element states
4. **Component Usage Verification**: Ensure components used, not inline styles
5. **Accessibility Testing**: Zero violations requirement

### 4. Test Execution Workflow
Added detailed workflow:
- When to run which tests
- Test execution steps
- Quick feedback loop process

### 5. Best Practices Section
10 best practices learned from experience:
1. Always test across all tabs
2. Log actual values for debugging
3. Use specific RGB values
4. Test both selected and unselected states
5. Verify component usage, not just styling
6. Use waitForTimeout for tab switches
7. Test gradients carefully (browser differences)
8. Create reusable test patterns
9. Run tests after every UI change
10. Zero tolerance for accessibility violations

### 6. Enhanced "What to Verify" Section
Expanded to include:
- **Computed Styles**: All visual properties
- **Component Usage**: Form elements, buttons, headers
- **Accessibility**: Zero violations, contrast, ARIA

### 7. Common Pitfalls
Added component and testing issues:
- Inline styles bypass component system
- Inconsistent button styling
- Don't test only one tab
- Don't skip accessibility tests

## Key Principles Reinforced

### 1. No Screenshots
Maintained strict prohibition on screenshot-based testing. All verification must be programmatic.

### 2. Computed Styles Only
Never assume classes produce expected output. Always verify with `getComputedStyle()`.

### 3. Comprehensive Coverage
Test visual styling, component usage, consistency, and accessibility.

### 4. Zero Tolerance
All tests must pass before committing. No exceptions for accessibility violations.

## Impact

The updated workflow document now serves as:
- **Complete reference** for UI testing approach
- **Pattern library** for common test scenarios
- **Best practices guide** from real experience
- **Quality gate** ensuring consistent, accessible UI

## Test Suite Status

Current test coverage:
- ✅ 16 total tests passing
- ✅ Visual styling tests
- ✅ Component consistency tests
- ✅ Component usage tests
- ✅ Accessibility tests (zero violations)
- ✅ Selected/unselected state tests

All tests verify actual computed styles, not assumptions.
