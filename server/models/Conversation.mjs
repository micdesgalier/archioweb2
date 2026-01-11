// server/models/conversation.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const conversationSchema = new Schema({
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true,
  },

  // Lié à un study_group si type === 'group'
  group_id: {
    type: Schema.Types.ObjectId,
    ref: 'StudyGroup',
  },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, 
{
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

// Index utiles
conversationSchema.index({ type: 1 });
conversationSchema.index({ group_id: 1 });

// Règles métier
conversationSchema.pre('save', async function () {
  // Une conversation de groupe doit avoir un group_id
  if (this.type === 'group' && !this.group_id) {
    throw new Error('Une conversation de type "group" doit être liée à un study_group.');
  }

  // Une conversation privée ne doit pas être liée à un groupe
  if (this.type === 'private' && this.group_id) {
    throw new Error('Une conversation privée ne peut pas être liée à un study_group.');
  }
});

export const Conversation = model('Conversation', conversationSchema);
export default Conversation;