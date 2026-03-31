'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getTeacherStats, getQuizzes, getStudents } from '@/lib/api';
import { useToast } from '@/components/ToastContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, quizzesData, studentsData] = await Promise.all([
        getTeacherStats(),
        getQuizzes(),
        getStudents()
      ]);
      setStats(statsData);
      setQuizzes(quizzesData);
      setStudentCount(studentsData.length);
    } catch (err) {
      console.error('Dashboard Load Error:', err);
      addToast(err.message || 'Failed to load dashboard data. Please check connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Welcome back, {user?.name} 👋</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">Here&apos;s your dashboard overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: studentCount, icon: '👨‍🎓', color: 'var(--color-secondary)', href: '/dashboard/teacher/students' },
          { label: 'Total Quizzes', value: stats?.totalQuizzes || 0, icon: '📝', color: 'var(--color-primary)', href: '/dashboard/teacher/quizzes' },
          { label: 'Total Attempts', value: stats?.totalAttempts || 0, icon: '✅', color: 'var(--color-success)', href: '/dashboard/teacher/results' },
        ].map((stat, i) => (
          <a href={stat.href} key={i} className="glass rounded-2xl p-5 hover:-translate-y-0.5 transition-all duration-200 block">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                {user?.department}
              </span>
            </div>
            <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-sm text-[var(--color-text-muted)] mt-1">{stat.label}</div>
          </a>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Recent Activity</h2>
        {stats?.recentAttempts?.length > 0 ? (
          <div className="space-y-3">
            {stats.recentAttempts.map((attempt, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--color-surface)]/50 hover:bg-[var(--color-surface-hover)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-primary-light)]">
                    {attempt.studentId?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{attempt.studentId?.name || 'Student'}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{attempt.quizId?.title || 'Quiz'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: attempt.score / attempt.totalQuestions >= 0.5 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {attempt.score}/{attempt.totalQuestions}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {new Date(attempt.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--color-text-muted)] text-sm py-8 text-center">No recent activity yet. Create a quiz to get started!</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <a href="/dashboard/teacher/create-quiz" className="glass rounded-2xl p-5 hover:bg-[var(--color-surface-hover)]/50 transition-all group">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">Create New Quiz</h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Add questions manually or upload Excel/CSV</p>
        </a>
        <a href="/dashboard/teacher/students" className="glass rounded-2xl p-5 hover:bg-[var(--color-surface-hover)]/50 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-secondary)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">Manage Students</h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Add students or upload Excel file</p>
        </a>
      </div>
    </div>
  );
}
