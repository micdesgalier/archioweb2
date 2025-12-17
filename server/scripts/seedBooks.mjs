// server/scripts/seedBooks.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import Book from '../models/Book.mjs';

const booksToSeed = [
  { title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry', publishedYear: 1943, genres: ['Fiction', 'Conte'] },
  { title: '1984', author: 'George Orwell', publishedYear: 1949, genres: ['Dystopie', 'Science-fiction'] },
  { title: 'Clean Code', author: 'Robert C. Martin', publishedYear: 2008, genres: ['Informatique', 'Programmation'] },
];

async function main() {
  await connectMongo(console);
  for (const b of booksToSeed) {
    const exists = await Book.findOne({ title: b.title });
    if (!exists) {
      const book = new Book(b);
      await book.save();
      console.log('Seeded book:', b.title);
    } else {
      console.log('Book already exists:', b.title);
    }
  }
  await disconnectMongo(console);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });