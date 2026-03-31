import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attempt from '@/models/Attempt';
import { verifyToken, requireRole } from '@/lib/auth-server';

// GET - Get student's own attempts
export async function GET(req) {
  try {
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    const roleCheck = requireRole(authResult.user, 'student');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    const attempts = await Attempt.find({ studentId: authResult.user.id })
      .populate('quizId', 'title department timeLimit')
      .sort({ submittedAt: -1 });

    return NextResponse.json(attempts);
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
