import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import connectDB from '@/lib/db';
import Attempt from '@/models/Attempt';
import Quiz from '@/models/Quiz';
import { verifyToken, requireRole } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(req, props) {
  try {
    const params = await props.params;
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    const roleCheck = requireRole(authResult.user, 'teacher');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();

    const quiz = await Quiz.findById(params.quizId);
    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found.' }, { status: 404 });
    }

    const attempts = await Attempt.find({ quizId: params.quizId })
      .populate('studentId', 'name enrollmentNo department branch')
      .sort({ submittedAt: -1 });

    const data = attempts.map((a, i) => ({
      'S.No': i + 1,
      'Name': a.studentId?.name || 'Unknown',
      'Enrollment No': a.studentId?.enrollmentNo || '-',
      'Department': a.studentId?.department || '-',
      'Branch': a.studentId?.branch || '-',
      'Score': a.score,
      'Total Questions': a.totalQuestions,
      'Submitted At': a.submittedAt ? new Date(a.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const safeName = quiz.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${safeName}_results.xlsx`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
