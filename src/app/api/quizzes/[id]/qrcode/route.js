import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import connectDB from '@/lib/db';
import Quiz from '@/models/Quiz';
import { verifyToken, requireRole } from '@/lib/auth-server';

export async function POST(req, props) {
  try {
    const params = await props.params;
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    
    const roleCheck = requireRole(authResult.user, 'teacher');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    const quiz = await Quiz.findById(params.id);
    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found.' }, { status: 404 });
    }

    // Derive the base URL from the incoming request headers (works on both localhost and Vercel)
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;
    const quizUrl = `${baseUrl}/quiz/${quiz._id}`;
    
    const qrCodeDataUrl = await QRCode.toDataURL(quizUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });

    return NextResponse.json({ qrCode: qrCodeDataUrl, url: quizUrl });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.', error: error.message }, { status: 500 });
  }
}
