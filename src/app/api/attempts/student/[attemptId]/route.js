import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attempt from '@/models/Attempt';
import Question from '@/models/Question';
import { verifyToken, requireRole } from '@/lib/auth-server';

// GET - Get specific attempt details including right/wrong answers
export async function GET(req, props) {
  try {
    const params = await props.params;
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    const roleCheck = requireRole(authResult.user, 'student');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    
    // Find attempt and populate quiz to get title
    const attempt = await Attempt.findOne({
      _id: params.attemptId,
      studentId: authResult.user.id
    }).populate('quizId', 'title department');

    if (!attempt) {
      return NextResponse.json({ message: 'Attempt not found.' }, { status: 404 });
    }

    // Populate the questions manually to ensure we get the options and correctAnswer
    const questions = await Question.find({ _id: { $in: attempt.answers.map(a => a.questionId) } });
    
    // Map the questions back to the attempt answers to provide a complete review object
    const reviewData = attempt.answers.map(answer => {
      const question = questions.find(q => String(q._id) === String(answer.questionId));
      return {
        questionId: answer.questionId,
        questionText: question ? question.questionText : 'Question removed from database',
        options: question ? question.options : [],
        correctAnswer: question ? question.correctAnswer : -1,
        selectedAnswer: answer.selectedAnswer,
        isCorrect: question ? answer.selectedAnswer === question.correctAnswer : false
      };
    });

    return NextResponse.json({
      attemptId: attempt._id,
      quizTitle: attempt.quizId?.title || 'Unknown Quiz',
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      submittedAt: attempt.submittedAt,
      review: reviewData
    });

  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
