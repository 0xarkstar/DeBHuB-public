# Contributing to IrysBase

Thank you for your interest in contributing to IrysBase! This document provides guidelines and instructions for contributing.

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL
- Redis
- Git

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/irysbase.git
   cd irysbase
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Set Up Environment**
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   # Edit .env files with your configuration
   ```

4. **Initialize Database**
   ```bash
   pnpm run db:generate
   pnpm run db:migrate
   ```

5. **Start Development**
   ```bash
   pnpm run dev:enhanced
   ```

## 📝 Contribution Guidelines

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Build/tooling changes

**Examples:**
```bash
feat(api): add document search endpoint
fix(web): resolve wallet connection issue
docs(readme): update installation instructions
refactor(services): improve error handling
test(api): add integration tests for search
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (run `pnpm format`)
- **Linting**: ESLint (run `pnpm lint`)
- **Type Checking**: `pnpm typecheck`

### Testing

```bash
# Run all tests
pnpm test

# Run specific tests
pnpm test:integration
pnpm test:e2e

# Type checking
pnpm typecheck
```

## 🔧 Development Workflow

### 1. Create an Issue

Before starting work, create or find an issue describing the feature/fix.

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Write clean, documented code
- Follow existing patterns and conventions
- Add tests for new features
- Update documentation as needed

### 4. Test Your Changes

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Tests
pnpm test

# Run locally
pnpm run dev:enhanced
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat(scope): description"
```

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 📋 Pull Request Process

### PR Guidelines

1. **Title**: Use conventional commit format
2. **Description**: Clearly describe changes and motivation
3. **Tests**: Include tests for new features
4. **Documentation**: Update docs if needed
5. **Screenshots**: Add for UI changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Manually tested

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. Automated checks must pass
2. At least one maintainer approval required
3. Address review feedback
4. Squash and merge when approved

## 🏗️ Project Structure

```
irysbase/
├── apps/
│   ├── api/           # Backend API
│   └── web/           # Frontend
├── packages/
│   ├── core/          # Core orchestrator
│   ├── contracts/     # Smart contracts
│   ├── shared/        # Shared utilities
│   └── ...
└── docs/              # Documentation
```

## 📚 Resources

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Services Guide](./docs/SERVICES.md)
- [Getting Started](./docs/GETTING_STARTED.md)

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Verify it's reproducible
3. Test with latest version

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. ...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS, Windows, Linux]
- Node.js: [version]
- Browser: [if applicable]

## Additional Context
Screenshots, logs, etc.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches considered

## Additional Context
Mockups, examples, etc.
```

## 📖 Documentation

### Documentation Guidelines

- Clear and concise language
- Code examples when applicable
- Keep docs up to date with code
- Follow existing format and style

### Documentation Types

- **API Docs**: Update in `docs/API.md`
- **Architecture**: Update in `docs/ARCHITECTURE.md`
- **Services**: Update in `docs/SERVICES.md`
- **Guides**: Update in respective doc files

## 🎯 Areas to Contribute

### High Priority

- [ ] Test coverage improvements
- [ ] Performance optimizations
- [ ] Documentation enhancements
- [ ] Bug fixes

### Features

- [ ] Frontend components
- [ ] API endpoints
- [ ] Service improvements
- [ ] Smart contracts

### Infrastructure

- [ ] CI/CD improvements
- [ ] Monitoring and logging
- [ ] Docker optimizations
- [ ] Deployment scripts

## 🤔 Questions?

- **Documentation**: Check [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/irysbase/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/irysbase/discussions)

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to IrysBase! 🎉