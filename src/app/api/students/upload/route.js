import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
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

export async function POST(req) {
  try {
    const authResult = verifyToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    
    const roleCheck = requireRole(authResult.user, 'teacher');
    if (roleCheck) return NextResponse.json({ message: roleCheck.error }, { status: roleCheck.status });

    await connectDB();
    
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ message: 'Please upload an Excel file.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data.length) {
      return NextResponse.json({ message: 'Excel file is empty.' }, { status: 400 });
    }

    let success = 0;
    let failed = 0;
    const errors = [];

    for (const row of data) {
      try {
        const enrollmentNo = (row.Enrollment || row.EnrollmentNo || row['Enrollment No'] || row.enrollment || '').toString().toUpperCase().trim();
        const name = (row.Name || row.name || '').toString().trim();
        const branch = (row.Branch || row.branch || '').toString().trim();

        if (!enrollmentNo || !name || !branch) {
          failed++;
          errors.push(`Row missing data: ${JSON.stringify(row)}`);
          continue;
        }

        const existing = await Student.findOne({ enrollmentNo });
        if (existing) {
          failed++;
          errors.push(`Duplicate: ${enrollmentNo}`);
          continue;
        }

        const department = branchToDepartment(branch);
        const hashedPassword = await bcrypt.hash(enrollmentNo, 12);

        await Student.create({ enrollmentNo, name, branch, department, password: hashedPassword });
        success++;
      } catch (err) {
        failed++;
        errors.push(`Error processing row: ${err.message}`);
      }
    }

    return NextResponse.json({ message: 'Upload complete.', summary: { total: data.length, success, failed, errors: errors.slice(0, 10) } });
  } catch (error) {
    return NextResponse.json({ message: 'Error processing file.', error: error.message }, { status: 500 });
  }
}
