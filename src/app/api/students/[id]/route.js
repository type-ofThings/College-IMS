import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Student from '@/models/Student';
import { verifyToken, requireRole } from '@/lib/auth-server';

export async function DELETE(req, props) {
  try {
    const params = await props.params;
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    
    const roleCheck = requireRole(authResult.user, 'teacher');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    const student = await Student.findByIdAndDelete(params.id);
    if (!student) {
      return NextResponse.json({ message: 'Student not found.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Student deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
