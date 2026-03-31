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

  const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b'];

  // Global Pass/Fail distribution
  const globalPassFail = performance?.length > 0 ? [
    { name: 'Passed', value: performance.reduce((acc, curr) => acc + (curr.passRate * curr.totalAttempts / 100), 0) },
    { name: 'Failed', value: performance.reduce((acc, curr) => acc + ((100 - curr.passRate) * curr.totalAttempts / 100), 0) }
  ] : [];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Performance Analytics</h1>
          <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest italic">Consolidated assessment results and statistical trends.</p>
        </div>

        <div className="relative w-full xl:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-30">🔍</span>
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-primary placeholder:text-slate-600 transition-all"
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="title" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Bar dataKey="avgScore" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} name="Avg %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Global Leaderboard Widget */}
            <div className="formal-card p-5">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Global Top Performers</h3>
              <div className="space-y-4">
                {leaderboard.slice(0, 5).map((student, i) => (
                  <div key={student._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-inner ${
                        i === 0 ? 'bg-amber-500 text-amber-950' : 
                        i === 1 ? 'bg-slate-300 text-slate-900' : 
                        i === 2 ? 'bg-amber-700 text-amber-100' : 
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate max-w-[120px]">{student.name}</p>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter tabular-nums">{student.totalScore} Points</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-black text-primary-light tabular-nums">{student.avgPercentage}%</p>
                      <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest italic">{student.attemptsCount} Tests</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="formal-card overflow-hidden transition-all duration-500 shadow-sm bg-slate-900/20">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/40">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Detailed Record Ledger</h3>
            </div>
            
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800">
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Student Identity</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Assessment</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">Outcome</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] text-right">Completion Date</th>
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
                        <tr key={i} className="group hover:bg-slate-800/30 transition-all">
                          <td className="px-6 py-4">
                             <div className="flex flex-col">
                               <span className="text-xs font-bold text-white leading-tight">{attempt.studentId?.name || 'Purged Account'}</span>
                               <span className="text-[10px] font-bold text-primary-light font-mono mt-0.5 tabular-nums opacity-70 uppercase">{attempt.studentId?.enrollmentNo || 'ID: UNKNOWN'}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col">
                               <span className="text-xs font-bold text-slate-300 leading-tight">{attempt.quizId?.title || 'Purged Assessment'}</span>
                               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">{attempt.quizId?.department || 'System'} Unit</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col items-center gap-1.5">
                               <div className="flex items-center gap-2">
                                 <span className={`text-[11px] font-bold transition-colors ${isPass ? 'text-emerald-500 border border-emerald-500/20' : 'text-rose-500 border border-rose-500/20'} px-2 py-0.5 rounded shadow-sm`}>
                                   {percent}%
                                 </span>
                                 <span className="text-[10px] font-bold text-slate-500 tabular-nums">({attempt.score} / {attempt.totalQuestions})</span>
                               </div>
                               <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
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
                         <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
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
