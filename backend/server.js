const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Conexión con PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT)
});

// Probar conexión
pool.connect()
    .then(client => {
        console.log(' Conectado correctamente a PostgreSQL');
        client.release();
    })
    .catch(error => {
        console.error(' Error conectando a PostgreSQL:', error.message);
    });

// Ruta de prueba
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Obtener máquinas
app.get('/api/maquinas', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM maquinas ORDER BY id');
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo máquinas' });
    }
});

// Obtener órdenes
app.get('/api/ordenes', async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT * FROM ordenes_produccion ORDER BY id'
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo órdenes' });
    }
});

// Crear nueva orden de producción
app.post('/api/ordenes', async (req, res) => {
    try {
        const { codigo, producto, cantidad_objetivo } = req.body;

        if (!codigo || !producto || !cantidad_objetivo) {
            return res.status(400).json({
                error: 'Código, producto y cantidad objetivo son obligatorios'
            });
        }

        const resultado = await pool.query(
            `INSERT INTO ordenes_produccion
            (codigo, producto, cantidad_objetivo, cantidad_producida, estado)
            VALUES ($1, $2, $3, 0, 'New')
            RETURNING *`,
            [codigo, producto, cantidad_objetivo]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error creando orden de producción'
        });
    }
});

// Eliminar orden de producción
app.delete('/api/ordenes/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            'DELETE FROM ordenes_produccion WHERE id = $1 RETURNING *',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: 'Orden no encontrada'
            });
        }

        res.json({
            mensaje: 'Orden eliminada correctamente',
            orden: resultado.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error eliminando orden de producción'
        });
    }
});

// Obtener resumen de producción
app.get('/api/resumen', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT 
                COALESCE(SUM(piezas_producidas), 0) AS producidas,
                COALESCE(SUM(piezas_defectuosas), 0) AS defectuosas,
                COALESCE(SUM(piezas_producidas), 0) -
                COALESCE(SUM(piezas_defectuosas), 0) AS buenas
            FROM registros_produccion
        `);

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error obteniendo resumen de producción'
        });
    }
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor MES ejecutándose en puerto ${PORT}`);
});