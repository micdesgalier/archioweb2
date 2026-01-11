// server/models/city.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const citySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },

  country: {
    type: String,
    trim: true,
    maxlength: 150,
  },

  postal_code: {
    type: String,
    trim: true,
    maxlength: 20,
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

// Index pour éviter les doublons évidents (optionnel mais recommandé)
citySchema.index(
  { name: 1, postal_code: 1, country: 1 },
  { unique: true }
);

export const City = model('City', citySchema);
export default City;