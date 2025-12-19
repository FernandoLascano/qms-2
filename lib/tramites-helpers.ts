// Funciones auxiliares para el manejo de trámites

export const calcularProgreso = (tramite: any) => {
  const etapas = [
    tramite.formularioCompleto,
    tramite.denominacionReservada,
    tramite.capitalDepositado,
    tramite.tasaPagada,
    tramite.documentosFirmados,
    tramite.tramiteIngresado,
    tramite.sociedadInscripta
  ]
  const completadas = etapas.filter(Boolean).length
  return Math.round((completadas / etapas.length) * 100)
}

export const getEstadoColor = (tramite: any) => {
  const progreso = calcularProgreso(tramite)

  // Si está al 100%, mostrar verde (Completado)
  if (progreso === 100 || tramite.sociedadInscripta) {
    return 'bg-green-100 text-green-800 border-green-200'
  }

  // Si tiene formulario completado pero no está al 100%, mostrar azul (En Proceso)
  if (tramite.formularioCompleto && progreso < 100) {
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  // Para otros estados
  switch (tramite.estadoGeneral) {
    case 'ESPERANDO_CLIENTE':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'ESPERANDO_APROBACION':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'CANCELADO':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export const getEstadoTexto = (tramite: any) => {
  const progreso = calcularProgreso(tramite)

  // Si está al 100%, mostrar "Completado"
  if (progreso === 100 || tramite.sociedadInscripta) {
    return 'Completado'
  }

  // Si tiene formulario completado pero no está al 100%, mostrar "En Proceso"
  if (tramite.formularioCompleto && progreso < 100) {
    return 'En Proceso'
  }

  // Para otros estados
  switch (tramite.estadoGeneral) {
    case 'ESPERANDO_CLIENTE': return 'Esperando Cliente'
    case 'ESPERANDO_APROBACION': return 'Esperando Aprobación'
    case 'INICIADO': return 'Iniciado'
    case 'CANCELADO': return 'Cancelado'
    default: return tramite.estadoGeneral
  }
}

export const obtenerEtapaActual = (tramite: any) => {
  if (!tramite.formularioCompleto) return 'Formulario pendiente'
  if (!tramite.denominacionReservada) return 'Esperando reserva de denominación'
  if (!tramite.capitalDepositado) return 'Esperando depósito de capital'
  if (!tramite.tasaPagada) return 'Esperando pago de tasa'
  if (!tramite.documentosFirmados) return 'Esperando firma de documentos'
  if (!tramite.tramiteIngresado) return 'Esperando ingreso del trámite'
  if (!tramite.sociedadInscripta) return 'Esperando inscripción'
  return 'Sociedad inscripta'
}
