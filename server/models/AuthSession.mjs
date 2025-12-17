// server/models/authSession.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const authSessionSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  refresh_token: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 255,
  },

  expires_at: {
    type: Date,
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

// Index utile pour rechercher rapidement les sessions d'un utilisateur
authSessionSchema.index({ user_id: 1 });

// Règles métier
authSessionSchema.pre('save', function(next) {
  if (!this.refresh_token || !this.refresh_token.trim()) {
    return next(new Error('Le refresh token est obligatoire.'));
  }
  next();
});

export const AuthSession = model('AuthSession', authSessionSchema);
export default AuthSession;