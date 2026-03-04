const bcrypt = require('bcryptjs');
const { query } = require('../_db.cjs');
const { generateToken } = require('../_auth.cjs');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).cjson({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).cjson({ error: 'Email and password are required' });
    }

    const result = await query(
      'SELECT u.id, u.email, u.password_hash, p.username, p.display_name FROM users u JOIN profiles p ON u.id = p.user_id WHERE u.email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).cjson({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).cjson({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email);

    return res.status(200).cjson({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).cjson({ error: 'Internal server error' });
  }
};
