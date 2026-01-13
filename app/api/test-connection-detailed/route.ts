import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET() {
  const results: any = {
    step1_checkEnv: {},
    step2_parseUrl: {},
    step3_testConnection: {},
    step4_testQuery: {}
  }

  // Paso 1: Verificar variable de entorno
  try {
    const dbUrl = process.env.DATABASE_URL
    results.step1_checkEnv = {
      success: !!dbUrl,
      hasUrl: !!dbUrl,
      urlLength: dbUrl?.length || 0,
      urlPreview: dbUrl ? dbUrl.substring(0, 50) + '...' : 'No encontrada'
    }
  } catch (error: any) {
    results.step1_checkEnv = { success: false, error: error.message }
  }

  // Paso 2: Parsear URL
  try {
    const dbUrl = process.env.DATABASE_URL || ''
    const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?/)
    
    if (urlMatch) {
      results.step2_parseUrl = {
        success: true,
        username: urlMatch[1],
        passwordLength: urlMatch[2].length,
        host: urlMatch[3],
        port: urlMatch[4],
        database: urlMatch[5],
        params: urlMatch[6] || 'sin parámetros',
        hasPgbouncer: dbUrl.includes('pgbouncer'),
        hasSslmode: dbUrl.includes('sslmode'),
        isPooler: dbUrl.includes('pooler.supabase.com'),
        isDirect: dbUrl.includes('db.') && dbUrl.includes('.supabase.co')
      }
    } else {
      results.step2_parseUrl = {
        success: false,
        error: 'No se pudo parsear la URL'
      }
    }
  } catch (error: any) {
    results.step2_parseUrl = { success: false, error: error.message }
  }

  // Paso 3: Intentar conexión
  try {
    const prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    const startTime = Date.now()
    await prisma.$connect()
    const connectTime = Date.now() - startTime

    results.step3_testConnection = {
      success: true,
      connectTimeMs: connectTime,
      message: 'Conexión establecida'
    }

    // Paso 4: Intentar query
    try {
      const queryStart = Date.now()
      const userCount = await prisma.user.count()
      const queryTime = Date.now() - queryStart

      results.step4_testQuery = {
        success: true,
        queryTimeMs: queryTime,
        userCount
      }

      await prisma.$disconnect()
    } catch (queryError: any) {
      results.step4_testQuery = {
        success: false,
        error: queryError.message,
        code: queryError.code
      }
      await prisma.$disconnect()
    }
  } catch (error: any) {
    results.step3_testConnection = {
      success: false,
      error: error.message,
      code: error.code,
      meta: error.meta
    }
  }

  const allSuccess = results.step1_checkEnv.success && 
                     results.step2_parseUrl.success && 
                     results.step3_testConnection.success &&
                     results.step4_testQuery.success

  return NextResponse.json({
    overall: allSuccess ? 'success' : 'failed',
    results
  }, { status: allSuccess ? 200 : 500 })
}

