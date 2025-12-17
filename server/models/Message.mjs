// server/models/message.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const messageSchema = new Schema({
  // Conversation liée
  conversation_id: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },

  // Expéditeur
  sender_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Contenu texte (optionnel si pièce jointe)
  content: {
    type: String,
  },

  message_type: {
    type: String,
    enum: ['text', 'image', 'video', 'file'],
    default: 'text',
    required: true,
  },

  // Réponse à un message (thread)
  parent_id: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Index essentiels pour la messagerie
messageSchema.index({ conversation_id: 1, created_at: 1 });
messageSchema.index({ sender_id: 1 });
messageSchema.index({ parent_id: 1 });

// Règles métier
messageSchema.pre('save', async function () {
  // Un message texte doit avoir du contenu
  if (this.message_type === 'text' && (!this.content || !this.content.trim())) {
    throw new Error('Un message de type "text" doit contenir du texte.');
  }

  // Les autres types peuvent avoir content null (URL fichier gérée ailleurs)
});

export const Message = model('Message', messageSchema);
export default Message;