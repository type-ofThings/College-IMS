'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { teacherLogin, teacherRegister } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function TeacherLoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', department: 'IT' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = isRegister
        ? await teacherRegister(form)
        : await teacherLogin({ email: form.email, password: form.password });

      login(data.token, data.user);
      router.push('/dashboard/teacher');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const departments = ['IT', 'CSE', 'ECE', 'ME', 'CE', 'EE', 'CIVIL'];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--color-surface)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 gradient-bg opacity-20" />

      <div className="w-full max-w-md animate-fade-in transition-all duration-500">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[var(--color-text-primary)] tracking-widest uppercase">EQuiz</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight">
            {isRegister ? 'Faculty Registration' : 'Faculty Portal Access'}
          </h1>
          <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-[0.2em] mt-2">
            {isRegister ? 'Create an academic administrative account' : 'Authenticated login for teaching staff'}
          </p>
        </div>

        <div className="formal-card p-8 sm:p-10 shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-primary opacity-30" />
            
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-bold uppercase tracking-widest rounded-lg px-4 py-3 flex items-center gap-3 animate-shake">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <div className="space-y-4">
              {isRegister && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Full Legal Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-20">👤</span>
                    <input
                      type="text" required value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold focus:outline-none focus:border-primary transition-all"
                      placeholder="e.g. Dr. Jane Smith"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-20">✉️</span>
                  <input
                    type="email" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold focus:outline-none focus:border-primary transition-all font-mono"
                    placeholder="faculty@college.edu"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Security Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-20">🔒</span>
                  <input
                    type="password" required value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold focus:outline-none focus:border-primary transition-all"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {isRegister && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Institutional Department</label>
                   <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-20">🏢</span>
                    <select
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                      {departments.map(d => <option key={d} value={d}>{d} Department</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl gradient-bg text-[var(--color-text-primary)] text-[10px] font-bold uppercase tracking-[0.25em] shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <LoadingSpinner size="sm" color="white" /> : (isRegister ? 'Finalize Registration' : 'Authorize Entrance')}
            </button>

            <div className="flex flex-col items-center gap-3 pt-6 border-t border-[var(--color-border)]">
              <button 
                type="button" 
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="text-[9px] font-bold text-primary-light uppercase tracking-widest hover:underline transition-all"
              >
                {isRegister ? 'Switch to Authenticated Login' : "Initialize Registration Portal"}
              </button>
              <Link href="/login/student" className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest hover:text-[var(--color-text-primary)] transition-colors flex items-center justify-center gap-1.5 group">
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Login as Student
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
