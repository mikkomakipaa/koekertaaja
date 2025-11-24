# Contributing to Exam Prepper

Thank you for your interest in contributing to Exam Prepper! This document provides guidelines and best practices for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch Naming Convention](#branch-naming-convention)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Security](#security)

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's coding standards

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A Supabase account (for database)
- An Anthropic API key (for AI features)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/mikkomakipaa/exam-prepper.git
cd exam-prepper

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your credentials to .env.local
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_key
# ANTHROPIC_API_KEY=your_api_key

# Run development server
npm run dev
```

---

## Development Workflow

We follow **GitHub Flow** - a simple, branch-based workflow:

```
main (production-ready)
  ↓
feature/your-feature (development)
  ↓
Pull Request → Code Review → Merge
  ↓
main (updated)
  ↓
Delete feature branch
```

### Step-by-Step Workflow

1. **Sync with main branch**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add user authentication"
   ```

5. **Push to remote**
   ```bash
   git push -u origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Fill in the template
   - Request review

7. **Address review feedback**
   ```bash
   # Make changes
   git add .
   git commit -m "fix: address review comments"
   git push
   ```

8. **After merge, clean up**
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

---

## Branch Naming Convention

Use semantic, descriptive branch names with the following prefixes:

### Branch Name Format

```
<type>/<short-description>
```

### Allowed Types

| Type | Purpose | Example |
|------|---------|---------|
| `feature/` | New features or enhancements | `feature/user-authentication` |
| `bugfix/` or `fix/` | Bug fixes | `bugfix/login-error` |
| `hotfix/` | Critical production fixes | `hotfix/security-patch` |
| `security/` | Security-related changes | `security/rate-limiting` |
| `refactor/` | Code refactoring (no behavior change) | `refactor/api-structure` |
| `docs/` | Documentation only | `docs/api-documentation` |
| `test/` | Test additions or fixes | `test/api-integration` |
| `chore/` | Maintenance tasks | `chore/update-deps` |
| `perf/` | Performance improvements | `perf/optimize-queries` |

### Branch Naming Rules

✅ **Good Examples:**
```bash
feature/add-oauth
bugfix/file-upload-crash
security/input-validation
docs/contributing-guide
chore/update-dependencies
```

❌ **Bad Examples:**
```bash
fix-bug                      # Missing type prefix
feature/fix_the_login_bug    # Use kebab-case, not snake_case
john-dev                     # Not descriptive
temp                         # Not semantic
feature/very-long-branch-name-that-is-too-descriptive  # Too long
```

### Best Practices

- **Keep it short:** 20-40 characters max
- **Use kebab-case:** Words separated by hyphens
- **Be descriptive:** Clearly indicate the purpose
- **No personal names:** Branch describes work, not person
- **No issue numbers in name:** Link issues in PR description instead

### With Issue Tracking

If you use issue tracking (GitHub Issues, Jira, etc.):

```bash
feature/GH-123-user-auth      # GitHub issue #123
bugfix/JIRA-456-payment-fix   # Jira ticket
```

---

## Commit Message Guidelines

We follow **Conventional Commits** specification for clear, semantic commit history.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, missing semicolons, etc.) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks (dependencies, build, etc.) |
| `security` | Security-related changes |
| `ci` | CI/CD changes |
| `revert` | Revert a previous commit |

### Examples

```bash
# Simple commit
git commit -m "feat: add user registration"

# With scope
git commit -m "fix(auth): resolve login timeout issue"

# With body
git commit -m "feat: implement rate limiting

Add middleware to limit API requests to 5 per hour per IP address.
Prevents DoS attacks and API cost exhaustion."

# Breaking change
git commit -m "feat!: change API response format

BREAKING CHANGE: API now returns data in { success, data, error } format"

# Multiple issues
git commit -m "fix: resolve payment processing bugs

Fixes #123, #456, #789"
```

### Commit Message Rules

- **Use imperative mood:** "add feature" not "added feature"
- **Lowercase subject:** Start with lowercase letter
- **No period at end:** Subject line should not end with a period
- **Keep subject < 50 chars:** For better readability
- **Wrap body at 72 chars:** For terminal readability
- **Separate subject and body:** Use blank line
- **Explain what and why:** Not just how

✅ **Good:**
```bash
feat: add email verification
fix: prevent duplicate submissions
docs: update API documentation
```

❌ **Bad:**
```bash
Added some stuff
WIP
Fixed bug
Update README.md
```

---

## Pull Request Process

### Before Creating a PR

1. **Ensure your branch is up to date**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main  # or git merge main
   ```

2. **Run tests and checks**
   ```bash
   npm run typecheck   # TypeScript checks
   npm run lint        # ESLint
   npm run build       # Build to catch errors
   ```

3. **Update documentation** if needed

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push -u origin feature/your-feature
   ```

2. **Go to GitHub** and click "New Pull Request"

3. **Fill in the PR template** (see `.github/pull_request_template.md`)

4. **Request reviewers** (if applicable)

5. **Link related issues** using keywords:
   ```markdown
   Closes #123
   Fixes #456
   Resolves #789
   ```

### PR Title Format

Use the same format as commit messages:

```
<type>: <description>
```

**Examples:**
- `feat: Add user authentication`
- `fix: Resolve file upload error`
- `security: Implement rate limiting`
- `docs: Update contributing guidelines`

### PR Description Checklist

Your PR description should include:

- [ ] **Summary** of changes
- [ ] **Motivation** why this change is needed
- [ ] **Testing** performed
- [ ] **Screenshots** (for UI changes)
- [ ] **Breaking changes** (if any)
- [ ] **Related issues** (linked)

### Review Process

1. **Address feedback promptly**
2. **Keep discussions constructive**
3. **Request re-review** after addressing comments
4. **Don't force-push** after review starts (use new commits)
5. **Squash commits** before merge (if requested)

### After Merge

1. **Delete your branch**
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/your-feature
   git push origin --delete feature/your-feature
   ```

2. **Celebrate!** 🎉

---

## Code Style

### TypeScript / JavaScript

- Use **TypeScript** for all new code
- Follow **ESLint** rules (run `npm run lint`)
- Use **Prettier** for formatting (configured in project)
- Prefer **functional components** with hooks in React
- Use **async/await** over promises
- Add **JSDoc comments** for complex functions

### File Organization

```
src/
├── app/              # Next.js pages and API routes
├── components/       # Reusable React components
├── lib/             # Core business logic
│   ├── ai/          # AI/LLM integration
│   ├── supabase/    # Database queries
│   ├── utils/       # Helper functions
│   └── validation/  # Input validation schemas
├── config/          # Configuration files
└── types/           # TypeScript type definitions
```

### Naming Conventions

- **Files:** `kebab-case.ts`
- **Components:** `PascalCase.tsx`
- **Functions:** `camelCase()`
- **Constants:** `UPPER_SNAKE_CASE`
- **Types/Interfaces:** `PascalCase`
- **Private functions:** `_camelCase()` (with underscore prefix)

### Example

```typescript
// Good
export function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(6);
  // ...
}

// Bad
export function GenerateCode(): string { /* ... */ }  // Wrong case
export function generate_code(): string { /* ... */ }  // Snake case
```

---

## Testing

### Running Tests

```bash
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run typecheck     # TypeScript type checking
```

### Writing Tests

- Write tests for **all new features**
- Maintain **test coverage** above 80%
- Test **edge cases** and **error scenarios**
- Use **descriptive test names**

### Test Structure

```typescript
describe('generateCode', () => {
  it('should generate a 6-character code', () => {
    const code = generateCode();
    expect(code).toHaveLength(6);
  });

  it('should only contain alphanumeric characters', () => {
    const code = generateCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('should generate unique codes', () => {
    const code1 = generateCode();
    const code2 = generateCode();
    expect(code1).not.toBe(code2);
  });
});
```

---

## Security

### Security Best Practices

1. **Never commit secrets**
   - Use `.env.local` for local development
   - Add `.env*` to `.gitignore`
   - Use environment variables for secrets

2. **Input validation**
   - Validate all user inputs
   - Use Zod schemas for API validation
   - Sanitize data before database insertion

3. **Authentication & Authorization**
   - Never trust client-side data
   - Use server-side validation
   - Implement proper RLS policies in Supabase

4. **Rate limiting**
   - Implement rate limiting on expensive endpoints
   - Monitor for abuse patterns

5. **Dependencies**
   - Keep dependencies up to date
   - Run `npm audit` regularly
   - Review dependency security advisories

### Reporting Security Issues

**DO NOT** open a public issue for security vulnerabilities.

Instead, email security issues to: [your-email@example.com]

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)

---

## Questions?

If you have questions, feel free to:
- Open a [GitHub Discussion](https://github.com/mikkomakipaa/exam-prepper/discussions)
- Create an issue with the `question` label
- Reach out to the maintainers

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to Exam Prepper! 🎉**
