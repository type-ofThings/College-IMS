import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import { verifyToken, requireRole } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(req, props) {
  try {
    const params = await props.params;
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    const roleCheck = requireRole(authResult.user, 'teacher');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    
    const body = await req.json();
    const { activeFrom, activeUntil } = body;

    const quiz = await Quiz.findOne({ _id: params.id, createdBy: authResult.user.id });
    
    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found.' }, { status: 404 });
    }

    quiz.activeFrom = activeFrom || Date.now();
    quiz.activeUntil = activeUntil || null;
    quiz.isActive = true; // Auto-activate upon reopen
    
    await quiz.save();

    return NextResponse.json({ message: 'Quiz reopened successfully.', quiz });
  } catch (error) {
    console.error('Quiz reopen error:', error);
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
