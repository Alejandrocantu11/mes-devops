

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
         const respuesta = await fetch('/api/maquinas');  
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
        const respuesta = await fetch('/api/ordenes');

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
        const respuesta = await fetch('/api/resumen');

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
        const respuesta = await fetch('/api/ordenes');
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
const respuesta = await fetch('/api/ordenes', {
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
    `/api/ordenes/${id}`,
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
// ========================================
// FASE 3 - GESTIÓN DE MATERIALES
// ========================================

// Cargar órdenes disponibles en el selector
async function cargarOrdenesMateriales() {
    try {
        const respuesta = await fetch('/api/ordenes');

        if (!respuesta.ok) {
            throw new Error('Error al obtener las órdenes');
        }

        const ordenes = await respuesta.json();

        const selector = document.getElementById('material-orden');

        selector.innerHTML =
            '<option value="">Seleccionar orden de producción</option>';

        ordenes.forEach(orden => {
            const opcion = document.createElement('option');

            opcion.value = orden.id;
            opcion.textContent = `${orden.codigo} - ${orden.producto}`;

            selector.appendChild(opcion);
        });

    } catch (error) {
        console.error('Error cargando órdenes para materiales:', error);
    }
}

// Ejecutar al abrir el dashboard
cargarOrdenesMateriales();

// ========================================
// MOSTRAR MATERIALES REGISTRADOS
// ========================================

async function cargarMateriales() {
    try {
        const respuesta = await fetch('/api/materiales');

        if (!respuesta.ok) {
            throw new Error('Error al obtener los materiales');
        }

        const materiales = await respuesta.json();
        const tabla = document.getElementById('tabla-materiales');

        tabla.innerHTML = '';

        materiales.forEach(material => {
            const fila = document.createElement('tr');

            const datos = [
                material.orden_codigo,
                material.nombre,
                material.cantidad,
                material.unidad
            ];

            datos.forEach(dato => {
                const celda = document.createElement('td');
                celda.textContent = dato;
                fila.appendChild(celda);
            });

            const celdaAccion = document.createElement('td');
            const boton = document.createElement('button');

            boton.textContent = 'Eliminar';
            boton.type = 'button';
            boton.dataset.id = material.id;

            celdaAccion.appendChild(boton);
            fila.appendChild(celdaAccion);

            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error('Error cargando materiales:', error);
    }
}

// Cargar materiales al abrir el dashboard
cargarMateriales();

// ========================================
// ELIMINAR MATERIALES DESDE LA INTERFAZ
// ========================================

document.getElementById('tabla-materiales').addEventListener('click', async (event) => {

    if (event.target.tagName !== 'BUTTON') {
        return;
    }

    const id = event.target.dataset.id;

    const confirmar = confirm(
        '¿Estás seguro de que deseas eliminar este material?'
    );

    if (!confirmar) {
        return;
    }

    try {
        const respuesta = await fetch(`/api/materiales/${id}`, {
            method: 'DELETE'
        });

        if (!respuesta.ok) {
            throw new Error('No se pudo eliminar el material');
        }

        alert('Material eliminado correctamente');

        // Actualizar la tabla automáticamente
        await cargarMateriales();

    } catch (error) {
        console.error('Error eliminando material:', error);
        alert('Ocurrió un error al eliminar el material');
    }
});

// ========================================
// AGREGAR MATERIALES DESDE LA INTERFAZ
// ========================================

document.getElementById('form-material').addEventListener('submit', async (event) => {
    event.preventDefault();

    const orden_id = Number(document.getElementById('material-orden').value);
    const nombre = document.getElementById('material-nombre').value.trim();
    const cantidad = Number(document.getElementById('material-cantidad').value);
    const unidad = document.getElementById('material-unidad').value;

    if (!orden_id || !nombre || !Number.isInteger(cantidad) || cantidad <= 0 || !unidad) {
        alert('Completa correctamente todos los campos');
        return;
    }

    try {
        const respuesta = await fetch('/api/materiales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orden_id,
                nombre,
                cantidad,
                unidad
            })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.error || 'Error al agregar material');
        }

        alert('Material agregado correctamente');

        // Limpiar formulario
        document.getElementById('form-material').reset();

        // Actualizar tabla sin recargar la página
        await cargarMateriales();

    } catch (error) {
        console.error('Error agregando material:', error);
        alert(error.message);
    }
});

