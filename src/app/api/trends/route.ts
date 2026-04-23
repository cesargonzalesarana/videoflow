import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

// Cached trends data
let cachedTrends: any[] | null = null
let lastFetch = 0
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) return auth.response!

    const now = Date.now()

    // Return cached data if still fresh
    if (cachedTrends && now - lastFetch < CACHE_DURATION) {
      return NextResponse.json({ trends: cachedTrends })
    }

    // Fetch fresh trends using AI
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Eres un analista de tendencias de redes sociales. Genera 10 temas trending actuales para creadores de contenido.
          Responde SOLAMENTE en formato JSON válido, sin markdown ni backticks. Array de objetos con:
          - "id": número incremental
          - "title": título del trend (máx 50 chars)
          - "category": una de ["Tecnología", "Entretenimiento", "Educación", "Lifestyle", "Negocios", "Salud", "Gaming"]
          - "engagement": número entre 1000 y 50000
          - "growth": número entre 5 y 95 (porcentaje)
          - "description": descripción breve (máx 100 chars)
          - "hashtags": array de 3-5 hashtags strings`
        }
      ],
      temperature: 0.9,
      max_tokens: 1500
    })

    const content = completion.choices[0]?.message?.content || '[]'

    // Try to parse JSON from the response
    let trends: any[] = []
    try {
      // Clean up potential markdown wrapping
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      trends = JSON.parse(cleaned)
    } catch {
      // Fallback to mock data if AI response isn't valid JSON
      trends = getDefaultTrends()
    }

    cachedTrends = trends
    lastFetch = now

    return NextResponse.json({ trends })
  } catch (error: unknown) {
    console.error('Trends error:', error)
    // Return fallback data on error
    return NextResponse.json({ trends: getDefaultTrends() })
  }
}

function getDefaultTrends() {
  return [
    { id: '1', title: 'IA Generativa 2025', category: 'Tecnología', engagement: 45000, growth: 85, description: 'Herramientas de IA que cambian la creación de contenido', hashtags: ['#IA', '#InteligenciaArtificial', '#Tech2025'] },
    { id: '2', title: 'Shorts Verticales', category: 'Entretenimiento', engagement: 38000, growth: 72, description: 'El formato corto domina todas las plataformas', hashtags: ['#Shorts', '#VerticalVideo', '#Viral'] },
    { id: '3', title: 'Educación Financiera', category: 'Educación', engagement: 32000, growth: 65, description: 'Contenido sobre inversiones y ahorro', hashtags: ['#Finanzas', '#Dinero', '#Invertir'] },
    { id: '4', title: 'Vida Minimalista', category: 'Lifestyle', engagement: 28000, growth: 58, description: 'Tendencia de simplificar la vida cotidiana', hashtags: ['#Minimalismo', '#MenosEsMás', '#Simple'] },
    { id: '5', title: 'Emprendimiento Digital', category: 'Negocios', engagement: 35000, growth: 70, description: 'Negocios online y monetización de contenido', hashtags: ['#Emprender', '#NegocioOnline', '#Freedom'] },
    { id: '6', title: 'Gaming en Mobile', category: 'Gaming', engagement: 42000, growth: 78, description: 'Juegos para smartphone que arrasan', hashtags: ['#Gaming', '#MobileGames', '#Gamer'] },
    { id: '7', title: 'Recetas Rápidas', category: 'Lifestyle', engagement: 26000, growth: 52, description: 'Cocina en menos de 5 minutos para redes', hashtags: ['#Cocina', '#Recetas', '#Food'] },
    { id: '8', title: 'Fitness en Casa', category: 'Salud', engagement: 30000, growth: 60, description: 'Rutinas de ejercicio sin equipo', hashtags: ['#Fitness', '#Salud', '#Ejercicio'] },
    { id: '9', title: 'Podcasts en Video', category: 'Entretenimiento', engagement: 22000, growth: 45, description: 'El formato podcast migra al video', hashtags: ['#Podcast', '#AudioVisual', '#Charlas'] },
    { id: '10', title: 'Sostenibilidad', category: 'Lifestyle', engagement: 24000, growth: 48, description: 'Eco-friendly y consumo consciente', hashtags: ['#Sostenible', '#Eco', '#Verde'] },
  ]
}
