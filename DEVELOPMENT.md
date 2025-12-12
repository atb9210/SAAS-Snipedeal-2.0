# 🚀 Guida Sviluppo Locale Rapido

Questa guida ti permette di sviluppare localmente **senza dover ricostruire Docker ogni volta**, riducendo i tempi di attesa da 2 minuti a pochi secondi.

## 📋 Prerequisiti

- Node.js 20+ installato localmente
- Docker Desktop (solo per MySQL e Redis)
- npm o yarn

## ⚡ Setup Iniziale (una volta sola)

### 1. Installa le dipendenze

```bash
npm install
```

### 2. Crea il file `.env.local`

Crea un file `.env.local` nella root del progetto con queste variabili:

```env
# Database MySQL (connessione locale)
DATABASE_URL=mysql://snipedeal:snipedeal_secret_2024@localhost:3306/snipedeal

# Redis (connessione locale)
REDIS_URL=redis://localhost:6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production-min-32-chars

# Ambiente
NODE_ENV=development
```

### 3. Avvia MySQL e Redis in Docker

```bash
npm run dev:services
```

Questo comando avvia solo MySQL e Redis (non l'app Next.js), impiegando ~10-20 secondi invece di 2 minuti.

### 4. Setup database (una volta sola)

```bash
npm run dev:setup
```

Questo comando:
- Genera il Prisma Client
- Crea le tabelle nel database
- Esegue il seed con dati iniziali

## 🎯 Sviluppo Quotidiano

### Opzione 1: Avvio Manuale (Consigliato)

**Terminale 1 - Servizi Docker:**
```bash
npm run dev:services
```

**Terminale 2 - Next.js (con hot reload):**
```bash
npm run dev
```

**Terminale 3 - Worker (opzionale, se necessario):**
```bash
npm run worker
```

### Opzione 2: Tutto in Uno

```bash
npm run dev:full
```

Questo comando avvia tutto automaticamente, ma è più lento perché aspetta che i servizi siano pronti.

## 📝 Script Disponibili

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Avvia Next.js in modalità sviluppo (hot reload) |
| `npm run dev:services` | Avvia solo MySQL e Redis in Docker |
| `npm run dev:services:down` | Ferma MySQL e Redis |
| `npm run dev:services:logs` | Mostra i log di MySQL e Redis |
| `npm run dev:setup` | Setup database (generate + push + seed) |
| `npm run dev:full` | Avvia tutto automaticamente |
| `npm run worker` | Avvia il worker di scraping |
| `npm run db:studio` | Apre Prisma Studio per visualizzare il DB |

## 🔥 Vantaggi di Questo Approccio

✅ **Hot Reload Istantaneo**: Le modifiche al codice Next.js si riflettono immediatamente  
✅ **Avvio Rapido**: MySQL e Redis partono in ~10-20 secondi  
✅ **Nessun Rebuild**: Non devi ricostruire l'immagine Docker per ogni modifica  
✅ **Debugging Facile**: Puoi usare breakpoint e debugger direttamente nel codice  
✅ **Performance Migliore**: Next.js gira nativamente, più veloce che in container  

## 🐛 Troubleshooting

### MySQL non si connette

Verifica che il container sia in esecuzione:
```bash
docker ps
```

Se non è attivo:
```bash
npm run dev:services
```

### Porta già in uso

Se la porta 3000 è occupata, puoi cambiarla:
```bash
PORT=3001 npm run dev
```

### Database non inizializzato

Se vedi errori di connessione al database:
```bash
npm run dev:setup
```

### Reset completo database

Se vuoi resettare tutto:
```bash
npm run dev:services:down
docker volume rm snipedeal2.0_nextjs_mysql-dev-data
npm run dev:services
npm run dev:setup
```

## 📦 Produzione

Per produzione, usa il `docker-compose.yml` completo:
```bash
docker-compose up -d
```

Questo avvia tutto in Docker come in produzione.

## 💡 Note

- I dati di MySQL e Redis sono salvati in volumi Docker separati (`mysql-dev-data` e `redis-dev-data`)
- Non vengono persi quando fermi i container
- Per resettare completamente, elimina i volumi Docker
- Il file `.env.local` non viene committato (è in `.gitignore`)


