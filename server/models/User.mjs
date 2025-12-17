// server/models/user.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  first_name: { type: String, required: true, trim: true, maxlength: 100 },
  last_name: { type: String, required: true, trim: true, maxlength: 100 },

  email: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true,
    lowercase: true,
  },
  password_hash: { type: String, required: true, maxlength: 1024 },

  birth_date: { type: Date },

  // Profil académique (références vers d'autres collections)
  city_id: { type: Schema.Types.ObjectId, ref: 'City' },            // references cities(id)
  institution_id: { type: Schema.Types.ObjectId, ref: 'Institution' }, // references institutions(id)
  field_id: { type: Schema.Types.ObjectId, ref: 'FieldOfStudy' },   // references fields_of_study(id)
  study_year: { type: Number, min: 1 }, // année d'étude (1,2,3,...)

  bio: { type: String },      // texte libre
  avatar_url: { type: String },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index unique pour l'email (simule UNIQUE(email) en SQL)
userSchema.index({ email: 1 }, { unique: true });

// transformer JSON pour retirer le password_hash et nettoyer la sortie
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    // retire des champs sensibles / internes
    delete ret.password_hash;
    delete ret.__v;
    // optionnel : exposer un id lisible
    ret.id = ret._id;
    delete ret._id;
    return ret;
  }
});

// lowercase automatique de l'email si modifié (sécurité/consistance)
userSchema.pre('save', async function () {
  if (this.isModified('email') && typeof this.email === 'string') {
    this.email = this.email.toLowerCase();
  }
});

// Virtual: calculer l'âge à partir de birth_date (entier d'années)
userSchema.virtual('age').get(function () {
  if (!this.birth_date) return null;
  const today = new Date();
  let age = today.getFullYear() - this.birth_date.getFullYear();
  const m = today.getMonth() - this.birth_date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < this.birth_date.getDate())) {
    age--;
  }
  return age;
});

// export (même style que ton modèle Book)
export const User = model('User', userSchema);
export default User;