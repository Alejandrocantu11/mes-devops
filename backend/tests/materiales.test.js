
const test = require('node:test');
const assert = require('node:assert/strict');

const { validarMaterial } = require('../utils/validarMaterial');

// PRUEBA 1: Registro correcto
test('Aceptar un material válido', () => {
    const resultado = validarMaterial({
        orden_id: 1,
        nombre: 'Tornillos',
        cantidad: 100,
        unidad: 'piezas'
    });

    assert.equal(resultado, null);
});

// PRUEBA 2: Nombre vacío
test('Rechazar material sin nombre', () => {
    const resultado = validarMaterial({
        orden_id: 1,
        nombre: '',
        cantidad: 100,
        unidad: 'piezas'
    });

    assert.equal(resultado, 'El nombre del material es obligatorio');
});

// PRUEBA 3: Cantidad negativa
test('Rechazar cantidades negativas', () => {
    const resultado = validarMaterial({
        orden_id: 1,
        nombre: 'Tornillos',
        cantidad: -10,
        unidad: 'piezas'
    });

    assert.equal(resultado, 'La cantidad debe ser un entero positivo');
});

// PRUEBA 4: Cantidad cero
test('Rechazar cantidades iguales a cero', () => {
    const resultado = validarMaterial({
        orden_id: 1,
        nombre: 'Tornillos',
        cantidad: 0,
        unidad: 'piezas'
    });

    assert.equal(resultado, 'La cantidad debe ser un entero positivo');
});

// PRUEBA 5: Orden inválida
test('Rechazar orden de producción inválida', () => {
    const resultado = validarMaterial({
        orden_id: -1,
        nombre: 'Tornillos',
        cantidad: 100,
        unidad: 'piezas'
    });

    assert.equal(resultado, 'La orden de producción no es válida');
});

// PRUEBA 6: Unidad vacía
test('Rechazar material sin unidad', () => {
    const resultado = validarMaterial({
        orden_id: 1,
        nombre: 'Tornillos',
        cantidad: 100,
        unidad: ''
    });

    assert.equal(resultado, 'La unidad es obligatoria');
});
