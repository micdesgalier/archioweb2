// server/models/studyGroup.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const studyGroupSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
  },

  description: {
    type: String,
    trim: true,
  },

  // Créateur du groupe
  creator_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Matière liée (optionnelle)
  subject_id: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
  },

  // Ville (si présentiel)
  city_id: {
    type: Schema.Types.ObjectId,
    ref: 'City',
  },

  location_detail: {
    type: String,
    trim: true,
    maxlength: 255,
  },

  is_online: {
    type: Boolean,
    default: false,
    required: true,
  },

  start_time: {
    type: Date,
  },

  end_time: {
    type: Date,
  },

  max_members: {
    type: Number,
    min: 2,
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

// Index utiles
studyGroupSchema.index({ creator_id: 1 });
studyGroupSchema.index({ subject_id: 1 });
studyGroupSchema.index({ city_id: 1 });
studyGroupSchema.index({ start_time: 1 });

// Règles métier
studyGroupSchema.pre('save', function (next) {
  // Un groupe en ligne ne doit pas avoir de ville
  if (this.is_online && this.city_id) {
    return next(
      new Error('Un groupe en ligne ne doit pas avoir de ville associée.')
    );
  }

  // end_time doit être après start_time
  if (this.start_time && this.end_time && this.end_time <= this.start_time) {
    return next(
      new Error('La date de fin doit être postérieure à la date de début.')
    );
  }

  next();
});

export const StudyGroup = model('StudyGroup', studyGroupSchema);
export default StudyGroup;