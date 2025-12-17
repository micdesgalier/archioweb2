// server/models/groupMember.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const groupMemberSchema = new Schema({
  // FK vers study_groups(id)
  group_id: {
    type: Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true,
  },

  // FK vers users(id)
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  role: {
    type: String,
    enum: ['member', 'admin'],
    default: 'member',
    required: true,
  },

  status: {
    type: String,
    enum: ['invited', 'joined', 'left'],
    default: 'joined',
    required: true,
  },

  joined_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, {
  timestamps: false,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;
      ret.id = `${ret.group_id}_${ret.user_id}`;
      return ret;
    },
  },
});

// Clé primaire composite (group_id, user_id)
groupMemberSchema.index(
  { group_id: 1, user_id: 1 },
  { unique: true }
);

// Index utiles
groupMemberSchema.index({ user_id: 1 });
groupMemberSchema.index({ status: 1 });

// Règles métier
groupMemberSchema.pre('save', async function () {
  // Un admin doit être "joined"
  if (this.role === 'admin' && this.status !== 'joined') {
    throw new Error('Un admin doit obligatoirement avoir le statut "joined".');
  }
});

export const GroupMember = model('GroupMember', groupMemberSchema);
export default GroupMember;