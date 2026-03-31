import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attempt from '@/models/Attempt';
import Quiz from '@/models/Quiz';
import { verifyToken, requireRole } from '@/lib/auth-server';

// GET - Teacher stats overview
export async function GET(req) {
  try {
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    const roleCheck = requireRole(authResult.user, 'teacher');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    const quizzes = await Quiz.find({ createdBy: authResult.user.id });
    const quizIds = quizzes.map(q => q._id);
    const totalAttempts = await Attempt.countDocuments({ quizId: { $in: quizIds } });
    const recentAttempts = await Attempt.find({ quizId: { $in: quizIds } })
      .populate('studentId', 'name enrollmentNo')
      .populate('quizId', 'title')
      .sort({ submittedAt: -1 })
      .limit(5);

    return NextResponse.json({
      totalQuizzes: quizzes.length,
      totalAttempts,
      recentAttempts
    });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
