import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import { verifyToken, requireRole } from '@/lib/auth-server';

export async function GET(req, props) {
  try {
    const params = await props.params;
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    await connectDB();
    const quiz = await Quiz.findById(params.id).populate('createdBy', 'name');
    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found.' }, { status: 404 });
    }

    const now = new Date();
    let status = 'active';
    if (quiz.activeFrom && now < new Date(quiz.activeFrom)) status = 'upcoming';
    else if (quiz.activeUntil && now > new Date(quiz.activeUntil)) status = 'expired';

    let questions = await Question.find({ quizId: quiz._id });
    const totalQuestions = questions.length;

    let requiresPassword = false;
    if (authResult.user.role === 'student') {
      if (quiz.password && quiz.password.trim() !== '') {
        requiresPassword = true;
        questions = null;
      } else {
        questions = questions.sort(() => Math.random() - 0.5);
        questions = questions.slice(0, quiz.questionsToAttempt);
        questions = questions.map(q => ({
          _id: q._id,
          questionText: q.questionText,
          options: q.options
        }));
      }
    }

    return NextResponse.json({ quiz, questions, requiresPassword, totalQuestions, status });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, props) {
  try {
    const params = await props.params;
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    
    const roleCheck = requireRole(authResult.user, 'teacher');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    const quiz = await Quiz.findByIdAndDelete(params.id);
    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found.' }, { status: 404 });
    }
    await Question.deleteMany({ quizId: quiz._id });
    return NextResponse.json({ message: 'Quiz deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
