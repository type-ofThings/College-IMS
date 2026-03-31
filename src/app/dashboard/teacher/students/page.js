'use client';

import { useState, useEffect } from 'react';
import { getStudents, addStudent, uploadStudents, deleteStudent } from '@/lib/api';
import { useToast } from '@/components/ToastContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ enrollmentNo: '', name: '', branch: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await addStudent(form);
      addToast('Student registered successfully.');
      setForm({ enrollmentNo: '', name: '', branch: '' });
      setShowAddForm(false);
      loadStudents();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubmitLoading(true);
    setUploadSummary(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await uploadStudents(formData);
      setUploadSummary(data.summary);
      addToast(data.message);
      loadStudents();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitLoading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this student record permanently?')) return;
    try {
      await deleteStudent(id);
      setStudents(students.filter(s => s._id !== id));
      addToast('Student record purged.');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(term) || s.enrollmentNo.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">Student Directory</h1>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1 font-bold uppercase tracking-widest italic">
            Total {students.length} students enrolled in your department.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-30">🔍</span>
            <input
              type="text"
              placeholder="Search directory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:border-primary placeholder:text-[var(--color-text-muted)]/50 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddForm(!showAddForm)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl gradient-bg text-white text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-md">
              + New Record
            </button>
            <label className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-[var(--color-primary)]/10 transition-all flex items-center justify-center gap-2">
              <span>📥</span> Batch Import
              <input type="file" accept=".xlsx,.xls" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Upload Summary */}
      {uploadSummary && (
        <div className="formal-card p-6 border-primary/30 animate-slide-up relative bg-[var(--color-surface-hover)]/50">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">Import Analysis Summary</h3>
             <button onClick={() => setUploadSummary(null)} className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest hover:text-[var(--color-text-primary)] transition-colors">Acknowledge</button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] text-center">
              <p className="text-2xl font-bold text-[var(--color-text-primary)] mb-1 tabular-nums">{uploadSummary.total}</p>
              <p className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">Total</p>
            </div>
            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-emerald-500/10 text-center">
              <p className="text-2xl font-bold text-emerald-500 mb-1 tabular-nums">{uploadSummary.success}</p>
              <p className="text-[8px] font-bold text-emerald-500/70 uppercase tracking-[0.2em]">Success</p>
            </div>
            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-rose-500/10 text-center">
              <p className="text-2xl font-bold text-rose-500 mb-1 tabular-nums">{uploadSummary.failed}</p>
              <p className="text-[8px] font-bold text-rose-500/70 uppercase tracking-[0.2em]">Conflicts</p>
            </div>
          </div>
          {uploadSummary.errors.length > 0 && (
            <div className="mt-4 bg-[var(--color-surface)] rounded-lg p-3 border border-rose-500/10 max-h-24 overflow-y-auto custom-scrollbar">
               {uploadSummary.errors.map((e, i) => (
                 <p key={i} className="text-[9px] text-rose-500/80 font-mono mb-1 last:mb-0 select-text">● {e}</p>
               ))}
            </div>
          )}
        </div>
      )}

      {/* Add Form Card */}
      {showAddForm && (
        <form onSubmit={handleAddStudent} className="formal-card p-6 animate-slide-up bg-[var(--color-surface-hover)]/40 relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary opacity-50" />
          <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-6">Record Admission</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-[8px] font-bold uppercase text-[var(--color-text-muted)] tracking-widest ml-1">Enrollment ID</p>
              <input type="text" required placeholder="Identification Number" value={form.enrollmentNo}
                onChange={(e) => setForm({ ...form, enrollmentNo: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:border-primary transition-all font-mono" />
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-bold uppercase text-[var(--color-text-muted)] tracking-widest ml-1">Legal Name</p>
              <input type="text" required placeholder="Full Name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:border-primary transition-all" />
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-bold uppercase text-[var(--color-text-muted)] tracking-widest ml-1">Specialization</p>
              <input type="text" required placeholder="e.g., Computer Science" value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:border-primary transition-all" />
            </div>
          </div>
          <div className="flex gap-2 mt-8 pt-4 border-t border-[var(--color-border)]">
            <button type="submit" disabled={submitLoading}
              className="px-6 py-2.5 rounded-xl gradient-bg text-white text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50">
              {submitLoading ? 'Registering...' : 'Validate & Save'}
            </button>
            <button type="button" onClick={() => setShowAddForm(false)}
              className="px-6 py-2.5 rounded-xl bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] text-[10px] font-bold uppercase tracking-widest hover:text-[var(--color-text-primary)] transition-all">
              Discard
            </button>
          </div>
        </form>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
           <LoadingSpinner size="lg" />
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Establishing secure link...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="formal-card p-24 text-center border-dashed border-slate-700">
          <div className="text-4xl mb-6 grayscale opacity-20">👨‍🎓</div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Database Vacant</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2 text-[10px] font-bold uppercase tracking-tighter">Enter student records to populate the system catalog.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="formal-card overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--color-surface-hover)] shadow-inner border-b border-[var(--color-border)]">
                    <th className="px-6 py-4 text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">ID Number</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">Student</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">Specialization</th>
                    <th className="px-6 py-4 text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">Department</th>
                    <th className="px-6 py-4 text-right text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="group hover:bg-[var(--color-primary)]/5 transition-all">
                      <td className="px-6 py-4">
                         <span className="text-[11px] font-bold font-mono text-primary-light tracking-wider tabular-nums">{student.enrollmentNo}</span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                           <div className="w-7 h-7 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center text-[10px] text-[var(--color-text-primary)] font-bold uppercase tabular-nums">
                              {student.name.charAt(0)}
                           </div>
                           <span className="text-xs font-bold text-[var(--color-text-primary)]">{student.name}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{student.branch}</span>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic opacity-50">{student.department}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button onClick={() => handleDelete(student._id)}
                           className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500/30 group-hover:text-rose-500 transition-all"
                           title="Delete record">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                           </svg>
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
             {filteredStudents.map((student) => (
               <div key={student._id} className="formal-card p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-xs text-white font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--color-text-primary)] leading-tight">{student.name}</p>
                        <p className="text-[10px] font-mono font-bold text-primary-light mt-0.5 tracking-tighter tabular-nums">{student.enrollmentNo}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(student._id)} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{student.branch}</span>
                    <span className="text-[8px] font-bold uppercase text-[var(--color-text-muted)] tracking-tighter tabular-nums">
                      DEPT: {student.department}
                    </span>
                  </div>
               </div>
             ))}
          </div>
          
          {filteredStudents.length === 0 && searchTerm && (
            <div className="formal-card p-20 text-center">
               <p className="text-2xl mb-4 grayscale opacity-20">🔍</p>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No entries found matching your query.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
