# 🚀 Deploy SnipeDeal 2.0 su Dokploy con Docker Compose

Questa guida mostra come deployare l'intera applicazione su Dokploy usando un **unico stack Docker Compose**, esattamente come funziona in locale.

## ✅ Vantaggi del Compose Stack

- ✅ **Setup identico** a locale (testato e funzionante)
- ✅ **Gestione automatica** delle dipendenze (healthcheck, depends_on)
- ✅ **Rete interna** automatica tra servizi
- ✅ **Un solo deploy** invece di 4 servizi separati
- ✅ **Migrazioni automatiche** all'avvio
- ✅ **Rollback facile** di tutto lo stack insieme

## 📋 Prerequisiti

- Account Dokploy attivo
- Repository GitHub con il codice
- Dominio configurato (es. `app.snipedeal.it`)

---

## 🚀 Deploy su Dokploy

### Step 1: Crea un nuovo progetto

1. Accedi a Dokploy
2. Vai su **Projects**
3. Clicca **"+ Create Project"**
4. Nome: `SnipeDeal 2.0 PWA`
5. Descrizione: `Stack completo: MySQL + Redis + App + Worker`

### Step 2: Crea un Compose Service

1. Nel progetto, clicca **"+ Create Service"**
2. Seleziona **"Compose"**
3. Configura:

#### Tab "General"

| Campo | Valore |
|-------|--------|
| **Name** | `snipedeal-stack` |
| **Source** | GitHub |
| **Repository** | `[Il tuo repository]` |
| **Branch** | `main` |
| **Compose Path** | `snipedeal-pwa/docker-compose.dokploy.yml` |
| **Auto Deploy** | ✅ Abilitato |

#### Tab "Environment Variables"

Copia e configura queste variabili:

```bash
# MySQL
MYSQL_ROOT_PASSWORD=TuaPasswordRoot123!
MYSQL_DATABASE=snipedeal_pwa
MYSQL_USER=snipedeal
MYSQL_PASSWORD=TuaPasswordDB456!

# Redis (opzionale, lascia vuoto per no password)
REDIS_PASSWORD=

# NextAuth
NEXTAUTH_URL=https://app.snipedeal.it
NEXTAUTH_SECRET=[GENERA_CON: openssl rand -base64 32]

# OAuth Google (opzionale)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OAuth GitHub (opzionale)
GITHUB_ID=
GITHUB_SECRET=
```

**IMPORTANTE:** Genera un NEXTAUTH_SECRET sicuro:
```bash
openssl rand -base64 32
```

### Step 3: Configura il Dominio

1. Vai nel servizio `snipedeal-stack`
2. Apri tab **"Domains"**
3. Clicca **"+ Add Domain"**

#### Per produzione:
| Campo | Valore |
|-------|--------|
| **Host** | `app.snipedeal.it` |
| **Port** | `3000` |
| **HTTPS** | ✅ Abilitato |
| **Certificate** | Let's Encrypt |

#### Per testing (traefik.me):
| Campo | Valore |
|-------|--------|
| **Host** | `snipedeal-stack.[SERVER-IP].traefik.me` |
| **Port** | `3000` |
| **HTTPS** | ✅ Abilitato |

### Step 4: Deploy

1. Clicca **"Deploy"**
2. Dokploy farà:
   - Pull del repository
   - Build di tutti i container
   - Avvio dello stack completo
   - Configurazione networking automatica

3. Monitora i logs:
   - Vai su "Logs"
   - Seleziona il servizio (app, mysql, redis, worker)
   - Verifica che tutto si avvii correttamente

---

## 🔄 Migrazioni Database

Dopo il primo deploy, esegui le migrazioni:

### Metodo 1: Via Terminal Dokploy (consigliato)

1. Vai su `snipedeal-stack` → **"Terminal"**
2. Seleziona il container **"app"**
3. Esegui:

```bash
# Diventa root
su root
# (premi invio se chiede password, non ce n'è)

# Vai nella directory app
cd /app

# Esegui migrazioni
npx prisma db push --schema=./prisma/schema.prisma

# Popola database con dati iniziali
npx prisma db seed --schema=./prisma/schema.prisma

# Verifica tabelle create
npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SHOW TABLES;"

# Esci
exit
```

### Metodo 2: Via SSH (se hai accesso al server)

```bash
# Entra nel container dell'app
docker exec -it snipedeal-app sh

# Diventa root
su root

# Esegui migrazioni
cd /app
npx prisma db push --schema=./prisma/schema.prisma
npx prisma db seed --schema=./prisma/schema.prisma
exit
exit
```

---

## 🧪 Verifica che tutto funzioni

### 1. Verifica servizi attivi

In Dokploy, vai su **"Services"** del compose stack:
- ✅ mysql: healthy
- ✅ redis: healthy
- ✅ app: running
- ✅ worker: running

### 2. Testa l'applicazione

1. Vai su `https://app.snipedeal.it` (o il tuo dominio)
2. Dovresti vedere la homepage
3. Vai su `/login`
4. Login con credenziali admin (dopo seed):
   - Email: `admin@snipedeal.it`
   - Password: `admin123`

