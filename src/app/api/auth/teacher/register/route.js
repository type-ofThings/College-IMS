import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Teacher from '@/models/Teacher';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, password, department } = body;

    if (!name || !email || !password || !department) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    const existing = await Teacher.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ message: 'Email already registered.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const teacher = await Teacher.create({ name, email: email.toLowerCase(), password: hashedPassword, department });

    const token = jwt.sign(
      { id: teacher._id, role: 'teacher', department: teacher.department, name: teacher.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      token,
      user: { id: teacher._id, name: teacher.name, email: teacher.email, department: teacher.department, role: 'teacher' }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
