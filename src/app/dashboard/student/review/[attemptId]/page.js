'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getAttemptReview } from '@/lib/api';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AttemptReviewPage({ params }) {
  const resolvedParams = use(params);
  const attemptId = resolvedParams.attemptId;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'student')) {
      router.push('/login/student');
      return;
    }
    if (user) loadReview();
  }, [user, authLoading, attemptId]);

  const loadReview = async () => {
    try {
      const data = await getAttemptReview(attemptId);
      setReviewData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center animate-fade-in">
        <div className="max-w-md mx-auto formal-card p-10 border-rose-500/20 bg-rose-500/5">
           <div className="text-4xl mb-4">⚠️</div>
           <p className="text-rose-500 font-bold text-sm tracking-wide">{error}</p>
           <Link href="/dashboard/student?tab=history" className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest hover:text-primary transition-colors mt-6 inline-block flex items-center justify-center gap-2">
             <span>←</span> Return to Log
           </Link>
        </div>
      </div>
    );
  }

  const { quizTitle, score, totalQuestions, submittedAt, review } = reviewData;
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <Link href="/dashboard/student?tab=history" className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] hover:text-primary transition-colors hover:-translate-x-1 duration-200">
            ← Return to History
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight mt-2">{quizTitle}</h1>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1 font-bold uppercase tracking-widest flex items-center gap-2">
            <span>Assessment Review</span>
            <span className="opacity-50">•</span>
            <span>{new Date(submittedAt).toLocaleString(undefined, {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}</span>
          </p>
        </div>
        
        <div className={`px-6 py-4 rounded-xl border ${percentage >= 50 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/5 border-rose-500/20'} flex flex-col items-center sm:items-end min-w-[140px]`}>
          <div className="flex items-center gap-3">
             <span className={`text-3xl font-black tabular-nums tracking-tighter leading-none ${percentage >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>{score}</span>
             <span className="text-lg font-bold text-[var(--color-text-muted)] leading-none mt-1">/ {totalQuestions}</span>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 ${percentage >= 50 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>Final Result</span>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-6 mt-8">
        {review.map((item, index) => {
          const isUnattempted = item.selectedAnswer === null || item.selectedAnswer === undefined || item.selectedAnswer === -1;

          return (
            <div key={item.questionId || index} className="formal-card p-6 sm:p-8 relative overflow-hidden group">
              {/* Top Accent line based on correctness */}
              <div className={`absolute top-0 left-0 w-full h-1 transition-all ${
                item.isCorrect ? 'bg-emerald-500/70' : (isUnattempted ? 'bg-[var(--color-border)]' : 'bg-rose-500/70')
              }`} />
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 pb-6 border-b border-[var(--color-border)]/50">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-relaxed flex-1">
                  <span className="inline-block min-w-[24px] text-[var(--color-text-muted)] font-mono tracking-widest">{index + 1}.</span> 
                  {item.questionText}
                </h3>
                <div className={`shrink-0 self-start px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                  item.isCorrect 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                    : (isUnattempted ? 'bg-[var(--color-surface-hover)] border-[var(--color-border)] text-[var(--color-text-muted)]' : 'bg-rose-500/10 border-rose-500/30 text-rose-500')
                }`}>
                  {item.isCorrect ? 'Correct' : (isUnattempted ? 'Skipped' : 'Incorrect')}
                </div>
              </div>

              <div className="space-y-3 pl-0 sm:pl-6">
                {item.options.map((option, oIndex) => {
                  const isSelected = item.selectedAnswer === oIndex;
                  const isCorrectAnswer = item.correctAnswer === oIndex;
                  
                  // Style logic
                  let optionClass = "border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]";
                  let icon = null;
                  
                  if (isCorrectAnswer) {
                    optionClass = "border-emerald-500 bg-emerald-500/5 text-emerald-500 shadow-sm";
                    icon = "✓";
                  } else if (isSelected && !item.isCorrect && !isUnattempted) {
                    optionClass = "border-rose-500 bg-rose-500/5 text-rose-500";
                    icon = "✗";
                  }

                  return (
                    <div key={oIndex} className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${optionClass}`}>
                      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all ${
                        isCorrectAnswer 
                          ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30 text-white border-transparent' 
                          : (isSelected && !item.isCorrect ? 'bg-rose-500 shadow-lg shadow-rose-500/30 text-white border-transparent' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]')
                      }`}>
                        {String.fromCharCode(65 + oIndex)}
                      </div>
                      
                      <span className={`flex-1 text-sm font-medium ${isCorrectAnswer || isSelected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                        {option}
                      </span>

                      {icon && (
                        <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black tabular-nums text-white shadow-md ${
                          isCorrectAnswer ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-rose-500 shadow-rose-500/40'
                        }`}>
                          {icon}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
