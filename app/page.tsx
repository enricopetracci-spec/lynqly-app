import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, Zap, BarChart3, Share2, Bell } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white overflow-x-hidden">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              L
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">Lynqly</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-sm sm:text-base">Accedi</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="text-sm sm:text-base">Inizia Gratis</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-12 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 px-2">
          La tua attività, <br />
          <span className="text-blue-600">in un click</span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto px-4">
          Sistema completo di prenotazioni online per saloni, barbieri, centri estetici e tutte le attività di quartiere.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
          <Link href="/auth/register">
            <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8">
              Prova Gratis per 30 Giorni
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8">
              Scopri di più
            </Button>
          </Link>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-4 px-4">
          Nessuna carta di credito richiesta • Setup in 5 minuti
        </p>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tutto quello che ti serve
          </h2>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Gestisci la tua attività con semplicità
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mb-4" />
              <CardTitle className="text-lg sm:text-xl">Prenotazioni Online</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                I tuoi clienti prenotano direttamente dal tuo link personale, 24/7
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Share2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mb-4" />
              <CardTitle className="text-lg sm:text-xl">Link Personale</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Un link unico da condividere su WhatsApp, Instagram e ovunque
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mb-4" />
              <CardTitle className="text-lg sm:text-xl">Notifiche Automatiche</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Email di conferma e promemoria automatici per i tuoi clienti
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mb-4" />
              <CardTitle className="text-lg sm:text-xl">Gestione Clienti</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Anagrafica completa con storico prenotazioni e note
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mb-4" />
              <CardTitle className="text-lg sm:text-xl">Setup Veloce</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Operativo in 5 minuti. Aggiungi servizi, orari e sei pronto
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mb-4" />
              <CardTitle className="text-lg sm:text-xl">Statistiche</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Dashboard con insights sui tuoi clienti e prenotazioni
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-blue-50 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Come funziona
            </h2>
            <p className="text-base sm:text-lg text-gray-600 px-4">
              In 3 semplici passaggi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Registrati</h3>
              <p className="text-sm sm:text-base text-gray-600 px-4">
                Crea il tuo account e configura la tua attività in 5 minuti
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Condividi</h3>
              <p className="text-sm sm:text-base text-gray-600 px-4">
                Ottieni il tuo link personale e condividilo con i clienti
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Ricevi Prenotazioni</h3>
              <p className="text-sm sm:text-base text-gray-600 px-4">
                I clienti prenotano online, tu ricevi notifiche in tempo reale
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
        <div className="bg-blue-600 rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Pronto a semplificare il tuo lavoro?
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-8 opacity-90 px-4">
            Unisciti a centinaia di attività che usano Lynqly
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8">
              Inizia Gratis Ora
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p className="text-sm sm:text-base">&copy; 2026 Lynqly. Tutti i diritti riservati.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4 text-sm sm:text-base">
            <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-900">Termini e Condizioni</Link>
            <Link href="/support" className="hover:text-gray-900">Supporto</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
