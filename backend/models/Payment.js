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
paymentSchema.pre("save", async function (next) {
  if (!this.paymentId) {
    const count = await mongoose.model("Payment").countDocuments();
    this.paymentId = `PAY${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

export default mongoose.model("Payment", paymentSchema);
