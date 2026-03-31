import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedAnswer: { type: Number, min: 0, max: 3 }
  }],
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

attemptSchema.index({ studentId: 1, quizId: 1 });

export default mongoose.models.Attempt || mongoose.model('Attempt', attemptSchema);
