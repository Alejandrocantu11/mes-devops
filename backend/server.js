const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { validarMaterial } = require('./utils/validarMaterial');
const { registrarEvento } = require('./utils/logger');
const {
    registro,
    materialesCreados,
    materialesEliminados,
    erroresValidacion
} = require('./utils/metricas');

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

// ========================================
// FASE 3 - GESTIÓN DE MATERIALES
// ========================================

// Obtener materiales de producción
app.get('/api/materiales', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                m.id,
                m.orden_id,
                o.codigo AS orden_codigo,
                m.nombre,
                m.cantidad,
                m.unidad,
                m.fecha_registro
            FROM materiales_produccion m
            INNER JOIN ordenes_produccion o
                ON m.orden_id = o.id
            ORDER BY m.id
        `);

        res.json(resultado.rows);

    } catch (error) {
        console.error('Error obteniendo materiales:', error);

        res.status(500).json({
            error: 'Error obteniendo materiales de producción'
        });
    }
});

// Agregar nuevo material de producción
app.post('/api/materiales', async (req, res) => {

    const errorValidacion = validarMaterial(req.body);

    if (errorValidacion) {
        registrarEvento('WARN', 'MATERIAL_VALIDACION_FALLIDA', {
            motivo: errorValidacion
        });

        erroresValidacion.inc();

        return res.status(400).json({
            error: errorValidacion
        });
    }
    try {
        const { orden_id, nombre, cantidad, unidad } = req.body;

        // Validar datos de entrada
        if (
            !Number.isInteger(orden_id) ||
            orden_id <= 0 ||
            typeof nombre !== 'string' ||
            !nombre.trim() ||
            nombre.trim().length > 100 ||
            !Number.isInteger(cantidad) ||
            cantidad <= 0 ||
            typeof unidad !== 'string' ||
            !unidad.trim() ||
            unidad.trim().length > 30
        ) {
            return res.status(400).json({
                error: 'Datos inválidos. Verifica orden, nombre, cantidad y unidad.'
            });
        }

        // Verificar que la orden exista
        const orden = await pool.query(
            'SELECT id FROM ordenes_produccion WHERE id = $1',
            [orden_id]
        );

        if (orden.rows.length === 0) {
            return res.status(404).json({
                error: 'La orden de producción no existe'
            });
        }

        // Registrar material
        const resultado = await pool.query(
            `INSERT INTO materiales_produccion
            (orden_id, nombre, cantidad, unidad)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [orden_id, nombre.trim(), cantidad, unidad.trim()]
        );

        registrarEvento('INFO', 'MATERIAL_CREADO', {
            material_id: resultado.rows[0].id,
            orden_id: resultado.rows[0].orden_id,
            cantidad: resultado.rows[0].cantidad
        });

        materialesCreados.inc();

        res.status(201).json(resultado.rows[0]);

    } catch (error) {
        console.error('Error agregando material:', error);

        res.status(500).json({
            error: 'Error al registrar el material'
        });
    }
});

// Eliminar material de producción
app.delete('/api/materiales/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                error: 'ID de material inválido'
            });
        }

        const resultado = await pool.query(
            'DELETE FROM materiales_produccion WHERE id = $1 RETURNING *',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                error: 'Material no encontrado'
            });
        }

        registrarEvento('INFO', 'MATERIAL_ELIMINADO', {
            material_id: Number(req.params.id)
        });

        materialesEliminados.inc();

        res.json({
            mensaje: 'Material eliminado correctamente',
            material: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error eliminando material:', error);

        res.status(500).json({
            error: 'Error al eliminar el material'
        });
    }
});

const PORT = 3000;

// Endpoint de métricas para Prometheus
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', registro.contentType);
        res.end(await registro.metrics());
    } catch (error) {
        res.status(500).send('Error al obtener las métricas');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor MES ejecutándose en puerto ${PORT}`);
});