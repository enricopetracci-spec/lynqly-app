# 🚀 GUIDA RAPIDA - Come Pubblicare Lynqly Online

## ⚡ PASSI VELOCI (30 minuti)

### PASSO 1: Crea gli account (10 minuti)

#### 1.1 GitHub
1. Vai su **github.com**
2. Clicca **"Sign up"** (iscriviti)
3. Usa la tua email e crea una password
4. Verifica l'email
5. ✅ Fatto!

#### 1.2 Vercel
1. Vai su **vercel.com**
2. Clicca **"Sign up"**
3. Clicca **"Continue with GitHub"**
4. Autorizza Vercel
5. ✅ Fatto!

#### 1.3 Supabase
1. Vai su **supabase.com**
2. Clicca **"Start your project"**
3. Clicca **"Sign up with GitHub"**
4. Crea Organization: scrivi "Lynqly"
5. ✅ Fatto!

---

### PASSO 2: Carica i file su GitHub (10 minuti)

1. Vai su **github.com** (fai login)
2. Clicca il **"+"** in alto a destra
3. Clicca **"New repository"**
4. Compila:
   - Nome: `lynqly-app`
   - Privato: ✅
   - Add README: ✅
5. Clicca **"Create repository"**

**ORA CARICA I FILE:**

6. Clicca **"Add file"** → **"Upload files"**
7. Apri la cartella `lynqly-app` che ti ho dato
8. Seleziona TUTTI i file e cartelle
9. Trascinali nella finestra di GitHub
10. Aspetta il caricamento (può richiedere 2-3 minuti)
11. In fondo scrivi: "Prima versione"
12. Clicca **"Commit changes"**
13. ✅ Caricato!

---

### PASSO 3: Crea il database (10 minuti)

1. Vai su **supabase.com** (fai login)
2. Clicca **"New project"**
3. Compila:
   - Name: `Lynqly`
   - Database Password: `Lynqly2025!DB` (SALVALA!)
   - Region: `Europe West`
4. Clicca **"Create new project"**
5. Aspetta 2 minuti (sta creando il database)

**CREA LE TABELLE:**

6. Clicca **"SQL Editor"** nel menu a sinistra
7. Clicca **"New query"**
8. Apri il file `supabase/schema.sql` che ti ho dato
9. Copia TUTTO il contenuto
10. Incolla nel box di Supabase
11. Clicca **"Run"** in basso a destra
12. Vedi "Success!" in verde
13. ✅ Database pronto!

**PRENDI LE CHIAVI:**

14. Clicca **"Project Settings"** (rotellina in basso a sinistra)
15. Clicca **"API"**
16. Vedi e COPIA questi 2 valori:
    - **Project URL** (es: `https://abcdefgh.supabase.co`)
    - **anon public key** (stringa lunga che inizia con `eyJh...`)
17. SALVALI da qualche parte! Ti servono subito

---

### PASSO 4: Pubblica l'app su Vercel (10 minuti)

1. Vai su **vercel.com** (fai login)
2. Clicca **"Add New..."** → **"Project"**
3. Trova **"lynqly-app"** nella lista
4. Clicca **"Import"**

**AGGIUNGI LE CHIAVI DEL DATABASE:**

5. Clicca **"Environment Variables"** (prima di fare deploy)
6. Aggiungi la PRIMA variabile:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: (incolla la Project URL di Supabase)
   - Clicca **"Add"**
7. Aggiungi la SECONDA variabile:
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: (incolla la anon key di Supabase)
   - Clicca **"Add"**

8. Clicca **"Deploy"**
9. Aspetta 2-3 minuti
10. Vedi "🎉 Congratulations!"
11. ✅ L'APP È ONLINE!

---

## 🎉 HAI FINITO!

Vedrai un link tipo: `lynqly-app.vercel.app`

**Clicca il link e prova:**
1. Clicca "Registrati"
2. Crea il tuo account
3. Configura la tua attività
4. Aggiungi un servizio
5. Copia il tuo link personale
6. Aprilo in un'altra finestra per vedere la pagina di prenotazione!

---

## 🆘 PROBLEMI?

### "Non riesco a caricare i file su GitHub"
→ I file sono troppi? Usa **GitHub Desktop**:
1. Scarica da desktop.github.com
2. Installalo
3. Fai login
4. Clicca "Add" → "Add existing repository"
5. Seleziona la cartella lynqly-app
6. Clicca "Publish repository"

### "Errore quando deploy su Vercel"
→ Hai aggiunto le Environment Variables PRIMA di cliccare Deploy?
→ Ricontrolla che le chiavi siano corrette (nessuno spazio prima/dopo)

### "L'app non si apre / errore 500"
→ Hai eseguito il file `schema.sql` su Supabase?
→ Vai su Supabase → SQL Editor → Table Editor → Verifica che vedi le tabelle

### "Non ricevo le email"
→ Le email non sono ancora configurate (serve Resend)
→ Per ora le prenotazioni funzionano comunque, le vedi nella dashboard

---

## 📞 SERVE AIUTO?

Torna nella chat con Claude e chiedi aiuto! Fai uno screenshot del problema.

---

## 🎯 PROSSIMI PASSI

Una volta che funziona:

1. **Comprare un dominio** (lynqly.it invece di vercel.app)
2. **Configurare le email** (Resend per conferme automatiche)
3. **Aggiungere più funzionalità** (tornando da Claude)

**CONGRATULAZIONI! HAI PUBBLICATO LYNQLY! 🎊**
