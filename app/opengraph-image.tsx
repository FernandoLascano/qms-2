import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'QuieroMiSAS - Constituí tu SAS online en Argentina'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #7f1d1d 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              background: '#dc2626',
              borderRadius: '16px',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'white', fontSize: '36px', fontWeight: 800 }}>
              QMS
            </span>
          </div>
          <span style={{ color: '#9ca3af', fontSize: '28px', fontWeight: 500 }}>
            QuieroMiSAS
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <span
            style={{
              color: 'white',
              fontSize: '56px',
              fontWeight: 900,
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            Constituí tu SAS
          </span>
          <span
            style={{
              color: 'white',
              fontSize: '56px',
              fontWeight: 900,
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            en{' '}
            <span style={{ color: '#dc2626' }}>5 días</span>
          </span>
        </div>

        {/* Subtitle */}
        <span
          style={{
            color: '#9ca3af',
            fontSize: '24px',
            marginTop: '24px',
            textAlign: 'center',
          }}
        >
          100% online · Córdoba y CABA · Desde $285.000
        </span>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: '48px',
            padding: '16px 32px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
          }}
        >
          <span style={{ color: '#d1d5db', fontSize: '18px' }}>
            +500 empresas constituidas
          </span>
          <span style={{ color: '#6b7280' }}>|</span>
          <span style={{ color: '#d1d5db', fontSize: '18px' }}>
            CUIT en 5 días hábiles
          </span>
          <span style={{ color: '#6b7280' }}>|</span>
          <span style={{ color: '#d1d5db', fontSize: '18px' }}>
            www.quieromisas.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
