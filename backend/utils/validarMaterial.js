function validarMaterial(material) {
    if (!Number.isInteger(material.orden_id) || material.orden_id <= 0) {
        return 'La orden de producción no es válida';
    }

    if (typeof material.nombre !== 'string' || !material.nombre.trim()) {
        return 'El nombre del material es obligatorio';
    }

    if (!Number.isInteger(material.cantidad) || material.cantidad <= 0) {
        return 'La cantidad debe ser un entero positivo';
    }

    if (typeof material.unidad !== 'string' || !material.unidad.trim()) {
        return 'La unidad es obligatoria';
    }

    return null;
}

module.exports = { validarMaterial };