### 3. Verifica database

Nel terminale del container mysql:

```bash
# Via Dokploy Terminal → seleziona container "mysql"
mysql -u snipedeal -p snipedeal_pwa

# Inserisci password: [TuaPasswordDB]

# Verifica tabelle
SHOW TABLES;

# Verifica utenti
SELECT email, role FROM User;

# Esci
exit
```

### 4. Verifica worker

Controlla i logs del worker:

```bash
# Via Dokploy → Logs → Seleziona "worker"
# Dovresti vedere: "Worker started and listening for jobs"
```

---

## 🔧 Gestione dello Stack

### Restart singolo servizio

```bash
# Via Dokploy Terminal
docker-compose restart app
docker-compose restart worker
docker-compose restart mysql
docker-compose restart redis
```

### Rebuild dopo modifiche al codice

1. Push su GitHub
2. Dokploy fa autodeploy automatico
3. Solo i servizi modificati vengono ricostruiti

### Stop/Start dello stack

In Dokploy:
- **Stop**: Clicca "Stop" sul servizio compose
- **Start**: Clicca "Start"
- **Redeploy**: Clicca "Redeploy" (rebuild completo)

### Backup database

```bash
# Via Dokploy Terminal → mysql container
mysqldump -u snipedeal -p snipedeal_pwa > /backup.sql

# Copia backup fuori dal container
docker cp snipedeal-mysql:/backup.sql ./backup-$(date +%Y%m%d).sql
```

---

## 📊 Monitoring

### Logs in tempo reale

In Dokploy → Logs:
- Seleziona il servizio da monitorare
- I logs si aggiornano automaticamente

### Health status

Dokploy mostra lo stato di salute di ogni servizio:
- 🟢 Verde = Healthy/Running
- 🟡 Giallo = Starting
- 🔴 Rosso = Error

### Metriche

In Dokploy → Monitoring:
- CPU usage
- Memory usage
- Network traffic
- Disk usage

---

## 🐛 Troubleshooting

### Problema: App non si connette al database

**Soluzione:**
1. Verifica che MySQL sia "healthy"
2. Controlla logs di MySQL: `docker-compose logs mysql`
3. Verifica DATABASE_URL nelle env vars
4. Dovrebbe essere: `mysql://snipedeal:[PASSWORD]@mysql:3306/snipedeal_pwa`

### Problema: Worker non processa job

**Soluzione:**
1. Verifica logs worker: `docker-compose logs worker`
2. Verifica che Redis sia "healthy"
3. Controlla REDIS_URL: `redis://:@redis:6379`

### Problema: Migrazioni falliscono

**Soluzione:**
1. Verifica di essere come root: `su root`
2. Verifica che lo schema esista: `ls -la /app/prisma/schema.prisma`
3. Prova con path esplicito: `npx prisma db push --schema=/app/prisma/schema.prisma`

### Problema: Volumi pieni

**Soluzione:**
```bash
# Pulisci volumi non usati
docker volume prune

# Verifica spazio
df -h
```

---

## 🔄 Aggiornamenti

### Update del codice

1. Push modifiche su GitHub
2. Dokploy fa autodeploy automatico
3. Solo i container modificati vengono ricostruiti
4. I volumi (database) **NON** vengono toccati

### Update dello schema database

1. Modifica `prisma/schema.prisma`
2. Push su GitHub
3. Dopo deploy, esegui migrazioni manualmente:
   ```bash
   docker-compose exec app npx prisma db push --schema=./prisma/schema.prisma
   ```

---

## 🎯 Best Practices

1. **Backup regolari** del database (mysqldump)
2. **Monitoring attivo** via Dokploy dashboard
3. **Logs retention** configurato
4. **Secrets sicuri** nelle env vars (non nel codice)
5. **Staging environment** per testare prima di produzione
6. **Rollback plan** pronto (tag GitHub o backup)

---

## 🔐 Sicurezza

- ✅ Tutti i servizi comunicano su rete interna Docker
- ✅ Solo l'app è esposta su porta 3000
- ✅ MySQL e Redis non sono accessibili dall'esterno
- ✅ HTTPS configurato con Let's Encrypt
- ✅ Password in env vars, non nel codice

---

## 📝 Note

- I volumi sono persistenti: i dati sopravvivono ai restart
- Le modifiche al codice richiedono rebuild: Dokploy lo fa automaticamente
- Le modifiche allo schema DB richiedono migrazioni manuali
- Il worker scala automaticamente con il carico (se configurato)

---

## 🆘 Supporto

Se hai problemi:
1. Controlla i logs in Dokploy
2. Verifica le env vars
3. Controlla che tutti i servizi siano "healthy"
4. Consulta la documentazione Dokploy: https://docs.dokploy.com

---

## 🎉 Setup Completo!

Una volta completati tutti gli step, hai:
- ✅ Database MySQL persistente
- ✅ Redis per job queue
- ✅ App Next.js con HTTPS
- ✅ Worker per scraping background
- ✅ Tutto in un unico stack gestibile
- ✅ Autodeploy su push GitHub

**L'applicazione è pronta per la produzione!** 🚀

