import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  department: {
    type: String,
    required: true,
    enum: ['IT', 'CSE', 'ECE', 'ME', 'CE', 'EE', 'CIVIL']
  }
}, { timestamps: true });

export default mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);
