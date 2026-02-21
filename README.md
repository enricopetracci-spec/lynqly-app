# 🎯 Lynqly - Gestionale per Attività di Quartiere

## 📋 Cosa include questo progetto

### 🏢 App Commerciante
- Dashboard con statistiche
- Gestione servizi e prezzi
- Calendario disponibilità
- Prenotazioni in tempo reale
- Anagrafica clienti
- Gestione staff
- Link personale da condividere

### 🔗 Pagina Pubblica per Clienti
- Pagina prenotazione personalizzata per ogni attività
- Calendario interattivo
- Form prenotazione semplice
- Conferma via email

## 🚀 Stack Tecnologico

- **Framework**: Next.js 14 (App Router)
- **UI**: React + Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Email**: Resend
- **Hosting**: Vercel
- **Linguaggio**: TypeScript

## 📁 Struttura Progetto

```
lynqly-app/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Pagine login/registrazione
│   ├── (dashboard)/       # Dashboard commerciante
│   ├── [business]/        # Pagina pubblica prenotazioni
│   └── api/               # API routes
├── components/            # Componenti React
├── lib/                   # Utilities e configurazioni
├── public/               # Assets statici
└── supabase/             # Database schema e migrations
```

## 🔧 Setup Locale (per sviluppo)

```bash
# Installa dipendenze
npm install

# Configura variabili ambiente
cp .env.example .env.local
# Compila .env.local con le tue chiavi

# Avvia server sviluppo
npm run dev
```

## 🌐 Deploy su Vercel

Segui la guida: GUIDA_COMPLETA_LYNQLY.md

## 📧 Supporto

Hai bisogno di aiuto? Torna nella chat con Claude!
