import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.mjs';

// Clés et configurations JWT
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Connexion d'un utilisateur
 */
export async function login(req, res) {
  const { username, password } = req.body;

  if (!username) return res.status(400).json({ error: 'Email requis' });
  if (!password) return res.status(400).json({ error: 'Mot de passe requis' });

  try {
    // Recherche de l'utilisateur par email
    const user = await User.findOne({ email: username.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    // Vérification du mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    // Création du token JWT
    const token = jwt.sign(
      { 
        sub: user._id.toString(),
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' }
    );

    // Définir le cookie avec la durée d'expiration du token
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: parseExpirationTime(JWT_EXPIRES_IN)
    });

    res.json(token);
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
}

/**
 * Convertit une durée JWT (ex: "7d", "1h") en millisecondes
 */
function parseExpirationTime(expiresIn) {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // 15 minutes par défaut

  const [, value, unit] = match;
  const num = parseInt(value);

  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return num * (units[unit] || units.m);
}

/**
 * Création d'un nouvel utilisateur
 */
export async function register(req, res) {
  const { nom, prenom, email, dateNaissance, password } = req.body;

  // Validation des champs obligatoires
  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
  }

  // Vérification du format de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Format d\'email invalide' });

  // Vérification de la longueur minimale du mot de passe
  if (password.length < 6) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });

  try {
    // Vérification que l'email n'existe pas déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

    // Hashage du mot de passe
    const password_hash = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    const newUser = new User({
      first_name: prenom,
      last_name: nom,
      email: email.toLowerCase(),
      password_hash,
      birth_date: dateNaissance ? new Date(dateNaissance) : undefined
    });

    await newUser.save();

    res.status(201).json({ 
      message: 'Compte créé avec succès',
      user: {
        id: newUser._id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error('Erreur lors de la création du compte:', err);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
}