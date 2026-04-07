import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, prompt, context } = body

    const zai = await ZAI.create()

    if (action === 'script') {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Eres un experto creador de contenido para redes sociales. Genera scripts de video atractivos y virales. Responde en español. El script debe incluir: hook inicial, desarrollo, y llamada a la acción. Formato: [HOOK], [DESARROLLO], [CTA]. Máximo 150 palabras.`
          },
          {
            role: 'user',
            content: prompt || 'Crea un script sobre tendencias actuales en tecnología para TikTok'
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      })

      const script = completion.choices[0]?.message?.content || 'No se pudo generar el script'
      return NextResponse.json({ script })
    }

    if (action === 'hashtags') {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en marketing de redes sociales. Genera hashtags relevantes y populares para el tema dado. Responde SOLO con los hashtags separados por espacios, sin explicación. Máximo 20 hashtags.'
          },
          {
            role: 'user',
            content: prompt || 'videos de tecnología'
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })

      const hashtags = completion.choices[0]?.message?.content || ''
      return NextResponse.json({ hashtags })
    }

    if (action === 'suggestions') {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Eres un consultor de contenido para creadores digitales. Analiza las tendencias y da 5 sugerencias de contenido específicas y accionables. Responde en español. Formato: número + título + descripción breve (1 línea).'
          },
          {
            role: 'user',
            content: prompt || 'Dame sugerencias de contenido para un creador de videos de tecnología'
          }
        ],
        temperature: 0.8,
        max_tokens: 600
      })

      const suggestions = completion.choices[0]?.message?.content || 'No se pudieron generar sugerencias'
      return NextResponse.json({ suggestions })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: unknown) {
    console.error('AI error:', error)
    const message = error instanceof Error ? error.message : 'Error del servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
