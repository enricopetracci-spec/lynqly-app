'use client'

import Link from 'next/link'
import { Calendar, Users, BarChart3, MessageSquare, Zap, Shield, ArrowRight, Check } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* HEADER */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
            Lynqly
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
              Accedi
            </Link>
            <Link 
              href="/auth/register"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Prova Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <div className="inline-block">
              <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
                ✨ La piattaforma tutto-in-uno per il tuo business
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
              Gestisci il tuo business<br/>
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                senza pensieri
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Prenotazioni, clienti, preventivi e marketing in un'unica piattaforma. 
              Semplice, veloce, professionale.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link 
                href="/auth/register"
                className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition flex items-center gap-2 text-lg font-medium shadow-lg shadow-blue-600/30"
              >
                Inizia Gratis Ora
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#features"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:border-gray-400 transition text-lg font-medium"
              >
                Scopri di più
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Prova gratuita 30 giorni</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Nessuna carta richiesta</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Cancella quando vuoi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tutto quello che ti serve
            </h2>
            <p className="text-xl text-gray-600">
              Funzionalità pensate per semplificarti la vita
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: 'Gestione Prenotazioni',
                description: 'Sistema completo per prenotazioni online e offline. Calendario intuitivo e notifiche automatiche.',
                color: 'blue'
              },
              {
                icon: Users,
                title: 'Anagrafica Clienti',
                description: 'Database clienti con storico completo, tag personalizzati e segmentazione avanzata.',
                color: 'green'
              },
              {
                icon: BarChart3,
                title: 'Statistiche Real-time',
                description: 'Dashboard con KPI aggiornati in tempo reale. Monitora le performance del tuo business.',
                color: 'blue'
              },
              {
                icon: MessageSquare,
                title: 'Campagne WhatsApp',
                description: 'Invia messaggi promozionali ai tuoi clienti con template personalizzabili.',
                color: 'green'
              },
              {
                icon: Zap,
                title: 'Preventivi Automatici',
                description: 'Genera preventivi professionali in PDF con un click. Traccia accettazioni e pagamenti.',
                color: 'yellow'
              },
              {
                icon: Shield,
                title: 'Sicuro e Affidabile',
                description: 'Dati crittografati, backup automatici e conformità GDPR garantita.',
                color: 'red'
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className="p-6 rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition group"
              >
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-100 flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">100+</div>
              <div className="text-blue-100">Business Attivi</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">10k+</div>
              <div className="text-blue-100">Prenotazioni Gestite</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">98%</div>
              <div className="text-blue-100">Clienti Soddisfatti</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-3xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">
              Pronto a iniziare?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Unisciti a centinaia di professionisti che hanno scelto Lynqly
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-blue-50 transition text-lg font-medium"
            >
              Richiedi Demo Gratuita
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">Lynqly</div>
              <p className="text-sm">
                La piattaforma gestionale per il tuo business.
              </p>
            </div>
            <div>
              <div className="font-semibold text-white mb-4">Prodotto</div>
              <div className="space-y-2 text-sm">
                <div>Funzionalità</div>
                <div>Pricing</div>
                <div>Demo</div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-white mb-4">Azienda</div>
              <div className="space-y-2 text-sm">
                <div>Chi siamo</div>
                <div>Contatti</div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-white mb-4">Legale</div>
              <div className="space-y-2 text-sm">
                <Link href="/privacy">Privacy Policy</Link>
                <div>Termini di Servizio</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            © 2026 Lynqly. Tutti i diritti riservati.
          </div>
        </div>
      </footer>
    </div>
  )
}
