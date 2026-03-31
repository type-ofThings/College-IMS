import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  department: {
    type: String,
    required: true,
    enum: ['IT', 'CSE', 'ECE', 'ME', 'CE', 'EE', 'CIVIL']
  },
  totalQuestions: { type: Number, required: true },
  questionsToAttempt: { type: Number, required: true },
  timeLimit: { type: Number, default: 30 },
  allowMultipleAttempts: { type: Boolean, default: false },
  password: { type: String, default: '' },
  activeFrom: { type: Date, default: Date.now },
  activeUntil: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
