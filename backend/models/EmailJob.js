import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  _id: String,
  to: { type: [String], required: true }, subject: String, html: String,
  guard: { model: { type: String, enum: ['Grade', 'Payment'] }, record: mongoose.Schema.Types.ObjectId, eventAt: Date },
  status: { type: String, enum: ['pending', 'sending', 'sent', 'failed', 'cancelled'], default: 'pending' },
  attempts: { type: Number, default: 0 }, nextAttempt: { type: Date, default: Date.now },
  leaseUntil: Date, sentAt: Date, lastError: String,
}, { timestamps: true });
schema.index({ status: 1, nextAttempt: 1, leaseUntil: 1 });
export default mongoose.model('EmailJob', schema);
