import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  questionText: { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: [arr => arr.length === 4, 'Exactly 4 options required']
  },
  correctAnswer: { type: Number, required: true, min: 0, max: 3 }
}, { timestamps: true });

export default mongoose.models.Question || mongoose.model('Question', questionSchema);
