const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, verifyEmail } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware'); 
const verificarPermiso = require('../middlewares/verificarPermiso');

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify/:token', verifyEmail);

// Rutas protegidas con autenticación y permisos
router.post('/admin/create-user', authMiddleware, verificarPermiso('crear_usuario'), register);
router.delete('/admin/delete-user/:id', authMiddleware, verificarPermiso('eliminar_usuario'), async (req, res) => {
    // Lógica para eliminar usuario
});
router.get('/admin/users', authMiddleware, verificarPermiso('ver_usuario'), async (req, res) => {
    // Lógica para listar usuarios
});

module.exports = router;
