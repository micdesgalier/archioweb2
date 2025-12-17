// server/models/institution.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const institutionSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
  },

  // Référence vers cities(id)
  city_id: {
    type: Schema.Types.ObjectId,
    ref: 'City',
  },

  address: {
    type: String,
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

// Index utile pour éviter les doublons évidents dans une même ville
institutionSchema.index(
  { name: 1, city_id: 1 },
  { unique: true }
);

export const Institution = model('Institution', institutionSchema);
export default Institution;