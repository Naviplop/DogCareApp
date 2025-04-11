const crypto = require('crypto');
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/mailer');

exports.register = async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  try {
    // Validar campos obligatorios
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }

    // Verificar si el usuario ya existe
    const userExist = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ mensaje: 'El usuario ya existe' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar token de verificación
    const verifyToken = crypto.randomBytes(32).toString('hex');

    // Guardar usuario en la base de datos (incluyendo el token y sin verificar el email)
    const newUser = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol, verify_token)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, email, rol`,
      [nombre, email, hashedPassword, rol, verifyToken]
    );

    // Enviar correo de verificación
    const verificationLink = `http://localhost:4000/api/auth/verify/${verifyToken}`;
    const emailText = `Hola ${nombre},\n\nPor favor verifica tu email haciendo clic en el siguiente enlace: ${verificationLink}\n\nGracias.`;
    await sendEmail(email, 'Verificación de Email', emailText);

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente. Se ha enviado un correo de verificación.',
      usuario: newUser.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validar campos
    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }
    // Verificar si el usuario existe
    const user = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ mensaje: 'Usuario no encontrado' });
    }
    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ mensaje: 'Contraseña incorrecta' });
    }
    // Crear token
    const token = jwt.sign(
      { id: user.rows[0].id },
      process.env.JWT_SECRET || 'secretKey',
      { expiresIn: '1h' }
    );
    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        id: user.rows[0].id,
        nombre: user.rows[0].nombre,
        email: user.rows[0].email,
        rol: user.rows[0].rol
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'UPDATE usuarios SET reset_token = $1, reset_token_exp = NOW() + INTERVAL \'1 hour\' WHERE email = $2',
      [token, email]
    );
    const resetLink = `http://localhost:4000/api/auth/reset-password/${token}`;
    await sendEmail(email, 'Recuperación de contraseña', `Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetLink}`);
    res.json({ mensaje: 'Correo de recuperación enviado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  try {
    const user = await pool.query(
      'SELECT id FROM usuarios WHERE reset_token = $1 AND reset_token_exp > NOW()',
      [token]
    );
    if (user.rows.length === 0) {
      return res.status(400).json({ mensaje: 'Token inválido o expirado' });
    }
    // Hashear la nueva contraseña antes de actualizar
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE usuarios SET password = $1, reset_token = NULL, reset_token_exp = NULL WHERE reset_token = $2',
      [hashedPassword, token]
    );
    res.json({ mensaje: 'Contraseña actualizada con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    // Buscar usuario con ese token
    const userResult = await pool.query('SELECT id FROM usuarios WHERE verify_token = $1', [token]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ mensaje: 'Token de verificación inválido' });
    }
    // Actualizar el usuario: marcar email como verificado y eliminar el token
    await pool.query(
      'UPDATE usuarios SET email_verified = true, verify_token = NULL WHERE id = $1',
      [userResult.rows[0].id]
    );
    res.status(200).json({ mensaje: 'Correo verificado exitosamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor', error: error.message });
  }
};

// Con esto no levanta el server: revisa duplicados o errores de sintaxis
exports.asignarRol = async (req, res) => {
  const { usuario_id, rol_id } = req.body;
  try {
    await pool.query('INSERT INTO usuario_roles (usuario_id, rol_id) VALUES ($1, $2)', [usuario_id, rol_id]);
    res.json({ mensaje: 'Rol asignado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};
