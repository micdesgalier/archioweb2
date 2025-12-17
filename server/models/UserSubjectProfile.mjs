// server/models/userSubjectProfile.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSubjectProfileSchema = new Schema({
  // FK vers users(id)
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // FK vers subjects(id)
  subject_id: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },

  can_help: {
    type: Boolean,
    default: false,
    required: true,
  },

  needs_help: {
    type: Boolean,
    default: false,
    required: true,
  },

  level: {
    type: Number,
    min: 1,
    max: 5, // niveau ressenti (1–5)
  },

  comment: {
    type: String,
    trim: true,
  },
}, {
  timestamps: false,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;
      ret.id = `${ret.user_id}_${ret.subject_id}`;
      return ret;
    },
  },
});

// Clé primaire composite (user_id, subject_id)
userSubjectProfileSchema.index(
  { user_id: 1, subject_id: 1 },
  { unique: true }
);

// Règle métier utile : ne pas être à la fois en aide et en difficulté
userSubjectProfileSchema.pre('save', function (next) {
  if (this.can_help && this.needs_help) {
    return next(
      new Error('Un utilisateur ne peut pas à la fois aider et demander de l’aide pour la même matière.')
    );
  }
  next();
});

export const UserSubjectProfile = model(
  'UserSubjectProfile',
  userSubjectProfileSchema
);
export default UserSubjectProfile;