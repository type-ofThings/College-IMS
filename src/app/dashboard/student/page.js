'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getQuizzes, getStudentPerformance, getLeaderboard } from '@/lib/api';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, Cell
} from 'recharts';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview';
    setActiveTab(tab);
  }, [searchParams]);

  const loadData = useCallback(async () => {
    try {
      const [quizData, perfData, leadData] = await Promise.all([
        getQuizzes(),
        getStudentPerformance(),
        getLeaderboard()
      ]);
      setQuizzes(quizData);
      setPerformance(perfData);
      setLeaderboard(leadData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'student')) {
      router.push('/login/student');
      return;
    }
    if (user) loadData();
  }, [user, authLoading, router, loadData]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const attemptedQuizIds = new Set((performance?.recentAttempts || []).map(a => a.quizId?._id));
  const availableQuizzes = quizzes.filter(q => !attemptedQuizIds.has(q._id));

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div className="flex items-center gap-2">
           <h1 className="text-xl font-bold text-white tracking-tight">Student Portal</h1>
           <span className="text-slate-600">/</span>
           <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{activeTab}</span>
        </div>
        
        <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800">
          {[
            { id: 'overview', label: 'Performance', icon: '📊' },
            { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
            { id: 'quizzes', label: 'Available Tests', icon: '📝' },
            { id: 'history', label: 'Full Log', icon: '🕒' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                router.push(`/dashboard/student?tab=${tab.id}`, { scroll: false });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
           <LoadingSpinner size="lg" />
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loading metrics...</p>
        </div>
      ) : (
        <div className="animate-fade-in">
          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-slide-up">
              {/* Performance Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Assessments', value: performance?.totalAttempts || 0, icon: '📋' },
                  { label: 'Average Score', value: `${performance?.avgScore || 0}%`, icon: '📈' },
                  { label: 'Highest', value: `${performance?.highestScore || 0}%`, icon: '🏅' },
                  { label: 'Global Rank', value: (() => {
                    const rank = leaderboard.findIndex(s => String(s._id) === String(user?.id));
                    return rank !== -1 ? rank + 1 : '--';
                  })(), icon: '🌍' },
                ].map((stat, i) => (
                  <div key={i} className="formal-card p-5 group hover:border-primary/50 transition-all">
                    <div className="text-lg opacity-40 group-hover:opacity-100 transition-opacity mb-2">{stat.icon}</div>
                    <div className="text-2xl font-bold text-white tabular-nums">{stat.value}</div>
                    <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Performance Graph */}
              {(performance?.chartData || []).length > 0 && (
                <div className="formal-card p-6 lg:p-8">
                  <div className="mb-8">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-white">Score Progression</h2>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium italic">Performance trends across completed assessments</p>
                  </div>
                  <div className="h-[280px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performance.chartData}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}}
                          dy={10}
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: '1px solid #1e293b', 
                            borderRadius: '8px', 
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#6366f1" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorScore)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Tab Content */}
          {activeTab === 'leaderboard' && (
            <div className="animate-slide-up space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">Global Standings</h2>
                <p className="text-[10px] text-slate-500 mt-1 font-medium italic">Top performing students across all departments</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Top 3 Podiums */}
                <div className="lg:col-span-1 space-y-4">
                  {leaderboard.slice(0, 3).map((student, i) => (
                    <div key={student._id} className={`formal-card p-6 border-l-4 ${
                      i === 0 ? 'border-l-amber-500 bg-amber-500/5' : 
                      i === 1 ? 'border-l-slate-400 bg-slate-400/5' : 
                      'border-l-amber-700 bg-amber-700/5'
                    }`}>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                        <div>
                          <p className="font-bold text-white text-sm">{student.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DEPT: {student.department} • {student.attemptsCount} Tests</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-end">
                         <div>
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Total Score</p>
                            <p className="text-xl font-black text-white tabular-nums tracking-tighter">{student.totalScore}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Efficiency</p>
                            <p className="text-md font-black text-primary-light tabular-nums">{student.avgPercentage}%</p>
                         </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Personal Rank Highlight if not in top 3 */}
                  {(() => {
                    const personalRank = leaderboard.findIndex(s => String(s._id) === String(user?.id));
                    if (personalRank > 2) {
                      return (
                        <div className="formal-card p-4 border border-primary/30 bg-primary/5">
                           <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-2">Your Current Standing</p>
                           <div className="flex justify-between items-center">
                              <p className="text-xs font-bold text-white"># {personalRank + 1} {user.name}</p>
                              <p className="text-xs font-black text-primary-light tabular-nums">{performance?.avgScore}%</p>
                           </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Rest of Leaderboard Table */}
                <div className="lg:col-span-2">
                  <div className="formal-card overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900/60 border-b border-slate-800">
                        <tr className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">
                          <th className="px-6 py-4">Rank</th>
                          <th className="px-6 py-4">Student</th>
                          <th className="px-6 py-4 text-center">Avg. Outcome</th>
                          <th className="px-6 py-4 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {leaderboard.slice(3).map((student, i) => {
                          const isCurrentUser = String(student._id) === String(user?.id);
                          return (
                            <tr key={student._id} className={`hover:bg-slate-800/30 transition-colors ${isCurrentUser ? 'bg-primary/5 border-y border-primary/20' : ''}`}>
                              <td className="px-6 py-4 text-xs font-black text-slate-600 tabular-nums">#{i + 4}</td>
                              <td className="px-6 py-4">
                                <p className="text-xs font-bold text-white leading-tight">{student.name} {isCurrentUser && <span className="ml-2 text-[8px] bg-primary px-1.5 py-0.5 rounded text-white">YOU</span>}</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{student.department}</p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-[11px] font-black text-primary-light tabular-nums">{student.avgPercentage}%</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-xs font-black text-white tabular-nums tracking-tighter">{student.totalScore}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quizzes Tab Content */}
          {activeTab === 'quizzes' && (
            <div className="animate-slide-up space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Open Assessments</h2>
                <div className="text-[9px] font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                  {availableQuizzes.length} ACTIVE
                </div>
              </div>
              {availableQuizzes.length === 0 ? (
                <div className="formal-card p-16 text-center border-dashed">
                  <div className="text-4xl mb-4 grayscale">📭</div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white">All Clear</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-medium">No pending quizzes assigned to your department.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {availableQuizzes.map((quiz) => (
                    <div key={quiz._id} className="formal-card p-6 group hover:border-primary transition-all flex flex-col justify-between">
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[8px] font-black uppercase text-primary tracking-tighter border border-primary/20 px-2 py-0.5 rounded-sm">
                             {quiz.department}
                           </span>
                           {quiz.status !== 'active' && (
                             <span className="text-[8px] font-black uppercase text-rose-500 tracking-tighter border border-rose-500/20 px-2 py-0.5 rounded-sm">
                               {quiz.status}
                             </span>
                           )}
                        </div>
                        <h3 className="font-bold text-md text-white group-hover:text-primary-light transition-colors">{quiz.title}</h3>
                        <div className="mt-3 flex items-center gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5">⏱ {quiz.timeLimit}m</span>
                          <span className="opacity-20">•</span>
                          <span className="flex items-center gap-1.5">❓ {quiz.questionsToAttempt || '--'} Qs</span>
                        </div>
                      </div>
                      
                      {quiz.status === 'active' ? (
                        <Link href={`/quiz/${quiz._id}`}
                          className="w-full text-center py-3 rounded-lg gradient-bg text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/10 hover:brightness-110 active:scale-[0.98] transition-all">
                          Start Attempt
                        </Link>
                      ) : (
                        <button disabled
                          className="w-full text-center py-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-600 text-[10px] font-bold uppercase tracking-widest opacity-60">
                          {quiz.status === 'upcoming' ? `Starts: ${new Date(quiz.activeFrom).toLocaleDateString()}` : 'Closed'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab Content */}
          {activeTab === 'history' && (
            <div className="animate-slide-up space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Submission Log</h2>
                <button onClick={() => setShowFullHistory(!showFullHistory)} className="text-[9px] font-bold text-primary uppercase tracking-widest hover:underline px-3 py-1 border border-primary/20 rounded-md">
                   Switch View Mode
                </button>
              </div>
              
              {(performance?.recentAttempts || []).length === 0 ? (
                <div className="formal-card p-16 text-center border-dashed">
                  <div className="text-4xl mb-4 grayscale">🚀</div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white">Log empty</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-medium">Complete an assessment to see detailed history.</p>
                </div>
              ) : showFullHistory ? (
                <div className="formal-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900/50 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-800">
                        <tr>
                          <th className="px-6 py-4">Title</th>
                          <th className="px-6 py-4 text-center">Outcome</th>
                          <th className="px-6 py-4 text-right">Applied</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {(performance?.recentAttempts || []).map((attempt, i) => (
                          <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-4 font-bold text-xs text-white">{attempt.quizId?.title || 'Unknown'}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`text-[9px] font-bold tabular-nums px-2 py-0.5 rounded-sm uppercase tracking-tighter ${
                                (attempt.score/attempt.totalQuestions) >= 0.5 ? 'text-emerald-500 border border-emerald-500/20' : 'text-rose-500 border border-rose-500/20'
                              }`}>
                                {Math.round((attempt.score/attempt.totalQuestions)*100)}% Result
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 tabular-nums uppercase">{new Date(attempt.submittedAt).toLocaleDateString(undefined, {year:'numeric', month:'short', day:'numeric'})}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {(performance?.recentAttempts || []).slice(0, 10).map((attempt, i) => (
                    <div key={i} className="formal-card p-4 flex items-center justify-between hover:bg-slate-800/20 transition-all border-l-2 border-l-primary/50">
                      <div>
                        <p className="text-xs font-bold text-white">{attempt.quizId?.title || 'Assessment'}</p>
                        <p className="text-[9px] text-slate-500 mt-1 font-bold uppercase tracking-tighter italic">{new Date(attempt.submittedAt).toLocaleDateString()} • {new Date(attempt.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-md font-bold tabular-nums ${(attempt.score/attempt.totalQuestions) >= 0.5 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {Math.round((attempt.score/attempt.totalQuestions)*100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
