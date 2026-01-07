import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
    index: true
  },
  to: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient conversation queries
messageSchema.index({ from: 1, to: 1, timestamp: -1 });
messageSchema.index({ to: 1, from: 1, timestamp: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;