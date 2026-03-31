import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Student from '@/models/Student';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { enrollmentNo, password } = body;

    if (!enrollmentNo || !password) {
      return NextResponse.json({ message: 'Enrollment number and password are required.' }, { status: 400 });
    }

    const student = await Student.findOne({ enrollmentNo: enrollmentNo.toUpperCase() });
    if (!student) {
      return NextResponse.json({ message: 'Invalid enrollment number or password.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid enrollment number or password.' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: student._id, role: 'student', department: student.department, name: student.name, enrollmentNo: student.enrollmentNo },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      token,
      user: { id: student._id, name: student.name, enrollmentNo: student.enrollmentNo, department: student.department, role: 'student' }
    });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
