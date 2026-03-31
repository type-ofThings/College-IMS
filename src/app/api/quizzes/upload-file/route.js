import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { verifyToken, requireRole } from '@/lib/auth-server';

export async function POST(req) {
  try {
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    
    const roleCheck = requireRole(authResult.user, 'teacher');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ message: 'Please upload a CSV or Excel file.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const questions = [];

    data.forEach(row => {
      const getVal = (keyStr) => {
        const matchingKey = Object.keys(row).find(k => k.toLowerCase().replace(/\s/g,'') === keyStr.toLowerCase().replace(/\s/g,''));
        return matchingKey ? row[matchingKey] : null;
      };

      const qText = getVal('Question');
      const optA = getVal('Option A') || getVal('A');
      const optB = getVal('Option B') || getVal('B');
      const optC = getVal('Option C') || getVal('C');
      const optD = getVal('Option D') || getVal('D');
      const ans = getVal('Answer') || getVal('Correct Answer');

      if (qText && optA && optB && optC && optD && ans !== null) {
        let correctAnswer = 0;
        const match = String(ans).match(/[a-d]/i);
        if (match && String(ans).length <= 2) {
           correctAnswer = match[0].toLowerCase().charCodeAt(0) - 97;
        } else {
           const textA = String(optA).trim().toLowerCase();
           const textB = String(optB).trim().toLowerCase();
           const textC = String(optC).trim().toLowerCase();
           const textD = String(optD).trim().toLowerCase();
           const val = String(ans).trim().toLowerCase();
           if(val === textB) correctAnswer = 1;
           else if(val === textC) correctAnswer = 2;
           else if(val === textD) correctAnswer = 3;
        }

        questions.push({
          questionText: String(qText),
          options: [String(optA), String(optB), String(optC), String(optD)],
          correctAnswer
        });
      }
    });

    if (!questions.length) {
      return NextResponse.json({ message: 'Could not detect any valid questions. Please ensure columns include: Question, Option A, Option B, Option C, Option D, Answer' }, { status: 400 });
    }

    return NextResponse.json({ message: `Parsed ${questions.length} questions from file.`, questions });
  } catch (error) {
    return NextResponse.json({ message: 'Error processing file.', error: error.message }, { status: 500 });
  }
}
