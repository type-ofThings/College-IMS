import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import { verifyToken, requireRole } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    
    // Only teachers can create quizzes
    const roleCheck = requireRole(authResult.user, 'teacher');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    const body = await req.json();
    const { title, department, questionsToAttempt, timeLimit, allowMultipleAttempts, password, questions, activeFrom, activeUntil } = body;

    if (!title || !department || !questions || !questions.length) {
      return NextResponse.json({ message: 'Title, department, and questions are required.' }, { status: 400 });
    }

    const numToAttempt = questionsToAttempt || questions.length;

    const quiz = await Quiz.create({
      title,
      department,
      totalQuestions: questions.length,
      questionsToAttempt: numToAttempt,
      timeLimit: timeLimit || 30,
      allowMultipleAttempts: allowMultipleAttempts || false,
      password: password || '',
      activeFrom: activeFrom || Date.now(),
      activeUntil: activeUntil || null,
      createdBy: authResult.user.id
    });

    const questionDocs = questions.map(q => ({
      quizId: quiz._id,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer
    }));

    await Question.insertMany(questionDocs);

    return NextResponse.json({ message: 'Quiz created successfully.', quiz }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    await connectDB();
    const { role, department, id } = authResult.user;
    let filter = {};

    if (role === 'teacher') {
      filter = { createdBy: id };
    } else {
      filter = { department };
    }

    const quizzes = await Quiz.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const now = new Date();
    const processedQuizzes = quizzes.map(quiz => {
      let status = 'active';
      if (!quiz.isActive) status = 'locked';
      else if (quiz.activeFrom && now < new Date(quiz.activeFrom)) status = 'upcoming';
      else if (quiz.activeUntil && now > new Date(quiz.activeUntil)) status = 'expired';
      
      return { 
        ...quiz.toObject(), 
        status 
      };
    });

    return NextResponse.json(processedQuizzes);
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
