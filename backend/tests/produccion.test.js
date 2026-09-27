const test = require('node:test');
const assert = require('node:assert');

function calcularPiezasBuenas(producidas, defectuosas) {
    return producidas - defectuosas;
}

test('calcula correctamente las piezas buenas', () => {
    const resultado = calcularPiezasBuenas(100, 5);

    assert.strictEqual(resultado, 95);
});