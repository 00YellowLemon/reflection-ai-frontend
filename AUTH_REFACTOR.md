# Authentication Refactor

This project has been refactored to use a context-based authentication approach instead of the previous hook-based system.

## New Authentication System

### Key Components

1. **AuthContext** (`contexts/AuthContext.tsx`)
   - Provides authentication state and methods throughout the app
   - Handles Firebase authentication and server session management
   - Uses `router.push()` for navigation after auth actions

2. **RouteGuard** (`components/RouteGuard.tsx`)
   - Protects routes based on authentication state
   - Handles redirects for authenticated/unauthenticated users
   - Shows loading states during auth checks

3. **useAuth Hook**
   - Exported from AuthContext
   - Provides access to user state, loading state, and auth methods
   - Replaces the previous `useServerAuth` hook

### Usage

#### In Layout
```tsx
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

#### In Protected Pages
```tsx
import { RouteGuard } from "@/components/RouteGuard";

export default function ProtectedPage() {
  return (
    <RouteGuard requireAuth={true}>
      {/* Page content */}
    </RouteGuard>
  );
}
```

#### In Components
```tsx
import { useAuth } from "@/contexts/AuthContext";

export default function MyComponent() {
  const { user, loading, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return <div>Welcome, {user.displayName}</div>;
}
```

### Benefits

1. **Centralized State Management**: All auth state is managed in one place
2. **Automatic Navigation**: Auth actions automatically redirect users using `router.push()`
3. **Better Loading States**: Consistent loading states across the app
4. **Route Protection**: Easy to protect routes with the RouteGuard component
5. **Cleaner Code**: No need for manual redirect logic in components

### Migration Notes

- Replaced `useServerAuth` with `useAuth` from context
- Removed manual redirect logic from components
- Simplified middleware (now just passes through)
- Added RouteGuard wrapper for protected pages
- All auth actions now automatically handle navigation
