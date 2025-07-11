'use client';

import Link from 'next/link';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  auth,
  // db, // Import db if you need to interact with Firestore
} from '../../firebaseConfig'; // Adjusted path
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  UserCredential,
  onAuthStateChanged, // Added for auth state listener
} from 'firebase/auth';

export default function AuthPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [formError, setFormError] = useState(''); // General form error

  // '''  // Loading states
  const [isLoading, setIsLoading] = useState(false); // For form submissions
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true); // For initial redirect check

  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // Don't set isLoading here, as we are redirecting
          handleAuthSuccess(result);
        }
      } catch (error) {
        handleAuthError(error);
      } finally {
        // This runs regardless of whether a redirect result was found
        setIsCheckingRedirect(false);
      }
    };
    checkRedirectResult();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        document.cookie = `firebaseAuthToken=${user.accessToken}; path=/; max-age=3600`; // Set cookie for middleware
        router.replace('/chat');
      } else {
        // User is signed out
        document.cookie = 'firebaseAuthToken=; path=/; max-age=0'; // Clear cookie
        // Optional: redirect to home if they are on a page that requires auth
        // and they just signed out from here.
        // However, middleware will handle redirecting from /chat if they try to access it.
        // If they are on /auth page and sign out, they should stay or go to '/'
        // router.replace('/'); // Uncomment if you want to redirect to home on logout from auth page
      }
    });
    return () => unsubscribe();
  }, [router]);

  const resetFormAndErrors = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setFormError('');
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    resetFormAndErrors();
  };

  const validateEmail = (emailInput: string) => {
    if (!emailInput) {
      setEmailError('Email is required.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(emailInput)) {
      setEmailError('Email address is invalid.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (passwordInput: string) => {
    if (!passwordInput) {
      setPasswordError('Password is required.');
      return false;
    }
    if (passwordInput.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (passwordInput: string, confirmPasswordInput: string) => {
    if (!isLoginView) {
      if (!confirmPasswordInput) {
        setConfirmPasswordError('Confirm password is required.');
        return false;
      }
      if (passwordInput !== confirmPasswordInput) {
        setConfirmPasswordError('Passwords do not match.');
        return false;
      }
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleAuthSuccess = async (userCredential: UserCredential) => {
    console.log('Auth success:', userCredential.user);
    // The onAuthStateChanged listener will handle cookie setting and redirection
    // So, we might not need to explicitly redirect here if the listener is robust enough.
    // However, setting the cookie immediately can be beneficial.
    if (userCredential.user) {
      // It's good practice to get the ID token for HTTP-only cookies if you were using server-side auth.
      // For client-side accessible cookies for middleware, accessToken might be considered,
      // but ID token is standard for auth purposes.
      const token = await userCredential.user.getIdToken();
      document.cookie = `firebaseAuthToken=${token}; path=/; max-age=3600`; // Expires in 1 hour
    }
    resetFormAndErrors();
    // router.replace('/chat'); // Redirection is now handled by onAuthStateChanged
  };

  const handleAuthError = (error: any) => { // Changed FirebaseError to any for broader compatibility
    console.error('Auth error:', error);
    if (error.code) {
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential': // Added for newer Firebase versions
                setFormError('Invalid email or password.');
                break;
            case 'auth/email-already-in-use':
                setFormError('This email address is already in use.');
                break;
            case 'auth/weak-password':
                setFormError('The password is too weak (at least 6 characters).');
                break;
            case 'auth/invalid-email':
                setFormError('The email address is not valid.');
                break;
            case 'auth/popup-closed-by-user':
                setFormError('Sign-in process was cancelled. Please try again.');
                break;
            case 'auth/cancelled-popup-request':
            case 'auth/popup-blocked': // Added for popup blocker issues
                setFormError('Sign-in popup was blocked or cancelled. Please allow popups and try again.');
                break;
            default:
                setFormError('An unexpected error occurred. Please try again.');
        }
    } else {
        setFormError('An unexpected error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (isEmailValid && isPasswordValid) {
      setIsLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        handleAuthSuccess(userCredential);
      } catch (error) {
        handleAuthError(error);
      }
    }
  };

  const handleSignUpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(password, confirmPassword);

    if (isEmailValid && isPasswordValid && isConfirmPasswordValid) {
      setIsLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        handleAuthSuccess(userCredential);
      } catch (error) {
        handleAuthError(error);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError('');
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      handleAuthError(error);
    }
  };

  if (isCheckingRedirect) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-medium text-gray-700">Authenticating...</div>
        <svg className="animate-spin mt-4 h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">'''
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {isLoginView ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isLoginView
              ? 'Welcome back! Please enter your details.'
              : 'Join us today! Create an account to get started.'}
          </p>
        </div>

        {formError && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm" role="alert">
            {formError}
          </div>
        )}

        {isLoginView ? (
          // Login Form
          <form onSubmit={handleLoginSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateEmail(email)}
                className={`mt-1 block w-full px-3 py-2 border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isLoading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="you@example.com"
              />
              {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => validatePassword(password)}
                className={`mt-1 block w-full px-3 py-2 border ${passwordError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isLoading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="••••••••"
              />
              {passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <a href="#" className={`font-medium text-blue-600 hover:text-blue-500 ${isLoading ? 'pointer-events-none opacity-70' : ''}`}>
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Sign In'}
              </button>
            </div>
          </form>
        ) : (
          // Sign-up Form
          <form onSubmit={handleSignUpSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="email-signup" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email-signup"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateEmail(email)}
                className={`mt-1 block w-full px-3 py-2 border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isLoading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="you@example.com"
              />
              {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
            </div>

            <div>
              <label htmlFor="password-signup" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password-signup"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => validatePassword(password)}
                className={`mt-1 block w-full px-3 py-2 border ${passwordError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isLoading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="Create a password (min. 6 characters)"
              />
              {passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}
            </div>

            <div>
              <label
                htmlFor="confirm-password-signup"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password-signup"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                disabled={isLoading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => validateConfirmPassword(password, confirmPassword)}
                className={`mt-1 block w-full px-3 py-2 border ${confirmPasswordError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isLoading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="Confirm your password"
              />
              {confirmPasswordError && <p className="mt-1 text-xs text-red-600">{confirmPasswordError}</p>}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Sign Up'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-sm text-center">
          <p className="text-gray-600">
            {isLoginView ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={toggleView}
              disabled={isLoading}
              className="font-medium text-blue-600 hover:underline disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoginView ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && !formError ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
            )}
            Sign in with Google
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          <Link href="/" className={`hover:underline ${isLoading ? 'pointer-events-none text-gray-400' : ''}`}>
            Go back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
