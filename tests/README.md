# Testing Guide

This project uses [Vitest](https://vitest.dev/) for fast, modern testing with full TypeScript support.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI (visual test runner)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── setup.ts                    # Global test setup and mocks
├── api/                        # API route tests
│   ├── organizer/
│   │   └── profile.test.ts    # Organizer profile API tests
│   ├── artist/
│   └── personal/
└── README.md                   # This file
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Feature Name', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  it('should do something', () => {
    // Arrange
    const input = 'test'
    
    // Act
    const result = myFunction(input)
    
    // Assert
    expect(result).toBe('expected')
  })
})
```

### Testing API Routes

When testing Next.js API routes, use the hoisted mock pattern to avoid initialization errors:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist mocks to avoid initialization errors
const { mockAuth, mockPrisma } = vi.hoisted(() => {
  const mockAuth = vi.fn()
  const mockPrisma = {
    model: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  }
  return { mockAuth, mockPrisma }
})

// Mock modules
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}))

// Import after mocks
import { POST } from '@/app/api/your-route/route'

describe('Your API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: null })
  })

  it('should handle authenticated request', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' })
    mockPrisma.model.findUnique.mockResolvedValue({ id: 'test' })

    const request = new Request('http://localhost:3000/api/your-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ id: 'test' })
  })
})
```

## Global Mocks

The following modules are globally mocked in `tests/setup.ts`:

- **Next.js Navigation** (`next/navigation`)
  - `useRouter`, `usePathname`, `useSearchParams`, `redirect`, `notFound`
  
- **Next.js Headers** (`next/headers`)
  - `cookies`, `headers`
  
- **Clerk Auth** (`@clerk/nextjs`, `@clerk/nextjs/server`)
  - `auth`, `currentUser`, `useUser`, `SignIn`, `SignUp`, `UserButton`
  
- **Internationalization** (`next-intl`)
  - `useTranslations`, `NextIntlClientProvider`
  
- **Prisma Client** (`@/lib/prisma`)
  - All model methods (findUnique, findMany, create, update, delete, etc.)

## Test Coverage

Generate a coverage report to see which parts of your code are tested:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory and include:
- HTML report (open `coverage/index.html` in a browser)
- JSON report
- Text summary in terminal

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Test from the user's perspective

2. **Keep Tests Isolated**
   - Each test should be independent
   - Use `beforeEach` to reset state
   - Don't rely on test execution order

3. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('should return 401 when user is not authenticated')
   
   // Bad
   it('test auth')
   ```

4. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should create user', () => {
     // Arrange - set up test data
     const userData = { name: 'Test' }
     
     // Act - execute the code under test
     const result = createUser(userData)
     
     // Assert - verify the result
     expect(result.name).toBe('Test')
   })
   ```

5. **Mock External Dependencies**
   - Don't hit real databases or APIs in tests
   - Use mocks to simulate external behavior
   - Keep tests fast and deterministic

## Debugging Tests

### Run a Single Test File
```bash
npm test -- profile.test.ts
```

### Run Tests Matching a Pattern
```bash
npm test -- --grep "POST"
```

### Debug in VS Code
Add this configuration to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Continuous Integration

Tests run automatically on every push and pull request. Ensure all tests pass before merging.

The CI pipeline runs:
1. Unit tests
2. Integration tests
3. Coverage checks (minimum 70% coverage required)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://testingjavascript.com/)