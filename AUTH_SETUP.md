# Authentication Setup Guide

This project now uses server-side authentication with Firebase Admin SDK for enhanced security.

## Environment Variables

You need to add these environment variables to your `.env.local` file:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

## Getting Firebase Admin Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Extract the following values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and newlines)

## Architecture Overview

### Server-Side Authentication
- Uses Firebase Admin SDK for server-side token verification
- Secure HTTP-only cookies for session management
- API routes protected with middleware
- Middleware redirects unauthenticated users

### API Routes
- `POST /api/auth/signin` - Create server session after Firebase auth
- `POST /api/auth/signout` - Clear server session
- `GET /api/auth/user` - Get current user info

### Client-Side
- `useServerAuth` hook for authentication state
- Client-side Firebase Auth for login/signup
- Server session created automatically after client auth

### Route Protection
- Middleware protects `/chat`, `/dashboard`, `/profile`
- Redirects unauthenticated users to `/auth`
- Redirects authenticated users away from `/auth`

## Key Files

- `lib/firebaseAdmin.ts` - Firebase Admin SDK configuration
- `lib/serverAuth.ts` - Server-side authentication utilities
- `lib/useServerAuth.ts` - Client-side authentication hook
- `middleware.ts` - Route protection middleware
- `app/api/auth/` - Authentication API routes

## Security Benefits

1. **Session Management**: Secure HTTP-only cookies
2. **Server-Side Validation**: All API routes verify authentication
3. **Route Protection**: Middleware prevents unauthorized access
4. **Token Refresh**: Automatic token refresh handling
5. **XSS Protection**: HTTP-only cookies prevent XSS attacks
