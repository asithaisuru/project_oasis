import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  _id: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: Date,
}, { timestamps: true });

export default mongoose.model('AuthSession', schema);
