import mongoose from 'mongoose';

export default mongoose.model('Counter', new mongoose.Schema({ _id: String, sequence: { type: Number, required: true } }));
