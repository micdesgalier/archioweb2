/**
 * Déconnexion de l'utilisateur
 * Supprime le cookie d'authentification côté client
 */
export function logout(req, res) { 
  res.clearCookie('auth_token', {
    httpOnly: true,                  // accessible uniquement par le serveur
    secure: process.env.NODE_ENV === 'production', // cookie sécurisé en prod
    sameSite: 'strict'               // protection CSRF
  });

  res.json({ success: true, message: 'Déconnexion réussie' });
}