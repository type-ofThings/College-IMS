'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createQuiz, uploadFileQuiz } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CreateQuizPage() {
  const auth = useAuth();
  const user = auth?.user;
  const router = useRouter();
  
  const [form, setForm] = useState({
    title: '', 
    department: 'All',
    questionsToAttempt: '', 
    timeLimit: 30, 
    allowMultipleAttempts: false,
    password: '',
    activeFrom: '', activeUntil: ''
  });
  const [questions, setQuestions] = useState([{ questionText: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const addQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await uploadFileQuiz(formData);
      setQuestions(data.questions);
      setMessage({ type: 'success', text: `Successfully parsed ${data.questions.length} questions from document.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const validQuestions = questions.filter(q =>
      q.questionText.trim() && q.options.every(o => o.trim())
    );

    if (!validQuestions.length) {
      setMessage({ type: 'error', text: 'Please define at least one complete question before proceeding.' });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        questionsToAttempt: parseInt(form.questionsToAttempt) || validQuestions.length,
        questions: validQuestions,
        // Convert local datetime strings to proper ISO (respects browser timezone)
        activeFrom: form.activeFrom ? new Date(form.activeFrom).toISOString() : '',
        activeUntil: form.activeUntil ? new Date(form.activeUntil).toISOString() : '',
      };
      await createQuiz(payload);
      setMessage({ type: 'success', text: 'Assessment created successfully.' });
      setTimeout(() => router.push('/dashboard/teacher'), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const departments = ['All', 'IT', 'CSE', 'ECE', 'ME', 'CE', 'EE', 'CIVIL'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="border-b border-[var(--color-border)] pb-4">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">Construct New Assessment</h1>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-1 font-bold uppercase tracking-widest italic">Manual entry or question upload via CSV/Excel.</p>
      </div>

      {message && (
        <div className={`text-[11px] font-bold uppercase tracking-wider rounded-lg px-4 py-3 border ${message.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Configuration */}
        <div className="formal-card p-6 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] border-b border-[var(--color-border)] pb-2">I. Configuration</h2>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
            <div className="col-span-full">
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5 ml-1">Title</label>
              <input type="text" required value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-sm font-medium focus:outline-none focus:border-primary transition-all text-[var(--color-text-primary)]"
                placeholder="e.g., Engineering Mathematics 101" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5 ml-1">Department</label>
              <select value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-sm font-medium focus:outline-none focus:border-primary transition-all text-[var(--color-text-primary)]">
                {departments.map(d => <option key={d} value={d}>{d === 'All' ? '🌐 All Departments (Open)' : d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5 ml-1">Duration (Mins)</label>
              <input type="number" value={form.timeLimit}
                onChange={(e) => setForm({ ...form, timeLimit: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-sm font-medium focus:outline-none focus:border-primary transition-all text-[var(--color-text-primary)]"
                min="1" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5 ml-1">Question Subset</label>
              <input type="number" value={form.questionsToAttempt}
                onChange={(e) => setForm({ ...form, questionsToAttempt: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-sm font-medium focus:outline-none focus:border-primary transition-all text-[var(--color-text-primary)]"
                placeholder={`All (${questions.length})`} min="1" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5 ml-1">Access Credentials</label>
              <input type="text" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-sm font-medium focus:outline-none focus:border-primary transition-all text-[var(--color-text-primary)] font-mono"
                placeholder="Password (Optional)" />
            </div>

            {/* Scheduling Section */}
            <div className="col-span-full pt-4 border-t border-[var(--color-border)] mt-2">
              <h3 className="text-[9px] font-bold uppercase tracking-widest text-primary mb-4">Availability & Scheduling</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5 ml-1">Active From</label>
                  <input type="datetime-local" value={form.activeFrom}
                    onChange={(e) => setForm({ ...form, activeFrom: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] uppercase focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5 ml-1">Active Until</label>
                  <input type="datetime-local" value={form.activeUntil}
                    onChange={(e) => setForm({ ...form, activeUntil: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] uppercase focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>

            <div className="col-span-full pt-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={form.allowMultipleAttempts}
                  onChange={(e) => setForm({ ...form, allowMultipleAttempts: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-surface-hover)] text-primary focus:ring-primary/20" />
                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest group-hover:text-[var(--color-text-primary)] transition-colors">Grant Permision for Multiple Entries</span>
              </label>
            </div>
          </div>
        </div>

        {/* Question Management */}
        <div className="formal-card p-6">
          <div className="flex items-center justify-between mb-8 border-b border-[var(--color-border)] pb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">II. Question Bank ({questions.length})</h2>
            <div className="flex gap-2">
              <label className="px-4 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] cursor-pointer hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-text-primary)] transition-all">
                📥 Question Upload
                <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} className="hidden" />
              </label>
              <button type="button" onClick={addQuestion}
                className="px-4 py-2 rounded-lg bg-primary text-white text-[10px] font-bold uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary/20">
                + New Question
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)]/30 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[10px] font-bold text-primary px-2 py-1 rounded bg-primary/10 border border-primary/20 mt-1 shrink-0 tabular-nums">Q{qIdx + 1}</span>
                  <textarea value={q.questionText} required
                    onChange={(e) => updateQuestion(qIdx, 'questionText', e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] focus:outline-none focus:border-primary transition-all resize-none"
                    placeholder="Describe the question..." rows={2} />
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(qIdx)}
                      className="text-rose-500 font-bold uppercase tracking-tighter text-[10px] mt-2 shrink-0 hover:underline">Revoke</button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3 pl-12">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2 group">
                      <input type="radio" name={`correct-${qIdx}`} checked={q.correctAnswer === oIdx}
                        onChange={() => updateQuestion(qIdx, 'correctAnswer', oIdx)}
                        className="shrink-0 w-3 h-3 text-emerald-500" title="Set as correct" />
                      <input type="text" required value={opt}
                        onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                        className={`flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border text-xs font-medium focus:outline-none transition-all ${q.correctAnswer === oIdx ? 'border-emerald-500/50 text-[var(--color-text-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] focus:border-primary'}`}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={loading}
            className="flex-1 py-4 rounded-xl shadow-xl gradient-bg text-white font-bold text-xs uppercase tracking-[0.2em] shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
            {loading ? <LoadingSpinner size="sm" /> : 'Finalize Assessment'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-surface-hover)]/80 hover:text-[var(--color-text-primary)] transition-all">
            Discard Changes
          </button>
        </div>
      </form>
    </div>
  );
}
