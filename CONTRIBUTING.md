# Contributing to @dcyfr/ai-agents

Thank you for your interest in contributing to the DCYFR AI Agents template!

## 🎯 Ways to Contribute

- 🐛 **Bug Reports** - Found an issue? Let us know
- ✨ **Feature Requests** - Have an idea? We'd love to hear it
- 📖 **Documentation** - Help improve our docs
- 🧪 **Tests** - Add test coverage
- 💻 **Code** - Submit bug fixes or new features
- 🎨 **Examples** - Create example agents

## 🚀 Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Git

### Setup Steps

```bash
# Clone repository
git clone https://github.com/dcyfr/dcyfr-ai-agents.git
cd dcyfr-ai-agents

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run examples
npm run example:customer-service
```

## 📁 Project Structure

```
dcyfr-ai-agents/
├── src/
│   ├── agent/
│   │   ├── core/          # Agent implementation
│   │   ├── tools/         # Tool system
│   │   └── memory/        # Memory implementations
│   └── types/             # TypeScript types
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── fixtures/          # Test fixtures
├── examples/              # Example agents
└── docs/                  # Documentation
```

## 🧪 Testing Guidelines

### Writing Tests

- Use Vitest for all tests
- Aim for 99%+ coverage
- Test both success and error cases
- Use descriptive test names

```typescript
describe('Feature', () => {
  it('should handle expected behavior', () => {
    // Test implementation
  });

  it('should handle edge case', () => {
    // Edge case test
  });

  it('should throw on invalid input', () => {
    // Error test
  });
});
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:run      # Run once (CI mode)
npm run test:coverage # Generate coverage report
```

## 📝 Code Style

### TypeScript

- Use strict mode (enabled by default)
- No `any` types
- Explicit return types for functions
- Use interfaces for objects, types for unions

```typescript
// ✅ Good
export function processData(input: string): Promise<Result> {
  // Implementation
}

// ❌ Bad
export function processData(input: any) {
  // Implementation
}
```

### Formatting

```bash
npm run lint          # Check code style
npm run lint:fix      # Auto-fix issues
npm run type-check    # Verify types
```

### Naming Conventions

- **Files**: kebab-case (`agent-executor.ts`)
- **Classes**: PascalCase (`AgentExecutor`)
- **Functions**: camelCase (`executeStep`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ITERATIONS`)
- **Types/Interfaces**: PascalCase (`AgentConfig`)

## 🔀 Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `test/description` - Test additions
- `refactor/description` - Code refactoring

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `test` - Tests
- `refactor` - Code refactoring
- `chore` - Maintenance

**Examples:**
```
feat(tools): add weather lookup tool
fix(agent): handle empty tool responses
docs(readme): update installation steps
test(memory): add long-term memory tests
```

### Pull Request Process

1. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dcyfr-ai-agents.git
   ```

2. **Create Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

3. **Make Changes**
   - Write code
   - Add tests (99%+ coverage required)
   - Update documentation
   - Run linter and tests

4. **Commit**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push**
   ```bash
   git push origin feature/my-feature
   ```

6. **Create PR**
   - Use descriptive title
   - Reference related issues
   - Describe changes
   - Add tests evidence
   - Request review

## ✅ PR Checklist

Before submitting, ensure:

- [ ] Tests pass (`npm test`)
- [ ] Code is linted (`npm run lint`)
- [ ] Types check (`npm run type-check`)
- [ ] Test coverage ≥99%
- [ ] Documentation updated
- [ ] Examples work (if applicable)
- [ ] CHANGELOG.md updated (for significant changes)
- [ ] No breaking changes (or clearly documented)

## 🐛 Bug Reports

### Good Bug Report Includes:

1. **Clear Title** - Describe the issue concisely
2. **Description** - What happened vs. what you expected
3. **Reproduction Steps** - Step-by-step instructions
4. **Environment** - Node version, OS, etc.
5. **Code Sample** - Minimal reproducible example
6. **Error Output** - Full error message/stack trace

### Template

```markdown
## Bug Description
[Clear description of the issue]

## Steps to Reproduce
1. [First step]
2. [Second step]
3. [...]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Node.js: [version]
- npm: [version]
- OS: [operating system]
- @dcyfr/ai-agents: [version]

## Code Sample
```typescript
// Minimal code to reproduce
```

## Error Output
```
[Error message and stack trace]
```
```

## ✨ Feature Requests

### Good Feature Request Includes:

1. **Use Case** - Why is this needed?
2. **Proposed Solution** - How should it work?
3. **Alternatives** - Other solutions considered
4. **Examples** - Code examples if possible

## 📖 Documentation

### Types of Documentation

- **README.md** - Quick start, overview
- **API Reference** - Detailed API docs
- **Guides** - How-to articles
- **Examples** - Working code samples
- **Architecture** - System design docs

### Writing Guidelines

- Clear, concise language
- Code examples for concepts
- Link to related docs
- Keep up-to-date with code

## 🎨 Creating Examples

Examples should:

1. **Demonstrate** a specific use case
2. **Be self-contained** (runnable standalone)
3. **Include comments** explaining key concepts
4. **Follow best practices**
5. **Be tested** (at least manually)

## 🔒 Security

- **Never commit** secrets or API keys
- **Report vulnerabilities** to security@dcyfr.ai (not public issues)
- **Follow secure coding** practices
- **Validate inputs** in tools

## 💬 Community

- Be respectful and inclusive
- Help others learn
- Provide constructive feedback
- Celebrate contributions

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution, no matter how small, makes a difference. We appreciate your support!

---

Questions? Email us at hello@dcyfr.ai or visit https://www.dcyfr.ai
