// server/models/fieldOfStudy.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const fieldOfStudySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
  },
}, {
  timestamps: false, // pas de created_at / updated_at en SQL
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Équivalent de UNIQUE(name)
fieldOfStudySchema.index({ name: 1 }, { unique: true });

export const FieldOfStudy = model('FieldOfStudy', fieldOfStudySchema);
export default FieldOfStudy;