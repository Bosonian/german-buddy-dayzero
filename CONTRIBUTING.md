# Contributing to DayZero

First off, thank you for considering contributing to DayZero! It's people like you that make DayZero such a great platform for mentorship.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- **Be respectful** and inclusive
- **Be patient** with newcomers
- **Be constructive** in feedback
- **Focus on what is best** for the community
- **Show empathy** towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** and what you expected
- **Include screenshots** if relevant
- **Include environment details** (OS, browser, Node/Python version)

**Bug Report Template:**

```markdown
## Bug Description
A clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g. macOS 13.1]
- Browser: [e.g. Chrome 108]
- Node Version: [e.g. 18.12.0]
- Python Version: [e.g. 3.11.0]

## Additional Context
Any other context about the problem.
```

### Suggesting Features

Feature suggestions are welcome! Before creating a feature suggestion:

- **Check the roadmap** to see if it's already planned
- **Check existing issues** to avoid duplicates
- **Provide a clear use case** for the feature

**Feature Request Template:**

```markdown
## Feature Description
A clear description of the feature.

## Problem it Solves
What problem does this feature solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other solutions you've considered.

## Additional Context
Mockups, examples, or other context.
```

### Pull Requests

#### Before You Start

1. **Check existing issues** to see if someone is already working on it
2. **Create an issue first** for major changes to discuss the approach
3. **Fork the repository** and create a branch from `main`
4. **Set up your development environment** (see README.md)

#### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Backend tests
   cd backend
   pytest

   # Frontend tests
   cd frontend
   npm test

   # Type checking
   npm run type-check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   Use conventional commit messages:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changed and why
   - Include screenshots for UI changes
   - List any breaking changes

**Pull Request Template:**

```markdown
## Description
Brief description of changes.

## Related Issue
Fixes #(issue number)

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
How has this been tested?

## Screenshots (if applicable)
Before/after screenshots for UI changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have commented complex code
- [ ] I have updated documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests
- [ ] All tests pass locally
```

## Development Guidelines

### Code Style

#### TypeScript/React (Frontend)

- Use **TypeScript** for all new code
- Follow **React best practices**
- Use **functional components** with hooks
- Use **Tailwind CSS** for styling
- Keep components **small and focused**
- Use **meaningful variable names**
- Add **TypeScript types** for all props and functions

Example:
```typescript
interface MentorCardProps {
  mentor: Mentor;
  onBook: (mentorId: string) => void;
}

export function MentorCard({ mentor, onBook }: MentorCardProps) {
  // Component implementation
}
```

#### Python (Backend)

- Follow **PEP 8** style guide
- Use **type hints** for all functions
- Write **descriptive docstrings**
- Use **async/await** for I/O operations
- Keep functions **small and focused**
- Use **Pydantic** for validation

Example:
```python
from typing import List
from fastapi import APIRouter, Depends
from app.schemas import MentorResponse

router = APIRouter()

@router.get("/mentors", response_model=List[MentorResponse])
async def list_mentors(
    category: str | None = None,
    skip: int = 0,
    limit: int = 20,
) -> List[MentorResponse]:
    """
    List mentors with optional filtering.

    Args:
        category: Filter by category slug
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of mentor profiles
    """
    # Implementation
```

### Testing

#### Frontend Tests

- Write tests for **all components**
- Test **user interactions**
- Test **edge cases**
- Use **React Testing Library**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MentorCard } from './MentorCard';

describe('MentorCard', () => {
  it('should call onBook when button is clicked', () => {
    const onBook = jest.fn();
    const mentor = { id: '1', name: 'John Doe', ... };

    render(<MentorCard mentor={mentor} onBook={onBook} />);

    fireEvent.click(screen.getByText('Book Session'));

    expect(onBook).toHaveBeenCalledWith('1');
  });
});
```

#### Backend Tests

- Write tests for **all endpoints**
- Test **authentication** and **authorization**
- Test **error cases**
- Use **pytest**

```python
import pytest
from fastapi.testclient import TestClient

def test_list_mentors(client: TestClient):
    response = client.get("/mentors")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_book_session_unauthorized(client: TestClient):
    response = client.post("/bookings", json={...})
    assert response.status_code == 401
```

### Documentation

- Update **README.md** for user-facing changes
- Update **API documentation** for endpoint changes
- Add **inline comments** for complex logic
- Write **clear commit messages**
- Update **CHANGELOG.md** for notable changes

### Database Migrations

When changing the database schema:

1. Create a migration (if using Alembic):
   ```bash
   alembic revision --autogenerate -m "Add new field to users"
   ```

2. Review the migration file
3. Test the migration locally
4. Include migration in your PR

## Project Structure

```
german-buddy-dayzero/
├── frontend/              # Next.js frontend
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and hooks
│   └── public/           # Static assets
├── backend/              # FastAPI backend
│   └── app/
│       ├── models.py     # Database models
│       ├── routers/      # API endpoints
│       ├── services/     # Business logic
│       └── schemas/      # Pydantic schemas
└── docs/                 # Documentation
```

## Getting Help

- **Discord**: Join our Discord server (coming soon)
- **GitHub Discussions**: For questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Email**: dev@dayzero.xyz (coming soon)

## Recognition

Contributors will be:
- Added to the **Contributors** section in README
- Mentioned in **release notes** for significant contributions
- Invited to **private beta** features (when available)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to DayZero! 🚀
