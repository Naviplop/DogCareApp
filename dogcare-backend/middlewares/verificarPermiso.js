const pool = require('../config/db');

/**
 * Middleware para verificar si el usuario tiene un permiso específico.
 * @param {string} permiso - El nombre del permiso a verificar.
 */
const verificarPermiso = (permiso) => {
  return async (req, res, next) => {
    try {
      // Se asume que authMiddleware ya ha agregado req.user con el id del usuario
      const usuarioId = req.userId; // O req.user.id, según cómo lo hayas configurado

      if (!usuarioId) {
        return res.status(401).json({ mensaje: 'No autenticado' });
      }

      // Consulta para obtener el permiso asignado al usuario mediante sus roles.
      // Se asume que tienes las siguientes tablas: usuario_roles, rol_permisos y permisos.
      const query = `
        SELECT p.nombre 
        FROM permisos p
        JOIN rol_permisos rp ON p.id = rp.permiso_id
        JOIN usuario_roles ur ON rp.rol_id = ur.rol_id
        WHERE ur.usuario_id = $1 AND p.nombre = $2
      `;
      const resultado = await pool.query(query, [usuarioId, permiso]);

      if (resultado.rows.length === 0) {
        return res.status(403).json({ mensaje: 'Acceso denegado: no tienes el permiso requerido' });
      }

      next();
    } catch (error) {
      console.error('Error en verificarPermiso:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
  };
};

module.exports = verificarPermiso;
