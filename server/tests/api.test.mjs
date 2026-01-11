import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import apiRouter from '../routes/api.mjs';
import { User } from '../models/User.mjs';
import { StudyGroup } from '../models/StudyGroup.mjs';
import { City } from '../models/City.mjs';

let mongod;
let app;

/**
 * Configuration initiale des tests : création d'une base MongoDB en mémoire
 * et initialisation de l'application Express
 */
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use('/api', apiRouter);
});

/**
 * Nettoyage après tous les tests : déconnexion et arrêt du serveur MongoDB
 */
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

/**
 * Nettoyage avant chaque test : suppression des données pour garantir l'isolation
 */
beforeEach(async () => {
  await User.deleteMany({});
  await StudyGroup.deleteMany({});
});

describe('API tests', () => {

  it('GET /api/cities renvoie la liste des villes', async () => {
    const citiesData = [
        { name: 'Lausanne', country: 'Suisse', postal_code: '1000' },
        { name: 'Yverdon-les-Bains', country: 'Suisse', postal_code: '1400' },
        { name: 'Bussigny', country: 'Suisse', postal_code: '1030' },
        { name: 'Montreux', country: 'Suisse', postal_code: '1820' },
        { name: 'Neuchâtel', country: 'Suisse', postal_code: '2000' },
        { name: 'Vevey', country: 'Suisse', postal_code: '1800' }
    ];

    await City.deleteMany({});
    await City.insertMany(citiesData);

    const res = await request(app).get('/api/cities');

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(6);

    const names = res.body.map(c => c.name);
    expect(names).toContain('Lausanne');
    expect(names).toContain('Vevey');
  });

  it('PUT /api/users/:id met à jour un utilisateur', async () => {
    const user = await User.create({
      first_name: 'OldName',
      last_name: 'User',
      email: 'old@example.com',
      password_hash: 'hashedpassword123'
    });

    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .send({ first_name: 'NewName' });

    expect(res.status).toBe(200);
    expect(res.body.first_name).toBe('NewName');
  });

  it('PUT /api/users/:id renvoie 400 pour un ID invalide', async () => {
    const res = await request(app)
      .put('/api/users/123')
      .send({ first_name: 'NewName' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ID utilisateur invalide/);
  });

  it('POST /api/study-groups crée un nouveau groupe', async () => {
    const user = await User.create({
      first_name: 'Creator',
      last_name: 'User',
      email: 'creator@example.com',
      password_hash: 'hashedpassword123'
    });

    const res = await request(app)
      .post('/api/study-groups')
      .send({
        title: 'Math Group',
        description: 'Group for math students',
        is_online: true,
        creator_id: user._id.toString()
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Math Group');
    expect(res.body.is_online).toBe(true);
  });

  it('POST /api/study-groups renvoie 400 si des champs requis sont manquants', async () => {
    const res = await request(app)
      .post('/api/study-groups')
      .send({ description: 'Missing title', is_online: true });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Titre et is_online sont requis/);
  });

  it("GET /api/study-groups/:id renvoie un groupe d'études", async () => {
    const user = await User.create({
      first_name: 'Creator',
      last_name: 'User',
      email: 'creator2@example.com',
      password_hash: 'hashedpassword123'
    });

    const group = await StudyGroup.create({
      title: 'Physics Group',
      description: 'For physics fans',
      creator_id: user._id,
      is_online: true
    });

    const res = await request(app).get(`/api/study-groups/${group._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Physics Group');
  });

  it('GET /api/study-groups/:id renvoie 400 pour un ID invalide', async () => {
    const res = await request(app).get('/api/study-groups/123');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ID de study group invalide/);
  });

  it('GET /api/users renvoie la liste des utilisateurs', async () => {
    await User.create({ first_name: 'Alice', last_name: 'A', email: 'alice@example.com', password_hash: 'pw1' });
    await User.create({ first_name: 'Bob', last_name: 'B', email: 'bob@example.com', password_hash: 'pw2' });

    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body.map(u => u.first_name)).toContain('Alice');
    expect(res.body.map(u => u.first_name)).toContain('Bob');
  });

  it('GET /api/users/:id renvoie un utilisateur', async () => {
    const user = await User.create({ first_name: 'Charlie', last_name: 'C', email: 'charlie@example.com', password_hash: 'pw3' });
    const res = await request(app).get(`/api/users/${user._id}`);
    expect(res.status).toBe(200);
    expect(res.body.first_name).toBe('Charlie');
  });

  it("GET /api/users/:id renvoie 404 si l'utilisateur n'existe pas", async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/users/${id}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Utilisateur introuvable/);
  });

});