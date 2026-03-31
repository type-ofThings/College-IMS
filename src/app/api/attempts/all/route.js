import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attempt from '@/models/Attempt';
import Quiz from '@/models/Quiz';
import { verifyToken, requireRole } from '@/lib/auth-server';

// GET - All attempts for teacher's quizzes
export async function GET(req) {
  try {
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    const roleCheck = requireRole(authResult.user, 'teacher');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    const quizzes = await Quiz.find({ createdBy: authResult.user.id });
    const quizIds = quizzes.map(q => q._id);
    const attempts = await Attempt.find({ quizId: { $in: quizIds } })
      .populate('studentId', 'name enrollmentNo branch')
      .populate('quizId', 'title department')
      .sort({ submittedAt: -1 });
    return NextResponse.json(attempts);
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
