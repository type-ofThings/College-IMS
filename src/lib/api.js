async function request(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove Content-Type for FormData safely
  if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(`/api${endpoint}`, {
    cache: 'no-store',
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type");
  let data;
  
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    throw new Error(`Server returned non-JSON response (${res.status}). ${text.substring(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// Auth
export const teacherLogin = (body) => request('/auth/teacher/login', { method: 'POST', body: JSON.stringify(body) });
export const teacherRegister = (body) => request('/auth/teacher/register', { method: 'POST', body: JSON.stringify(body) });
export const studentLogin = (body) => request('/auth/student/login', { method: 'POST', body: JSON.stringify(body) });

// Students
export const getStudents = () => request('/students');
export const addStudent = (body) => request('/students', { method: 'POST', body: JSON.stringify(body) });
export const uploadStudents = (formData) => request('/students/upload', { method: 'POST', body: formData });
export const deleteStudent = (id) => request(`/students/${id}`, { method: 'DELETE' });

// Quizzes
export const getQuizzes = () => request('/quizzes');
export const getQuizById = (id) => request(`/quizzes/${id}`);
export const createQuiz = (body) => request('/quizzes', { method: 'POST', body: JSON.stringify(body) });
export const generateQRCode = (id) => request(`/quizzes/${id}/qrcode`, { method: 'POST' });
export const uploadFileQuiz = (formData) => request('/quizzes/upload-file', { method: 'POST', body: formData });
export const toggleQuizStatus = (id) => request(`/quizzes/${id}/toggle`, { method: 'PATCH' });
export const deleteQuiz = (id) => request(`/quizzes/${id}`, { method: 'DELETE' });
export const startQuizWithPassword = (id, password) => request(`/quizzes/${id}/start`, { method: 'POST', body: JSON.stringify({ password }) });

// Attempts
export const submitAttempt = (body) => request('/attempts', { method: 'POST', body: JSON.stringify(body) });
export const getStudentAttempts = () => request('/attempts/student');
export const getQuizAttempts = (quizId) => request(`/attempts/quiz/${quizId}`);
export const getTeacherStats = () => request('/attempts/stats');
export const getAllAttempts = () => request('/attempts/all');
export const checkAttempt = (quizId) => request(`/attempts/check/${quizId}`);
export const getStudentPerformance = () => request('/attempts/performance');
export const getLeaderboard = () => request('/attempts/leaderboard');
export const getTeacherPerformance = () => request('/attempts/performance-all');
