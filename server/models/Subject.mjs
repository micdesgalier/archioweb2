// server/models/subject.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const subjectSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
  },

  // Référence optionnelle vers fields_of_study(id)
  field_id: {
    type: Schema.Types.ObjectId,
    ref: 'FieldOfStudy',
  },

  code: {
    type: String,
    trim: true,
    maxlength: 50,
    uppercase: true, // ex: MATH-101
  },

  level: {
    type: String,
    trim: true,
    maxlength: 50, // ex: Bachelor, Master
  },
}, {
  timestamps: false,
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
subjectSchema.index({ code: 1 }, { unique: true, sparse: true }); // code unique si présent
subjectSchema.index({ name: 1, field_id: 1 }, { unique: true });  // évite doublons dans une filière

export const Subject = model('Subject', subjectSchema);
export default Subject;