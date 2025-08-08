'use client';

import { useAuth } from '@/lib/auth-context';

export default function AuthDebug() {
  const { user, loading } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs">
      <div className="font-bold mb-2">Auth Debug</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User: {user ? `${user.email} (${user.role})` : 'None'}</div>
      <div>User ID: {user?.id || 'N/A'}</div>
    </div>
  );
}
