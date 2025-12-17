// server/models/userAvailability.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userAvailabilitySchema = new Schema({
  // Utilisateur concerné
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  start_time: {
    type: Date,
    required: true,
  },

  end_time: {
    type: Date,
    required: true,
  },

  is_recurring: {
    type: Boolean,
    default: false,
    required: true,
  },

  // iCal recurrence rule (ex: "FREQ=WEEKLY;BYDAY=MO,WE")
  recurrence_rule: {
    type: String,
    trim: true,
    maxlength: 255,
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

// Index pour rechercher rapidement les disponibilités d'un utilisateur
userAvailabilitySchema.index({ user_id: 1, start_time: 1, end_time: 1 });

// Règles métier
userAvailabilitySchema.pre('save', function (next) {
  if (this.end_time <= this.start_time) {
    return next(new Error('La date de fin doit être postérieure à la date de début.'));
  }
  // Si is_recurring est vrai, recurrence_rule doit être défini
  if (this.is_recurring && !this.recurrence_rule) {
    return next(new Error('Une disponibilité récurrente doit avoir une règle de récurrence.'));
  }
  next();
});

export const UserAvailability = model('UserAvailability', userAvailabilitySchema);
export default UserAvailability;