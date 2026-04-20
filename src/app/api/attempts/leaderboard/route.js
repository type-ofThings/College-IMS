import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attempt from '@/models/Attempt';
import Quiz from '@/models/Quiz';
import { verifyToken } from '@/lib/auth-server';

// GET - Subject-wise leaderboard (accessible by both teachers and students)
export async function GET(req) {
  try {
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');

    // Build match stage — filter by quiz department if a subject is specified
    let matchStage = {};
    if (subject && subject !== 'all') {
      const quizIds = await Quiz.find({ department: subject }).distinct('_id');
      matchStage = { quizId: { $in: quizIds } };
    }

    // Get distinct departments from quizzes for the subject dropdown
    const allDepartments = await Quiz.distinct('department');
    const subjects = allDepartments.filter(d => d && d !== 'All' && d !== '');

    const leaderboard = await Attempt.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: "$studentId",
          totalScore: { $sum: "$score" },
          totalQuestions: { $sum: "$totalQuestions" },
          attemptsCount: { $sum: 1 },
          avgPercentage: { 
            $avg: { $multiply: [{ $divide: ["$score", "$totalQuestions"] }, 100] } 
          }
        }
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      {
        $project: {
          _id: 1,
          totalScore: 1,
          totalQuestions: 1,
          attemptsCount: 1,
          avgPercentage: { $round: ["$avgPercentage", 1] },
          name: "$student.name",
          enrollmentNo: "$student.enrollmentNo",
          department: "$student.department"
        }
      },
      { $sort: { totalScore: -1, avgPercentage: -1 } },
      { $limit: 50 }
    ]);

    return NextResponse.json({ leaderboard, subjects });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
