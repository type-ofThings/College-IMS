import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attempt from '@/models/Attempt';
import Quiz from '@/models/Quiz';
import Student from '@/models/Student';
import { verifyToken } from '@/lib/auth-server';

// GET - Subject & Department-wise leaderboard
export async function GET(req) {
  try {
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');     // quiz title filter
    const department = searchParams.get('department'); // student department filter

    // Build match stage for attempts
    let matchStage = {};

    // Filter by quiz title (subject)
    if (subject && subject !== 'all') {
      const quizIds = await Quiz.find({ title: subject }).distinct('_id');
      matchStage.quizId = { $in: quizIds };
    }

    // Get all distinct quiz titles that have been attempted (for the subject dropdown)
    const attemptedQuizIds = await Attempt.distinct('quizId');
    const attemptedQuizzes = await Quiz.find({ _id: { $in: attemptedQuizIds } }).distinct('title');
    const subjects = attemptedQuizzes.sort();

    // Get all distinct student departments (for the department dropdown)
    const departments = await Student.distinct('department');

    // Build the aggregation pipeline
    const pipeline = [];

    // Match by quiz if subject filter is set
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Group by student
    pipeline.push({
      $group: {
        _id: "$studentId",
        totalScore: { $sum: "$score" },
        totalQuestions: { $sum: "$totalQuestions" },
        attemptsCount: { $sum: 1 },
        avgPercentage: { 
          $avg: { $multiply: [{ $divide: ["$score", "$totalQuestions"] }, 100] } 
        }
      }
    });

    // Lookup student details
    pipeline.push({
      $lookup: {
        from: "students",
        localField: "_id",
        foreignField: "_id",
        as: "student"
      }
    });
    pipeline.push({ $unwind: "$student" });

    // Filter by department if set (after lookup so we have student data)
    if (department && department !== 'all') {
      pipeline.push({ $match: { "student.department": department } });
    }

    // Project fields
    pipeline.push({
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
    });

    pipeline.push({ $sort: { totalScore: -1, avgPercentage: -1 } });
    pipeline.push({ $limit: 50 });

    const leaderboard = await Attempt.aggregate(pipeline);

    return NextResponse.json({ leaderboard, subjects, departments });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
