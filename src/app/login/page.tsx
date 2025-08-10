'use client';

import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/lib/auth-context';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, login, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if authentication is not loading and user is authenticated
    if (!authLoading && user) {
      if (user.role === 'ADMIN' || user.role === 'STAFF') {
        router.push('/admin/dashboard');
      } else if (user.role === 'USER') {
        router.push('/');
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success) {
      // The redirect will be handled by the useEffect above
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  // Show loading spinner while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is already authenticated, show loading (will redirect)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Theme Toggle positioned absolutely in top right */}
      <div className="absolute top-4 right-4 m-4">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/rfl-seeklogo.png"
              alt="RFL Seek"
              width={200}
              height={67}
              className="h-16 w-auto"
            />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-foreground">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">Meeting Room Booking System</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input id="email" name="email" type="email" autoComplete="email" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground bg-card rounded-t-md focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-border placeholder-muted-foreground text-foreground bg-card rounded-b-md focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeSlashIcon className="h-5 w-5 text-muted-foreground" /> : <EyeIcon className="h-5 w-5 text-muted-foreground" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-4">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
