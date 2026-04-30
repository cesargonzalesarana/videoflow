import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'VideoFlow - Crea, Programa y Publica Videos con IA'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a1f 0%, #1a0a2e 100%)',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-100px', left: '-100px',
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(124, 58, 237, 0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-120px', right: '-120px',
          width: 500, height: 500, borderRadius: '50%',
          background: 'rgba(168, 85, 247, 0.06)',
        }} />
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          width: 880, height: 420, borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(168, 85, 247, 0.08) 100%)',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          borderTop: '4px solid #7c3aed',
        }}>
          <div style={{ fontSize: 72, fontWeight: 800, color: 'white', letterSpacing: '-1px', marginBottom: 16 }}>
            VideoFlow
          </div>
          <div style={{ fontSize: 28, color: '#c4b5fd', letterSpacing: '0.5px', marginBottom: 28 }}>
            Crea, Programa y Publica Videos con IA
          </div>
          <div style={{ width: 300, height: 2, background: 'linear-gradient(90deg, #7c3aed, #a855f7)', opacity: 0.5, marginBottom: 32 }} />
          <div style={{ display: 'flex', gap: 48, fontSize: 20, color: '#a78bfa' }}>
            <span>Editor de Video</span>
            <span>Programador</span>
            <span>IA Trends</span>
          </div>
          <div style={{
            marginTop: 36, padding: '14px 60px', borderRadius: 26,
            background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
            fontSize: 18, fontWeight: 600, color: 'white',
          }}>
            Comenzar Gratis
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}