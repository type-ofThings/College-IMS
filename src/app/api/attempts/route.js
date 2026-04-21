import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attempt from '@/models/Attempt';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import { verifyToken, requireRole } from '@/lib/auth-server';

// POST - Submit a quiz attempt (student only)
export async function POST(req) {
  try {
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    const roleCheck = requireRole(authResult.user, 'student');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    const body = await req.json();
    const { quizId, answers } = body;
    const studentId = authResult.user.id;

    if (!quizId || !answers) {
      return NextResponse.json({ message: 'Quiz ID and answers are required.' }, { status: 400 });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found.' }, { status: 404 });
    }

    if (!quiz.allowMultipleAttempts) {
      const existing = await Attempt.findOne({ studentId, quizId });
      if (existing) {
        return NextResponse.json({ message: 'You have already attempted this quiz.' }, { status: 400 });
      }
    }

    let score = 0;
    const processedAnswers = [];

    // Bulk fetch all questions in one query instead of N individual queries
    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

    for (const ans of answers) {
      const question = questionMap.get(ans.questionId.toString());
      if (question && question.correctAnswer === ans.selectedAnswer) {
        score++;
      }
      processedAnswers.push({
        questionId: ans.questionId,
        selectedAnswer: ans.selectedAnswer
      });
    }

    await Attempt.create({
      studentId,
      quizId,
      answers: processedAnswers,
      score,
      totalQuestions: answers.length
    });

    return NextResponse.json({
      message: 'Quiz submitted successfully.',
      result: { score, totalQuestions: answers.length, percentage: Math.round((score / answers.length) * 100) }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
