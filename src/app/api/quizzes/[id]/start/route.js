import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import { verifyToken } from '@/lib/auth-server';

export async function POST(req, props) {
  try {
    const params = await props.params;
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    await connectDB();
    const body = await req.json();
    const { password } = body;
    
    const quiz = await Quiz.findById(params.id);
    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found.' }, { status: 404 });
    }

    if (quiz.password && quiz.password !== password) {
      return NextResponse.json({ message: 'Incorrect quiz password.' }, { status: 401 });
    }

    // Success: return questions
    let questions = await Question.find({ quizId: quiz._id });
    questions = questions.sort(() => Math.random() - 0.5)
      .slice(0, quiz.questionsToAttempt)
      .map(q => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options
      }));

    return NextResponse.json({ message: 'Access granted.', questions });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
