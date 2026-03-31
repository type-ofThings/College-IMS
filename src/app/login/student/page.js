'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { studentLogin } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';

function StudentLoginContent() {
  const [form, setForm] = useState({ enrollmentNo: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard/student';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await studentLogin(form);
      login(data.token, data.user);
      router.push(redirectUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--color-surface)] relative overflow-hidden">
      {/* Subtle professional background accent */}
      <div className="absolute top-0 left-0 w-full h-1 gradient-bg opacity-20" />
      
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[var(--color-text-primary)] tracking-widest uppercase">EQuiz</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight">Student Portal Access</h1>
          <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-[0.2em] mt-2">Authenticated login for registered students</p>
        </div>

        <div className="formal-card p-8 sm:p-10 shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-bold uppercase tracking-widest rounded-lg px-4 py-3 flex items-center gap-3 animate-shake">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Enrollment Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-20">🆔</span>
                  <input
                    type="text" required value={form.enrollmentNo}
                    onChange={(e) => setForm({ ...form, enrollmentNo: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold focus:outline-none focus:border-primary transition-all font-mono tracking-widest placeholder:tracking-normal placeholder:font-medium placeholder:text-[10px]"
                    placeholder="Enter Student ID"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Account Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-20">🔒</span>
                  <input
                    type="password" required value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold focus:outline-none focus:border-primary transition-all placeholder:text-[10px] placeholder:font-medium"
                    placeholder="Enter Secure Password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl gradient-bg text-white text-[10px] font-bold uppercase tracking-[0.25em] shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <LoadingSpinner size="sm" color="white" /> : 'Authorize Entrance'}
            </button>

            <div className="flex items-center justify-center pt-6 border-t border-[var(--color-border)]">
              <Link href="/login/teacher" className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1.5 group">
                 Switch to Faculty Login 
                 <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </form>
        </div>
        
        <p className="text-center mt-8 text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-tight select-none opacity-50">
          Electronic Quiz Gateway • IT Infrastructure Management
        </p>
      </div>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <StudentLoginContent />
    </Suspense>
  );
}
