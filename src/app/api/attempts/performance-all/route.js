import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attempt from '@/models/Attempt';
import Quiz from '@/models/Quiz';
import { verifyToken, requireRole } from '@/lib/auth-server';

// GET - Teacher performance stats per quiz
export async function GET(req) {
  try {
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    const roleCheck = requireRole(authResult.user, 'teacher');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    const teacherId = authResult.user.id;
    const quizzes = await Quiz.find({ createdBy: teacherId });
    const quizIds = quizzes.map(q => q._id);

    const stats = await Attempt.aggregate([
      { $match: { quizId: { $in: quizIds } } },
      {
        $group: {
          _id: "$quizId",
          avgScore: { $avg: { $multiply: [{ $divide: ["$score", "$totalQuestions"] }, 100] } },
          totalAttempts: { $sum: 1 },
          passCount: {
            $sum: {
              $cond: [
                { $gte: [{ $divide: ["$score", "$totalQuestions"] }, 0.5] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "_id",
          as: "quiz"
        }
      },
      { $unwind: "$quiz" },
      {
        $project: {
          title: "$quiz.title",
          avgScore: { $round: ["$avgScore", 1] },
          totalAttempts: 1,
          passRate: { 
            $round: [{ $multiply: [{ $divide: ["$passCount", "$totalAttempts"] }, 100] }, 1] 
          }
        }
      },
      { $sort: { avgScore: -1 } }
    ]);

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
