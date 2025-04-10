import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
  console.log("Initializing database...");
  
  // Push schema to database
  try {
    await db.insert(schema.users).values({
      username: "admin",
      password: "admin123.cbd29512c1e547597319975439e9dc9b385485ec5363983669c8f26369e7b7dd82dc6e2a9b3b5be5c2da98c0a1cd0d8b6267fe6b02d9a0c99415ac7e81c71e7e.6c45ab07f03c53ad6b9a38db3f0d1509",
      role: "admin",
      name: "Administrator",
      email: "admin@healthtrack.com",
      createdAt: new Date()
    }).onConflictDoNothing().execute();
    
    await db.insert(schema.users).values({
      username: "doctor",
      password: "doctor123.cbd29512c1e547597319975439e9dc9b385485ec5363983669c8f26369e7b7dd82dc6e2a9b3b5be5c2da98c0a1cd0d8b6267fe6b02d9a0c99415ac7e81c71e7e.6c45ab07f03c53ad6b9a38db3f0d1509",
      role: "doctor",
      name: "Dr. Mario Rossi",
      email: "doctor@healthtrack.com",
      createdAt: new Date()
    }).onConflictDoNothing().execute();
    
    await db.insert(schema.users).values({
      username: "patient",
      password: "patient123.cbd29512c1e547597319975439e9dc9b385485ec5363983669c8f26369e7b7dd82dc6e2a9b3b5be5c2da98c0a1cd0d8b6267fe6b02d9a0c99415ac7e81c71e7e.6c45ab07f03c53ad6b9a38db3f0d1509",
      role: "user",
      name: "Giovanni Paziente",
      email: "patient@healthtrack.com",
      createdAt: new Date()
    }).onConflictDoNothing().execute();
    
    // Get the patient user ID
    const [patientUser] = await db.select().from(schema.users).where(schema.users.username === "patient");
    const [doctorUser] = await db.select().from(schema.users).where(schema.users.username === "doctor");
    
    if (patientUser && doctorUser) {
      // Create patient record
      await db.insert(schema.patients).values({
        userId: patientUser.id,
        doctorId: doctorUser.id,
        notes: "Diabete Tipo 2, Ipertensione"
      }).onConflictDoNothing().execute();
      
      // Create measurements
      const now = new Date();
      
      // Create glucose measurement
      const [glucoseMeasurement] = await db.insert(schema.measurements).values({
        userId: patientUser.id,
        type: "glucose",
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        notes: "A digiuno"
      }).returning();
      
      if (glucoseMeasurement) {
        await db.insert(schema.glucoseMeasurements).values({
          measurementId: glucoseMeasurement.id,
          value: 120
        });
      }
      
      // Create blood pressure measurement
      const [bpMeasurement] = await db.insert(schema.measurements).values({
        userId: patientUser.id,
        type: "blood_pressure",
        timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
        notes: "Post caffè"
      }).returning();
      
      if (bpMeasurement) {
        await db.insert(schema.bloodPressureMeasurements).values({
          measurementId: bpMeasurement.id,
          systolic: 130,
          diastolic: 85,
          heartRate: 75
        });
      }
      
      // Create weight measurement
      const [weightMeasurement] = await db.insert(schema.measurements).values({
        userId: patientUser.id,
        type: "weight",
        timestamp: new Date(now.getTime() - 72 * 60 * 60 * 1000), // 3 days ago
        notes: "Prima della colazione"
      }).returning();
      
      if (weightMeasurement) {
        await db.insert(schema.weightMeasurements).values({
          measurementId: weightMeasurement.id,
          value: 78500 // 78.5 kg in grams
        });
      }
    }
    
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    await pool.end();
  }
}

main();