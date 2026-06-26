// ============================================
// Código de entrega (PIN de 4 dígitos)
// ============================================
// Se genera al crear el envío y se le muestra al solicitante. Quien recibe el
// paquete se lo dicta al cadete, que lo tipea al entregar. El backend valida el
// código antes de pasar el envío a 'delivered'. Sirve como prueba de entrega.

/**
 * Genera un PIN de entrega de 4 dígitos (string, con ceros a la izquierda).
 * @returns {string} ej. "0427"
 */
export function generateDeliveryCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default generateDeliveryCode;
