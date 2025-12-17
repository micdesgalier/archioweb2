// server/models/conversationParticipant.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const conversationParticipantSchema = new Schema({
  // FK vers conversations(id)
  conversation_id: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },

  // FK vers users(id)
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: false,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;
      ret.id = `${ret.conversation_id}_${ret.user_id}`;
      return ret;
    },
  },
});

// Clé primaire composite (conversation_id, user_id)
conversationParticipantSchema.index(
  { conversation_id: 1, user_id: 1 },
  { unique: true }
);

// Index utiles
conversationParticipantSchema.index({ user_id: 1 });

// Règles métier utiles
conversationParticipantSchema.pre('save', function (next) {
  // Empêcher un utilisateur d'être ajouté deux fois est déjà couvert par l'index unique
  next();
});

export const ConversationParticipant = model(
  'ConversationParticipant',
  conversationParticipantSchema
);
export default ConversationParticipant;