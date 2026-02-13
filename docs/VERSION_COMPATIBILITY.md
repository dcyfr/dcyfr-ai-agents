# Version Compatibility Guide

## Overview

This document outlines version compatibility requirements between `@dcyfr/ai` (runtime) and `@dcyfr/ai-agents` packages to ensure reliable autonomous agent operation.

## Version Compatibility Matrix

### Supported Combinations ✅

| @dcyfr/ai-agents | @dcyfr/ai | Status | Notes |
|------------------|-----------|--------|-------|
| 1.0.x | 1.0.4+ | ✅ Recommended | Latest features and compatibility |
| 1.0.x | 1.0.3 | ✅ Supported | Minor feature limitations |
| 1.0.x | 1.0.2 | ✅ Supported | Runtime warnings may appear |
| 1.0.x | 1.0.1 | ⚠️ Limited | Version skew warnings |

### Unsupported Combinations ❌

| @dcyfr/ai-agents | @dcyfr/ai | Status | Issue |
|------------------|-----------|--------|-------|
| 2.0.x | 1.x.x | ❌ Incompatible | Major version mismatch |
| 1.0.x | 0.x.x | ❌ Incompatible | Breaking changes |
| 1.0.x | 2.x.x | ⚠️ May work | Untested combination |

## Compatibility Rules

### 1. Major Version Matching
- **Required**: Major versions MUST match (1.x.x with 1.x.x)
- **Rationale**: Major versions introduce breaking changes
- **Warning**: "Version Mismatch Warning" logged if violated

### 2. Minor Version Tolerance
- **Supported**: Runtime can be newer minor version than agents
- **Example**: `@dcyfr/ai-agents@1.0.x` with `@dcyfr/ai@1.2.x` ✅
- **Limit**: Agents should not be >2 minor versions ahead of runtime
- **Warning**: "Version Skew Warning" logged if exceeded

### 3. Patch Version Flexibility
- **Supported**: Any patch version combination within same minor
- **Example**: `@dcyfr/ai-agents@1.0.5` with `@dcyfr/ai@1.0.4` ✅
- **Note**: No warnings for patch version differences

## Installation Guide

### New Projects (Recommended)

```bash
# Install latest compatible versions
npm install @dcyfr/ai@latest @dcyfr/ai-agents@latest

# Or pin to specific versions for stability
npm install @dcyfr/ai@^1.0.4 @dcyfr/ai-agents@^1.0.0
```

### Existing Projects

```bash
# Check current versions
npm list @dcyfr/ai @dcyfr/ai-agents

# Upgrade to compatible versions
npm install @dcyfr/ai@^1.0.4

# Verify compatibility
npm run test
```

## Version Checking

### Automatic Detection

The AgentRuntime automatically checks version compatibility during initialization:

```typescript
import { AgentRuntime } from '@dcyfr/ai/runtime';

// Version checking happens automatically
const runtime = new AgentRuntime(
  'my-agent',
  providerRegistry,
  memory,
  telemetry
);
// Console output: version warnings if needed
```

### Manual Verification

```bash
# Environment variable method
export DCYFR_AGENTS_VERSION="1.0.0"
node your-agent.js

# Check versions programmatically
node -e "console.log(require('@dcyfr/ai/package.json').version)"
node -e "console.log(require('@dcyfr/ai-agents/package.json').version)"
```

## CI/CD Integration

### GitHub Actions Matrix

The project includes automated version compatibility testing:

```yaml
strategy:
  matrix:
    dcyfr-ai-version: ['1.0.4', '1.0.3', '1.0.2', '1.0.1']
    node-version: ['20', '22']
```

This ensures compatibility across version combinations before release.

### Enterprise Deployment

```bash
# Lock dependencies for consistent deployments
npm ci --production

# Verify versions in production
npm list --depth=0 @dcyfr/ai @dcyfr/ai-agents

# Monitor logs for version warnings
grep "Version.*Warning" /var/log/your-app.log
```

## Troubleshooting

### Version Mismatch Warnings

**Symptom**: Console warning during AgentRuntime initialization
```
[AgentRuntime] Version Mismatch Warning: Runtime v1.0.4 (major 1) with Agents v2.0.0 (major 2)
```

**Solution**:
1. Update both packages to compatible versions:
   ```bash
   npm install @dcyfr/ai@latest @dcyfr/ai-agents@latest
   ```
2. Check peer dependencies in package.json
3. Clear node_modules and reinstall if needed

### Version Skew Warnings

**Symptom**: Console warning about minor version differences
```
[AgentRuntime] Version Skew Warning: Agents v1.3.0 is significantly ahead of runtime v1.0.4
```

**Solution**:
1. Upgrade runtime package:
   ```bash
   npm install @dcyfr/ai@latest
   ```
2. Test agent functionality with new version
3. Update CI/CD pipelines with new version constraints

### Missing Version Detection

**Symptom**: Warning about unable to detect agents version
```
[AgentRuntime] Warning: Unable to detect @dcyfr/ai-agents version
```

**Solution**:
1. Set environment variable:
   ```bash
   export DCYFR_AGENTS_VERSION="1.0.0"
   ```
2. Verify package.json includes correct version
3. Check if running in containerized environment

## Best Practices

### Development
- Use exact versions in package-lock.json for consistency
- Test with multiple runtime versions during development
- Enable version checking logs during debugging

### Production
- Pin to specific minor versions for stability
- Monitor application logs for version warnings
- Implement health checks that verify component versions

### CI/CD
- Include version compatibility tests in pipeline
- Test version upgrade scenarios before deployment
- Document version dependencies in deployment guides

## Migration Instructions

### From Pre-1.0 Versions

Pre-1.0 versions are not compatible with the version checking system. Upgrade path:

1. Update to latest 1.x versions
2. Test agent functionality thoroughly
3. Update any deprecated API usage
4. Deploy with version checking enabled

### Between Minor Versions

Minor version updates within 1.x are generally safe:

1. Update runtime first: `npm install @dcyfr/ai@1.x.0`
2. Test agents with new runtime
3. Update agents if needed: `npm install @dcyfr/ai-agents@1.x.0`
4. Monitor for deprecation warnings

### Planning Major Version Updates

For future 2.0 releases:

1. Review breaking changes in CHANGELOG.md
2. Test in staging environment first
3. Update both packages simultaneously
4. Follow migration guides for API changes

---

**Last Updated**: February 12, 2026  
**Version**: 1.0.4  
**Status**: Active