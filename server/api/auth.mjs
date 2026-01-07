import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.mjs';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const CHAT_PWD = process.env.CHAT_PWD;

export async function login(req, res) {
  const { username, password, rememberMe = false } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Email requis' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Mot de passe requis' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email: username.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        sub: user._id.toString(),
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256'
      }
    );

    if (rememberMe) {
      const maxAge = parseExpirationTime(JWT_EXPIRES_IN);
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge
      });
    }

    res.json(token);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
}

/**
 * Convert JWT expiration string to milliseconds
 * @param {string} expiresIn - JWT expiration string (e.g., '15m', '1h', '7d')
 * @returns {number} - Milliseconds
 */
function parseExpirationTime(expiresIn) {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // default 15 minutes

  const [, value, unit] = match;
  const num = parseInt(value);

  const units = {
    s: 1000,           // seconds
    m: 60 * 1000,      // minutes
    h: 60 * 60 * 1000, // hours
    d: 24 * 60 * 60 * 1000 // days
  };

  return num * (units[unit] || units.m);
}

/**
 * Register a new user
 */
export async function register(req, res) {
  const { nom, prenom, email, dateNaissance, password } = req.body;

  // Validation
  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Format d\'email invalide' });
  }

  // Password minimum length
  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
  }

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
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
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
}