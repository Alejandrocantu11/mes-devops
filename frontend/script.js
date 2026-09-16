// Datos iniciales de producción
let produccion = 850;
let buenas = 825;
let defectuosas = 25;

// Simulación de producción
function actualizarProduccion() {

    // Se produce una nueva pieza
    produccion++;

    // Simulamos que aproximadamente algunas piezas pueden salir defectuosas
    const piezaDefectuosa = Math.random() < 0.05;

    if (piezaDefectuosa) {
        defectuosas++;
    } else {
        buenas++;
    }

    // Actualizar información en la interfaz
    document.getElementById("produccion").textContent = produccion;
    document.getElementById("buenas").textContent = buenas;
    document.getElementById("defectuosas").textContent = defectuosas;
}

// Generar información cada 5 segundos
setInterval(actualizarProduccion, 5000);

// PRUEBAS DE RENDIMIENTO
function pruebaRendimiento(cantidad) {

    const inicio = performance.now();

    let registros = [];

    // Generación de datos simulados
    for (let i = 0; i < cantidad; i++) {

        const registro = {
            id: i + 1,
            maquina: "M0" + ((i % 4) + 1),
            piezasProducidas: Math.floor(Math.random() * 100),
            piezasDefectuosas: Math.floor(Math.random() * 5),
            tiempoCiclo: (Math.random() * 10).toFixed(2),
            estado: Math.random() > 0.1 ? "Produciendo" : "Detenida"
        };

        registros.push(registro);
    }

    // Procesamiento de los registros
    let totalProducidas = 0;
    let totalDefectuosas = 0;

    registros.forEach(registro => {
        totalProducidas += registro.piezasProducidas;
        totalDefectuosas += registro.piezasDefectuosas;
    });

    const fin = performance.now();

    const tiempo = (fin - inicio).toFixed(2);

    document.getElementById("resultadoPrueba").textContent =
        cantidad.toLocaleString() +
        " registros procesados en " +
        tiempo +
        " ms";
}

// ========================================
// CONEXIÓN DEL FRONTEND CON EL BACKEND MES
// ========================================

async function cargarMaquinas() {
    try {
        const respuesta = await fetch('http://localhost:3000/api/maquinas');

        if (!respuesta.ok) {
            throw new Error('Error al obtener las máquinas');
        }

        const maquinas = await respuesta.json();

console.log("Máquinas obtenidas desde PostgreSQL:");
console.log(maquinas);

// Calcular máquinas activas y detenidas
const activas = maquinas.filter(
    maquina => maquina.estado.toLowerCase() === "produciendo"
).length;

const detenidas = maquinas.filter(
    maquina => maquina.estado.toLowerCase() === "detenida"
).length;

// Actualizar tarjetas
document.getElementById("activas").textContent = activas;
document.getElementById("detenidas").textContent = detenidas;

const tabla = document.getElementById("tabla-maquinas");

tabla.innerHTML = "";

maquinas.forEach(maquina => {

    const fila = document.createElement("tr");

    const claseEstado =
        maquina.estado.toLowerCase() === "produciendo"
        ? "produciendo"
        : "detenida";

    fila.innerHTML = `
        <td>${maquina.codigo}</td>
        <td class="${claseEstado}">${maquina.estado}</td>
    `;

    tabla.appendChild(fila);
});

} catch (error) {
    console.error("Error conectando con el backend:", error);
}
}

cargarMaquinas();

// ========================================
// CARGAR ORDEN ACTUAL DESDE POSTGRESQL
// ========================================

async function cargarOrdenActual() {
    try {
        const respuesta = await fetch('http://localhost:3000/api/ordenes');

        if (!respuesta.ok) {
            throw new Error('Error al obtener las órdenes');
        }

        const ordenes = await respuesta.json();

        if (ordenes.length === 0) {
            console.log('No hay órdenes de producción');
            return;
        }

        const orden = ordenes[0];

        document.getElementById('orden-codigo').textContent =
            orden.codigo;

        document.getElementById('orden-producto').textContent =
            orden.producto;

        document.getElementById('orden-progreso').textContent =
            `${orden.cantidad_producida} / ${orden.cantidad_objetivo}`;

        document.getElementById('orden-estado').textContent =
             orden.estado;

        document.getElementById('produccion').textContent =
            orden.cantidad_producida;

        console.log('Orden obtenida desde PostgreSQL:', orden);

    } catch (error) {
        console.error('Error cargando la orden:', error);
    }
}

cargarOrdenActual();

// ========================================
// CARGAR RESUMEN DESDE POSTGRESQL
// ========================================

async function cargarResumen() {
    try {
        const respuesta = await fetch('http://localhost:3000/api/resumen');

        if (!respuesta.ok) {
            throw new Error('Error al obtener el resumen');
        }

        const resumen = await respuesta.json();

        document.getElementById('produccion').textContent =
            resumen.producidas;

        document.getElementById('buenas').textContent =
            resumen.buenas;

        document.getElementById('defectuosas').textContent =
            resumen.defectuosas;

        console.log('Resumen obtenido desde PostgreSQL:', resumen);

    } catch (error) {
        console.error('Error cargando resumen:', error);
    }
}

cargarResumen();