require ('dotenv').config(); //Carga las variable de entorno
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth'); //Rutas de autenticación

const app = express();

// Middleware globales
app.use(cors());
app.use(express.json()); //Parsear JSON en las peticiones

// Rutas

app.use('/api/auth', authRoutes); //Rutas de autenticación

//Iniciar Servidor

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});