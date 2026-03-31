import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  enrollmentNo: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  branch: { type: String, required: true, trim: true },
  department: {
    type: String,
    required: true,
    enum: ['IT', 'CSE', 'ECE', 'ME', 'CE', 'EE', 'CIVIL']
  },
  password: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.Student || mongoose.model('Student', studentSchema);
