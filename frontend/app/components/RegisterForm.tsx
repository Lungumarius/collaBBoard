'use client';

import { useState } from 'react';
import { apiClient } from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';
import { useRouter } from 'next/navigation';
import ColdStartLoader from './ColdStartLoader';
import Logo from './Logo';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.register(formData);
      login(response);
      router.push('/boards');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      <div className="max-w-md w-full glass-panel rounded-3xl shadow-2xl p-8 animate-float">
        <div className="text-center mb-8">
           <div className="mb-6 transform hover:scale-105 transition-transform duration-500 inline-block">
             <Logo className="w-16 h-16" />
           </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h2>
          <p className="text-gray-500 mt-2 text-sm">Join the next generation of collaboration.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 text-gray-900 bg-white/50 transition-all outline-none"
                placeholder="John"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 text-gray-900 bg-white/50 transition-all outline-none"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
              Work Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 text-gray-900 bg-white/50 transition-all outline-none"
              placeholder="name@company.com"
            />
          </div>

          <div>
             <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 text-gray-900 bg-white/50 transition-all outline-none"
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-400 mt-1 ml-1">Must be at least 6 characters</p>
          </div>

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold py-3.5 px-4 rounded-xl transition duration-300 shadow-lg shadow-purple-600/20 active:scale-[0.98] transform hover:-translate-y-0.5 mt-2"
          >
            Start Creating
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-violet-600 hover:text-violet-700 font-bold hover:underline decoration-2 underline-offset-4 transition-colors">
              Log in
            </a>
          </p>
        </div>
      </div>
      
       {/* Decorative blobs */}
       <div className="fixed bottom-10 left-10 w-72 h-72 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
       <div className="fixed top-10 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" style={{animationDelay: "1.5s"}}></div>
    </div>
  );
}
