

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

// ========================================
// GESTIÓN DE ÓRDENES DE PRODUCCIÓN
// ========================================

// Mostrar todas las órdenes registradas
async function cargarOrdenes() {
    try {
        const respuesta = await fetch('http://localhost:3000/api/ordenes');

        if (!respuesta.ok) {
            throw new Error('Error al obtener las órdenes');
        }

        const ordenes = await respuesta.json();

        const tabla = document.getElementById('tabla-ordenes');

        tabla.innerHTML = '';

        ordenes.forEach(orden => {

            const fila = document.createElement('tr');

            fila.innerHTML = `
                <td>${orden.codigo}</td>
                <td>${orden.producto}</td>
                <td>${orden.cantidad_objetivo}</td>
                <td>${orden.cantidad_producida}</td>
                <td>${orden.estado}</td>
                <td>
                    <button onclick="eliminarOrden(${orden.id})">
                        Eliminar
                    </button>
                </td>
            `;

            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error('Error cargando órdenes:', error);
    }
}

cargarOrdenes();

// Crear nueva orden desde la interfaz
document.getElementById('form-orden').addEventListener('submit', async function(event) {

    event.preventDefault();

    const codigo = document.getElementById('codigo').value;
    const producto = document.getElementById('producto').value;
    const cantidad = document.getElementById('cantidad').value;

    try {
        const respuesta = await fetch('http://localhost:3000/api/ordenes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                codigo: codigo,
                producto: producto,
                cantidad_objetivo: Number(cantidad)
            })
        });

        if (!respuesta.ok) {
            throw new Error('Error al crear la orden');
        }

        await respuesta.json();

        // Limpiar formulario
        document.getElementById('form-orden').reset();

        // Actualizar tabla
        cargarOrdenes();

    } catch (error) {
        console.error('Error creando orden:', error);
    }
});

// Eliminar orden desde la interfaz
async function eliminarOrden(id) {

    const confirmar = confirm('¿Deseas eliminar esta orden?');

    if (!confirmar) {
        return;
    }

    try {
        const respuesta = await fetch(
            `http://localhost:3000/api/ordenes/${id}`,
            {
                method: 'DELETE'
            }
        );

        if (!respuesta.ok) {
            throw new Error('Error al eliminar la orden');
        }

        await respuesta.json();

        // Actualizar tabla después de eliminar
        cargarOrdenes();

    } catch (error) {
        console.error('Error eliminando orden:', error);
    }
}