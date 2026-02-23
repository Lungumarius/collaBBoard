'use client';

import { useState } from 'react';
import { apiClient } from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';
import { useRouter } from 'next/navigation';
import ColdStartLoader from './ColdStartLoader';
import Logo from './Logo';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.login({ email, password });
      login(response);
      router.push('/boards');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
    // Note: We don't set loading(false) on success to prevent UI flash before redirect
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center aurora-bg-light">
        <div className="glass-panel p-8 rounded-2xl shadow-xl">
          <ColdStartLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center aurora-bg-light p-4">
      <div className="max-w-md w-full glass-panel rounded-3xl shadow-2xl p-8 md:p-12 animate-float">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="mb-6 transform hover:scale-105 transition-transform duration-500">
             <Logo className="w-16 h-16" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="text-gray-500 mt-3 text-base">
            Your creative space is ready. Let's make something amazing.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-900 bg-white/50 backdrop-blur-sm transition-all outline-none"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2 ml-1">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Forgot?</a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-900 bg-white/50 backdrop-blur-sm transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition duration-300 shadow-lg shadow-blue-600/20 active:scale-[0.98] transform hover:-translate-y-0.5"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <a href="/register" className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline decoration-2 underline-offset-4 transition-colors">
              Join for free
            </a>
          </p>
        </div>
      </div>
      
      {/* Decorative blobs */}
      <div className="fixed top-20 left-20 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
      <div className="fixed bottom-20 right-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" style={{animationDelay: "2s"}}></div>
    </div>
  );
}
