
function registrarEvento(nivel, evento, detalles = {}) {
    const registro = {
        timestamp: new Date().toISOString(),
        nivel,
        evento,
        detalles
    };

    console.log(JSON.stringify(registro));
}

module.exports = { registrarEvento };
