import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const messageSchema = new Schema({
  from: { type: String, required: true, index: true },
  to: { type: String, required: true, index: true },
  content: { type: String, required: true, maxlength: 500 },
  timestamp: { type: Date, default: Date.now, index: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

// Indexes for efficient querying
messageSchema.index({ from: 1, to: 1, timestamp: -1 });
messageSchema.index({ to: 1, from: 1, timestamp: -1 });

const Message = model('Message', messageSchema);
export default Message;