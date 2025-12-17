// server/models/externalCalendar.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const externalCalendarSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  provider: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50, // 'google', 'apple', ...
  },

  external_id: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255, // id du calendrier externe
  },

  access_token: {
    type: String,
    required: true, // idéalement chiffré côté serveur
  },

  refresh_token: {
    type: String,
    trim: true,
  },

  sync_enabled: {
    type: Boolean,
    default: true,
    required: true,
  },
}, {
  timestamps: false,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  },
});

// Index pour éviter les doublons par calendrier externe et utilisateur
externalCalendarSchema.index({ user_id: 1, provider: 1, external_id: 1 }, { unique: true });

// Règles métier
externalCalendarSchema.pre('save', function(next) {
  if (!this.access_token || !this.access_token.trim()) {
    return next(new Error('Le token d’accès est requis.'));
  }
  next();
});

export const ExternalCalendar = model('ExternalCalendar', externalCalendarSchema);
export default ExternalCalendar;