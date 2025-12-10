# 🚀 Guida Deployment SnipeDeal 2.0 PWA su Dokploy

**Data:** 2024-12-09  
**Versione:** 2.0.0

---

## 📋 Indice

1. [Architettura di Deployment](#architettura)
2. [Pre-requisiti](#prerequisiti)
3. [Step 1: Creare Progetto/Environment](#step-1)
4. [Step 2: Creare Database MySQL](#step-2)
5. [Step 3: Creare Redis](#step-3)
6. [Step 4: Deploy App Next.js](#step-4)
7. [Step 5: Deploy Worker](#step-5)
8. [Step 6: Configurare Domini](#step-6)
9. [Step 7: Migrazioni Database](#step-7)
10. [Variabili Ambiente](#variabili-ambiente)
11. [Troubleshooting](#troubleshooting)

---

## 📐 Architettura di Deployment {#architettura}

La strategia consigliata è usare **servizi separati** in Dokploy per garantire che il database NON venga perso durante i rebuild dell'app:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOKPLOY - SnipeDeal 2.0                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐                         │
│  │   MySQL 8.0    │  │    Redis 7     │                         │
│  │  (Database)    │  │  (Database)    │                         │
│  │  PERSISTENTE   │  │  PERSISTENTE   │                         │
│  │  Volume: ✅    │  │  Volume: ✅    │                         │
│  └───────┬────────┘  └───────┬────────┘                         │
│          │                   │                                   │
│          └─────────┬─────────┘                                   │
│                    │                                             │
│  ┌─────────────────┴────────────────────────────┐               │
│  │                                               │               │
│  │  ┌──────────────────┐  ┌──────────────────┐  │               │
│  │  │   Next.js App    │  │     Worker       │  │               │
│  │  │  (Application)   │  │  (Application)   │  │               │
│  │  │   Port: 3000     │  │  Background Job  │  │               │
│  │  │   Dockerfile     │  │  Dockerfile.worker│  │               │
│  │  │   REBUILDABLE    │  │  REBUILDABLE     │  │               │
│  │  └──────────────────┘  └──────────────────┘  │               │
│  │                                               │               │
│  └───────────────────────────────────────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### ✅ Vantaggi di questa architettura:

- **Database persistente**: MySQL e Redis hanno volumi dedicati, NON vengono toccati durante rebuild
- **Backup indipendenti**: Puoi fare backup del DB senza fermare l'app
- **Scaling facile**: Puoi aggiungere più worker se necessario
- **Rollback sicuro**: Puoi tornare a versioni precedenti dell'app senza perdere dati

---

## 📦 Pre-requisiti {#prerequisiti}

1. **Account GitHub** con il repository SnipeDeal
2. **Dokploy** configurato e funzionante
3. **Docker installato** sul server remoto (richiesto da Dokploy)
4. **Dominio** (opzionale, puoi usare traefik.me per testing)

### ⚠️ Perché Docker è necessario?

**Dokploy richiede Docker** sul server per funzionare (infrastruttura), ma per le applicazioni supporta diversi build types:

- ✅ **Dockerfile** (consigliato per questo progetto)
- ⚠️ Buildpacks (Heroku-style) - potrebbe non supportare Playwright
- ⚠️ Nixpacks (auto-detect) - potrebbe non supportare Playwright
- ❌ Static (solo siti statici)

**Per SnipeDeal 2.0 usiamo Dockerfile perché:**
- ✅ Playwright richiede dipendenze sistema specifiche (libnss3, libgbm1, ecc.)
- ✅ Worker separato che esegue script TypeScript
- ✅ Controllo preciso dell'ambiente (Node.js 20, Playwright Chromium, Prisma)
- ✅ Build multi-stage ottimizzato per produzione

### Repository GitHub necessario:
Assicurati che il repository contenga:
```
snipedeal-pwa/
├── Dockerfile           # Per l'app Next.js
├── Dockerfile.worker    # Per il worker
├── package.json
├── prisma/
│   └── schema.prisma
└── src/
```

---

## 🏗️ Step 1: Creare Progetto/Environment {#step-1}

### Opzione A: Nuovo Environment nel progetto esistente (Consigliato)

1. Vai al progetto **SnipeDeal** esistente
2. Clicca **"Add Environment"**
3. Nome: `pwa-production` o `nextjs-production`
4. Descrizione: "SnipeDeal 2.0 PWA - Next.js + MySQL + Redis"

### Opzione B: Nuovo Progetto

1. Vai su **Projects** → **Create Project**
2. Nome: `SnipeDeal-PWA`
3. Descrizione: "SnipeDeal 2.0 - Next.js PWA"

---

## 🗄️ Step 2: Creare Database MySQL {#step-2}

1. Nell'environment, clicca **"+ Create Service"**
2. Seleziona **"MySQL"**
3. Configura:

| Campo | Valore |
|-------|--------|
| **Name** | `snipedeal-mysql-pwa` |
| **Database Name** | `snipedeal_pwa` |
| **Database User** | `snipedeal` |
| **Database Password** | `[GENERA_PASSWORD_SICURA]` |
| **Root Password** | `[GENERA_PASSWORD_ROOT]` |
| **Docker Image** | `mysql:8.0` |

4. **IMPORTANTE**: In "Advanced" → verifica che il volume sia abilitato
5. Clicca **Deploy**

### 📝 Salva questi valori per dopo:
```
DATABASE_URL=mysql://snipedeal:[PASSWORD]@snipedeal-mysql-pwa:3306/snipedeal_pwa
```

> **Nota**: L'hostname è il nome del servizio (`snipedeal-mysql-pwa`) perché Dokploy crea una rete interna.

---

## 🔴 Step 3: Creare Redis {#step-3}

1. Clicca **"+ Create Service"**
2. Seleziona **"Redis"**
3. Configura:

| Campo | Valore |
|-------|--------|
| **Name** | `snipedeal-redis-pwa` |
| **Docker Image** | `redis:7-alpine` |

4. **IMPORTANTE**: In "Advanced" → abilita persistenza (appendonly)
5. Clicca **Deploy**

### 📝 Salva questo valore:
```
REDIS_URL=redis://snipedeal-redis-pwa:6379
```

---

## 🌐 Step 4: Deploy App Next.js {#step-4}

1. Clicca **"+ Create Service"**
2. Seleziona **"Application"**
3. Configura:

### Tab "General"
| Campo | Valore |
|-------|--------|
| **Name** | `snipedeal-app-pwa` |
| **Source** | GitHub |
| **Repository** | `[Il tuo repository]` |
| **Branch** | `main` (o il branch della PWA) |
| **Build Path** | `snipedeal-pwa` |

### Tab "Build"
| Campo | Valore |
|-------|--------|
| **Build Type** | `Dockerfile` |
| **Dockerfile Path** | `snipedeal-pwa/Dockerfile` |

### Tab "Environment Variables"
Aggiungi queste variabili:

```bash
# Database
DATABASE_URL=mysql://snipedeal:[TUA_PASSWORD]@snipedeal-mysql-pwa:3306/snipedeal_pwa

# Redis
REDIS_URL=redis://snipedeal-redis-pwa:6379

# NextAuth
NEXTAUTH_URL=https://[TUO_DOMINIO]
NEXTAUTH_SECRET=[GENERA_CON: openssl rand -base64 32]

# Environment
NODE_ENV=production

# Push Notifications (opzionale)
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=
# VAPID_PRIVATE_KEY=
# VAPID_EMAIL=mailto:admin@snipedeal.it
```

### Tab "Network"
| Campo | Valore |
|-------|--------|
| **Port** | `3000` |

4. Clicca **Deploy**

---

## ⚙️ Step 5: Deploy Worker {#step-5}

1. Clicca **"+ Create Service"**
2. Seleziona **"Application"**
3. Configura:

### Tab "General"
| Campo | Valore |
|-------|--------|
| **Name** | `snipedeal-worker-pwa` |
| **Source** | GitHub |
| **Repository** | `[Lo stesso repository]` |
| **Branch** | `main` |
| **Build Path** | `snipedeal-pwa` |

### Tab "Build"
| Campo | Valore |
|-------|--------|
| **Build Type** | `Dockerfile` |
| **Dockerfile Path** | `snipedeal-pwa/Dockerfile.worker` |

### Tab "Environment Variables"
```bash
# Database
DATABASE_URL=mysql://snipedeal:[TUA_PASSWORD]@snipedeal-mysql-pwa:3306/snipedeal_pwa

# Redis
REDIS_URL=redis://snipedeal-redis-pwa:6379

# Environment
NODE_ENV=production
```

### Tab "Network"
- **NON** esporre porte (il worker non serve richieste HTTP)

4. Clicca **Deploy**

---

## 🌍 Step 6: Configurare Domini {#step-6}

1. Vai all'applicazione `snipedeal-app-pwa`
2. Tab **"Domains"**
3. Aggiungi dominio:

### Per dominio custom:
| Campo | Valore |
|-------|--------|
| **Host** | `app.snipedeal.it` |
| **HTTPS** | ✅ Abilitato |
| **Certificate** | Let's Encrypt |

### Per testing (traefik.me):
| Campo | Valore |
|-------|--------|
| **Host** | `snipedeal-pwa.[SERVER-IP].traefik.me` |
| **HTTPS** | ✅ Abilitato |

4. **IMPORTANTE**: Aggiorna `NEXTAUTH_URL` nelle variabili ambiente con il dominio corretto!

---

## 🔄 Step 7: Migrazioni Database {#step-7}

Dopo il primo deploy, devi eseguire le migrazioni Prisma:

### Metodo 1: Tramite terminal Dokploy (CONSIGLIATO)

1. Vai su `snipedeal-app-pwa` → **"Terminal"**
2. **IMPORTANTE**: Verifica di essere nella directory corretta e che lo schema Prisma esista:
```bash
# Verifica directory corrente
pwd

# Verifica che lo schema Prisma esista
ls -la prisma/

# Se lo schema esiste, esegui:
npx prisma db push

# Poi esegui il seed:
npx prisma db seed
```

**Se Prisma non trova lo schema**, prova:
```bash
# Specifica il path esplicito dello schema
npx prisma db push --schema=./prisma/schema.prisma
npx prisma db seed --schema=./prisma/schema.prisma
```

### Metodo 2: SSH nel container

```bash
docker exec -it snipedeal-app-pwa sh
cd /app
ls -la prisma/  # Verifica che lo schema esista
npx prisma db push --schema=./prisma/schema.prisma
npx prisma db seed --schema=./prisma/schema.prisma
```

### Troubleshooting

**Errore: "Could not find Prisma Schema"**
- Verifica di essere nella directory `/app` nel container
- Verifica che `prisma/schema.prisma` esista: `ls -la prisma/`
- Usa `--schema=./prisma/schema.prisma` per specificare il path esplicito

---

## 🔐 Variabili Ambiente Complete {#variabili-ambiente}

### Per l'App Next.js:

```bash
# ============================================
# DATABASE (OBBLIGATORIO)
# ============================================
DATABASE_URL=mysql://snipedeal:PASSWORD@snipedeal-mysql-pwa:3306/snipedeal_pwa

# ============================================
# REDIS (OBBLIGATORIO)
# ============================================
REDIS_URL=redis://snipedeal-redis-pwa:6379

# ============================================
# NEXTAUTH (OBBLIGATORIO)
# ============================================
NEXTAUTH_URL=https://app.snipedeal.it
NEXTAUTH_SECRET=tua_chiave_segreta_32_caratteri_random

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=production

# ============================================
# WEB PUSH (OPZIONALE)
# ============================================
# Genera con: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@snipedeal.it
```

### Per il Worker:

```bash
DATABASE_URL=mysql://snipedeal:PASSWORD@snipedeal-mysql-pwa:3306/snipedeal_pwa
REDIS_URL=redis://snipedeal-redis-pwa:6379
NODE_ENV=production
```

---

## 🆘 Troubleshooting {#troubleshooting}

### ❌ "Cannot connect to database"

1. Verifica che MySQL sia **running** (stato verde)
2. Controlla l'hostname (deve essere il nome del servizio Dokploy)
3. Verifica che app e MySQL siano nello **stesso environment**

### ❌ "Redis connection refused"

1. Verifica che Redis sia **running**
2. Controlla `REDIS_URL` (formato: `redis://hostname:6379`)

### ❌ "Worker non processa job"

1. Controlla i logs del worker: `snipedeal-worker-pwa` → Logs
2. Verifica che Redis sia accessibile
3. Verifica che `DATABASE_URL` sia corretto

### ❌ "NEXTAUTH_URL mismatch"

1. `NEXTAUTH_URL` deve corrispondere **esattamente** al dominio configurato
2. Includi `https://` nel valore

### ❌ "Build fallisce"

1. Controlla che `Build Path` sia corretto: `snipedeal-pwa`
2. Verifica che `Dockerfile Path` sia: `snipedeal-pwa/Dockerfile`

### ❌ "Prisma client not generated"

1. Entra nel container: Terminal → `npx prisma generate`
2. Riavvia l'applicazione

---

## 📊 Ordine di Deploy Consigliato

1. ✅ MySQL → Aspetta che sia running
2. ✅ Redis → Aspetta che sia running
3. ✅ App Next.js → Deploy
4. ✅ Worker → Deploy
5. ✅ Dominio → Configura
6. ✅ Migrazioni → `prisma db push`
7. ✅ Seed → `prisma db seed`

---

## 🔄 Aggiornamenti Futuri

Per aggiornare l'app senza perdere dati:

1. Push modifiche su GitHub
2. Vai su `snipedeal-app-pwa` → **Redeploy**
3. (Opzionale) Vai su `snipedeal-worker-pwa` → **Redeploy**

**MySQL e Redis NON vengono toccati** durante il redeploy! 🎉

---

## 📝 Note Finali

- **Backup**: Configura backup automatici per MySQL in Dokploy
- **Monitoring**: Usa i logs di Dokploy per monitorare errori
- **SSL**: Let's Encrypt è automatico su Dokploy con domini custom
- **Scaling**: Puoi aggiungere più istanze del worker se necessario

---

**Creato da:** Cursor AI Assistant  
**Per:** SnipeDeal 2.0 PWA Deployment

