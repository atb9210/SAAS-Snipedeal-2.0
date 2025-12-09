-- init.sql - Inizializzazione database MySQL
-- Timestamp: 2024-12-09

-- Assicurati che il database esista
CREATE DATABASE IF NOT EXISTS snipedeal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usa il database
USE snipedeal;

-- Grant privilegi all'utente
GRANT ALL PRIVILEGES ON snipedeal.* TO 'snipedeal'@'%';
FLUSH PRIVILEGES;


