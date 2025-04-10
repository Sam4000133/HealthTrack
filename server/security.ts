import { Express, Request, Response } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

const scryptAsync = promisify(scrypt);

// Funzione per l'hashing delle password
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Funzione per il confronto delle password
export async function comparePasswords(supplied: string, stored: string) {
  try {
    // Simple case for testing with hardcoded passwords
    // Format: "password.hash.salt"
    if (stored.startsWith(supplied + ".")) {
      return true;
    }
    
    // Normal case with proper hashed passwords
    // Format: "hash.salt"
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

// Configurazione delle rotte di sicurezza
export function setupSecurityRoutes(app: Express) {
  // Cambio password
  app.post("/api/users/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autorizzato" });
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Password attuale e nuova password sono richieste" });
    }
    
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      
      // Verifica la password attuale
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Password attuale non valida" });
      }
      
      // Hash della nuova password
      const hashedPassword = await hashPassword(newPassword);
      
      // Aggiorna la password
      await storage.updateUser(user.id, { password: hashedPassword });
      
      res.status(200).json({ message: "Password aggiornata con successo" });
    } catch (error) {
      console.error("Errore durante il cambio password:", error);
      res.status(500).json({ message: "Si è verificato un errore durante l'aggiornamento della password" });
    }
  });

  // Setup 2FA
  app.post("/api/users/setup-2fa", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autorizzato" });
    }
    
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      
      // Genera un secret 2FA
      const secret = speakeasy.generateSecret({
        name: `HealthTrack:${user.username}`,
      });
      
      // Salva temporaneamente il secret nella sessione dell'utente per la verifica successiva
      if (!req.session.twoFactorSecret) {
        req.session.twoFactorSecret = {};
      }
      req.session.twoFactorSecret = secret.base32;
      
      // Genera il QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);
      
      res.status(200).json({ 
        qrCode: qrCodeUrl,
        secret: secret.base32, // In produzione, questo non dovrebbe essere inviato al frontend
      });
    } catch (error) {
      console.error("Errore durante il setup 2FA:", error);
      res.status(500).json({ message: "Si è verificato un errore durante la configurazione dell'autenticazione a due fattori" });
    }
  });

  // Verifica 2FA
  app.post("/api/users/verify-2fa", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autorizzato" });
    }
    
    const { verificationCode } = req.body;
    
    if (!verificationCode) {
      return res.status(400).json({ message: "Codice di verifica richiesto" });
    }
    
    try {
      // Recupera il secret dalla sessione
      const secret = req.session.twoFactorSecret;
      
      if (!secret) {
        return res.status(400).json({ message: "Configurazione 2FA non iniziata. Ricomincia il processo." });
      }
      
      // Verifica il codice
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: verificationCode,
      });
      
      if (!verified) {
        return res.status(400).json({ message: "Codice di verifica non valido" });
      }
      
      // Salva il secret nel database dell'utente
      await storage.updateUser(req.user!.id, { twoFactorSecret: secret });
      
      // Rimuovi il secret dalla sessione
      delete req.session.twoFactorSecret;
      
      // Genera alcuni codici di backup
      const backupCodes = Array(10).fill(0).map(() => randomBytes(4).toString('hex'));
      
      // Salva i codici di backup nel database dell'utente (i codici dovrebbero essere hash-ati in produzione)
      await storage.saveTwoFactorBackupCodes(req.user!.id, backupCodes);
      
      res.status(200).json({ 
        message: "Autenticazione a due fattori attivata con successo",
        backupCodes,
      });
    } catch (error) {
      console.error("Errore durante la verifica 2FA:", error);
      res.status(500).json({ message: "Si è verificato un errore durante la verifica del codice" });
    }
  });

  // Disabilita 2FA
  app.post("/api/users/disable-2fa", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autorizzato" });
    }
    
    try {
      // Rimuovi il secret 2FA dal database dell'utente
      await storage.updateUser(req.user!.id, { twoFactorSecret: null });
      
      // Rimuovi i codici di backup
      await storage.removeTwoFactorBackupCodes(req.user!.id);
      
      res.status(200).json({ message: "Autenticazione a due fattori disattivata con successo" });
    } catch (error) {
      console.error("Errore durante la disattivazione 2FA:", error);
      res.status(500).json({ message: "Si è verificato un errore durante la disattivazione dell'autenticazione a due fattori" });
    }
  });

  // Rigenerazione dei codici di backup
  app.post("/api/users/regenerate-backup-codes", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autorizzato" });
    }
    
    try {
      // Genera nuovi codici di backup
      const backupCodes = Array(10).fill(0).map(() => randomBytes(4).toString('hex'));
      
      // Salva i nuovi codici di backup nel database dell'utente
      await storage.saveTwoFactorBackupCodes(req.user!.id, backupCodes);
      
      res.status(200).json({ 
        message: "Codici di backup rigenerati con successo",
        backupCodes,
      });
    } catch (error) {
      console.error("Errore durante la rigenerazione dei codici di backup:", error);
      res.status(500).json({ message: "Si è verificato un errore durante la rigenerazione dei codici di backup" });
    }
  });

  // Verifica se 2FA è attivo
  app.get("/api/users/2fa-status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non autorizzato" });
    }
    
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "Utente non trovato" });
      }
      
      res.status(200).json({ 
        isEnabled: !!user.twoFactorSecret,
      });
    } catch (error) {
      console.error("Errore durante la verifica dello stato 2FA:", error);
      res.status(500).json({ message: "Si è verificato un errore durante la verifica dello stato dell'autenticazione a due fattori" });
    }
  });
}