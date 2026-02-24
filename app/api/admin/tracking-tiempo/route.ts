import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener métricas de tracking de tiempo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tramiteId = searchParams.get('tramiteId')

    if (tramiteId) {
      // Tracking de tiempo para un trámite específico
      const tramite = await prisma.tramite.findUnique({
        where: { id: tramiteId },
        select: {
          id: true,
          denominacionSocial1: true,
          denominacionAprobada: true,
          createdAt: true,
          fechaFormularioCompleto: true,
          fechaDenominacionReservada: true,
          fechaCapitalDepositado: true,
          fechaTasaPagada: true,
          fechaDocumentosRevisados: true,
          fechaDocumentosFirmados: true,
          fechaTramiteIngresado: true,
          fechaSociedadInscripta: true,
          formularioCompleto: true,
          denominacionReservada: true,
          capitalDepositado: true,
          tasaPagada: true,
          documentosRevisados: true,
          documentosFirmados: true,
          tramiteIngresado: true,
          sociedadInscripta: true
        }
      })

      if (!tramite) {
        return NextResponse.json(
          { error: 'Trámite no encontrado' },
          { status: 404 }
        )
      }

      // Calcular tiempos por etapa
      const tiempos: Record<string, { dias: number, horas: number, minutos: number } | null> = {}

      // Tiempo desde inicio hasta formulario completo
      if (tramite.fechaFormularioCompleto) {
        const diff = tramite.fechaFormularioCompleto.getTime() - tramite.createdAt.getTime()
        tiempos.formularioCompleto = calcularTiempo(diff)
      }

      // Tiempo desde formulario hasta reserva de denominación
      if (tramite.fechaFormularioCompleto && tramite.fechaDenominacionReservada) {
        const diff = tramite.fechaDenominacionReservada.getTime() - tramite.fechaFormularioCompleto.getTime()
        tiempos.denominacionReservada = calcularTiempo(diff)
      }

      // Tiempo desde reserva hasta depósito de capital
      if (tramite.fechaDenominacionReservada && tramite.fechaCapitalDepositado) {
        const diff = tramite.fechaCapitalDepositado.getTime() - tramite.fechaDenominacionReservada.getTime()
        tiempos.capitalDepositado = calcularTiempo(diff)
      }

      // Tiempo desde capital hasta pago de tasa
      if (tramite.fechaCapitalDepositado && tramite.fechaTasaPagada) {
        const diff = tramite.fechaTasaPagada.getTime() - tramite.fechaCapitalDepositado.getTime()
        tiempos.tasaPagada = calcularTiempo(diff)
      }

      // Tiempo desde tasa hasta documentos revisados
      if (tramite.fechaTasaPagada && tramite.fechaDocumentosRevisados) {
        const diff = tramite.fechaDocumentosRevisados.getTime() - tramite.fechaTasaPagada.getTime()
        tiempos.documentosRevisados = calcularTiempo(diff)
      }

      // Tiempo desde revisión hasta documentos firmados
      if (tramite.fechaDocumentosRevisados && tramite.fechaDocumentosFirmados) {
        const diff = tramite.fechaDocumentosFirmados.getTime() - tramite.fechaDocumentosRevisados.getTime()
        tiempos.documentosFirmados = calcularTiempo(diff)
      }

      // Tiempo desde firmas hasta ingreso del trámite
      if (tramite.fechaDocumentosFirmados && tramite.fechaTramiteIngresado) {
        const diff = tramite.fechaTramiteIngresado.getTime() - tramite.fechaDocumentosFirmados.getTime()
        tiempos.tramiteIngresado = calcularTiempo(diff)
      }

      // Tiempo desde ingreso hasta inscripción
      if (tramite.fechaTramiteIngresado && tramite.fechaSociedadInscripta) {
        const diff = tramite.fechaSociedadInscripta.getTime() - tramite.fechaTramiteIngresado.getTime()
        tiempos.sociedadInscripta = calcularTiempo(diff)
      }

      // Tiempo total
      let tiempoTotal = null
      if (tramite.fechaSociedadInscripta) {
        const diff = tramite.fechaSociedadInscripta.getTime() - tramite.createdAt.getTime()
        tiempoTotal = calcularTiempo(diff)
      } else if (tramite.fechaTramiteIngresado) {
        const diff = tramite.fechaTramiteIngresado.getTime() - tramite.createdAt.getTime()
        tiempoTotal = calcularTiempo(diff)
      }

      return NextResponse.json({
        tramite: {
          id: tramite.id,
          denominacion: tramite.denominacionAprobada || tramite.denominacionSocial1
        },
        tiempos,
        tiempoTotal
      })
    } else {
      // Métricas agregadas de todos los trámites
      const tramites = await prisma.tramite.findMany({
        where: {
          formularioCompleto: true
        },
        select: {
          fechaFormularioCompleto: true,
          fechaDenominacionReservada: true,
          fechaCapitalDepositado: true,
          fechaTasaPagada: true,
          fechaDocumentosRevisados: true,
          fechaDocumentosFirmados: true,
          fechaTramiteIngresado: true,
          fechaSociedadInscripta: true,
          createdAt: true
        }
      })

      // Calcular promedios
      const promedios: Record<string, number> = {}
      const etapas = [
        'formularioCompleto',
        'denominacionReservada',
        'capitalDepositado',
        'tasaPagada',
        'documentosRevisados',
        'documentosFirmados',
        'tramiteIngresado',
        'sociedadInscripta'
      ]

      etapas.forEach((etapa, index) => {
        const tiemposEtapa: number[] = []
        
        tramites.forEach(tramite => {
          const fechaActual = getFechaEtapa(tramite, etapa)
          const fechaAnterior = index === 0 
            ? tramite.createdAt 
            : getFechaEtapa(tramite, etapas[index - 1])
          
          if (fechaActual && fechaAnterior) {
            const diff = fechaActual.getTime() - fechaAnterior.getTime()
            tiemposEtapa.push(diff)
          }
        })

        if (tiemposEtapa.length > 0) {
          const promedio = tiemposEtapa.reduce((a, b) => a + b, 0) / tiemposEtapa.length
          promedios[etapa] = promedio / (1000 * 60 * 60 * 24) // Convertir a días
        }
      })

      // Tiempo promedio total
      const tiemposTotales: number[] = []
      tramites.forEach(tramite => {
        const fechaFinal = tramite.fechaSociedadInscripta || tramite.fechaTramiteIngresado
        if (fechaFinal) {
          const diff = fechaFinal.getTime() - tramite.createdAt.getTime()
          tiemposTotales.push(diff)
        }
      })

      const tiempoPromedioTotal = tiemposTotales.length > 0
        ? tiemposTotales.reduce((a, b) => a + b, 0) / tiemposTotales.length / (1000 * 60 * 60 * 24)
        : 0

      return NextResponse.json({
        promedios,
        tiempoPromedioTotal,
        totalTramites: tramites.length
      })
    }

  } catch {
    return NextResponse.json(
      { error: 'Error al obtener tracking de tiempo' },
      { status: 500 }
    )
  }
}

function calcularTiempo(diffMs: number) {
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  return { dias, horas, minutos }
}

function getFechaEtapa(tramite: any, etapa: string): Date | null {
  const mapeo: Record<string, string> = {
    'formularioCompleto': 'fechaFormularioCompleto',
    'denominacionReservada': 'fechaDenominacionReservada',
    'capitalDepositado': 'fechaCapitalDepositado',
    'tasaPagada': 'fechaTasaPagada',
    'documentosRevisados': 'fechaDocumentosRevisados',
    'documentosFirmados': 'fechaDocumentosFirmados',
    'tramiteIngresado': 'fechaTramiteIngresado',
    'sociedadInscripta': 'fechaSociedadInscripta'
  }
  
  return tramite[mapeo[etapa]] || null
}

