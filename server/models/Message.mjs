import mongoose from 'mongoose'; 
const { Schema, model } = mongoose; 
const messageSchema = new Schema({ 
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
  receiver_id: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
  content: { type: String, required: true, maxlength: 500 }, 
  timestamp: { type: Date, default: Date.now }, 
  read: { type: Boolean, default: false }, 
  parent_id: { type: Schema.Types.ObjectId, ref: 'Message' }, 
  // si fil de discussion 
  conversation_id: { type: Schema.Types.ObjectId, ref: 'Conversation' } 
  // si tu as des conversations
  }, { timestamps: true }); 
  
  const Message = model('Message', messageSchema); 
  export default Message;