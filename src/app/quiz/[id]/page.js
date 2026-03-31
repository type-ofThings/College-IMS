'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getQuizById, submitAttempt, checkAttempt, startQuizWithPassword } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function QuizAttemptPage({ params }) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');
  
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [quizPassword, setQuizPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'student')) {
      router.push(`/login/student?redirect=/quiz/${quizId}`);
      return;
    }
    if (user) loadQuiz();
  }, [user, authLoading]);

  const loadQuiz = async () => {
    try {
      const checkData = await checkAttempt(quizId);
      if (checkData.attempted) {
        setAlreadyAttempted(true);
        setResult({
          score: checkData.attempt.score,
          totalQuestions: checkData.attempt.totalQuestions,
          percentage: Math.round((checkData.attempt.score / checkData.attempt.totalQuestions) * 100)
        });
        setLoading(false);
        return;
      }

      const data = await getQuizById(quizId);
      setQuiz(data.quiz);
      
      if (data.requiresPassword) {
        setRequiresPassword(true);
      } else {
        setQuestions(data.questions);
      }
      setTimeLeft(data.quiz.timeLimit * 60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    const answerArray = questions.map(q => ({
      questionId: q._id,
      selectedAnswer: answers[q._id] ?? -1
    }));

    try {
      const data = await submitAttempt({ quizId, answers: answerArray });
      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [answers, questions, quizId, submitting]);

  // Timer
  useEffect(() => {
    if (!started || timeLeft === null || timeLeft <= 0 || result) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, timeLeft, result, handleSubmit]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]"><LoadingSpinner size="lg" /></div>;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-surface)]">
        <div className="formal-card p-8 max-w-md w-full text-center">
          <p className="text-[var(--color-danger)] font-bold mb-4">Error loading quiz</p>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">{error}</p>
          <button onClick={() => router.push('/dashboard/student')} className="w-full py-3 rounded-xl gradient-bg text-white font-bold text-sm">Return Home</button>
        </div>
      </div>
    );
  }

  // Result Screen
  if (result) {
    const passed = result.percentage >= 50;
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-surface)]">
        <div className="formal-card p-10 max-w-lg w-full text-center animate-slide-up shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 gradient-bg opacity-30" />
          <div className="text-6xl mb-6 flex justify-center">{passed ? '🎉' : '📚'}</div>
          <h2 className="text-2xl font-bold mb-2 tracking-tight">{alreadyAttempted ? 'Already Attempted' : (passed ? 'Assessment Complete' : 'Keep Practicing')}</h2>
          <p className="text-[var(--color-text-muted)] text-sm mb-10 font-medium">
            {alreadyAttempted ? 'You have already submitted this assessment.' : 'Your quiz results have been recorded successfully.'}
          </p>

          <div className="bg-slate-900/50 rounded-2xl p-8 mb-10 border border-[var(--color-border)] relative group">
            <div className="text-6xl font-black mb-1 tabular-nums" style={{ color: passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {result.percentage}<span className="text-xl ml-1 opacity-60">%</span>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest">
              Performance Score: {result.score} / {result.totalQuestions}
            </p>
          </div>

          <button onClick={() => router.push('/dashboard/student')}
            className="w-full py-4 rounded-xl shadow-lg gradient-bg text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all">
            Return to Student Portal
          </button>
        </div>
      </div>
    );
  }

  // Start Screen
  if (!started) {
    // RESOLVE: Show correct question count even if questions array is empty initially (due to password)
    const displayQuestionCount = quiz?.questionsToAttempt || (questions.length > 0 ? questions.length : '--');

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-surface)]">
        <div className="formal-card p-8 md:p-12 max-w-xl w-full text-center animate-slide-up shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl shadow-md border border-slate-700 mx-auto mb-6">📖</div>
          <h2 className="text-2xl font-bold mb-2 tracking-tight text-white">{quiz?.title}</h2>
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
              {quiz?.department} Assessment
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800">
              <p className="text-3xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{displayQuestionCount}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Questions</p>
            </div>
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800">
              <p className="text-3xl font-bold text-white mb-1">{quiz?.timeLimit}m</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Duration</p>
            </div>
          </div>

          <div className="text-left bg-slate-900/50 rounded-xl p-6 mb-8 space-y-3 border border-slate-800/50">
            <div className="flex items-start gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              <span className="text-emerald-500">✓</span> Automatic submission on timeout
            </div>
            <div className="flex items-start gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              <span className="text-emerald-500">✓</span> Full navigation allowed
            </div>
            <div className="flex items-start gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              <span className="text-rose-500 flex-shrink-0">⚠️</span> One attempt only per session
            </div>
          </div>

          {quiz?.status !== 'active' ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-3 justify-center">
              <span>🔒</span> Quiz is currently {quiz?.status}.
            </div>
          ) : requiresPassword ? (
            <div className="space-y-4">
              <input type="text" value={quizPassword}
                onChange={(e) => setQuizPassword(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-center text-base font-bold tracking-[0.3em] focus:outline-none focus:border-indigo-500 transition-all placeholder:tracking-normal placeholder:font-medium placeholder:text-xs"
                placeholder="Enter Access Password" />
              {passwordError && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">{passwordError}</p>}
              <button 
                onClick={async () => {
                   try {
                     setSubmitting(true);
                     const data = await startQuizWithPassword(quizId, quizPassword);
                     setQuestions(data.questions);
                     setStarted(true);
                   } catch (err) {
                     setPasswordError(err.message);
                   } finally {
                     setSubmitting(false);
                   }
                }} 
                disabled={submitting || !quizPassword}
                className="w-full py-4 rounded-xl gradient-bg text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? 'Verifying...' : 'Begin Assessment'}
              </button>
            </div>
          ) : (
            <button onClick={() => setStarted(true)}
              className="w-full py-4 rounded-xl gradient-bg text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all">
              Initialize Test Environment
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col">
      {/* Formal Header */}
      <div className="glass sticky top-0 z-50 border-b border-[var(--color-border)] px-4">
        <div className="max-w-4xl mx-auto h-16 flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 truncate max-w-[200px]">{quiz?.title}</p>
            <p className="text-[11px] font-bold text-white tracking-wide">Q{currentQ + 1} <span className="text-slate-500">/ {questions.length}</span></p>
          </div>
          
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border transition-all ${
            timeLeft <= 60 ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse' : 'bg-slate-800 border-slate-700 text-teal-400'
          }`}>
            <span className="text-sm">⌛</span>
            <span className="text-sm font-mono font-bold tabular-nums">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-800">
           <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 pt-10 pb-32 animate-fade-in" key={currentQ}>
        <div className="formal-card p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-800/50" />
          <h3 className="text-lg sm:text-xl font-bold leading-relaxed text-white mb-10">
            {currentQuestion.questionText}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option, oIdx) => {
              const isSelected = answers[currentQuestion._id] === oIdx;
              return (
                <button key={oIdx} onClick={() => setAnswers({ ...answers, [currentQuestion._id]: oIdx })}
                  className={`group w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                    isSelected
                      ? 'border-indigo-500/50 bg-indigo-500/5 shadow-md'
                      : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                  }`}
                  style={{ minHeight: '56px' }}>
                  
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all border ${
                    isSelected ? 'bg-indigo-500 text-white border-transparent' : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    {String.fromCharCode(65 + oIdx)}
                  </div>
                  
                  <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {option}
                  </span>

                  {isSelected && <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mini Grid Nav */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
           {questions.map((_, i) => (
             <button key={i} onClick={() => setCurrentQ(i)}
               className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all border ${
                 i === currentQ 
                   ? 'bg-indigo-500 text-white border-transparent shadow-md' 
                   : (answers[questions[i]._id] !== undefined ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-slate-900 border-slate-800 text-slate-500')
               }`}>
               {i + 1}
             </button>
           ))}
        </div>
      </div>

      {/* Modern Compact Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-bottom backdrop-blur-xl bg-slate-950/40 border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button 
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} 
            disabled={currentQ === 0}
            className="flex-1 sm:flex-none h-12 px-6 rounded-xl border border-slate-800 bg-slate-900 text-[10px] font-bold uppercase tracking-widest text-slate-400 disabled:opacity-20 active:scale-95 transition-all">
            Previous
          </button>

          <div className="hidden sm:flex items-center gap-1.5 opacity-50">
             {questions.map((_, i) => (
               <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
                 i === currentQ ? 'w-6 bg-indigo-500' : (answers[questions[i]._id] !== undefined ? 'w-2 bg-emerald-500' : 'w-1.5 bg-slate-700')
               }`} />
             ))}
          </div>

          {currentQ === questions.length - 1 ? (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 sm:flex-none h-12 px-10 rounded-xl gradient-bg text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/10 active:scale-95 transition-all">
              {submitting ? 'Processing...' : 'Submit Entry'}
            </button>
          ) : (
            <button 
              onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
              className="flex-1 sm:flex-none h-12 px-10 rounded-xl gradient-bg text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/10 active:scale-95 transition-all">
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
