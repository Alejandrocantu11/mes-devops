
const client = require('prom-client');

// Registro de métricas de Prometheus
const registro = new client.Registry();

// Métricas generales de Node.js
client.collectDefaultMetrics({ register: registro });

// Contador de materiales creados
const materialesCreados = new client.Counter({
    name: 'mes_materiales_creados_total',
    help: 'Total de materiales de produccion creados',
    registers: [registro]
});

// Contador de materiales eliminados
const materialesEliminados = new client.Counter({
    name: 'mes_materiales_eliminados_total',
    help: 'Total de materiales de produccion eliminados',
    registers: [registro]
});

// Contador de errores de validación
const erroresValidacion = new client.Counter({
    name: 'mes_errores_validacion_total',
    help: 'Total de solicitudes de materiales rechazadas por validacion',
    registers: [registro]
});

module.exports = {
    registro,
    materialesCreados,
    materialesEliminados,
    erroresValidacion
};
