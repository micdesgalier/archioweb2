// server/models/book.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const bookSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String },
  publishedYear: { type: Number },
  genres: { type: [String], default: [] },
  available: { type: Boolean, default: true },
}, { timestamps: true });

export const Book = model('Book', bookSchema);
export default Book;