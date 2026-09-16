const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Conexión con PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mes_db',
    password: 'Alejandro11',
    port: 5432
});

// Probar conexión
pool.connect()
    .then(client => {
        console.log('✅ Conectado correctamente a PostgreSQL');
        client.release();
    })
    .catch(error => {
        console.error('❌ Error conectando a PostgreSQL:', error.message);
    });

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Backend MES funcionando');
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