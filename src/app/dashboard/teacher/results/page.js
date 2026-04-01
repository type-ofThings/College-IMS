'use client';

import { useState, useEffect } from 'react';
import { getAllAttempts, getTeacherPerformance, getLeaderboard } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function StudentResultsPage() {
  const [attempts, setAttempts] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportQuizId, setExportQuizId] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [attemptsData, perfData, leadData] = await Promise.all([
        getAllAttempts(),
        getTeacherPerformance(),
        getLeaderboard()
      ]);
      setAttempts(attemptsData);
      setPerformance(perfData);
      setLeaderboard(leadData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAttempts = attempts.filter(a => {
    const term = searchTerm.toLowerCase();
    const studentName = a.studentId?.name?.toLowerCase() || '';
    const enrollment = a.studentId?.enrollmentNo?.toLowerCase() || '';
    const quizTitle = a.quizId?.title?.toLowerCase() || '';
    return studentName.includes(term) || enrollment.includes(term) || quizTitle.includes(term);
  });

  // Get unique quizzes from attempts for the export dropdown
  const uniqueQuizzes = [...new Map(attempts.map(a => [a.quizId?._id, { _id: a.quizId?._id, title: a.quizId?.title }]).filter(([k]) => k)).values()];

  const handleExport = async (quizId) => {
    if (!quizId) return;
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/export-results/${quizId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quiz-results.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b'];

  // Global Pass/Fail distribution
  const globalPassFail = performance?.length > 0 ? [
    { name: 'Passed', value: performance.reduce((acc, curr) => acc + (curr.passRate * curr.totalAttempts / 100), 0) },
    { name: 'Failed', value: performance.reduce((acc, curr) => acc + ((100 - curr.passRate) * curr.totalAttempts / 100), 0) }
  ] : [];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">Performance Analytics</h1>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1 font-bold uppercase tracking-widest italic">Consolidated assessment results and statistical trends.</p>
        </div>

        <div className="relative w-full xl:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-30">🔍</span>
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:border-primary placeholder:text-[var(--color-text-muted)]/50 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
           <LoadingSpinner size="lg" />
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Processing core metrics...</p>
        </div>
      ) : (
        <>
          {/* Charts & Leaderboard Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Avg Score per Quiz */}
            <div className="formal-card p-5 lg:col-span-2">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Success Rate per Assessment</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="title" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Bar dataKey="avgScore" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} name="Avg %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Global Leaderboard Widget */}
            <div className="formal-card p-5">
              <h3 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-6">Global Top Performers</h3>
              <div className="space-y-4">
                {leaderboard.slice(0, 5).map((student, i) => (
                  <div key={student._id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-hover)]/50 border border-[var(--color-border)]/50 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-inner ${
                        i === 0 ? 'bg-amber-500 text-amber-950' : 
                        i === 1 ? 'bg-slate-300 text-slate-900' : 
                        i === 2 ? 'bg-amber-700 text-amber-100' : 
                        'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--color-text-primary)] truncate max-w-[120px]">{student.name}</p>
                        <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-tighter tabular-nums">{student.totalScore} Points</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-black text-primary-light tabular-nums">{student.avgPercentage}%</p>
                      <p className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest italic">{student.attemptsCount} Tests</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="formal-card overflow-hidden transition-all duration-500 shadow-sm bg-[var(--color-surface-hover)]/20">
            <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">Detailed Record Ledger</h3>
              <div className="flex items-center gap-2">
                <select
                  value={exportQuizId}
                  onChange={(e) => setExportQuizId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[10px] font-bold text-[var(--color-text-primary)] focus:outline-none focus:border-primary transition-all"
                >
                  <option value="">Select Quiz to Export</option>
                  {uniqueQuizzes.map(q => (
                    <option key={q._id} value={q._id}>{q.title}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleExport(exportQuizId)}
                  disabled={!exportQuizId || exporting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  {exporting ? '⏳' : '📥'} Export Excel
                </button>
              </div>
            </div>
            
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-hover)]/60 border-b border-[var(--color-border)]">
                    <th className="px-6 py-4 text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">Student Identity</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">Assessment</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] text-center">Outcome</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] text-right">Completion Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredAttempts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-20 text-center">
                         <p className="text-2xl mb-4 grayscale opacity-20">📊</p>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No matching results located in logs.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAttempts.map((attempt, i) => {
                      const percent = Math.round((attempt.score / attempt.totalQuestions) * 100);
                      const isPass = percent >= 50;
                      return (
                        <tr key={i} className="group hover:bg-[var(--color-surface-hover)]/30 transition-all">
                          <td className="px-6 py-4">
                             <div className="flex flex-col">
                               <span className="text-xs font-bold text-[var(--color-text-primary)] leading-tight">{attempt.studentId?.name || 'Purged Account'}</span>
                               <span className="text-[10px] font-bold text-primary-light font-mono mt-0.5 tabular-nums opacity-70 uppercase">{attempt.studentId?.enrollmentNo || 'ID: UNKNOWN'}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col">
                               <span className="text-xs font-bold text-[var(--color-text-primary)] leading-tight">{attempt.quizId?.title || 'Purged Assessment'}</span>
                               <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1 italic">{attempt.quizId?.department || 'System'} Unit</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col items-center gap-1.5">
                               <div className="flex items-center gap-2">
                                 <span className={`text-[11px] font-bold transition-colors ${isPass ? 'text-emerald-500 border border-emerald-500/20' : 'text-rose-500 border border-rose-500/20'} px-2 py-0.5 rounded shadow-sm`}>
                                   {percent}%
                                 </span>
                                 <span className="text-[10px] font-bold text-[var(--color-text-muted)] tabular-nums">({attempt.score} / {attempt.totalQuestions})</span>
                               </div>
                               <div className="w-20 h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
                                 <div className={`h-full transition-all duration-700 ${isPass ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${percent}%` }} />
                               </div>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className="text-[10px] font-bold text-slate-500 tabular-nums uppercase">
                                {new Date(attempt.submittedAt).toLocaleDateString(undefined, {
                                  year: 'numeric', month: 'short', day: 'numeric'
                                })}
                             </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-slate-800/40">
               {filteredAttempts.length === 0 ? (
                 <div className="p-16 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No matching results found.</p>
                 </div>
               ) : (
                 filteredAttempts.map((attempt, i) => {
                    const percent = Math.round((attempt.score / attempt.totalQuestions) * 100);
                    const isPass = percent >= 50;
                    return (
                      <div key={i} className="p-4 space-y-4 hover:bg-slate-800/20 transition-all">
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded border flex items-center justify-center text-[10px] font-bold shadow-sm ${isPass ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                                  {percent}%
                               </div>
                               <div>
                                  <p className="text-xs font-bold text-white leading-tight">{attempt.studentId?.name || 'Unknown'}</p>
                                  <p className="text-[10px] font-bold text-primary-light font-mono mt-0.5 uppercase opacity-60 tabular-nums">{attempt.studentId?.enrollmentNo}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Module</p>
                               <p className="text-[10px] font-bold text-slate-300 mt-0.5 truncate max-w-[120px]">{attempt.quizId?.title}</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-between border-t border-[var(--color-border)]/80 pt-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                               {new Date(attempt.submittedAt).toLocaleDateString()}
                            </span>
                            <div className="w-1/3 h-1 bg-slate-800 rounded-full overflow-hidden">
                               <div className={`h-full ${isPass ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${percent}%` }} />
                            </div>
                         </div>
                      </div>
                    );
                 })
               )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
