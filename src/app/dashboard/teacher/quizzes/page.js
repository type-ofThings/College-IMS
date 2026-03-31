'use client';

import { useState, useEffect } from 'react';
import { getQuizzes, generateQRCode, toggleQuizStatus, deleteQuiz } from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => { loadQuizzes(); }, []);

  const loadQuizzes = async () => {
    try {
      const data = await getQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQRCode = async (quizId) => {
    setSelectedQuiz({ _id: quizId });
    try {
      const data = await generateQRCode(quizId);
      setQrCode(data);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleToggle = async (quizId) => {
    try {
      await toggleQuizStatus(quizId);
      addToast('Quiz status updated!');
      loadQuizzes();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (quizId) => {
    if (!confirm('Delete this quiz? All associated data will be lost.')) return;
    try {
      await deleteQuiz(quizId);
      addToast('Quiz deleted successfully');
      setQuizzes(quizzes.filter(q => q._id !== quizId));
      if (selectedQuiz?._id === quizId) {
        setSelectedQuiz(null);
        setQrCode(null);
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">Assessment Management</h1>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1 font-bold uppercase tracking-widest italic">Monitor, publish, and share your quizzes.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
           <LoadingSpinner size="lg" />
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Establishing data streams...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="formal-card p-20 text-center border-dashed border-[var(--color-border)]">
          <div className="text-4xl mb-6 grayscale">📭</div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-widest">No Quizzes Active</h3>
          <p className="text-[var(--color-text-muted)] max-w-sm mx-auto mt-2 text-[10px] font-bold uppercase tracking-tighter">Your quiz catalog is empty. Create an assessment to begin.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Quiz List */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] px-2 mb-2">Live Catalog</h2>
            <div className="grid gap-3">
              {quizzes.map((quiz) => (
                <div key={quiz._id} 
                  className={`formal-card p-5 transition-all duration-200 cursor-pointer ${
                    selectedQuiz?._id === quiz._id 
                    ? 'border-primary ring-1 ring-primary/30 bg-primary/5' 
                    : 'hover:border-slate-700 hover:bg-slate-800/30'
                  }`}
                  onClick={() => handleQRCode(quiz._id)}
                >
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex-1">
                      <h3 className="font-bold text-md text-[var(--color-text-primary)] tracking-tight leading-tight">{quiz.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-sm bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] border border-[var(--color-border)] uppercase">
                          {quiz.department}
                        </span>
                        <span className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                          {quiz.totalQuestions} Questions • {quiz.timeLimit}m
                        </span>
                      </div>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-[0.2em] ${
                      quiz.isActive 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                    }`}>
                      {quiz.isActive ? 'Live' : 'Hidden'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[var(--color-border)]">
                    <button onClick={(e) => { e.stopPropagation(); handleQRCode(quiz._id); }}
                      className="flex-1 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-primary)]/10 transition-all text-[var(--color-text-muted)]">
                      View QR
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleToggle(quiz._id); }}
                      className="flex-1 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-primary)]/10 transition-all text-[var(--color-text-muted)]">
                      {quiz.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(quiz._id); }}
                      className="flex-1 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: QR Details */}
          <div className="lg:col-span-5 lg:sticky lg:top-10">
            {qrCode ? (
              <div className="formal-card p-8 text-center animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary animate-pulse" />
                <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] mb-8 text-[var(--color-text-muted)]">Distribution Console</h3>
                
                <div className="bg-white p-6 rounded-xl mx-auto w-fit mb-8 shadow-inner ring-4 ring-[var(--color-border)]">
                  <img src={qrCode.qrCode} alt="Quiz QR Code" className="w-40 h-40 sm:w-56 sm:h-56" />
                </div>

                <div className="bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg p-4 mb-8 text-left">
                   <p className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Entry Point URL</p>
                   <p className="text-[10px] text-primary-light font-bold break-all select-all font-mono leading-relaxed">{qrCode.url}</p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(qrCode.url);
                    addToast('Successfully copied access link');
                  }}
                  className="w-full py-4 rounded-xl gradient-bg text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  Copy Entrance Link
                </button>
              </div>
            ) : (
              <div className="formal-card p-12 text-center border-dashed border-[var(--color-border)] min-h-[400px] flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-hover)] flex items-center justify-center text-2xl mb-4 grayscale opacity-30">📱</div>
                <p className="text-[var(--color-text-muted)] text-[10px] font-bold uppercase tracking-[0.2em] max-w-[180px] leading-relaxed">Select an entry from the catalog to initialize sharing</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
