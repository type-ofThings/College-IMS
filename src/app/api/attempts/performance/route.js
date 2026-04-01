import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attempt from '@/models/Attempt';
import { verifyToken, requireRole } from '@/lib/auth-server';

// GET - Student performance overview
export async function GET(req) {
  try {
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    const roleCheck = requireRole(authResult.user, 'student');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    const studentId = authResult.user.id;
    const attempts = await Attempt.find({ studentId })
      .populate('quizId', 'title department')
      .sort({ submittedAt: 1 });

    if (attempts.length === 0) {
      return NextResponse.json({
        totalAttempts: 0,
        avgScore: 0,
        highestScore: 0,
        lowestScore: 0,
        recentAttempts: [],
        chartData: []
      });
    }

    const percentages = attempts.map(a => Math.round((a.score / a.totalQuestions) * 100));
    const totalAttempts = attempts.length;
    const avgScore = Math.round(percentages.reduce((a, b) => a + b, 0) / totalAttempts);
    const highestScore = Math.max(...percentages);
    const lowestScore = Math.min(...percentages);

    const recentAttempts = [...attempts].reverse();
    const chartData = attempts.map(a => ({
      name: a.quizId?.title || 'Quiz',
      score: Math.round((a.score / a.totalQuestions) * 100),
      date: new Date(a.submittedAt).toLocaleDateString()
    }));

    return NextResponse.json({
      totalAttempts,
      avgScore,
      highestScore,
      lowestScore,
      recentAttempts,
      chartData
    });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
