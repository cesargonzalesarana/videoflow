"use client";

import { Check, Zap, Crown, Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Gratis",
    icon: Zap,
    price: "$0",
    period: "para siempre",
    description: "Perfecto para empezar a crear videos",
    features: [
      "3 proyectos activos",
      "5 GB de almacenamiento",
      "Exportaci\u00f3n en 720p",
      "Timeline b\u00e1sico",
      "Biblioteca de medios",
      "Publicaci\u00f3n manual",
    ],
    cta: "Empezar gratis",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    icon: Crown,
    price: "$12",
    period: "/mes",
    description: "Para creadores que necesitan m\u00e1s poder",
    features: [
      "Proyectos ilimitados",
      "100 GB de almacenamiento",
      "Exportaci\u00f3n en 4K",
      "Timeline avanzado + pistas",
      "IA generativa de textos",
      "Publicaci\u00f3n programada",
      "Audio AI (text-to-speech)",
      "Soporte prioritario",
    ],
    cta: "Comenzar prueba gratis",
    variant: "default" as const,
    popular: true,
  },
  {
    name: "Empresa",
    icon: Building2,
    price: "$39",
    period: "/mes",
    description: "Para equipos y producciones profesionales",
    features: [
      "Todo lo de Pro",
      "Almacenamiento ilimitado",
      "Exportaci\u00f3n sin marca de agua",
      "Colaboraci\u00f3n en equipo",
      "API de integraci\u00f3n",
      "Analytics avanzados",
      "Canales m\u00faltiples",
      "Manager dedicado",
    ],
    cta: "Contactar ventas",
    variant: "outline" as const,
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-lg font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              VideoFlow
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 sm:py-24 text-center px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Planes para cada{" "}
            <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              creador
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comienza gratis y escala cuando lo necesites. Sin sorpresas, sin costos ocultos.
            Cancela cuando quieras.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-violet-500 shadow-lg shadow-violet-500/10 scale-105"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    M\u00e1s popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <plan.icon className="w-6 h-6 text-violet-500" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="text-center pb-2 flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-3 text-left">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Link href="/" className="w-full">
                  <Button variant={plan.variant} className="w-full" size="lg">
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold text-center">Preguntas frecuentes</h2>
          <div className="space-y-6">
            {[
              {
                q: "\u00bfPuedo cancelar en cualquier momento?",
                a: "S\u00ed, puedes cancelar tu suscripci\u00f3n cuando quieras desde tu panel de configuraci\u00f3n. No hay penalizaciones ni costos ocultos.",
              },
              {
                q: "\u00bfHay prueba gratuita del plan Pro?",
                a: "S\u00ed, el plan Pro incluye 14 d\u00edas de prueba gratuita con acceso a todas las funcionalidades. No se requiere tarjeta de cr\u00e9dito.",
              },
              {
                q: "\u00bfQu\u00e9 m\u00e9todos de pago aceptan?",
                a: "Aceptamos tarjetas de cr\u00e9dito/d\u00e9bito (Visa, MasterCard, American Express), PayPal y transferencias bancarias para el plan Empresa.",
              },
              {
                q: "\u00bfQu\u00e9 pasa con mis videos si cancelo?",
                a: "Tus videos se mantienen en tu cuenta durante 30 d\u00edas despu\u00e9s de la cancelaci\u00f3n. Puedes exportarlos en cualquier momento durante ese per\u00edodo.",
              },
            ].map((faq) => (
              <div key={faq.q} className="space-y-2">
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="text-muted-foreground text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} VideoFlow. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
