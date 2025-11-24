export function logout(req, res) {
  // Clear the auth_token cookie
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  });

  res.json({ success: true, message: 'Logged out successfully' });
}