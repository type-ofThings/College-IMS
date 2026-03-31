import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attempt from '@/models/Attempt';
import { verifyToken, requireRole } from '@/lib/auth-server';

// GET - Get all attempts for a specific quiz (teacher only)
export async function GET(req, props) {
  try {
    const params = await props.params;
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    const roleCheck = requireRole(authResult.user, 'teacher');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    const attempts = await Attempt.find({ quizId: params.quizId })
      .populate('studentId', 'name enrollmentNo branch')
      .sort({ score: -1 });

    return NextResponse.json(attempts);
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
