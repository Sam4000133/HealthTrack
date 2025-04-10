import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupSecurityRoutes } from "./security";
import {
  MeasurementType,
  createGlucoseMeasurementSchema,
  createBloodPressureMeasurementSchema,
  createWeightMeasurementSchema,
  insertUserSchema
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middleware
  const { isAdmin, isDoctor, isAuthenticated } = setupAuth(app);

  // User routes
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send password in response
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Errore durante il recupero degli utenti" });
    }
  });

  app.post("/api/users", isAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      // Don't send password in response
      const { password, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Dati utente non validi", errors: error.format() });
      }
      res.status(500).json({ message: "Errore durante la creazione dell'utente" });
    }
  });

  // Patient routes
  app.get("/api/patients/doctor/:doctorId", isDoctor, async (req, res) => {
    try {
      const doctorId = parseInt(req.params.doctorId);
      const patients = await storage.getPatientsForDoctor(doctorId);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Errore durante il recupero dei pazienti" });
    }
  });

  app.put("/api/patients/:patientId/doctor/:doctorId", isAdmin, async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const doctorId = parseInt(req.params.doctorId);
      const patient = await storage.assignDoctor(patientId, doctorId);
      if (!patient) {
        return res.status(404).json({ message: "Paziente non trovato" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Errore durante l'assegnazione del medico" });
    }
  });

  // Measurement routes - common
  app.get("/api/measurements/latest", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : req.user!.id;
      
      // Check permissions - users can only access their own data
      if (req.user!.role === 'user' && req.user!.id !== userId) {
        return res.status(403).json({ message: "Non autorizzato ad accedere ai dati di altri utenti" });
      }
      
      const latestMeasurements = await storage.getLatestMeasurementsByType(userId);
      res.json(latestMeasurements);
    } catch (error) {
      res.status(500).json({ message: "Errore durante il recupero delle misurazioni recenti" });
    }
  });

  app.get("/api/measurements", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : req.user!.id;
      const type = req.query.type as MeasurementType | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      // Check permissions - users can only access their own data
      if (req.user!.role === 'user' && req.user!.id !== userId) {
        return res.status(403).json({ message: "Non autorizzato ad accedere ai dati di altri utenti" });
      }
      
      const measurements = await storage.getMeasurementsWithDetailsByUser(userId, type, limit);
      res.json(measurements);
    } catch (error) {
      res.status(500).json({ message: "Errore durante il recupero delle misurazioni" });
    }
  });

  app.get("/api/measurements/stats/:type/:days", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : req.user!.id;
      const type = req.params.type as MeasurementType;
      const days = parseInt(req.params.days);
      
      // Check permissions - users can only access their own data
      if (req.user!.role === 'user' && req.user!.id !== userId) {
        return res.status(403).json({ message: "Non autorizzato ad accedere ai dati di altri utenti" });
      }
      
      const measurements = await storage.getRecentMeasurementsByType(userId, type, days);
      res.json(measurements);
    } catch (error) {
      res.status(500).json({ message: "Errore durante il recupero delle statistiche" });
    }
  });

  // Glucose measurement routes
  app.post("/api/measurements/glucose", isAuthenticated, async (req, res) => {
    try {
      const userId = req.body.userId || req.user!.id;
      
      // Check permissions - users can only add their own data
      if (req.user!.role === 'user' && req.user!.id !== userId) {
        return res.status(403).json({ message: "Non autorizzato ad aggiungere dati per altri utenti" });
      }
      
      const data = createGlucoseMeasurementSchema.parse({
        ...req.body,
        userId
      });
      
      const measurement = await storage.createGlucoseMeasurement(data);
      res.status(201).json(measurement);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.format() });
      }
      res.status(500).json({ message: "Errore durante il salvataggio della misurazione" });
    }
  });

  // Blood pressure measurement routes
  app.post("/api/measurements/blood-pressure", isAuthenticated, async (req, res) => {
    try {
      const userId = req.body.userId || req.user!.id;
      
      // Check permissions - users can only add their own data
      if (req.user!.role === 'user' && req.user!.id !== userId) {
        return res.status(403).json({ message: "Non autorizzato ad aggiungere dati per altri utenti" });
      }
      
      const data = createBloodPressureMeasurementSchema.parse({
        ...req.body,
        userId
      });
      
      const measurement = await storage.createBloodPressureMeasurement(data);
      res.status(201).json(measurement);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.format() });
      }
      res.status(500).json({ message: "Errore durante il salvataggio della misurazione" });
    }
  });

  // Weight measurement routes
  app.post("/api/measurements/weight", isAuthenticated, async (req, res) => {
    try {
      const userId = req.body.userId || req.user!.id;
      
      // Check permissions - users can only add their own data
      if (req.user!.role === 'user' && req.user!.id !== userId) {
        return res.status(403).json({ message: "Non autorizzato ad aggiungere dati per altri utenti" });
      }
      
      const data = createWeightMeasurementSchema.parse({
        ...req.body,
        userId
      });
      
      const measurement = await storage.createWeightMeasurement(data);
      res.status(201).json(measurement);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.format() });
      }
      res.status(500).json({ message: "Errore durante il salvataggio della misurazione" });
    }
  });

  // Export measurements as CSV
  app.get("/api/export/measurements", isAuthenticated, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : req.user!.id;
      const type = req.query.type as MeasurementType | undefined;
      
      // Check permissions - users can only export their own data
      if (req.user!.role === 'user' && req.user!.id !== userId) {
        return res.status(403).json({ message: "Non autorizzato ad esportare i dati di altri utenti" });
      }
      
      const measurements = await storage.getMeasurementsWithDetailsByUser(userId, type);
      
      // Convert to CSV
      let csv = "Data,Tipo,Valore,Note\n";
      
      measurements.forEach(m => {
        const date = m.timestamp.toLocaleString();
        let value = "";
        
        if (m.type === 'glucose' && m.glucose) {
          value = `${m.glucose.value} mg/dL`;
        } else if (m.type === 'blood_pressure' && m.bloodPressure) {
          const bp = m.bloodPressure;
          value = `${bp.systolic}/${bp.diastolic} mmHg`;
          if (bp.heartRate) {
            value += `, ${bp.heartRate} BPM`;
          }
        } else if (m.type === 'weight' && m.weight) {
          value = `${(m.weight.value / 1000).toFixed(1)} kg`;
        }
        
        csv += `"${date}","${m.type}","${value}","${m.notes}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=measurements.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: "Errore durante l'esportazione dei dati" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
