'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/store/authStore';
import RegisterForm from '@/app/components/RegisterForm';

export default function RegisterPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/boards');
    }
  }, [isAuthenticated, router]);

  return <RegisterForm />;
}
