import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import Student from '@/models/Student';
import { verifyToken, requireRole } from '@/lib/auth-server';

const branchToDepartment = (branch) => {
  const mapping = {
    'IT': 'IT', 'INFORMATION TECHNOLOGY': 'IT',
    'CSE': 'CSE', 'COMPUTER SCIENCE': 'CSE', 'COMPUTER SCIENCE AND ENGINEERING': 'CSE',
    'ECE': 'ECE', 'ELECTRONICS': 'ECE', 'ELECTRONICS AND COMMUNICATION': 'ECE',
    'ME': 'ME', 'MECHANICAL': 'ME', 'MECHANICAL ENGINEERING': 'ME',
    'CE': 'CE', 'COMPUTER ENGINEERING': 'CE',
    'EE': 'EE', 'ELECTRICAL': 'EE', 'ELECTRICAL ENGINEERING': 'EE',
    'CIVIL': 'CIVIL', 'CIVIL ENGINEERING': 'CIVIL'
  };
  return mapping[branch.toUpperCase()] || 'IT';
};

export async function GET(req) {
  try {
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    
    const roleCheck = requireRole(authResult.user, 'teacher');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    const { department } = authResult.user;
    const students = await Student.find({ department }).select('-password').sort({ name: 1 });
    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    
    const roleCheck = requireRole(authResult.user, 'teacher');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    const body = await req.json();
    const { enrollmentNo, name, branch } = body;

    if (!enrollmentNo || !name || !branch) {
      return NextResponse.json({ message: 'Enrollment number, name, and branch are required.' }, { status: 400 });
    }

    const existing = await Student.findOne({ enrollmentNo: enrollmentNo.toUpperCase() });
    if (existing) {
      return NextResponse.json({ message: 'Student with this enrollment number already exists.' }, { status: 400 });
    }

    const department = branchToDepartment(branch);
    const hashedPassword = await bcrypt.hash(enrollmentNo.toUpperCase(), 12);

    const student = await Student.create({
      enrollmentNo: enrollmentNo.toUpperCase(),
      name,
      branch,
      department,
      password: hashedPassword
    });

    return NextResponse.json({ message: 'Student added successfully.', student: { id: student._id, enrollmentNo: student.enrollmentNo, name: student.name, branch: student.branch, department: student.department } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
