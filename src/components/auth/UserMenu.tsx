'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { SignOut, UserCircle } from '@phosphor-icons/react';

export function UserMenu() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white border-b">
      <div className="flex items-center gap-2 flex-1">
        <User className="w-5 h-5 text-gray-600" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.email}
          </p>
          <p className="text-xs text-gray-500">Admin</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className="flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Kirjaudu ulos
      </Button>
    </div>
  );
}
