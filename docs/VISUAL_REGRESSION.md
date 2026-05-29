# Visual Regression Testing Guide

This guide explains how visual regression testing works in ChainBridge and how to review and manage visual changes.

## Overview

ChainBridge uses **Chromatic** with **Storybook** for automated visual regression testing of UI components. This ensures that visual changes are intentional and reviewed before merging.

## How It Works

### 1. Component Stories
Each UI component has Storybook stories that define different states and variations:
```typescript
// Example: Button.stories.tsx
export const Default: Story = {
  args: { children: 'Connect Wallet' },
};

export const Variants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="default">Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};
```

### 2. Automated Testing
- **CI/CD**: Visual tests run automatically on every PR and push to main branches
- **Screenshot Comparison**: Each story is captured as a screenshot and compared against baselines
- **Change Detection**: Visual differences are flagged for review

### 3. Review Process
When visual changes are detected:
1. Chromatic creates a build with visual differences
2. Team members review changes in the Chromatic UI
3. Changes can be approved or rejected
4. Approved baselines become the new standard

## Running Tests Locally

### Prerequisites
```bash
cd frontend
npm install
```

### Local Visual Testing
```bash
# Run visual tests locally (accepts changes automatically)
npm run test:visual

# Run without accepting changes (for review)
npm run test:visual:local
```

### Storybook Development
```bash
# Start Storybook for manual testing
npm run storybook

# Build Storybook static files
npm run build-storybook
```

## CI/CD Integration

### GitHub Actions Workflow
The visual regression workflow (`.github/workflows/visual-regression.yml`) runs:

1. **On Pull Requests**: Tests against the target branch
2. **On Main Branch Pushes**: Updates baselines for approved changes
3. **Comments**: Posts test results as PR comments

### Environment Variables
- `CHROMATIC_PROJECT_TOKEN`: Required for CI integration
- Set in GitHub repository secrets

## Reviewing Visual Changes

### Chromatic Dashboard
Access the Chromatic dashboard to review changes:
1. Click the link in the PR comment
2. Review side-by-side comparisons
3. Use keyboard shortcuts for efficient navigation

### Change Categories
- **Added**: New components or stories
- **Changed**: Visual modifications to existing components
- **Removed**: Deleted components or stories

### Approval Guidelines
✅ **Approve** when:
- Intentional design improvements
- Bug fixes affecting visual appearance
- New component variations
- Responsive design adjustments

❌ **Reject** when:
- Accidental visual regressions
- Broken layouts or styling
- Unintended color/type changes
- Accessibility issues

## Best Practices

### Writing Good Stories
1. **Cover All States**: Include normal, hover, disabled, loading states
2. **Use Real Content**: Use realistic text and data
3. **Test Variants**: Show all size, color, and variant options
4. **Include Edge Cases**: Empty states, error states, long content

### Component Design
1. **Consistent Spacing**: Use design tokens for margins/padding
2. **Predictable Colors**: Define color palette in theme
3. **Responsive Design**: Test multiple viewport sizes
4. **Accessibility**: Include focus states and ARIA attributes

### Minimizing False Positives
1. **Stable Content**: Use consistent placeholder text
2. **Avoid Animations**: Disable animations in tests
3. **Consistent Theme**: Set fixed theme for testing
4. **Network Conditions**: Wait for fonts/images to load

## Troubleshooting

### Common Issues

#### Flaky Tests
**Problem**: Tests pass/fail inconsistently
**Solution**: 
- Add explicit waits for network requests
- Disable animations and transitions
- Use consistent viewports

#### False Positives
**Problem**: Tests flag irrelevant changes
**Solution**:
- Add CSS normalization for testing
- Use consistent fonts and loading strategies
- Exclude dynamic content from comparison

#### Build Failures
**Problem**: Visual tests fail in CI
**Solution**:
- Check Chromatic project token
- Verify Storybook builds successfully
- Review GitHub Actions logs

### Debug Commands
```bash
# Debug specific story
npm run storybook -- --story "Button--Default"

# Run tests with verbose output
npm run test:visual -- --verbose

# Test specific viewport
npm run test:visual:local -- --viewport mobile
```

## Configuration Files

### Storybook Configuration
- `.storybook/main.ts`: Main Storybook config
- `.storybook/test-runner.js`: Visual test runner settings
- `.storybook/visual-tests.config.js`: Chromatic configuration

### Component Stories
- `src/stories/ui/*.stories.tsx`: UI component stories
- Organized by component type (Button, StatusBadge, etc.)

## Version Control

### Baseline Management
- **Versioned Baselines**: Each release has approved visual baselines
- **Branch Strategy**: Feature branches test against `main` baselines
- **Merge Strategy**: Approved changes update baselines automatically

### Review Workflow
1. **Developer**: Creates PR with visual changes
2. **CI**: Runs visual tests and posts results
3. **Reviewer**: Checks Chromatic dashboard for changes
4. **Approval**: Changes approved in Chromatic UI
5. **Merge**: PR merged with updated baselines

## Performance Considerations

### Optimization
- **Parallel Testing**: Stories run in parallel for faster execution
- **Smart Caching**: Only test changed components
- **Incremental Builds**: Reuse previous build artifacts

### CI Costs
- **Chromatic Quotas**: Monitor usage to avoid overages
- **Selective Testing**: Test only changed files when possible
- **Build Caching**: Cache Storybook builds between runs

## Security

### Sensitive Content
- **No Secrets**: Avoid displaying API keys or tokens in stories
- **Sanitized Data**: Use mock data instead of real user information
- **Environment Isolation**: Test environment separate from production

### Access Control
- **Team Permissions**: Limit who can approve visual changes
- **Branch Protection**: Require visual test approval for merges
- **Audit Trail**: Track who approved/rejected changes

## Integration with Other Tests

### Unit Tests
- **Complementary**: Visual tests complement, don't replace unit tests
- **Coverage**: Visual tests cover UI appearance, unit tests cover logic
- **CI Pipeline**: Both run in same CI workflow

### E2E Tests
- **Different Scope**: E2E tests test user flows, visual tests test components
- **Shared Fixtures**: Can share test data and utilities
- **Consistent Environment**: Both use same test infrastructure

## Future Enhancements

### Planned Features
- **Accessibility Testing**: Automated accessibility checks
- **Performance Testing**: Visual performance metrics
- **Cross-Browser Testing**: Multiple browser testing
- **Mobile Testing**: Native mobile app visual testing

### Tool Improvements
- **Better Diff Visualization**: Enhanced change comparison
- **AI-Powered Review**: Automated change classification
- **Integration**: Better integration with design tools
- **Reporting**: Enhanced analytics and reporting

## Support

### Getting Help
- **Documentation**: [Storybook Docs](https://storybook.js.org/)
- **Chromatic Support**: [Chromatic Help Center](https://www.chromatic.com/docs)
- **GitHub Issues**: Report issues in repository

### Training Resources
- **Visual Testing Best Practices**: Team training materials
- **Component Library Guidelines**: Design system documentation
- **Code Review Guidelines**: Review process documentation
