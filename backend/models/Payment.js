import { allocateHumanId } from '../utils/humanId.js';
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Please add payment amount"],
    },
    month: {
      type: String,
      required: [true, "Please add payment month"],
    },
    year: {
      type: Number,
      required: [true, "Please add payment year"],
    },
    notificationPending: { type: Boolean, default: false },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank-transfer", "online"],
      default: "cash",
    },
    transactionId: String,
    notes: String,
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isGenerated: {
      type: Boolean,
      default: false,
    },
    enrollmentDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate payment ID before saving
paymentSchema.pre('validate', async function () {
  if (this.isNew) this.paymentId = await allocateHumanId(this.constructor, 'paymentId', 'PAY', this.paymentId);
});

export default mongoose.model("Payment", paymentSchema);
