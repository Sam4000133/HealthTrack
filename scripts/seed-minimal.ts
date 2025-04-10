import { db } from "../server/db";
import { 
  users, 
  patients, 
  measurements, 
  glucoseMeasurements, 
  weightMeasurements, 
  bloodPressureMeasurements 
} from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { subDays, startOfDay, addHours } from "date-fns";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log("Seeding minimal test data...");
  
  // Clear existing data
  await db.delete(glucoseMeasurements);
  await db.delete(bloodPressureMeasurements);
  await db.delete(weightMeasurements);
  await db.delete(measurements);
  await db.delete(patients);
  await db.delete(users);
  
  console.log("Existing data cleared...");
  
  // Create admin user (for testing)
  const adminUser = await db.insert(users).values({
    username: "admin",
    password: await hashPassword("admin123"),
    name: "Admin User",
    role: "admin",
    email: "admin@example.com",
    createdAt: new Date(),
    twoFactorSecret: null,
    twoFactorEnabled: false
  }).returning();
  
  // Create one doctor
  const doctor = await db.insert(users).values({
    username: "doctor1",
    password: await hashPassword("doctor123"),
    name: "Dr. Mario Rossi",
    role: "doctor",
    email: "dr.rossi@example.com",
    createdAt: new Date(),
    twoFactorSecret: null,
    twoFactorEnabled: false
  }).returning();
  
  // Create one patient
  const patient = await db.insert(users).values({
    username: "patient1",
    password: await hashPassword("patient123"),
    name: "Giuseppe Verdi",
    role: "user",
    email: "giuseppe@example.com",
    createdAt: new Date(),
    twoFactorSecret: null,
    twoFactorEnabled: false
  }).returning();
  
  console.log("Users created...");
  
  // Register patient
  const patientRecord = await db.insert(patients).values({
    userId: patient[0].id,
    doctorId: doctor[0].id,
    notes: "Paziente con diabete di tipo 2"
  }).returning();
  
  // Also register admin as a patient for testing
  const adminPatient = await db.insert(patients).values({
    userId: adminUser[0].id,
    doctorId: doctor[0].id,
    notes: "Paziente per test di sistema"
  }).returning();
  
  console.log("Patients registered...");
  
  // Create minimal data for the last 2 days
  const days = [0, 1]; // Today and yesterday
  const patientIds = [adminUser[0].id, patient[0].id];
  
  // Base values
  const patientBaseValues = {
    [adminUser[0].id]: { glucose: 110, weight: 75, systolic: 120, diastolic: 80 },
    [patient[0].id]: { glucose: 140, weight: 80, systolic: 130, diastolic: 85 }
  };
  
  // Generate measurements for today and yesterday
  for (const dayOffset of days) {
    const date = subDays(startOfDay(new Date()), dayOffset);
    
    // For each patient
    for (const patientId of patientIds) {
      const baseValues = patientBaseValues[patientId];
      const morningTime = addHours(date, 9); // 9am
      
      // Glucose measurement
      const glucoseValue = Math.round(baseValues.glucose + (Math.random() * 20 - 10));
      const glucoseMeasurement = await db.insert(measurements).values({
        userId: patientId,
        type: "glucose",
        timestamp: morningTime,
        notes: "Misurazione mattutina"
      }).returning();
      
      await db.insert(glucoseMeasurements).values({
        measurementId: glucoseMeasurement[0].id,
        value: glucoseValue
      });
      
      // Blood pressure measurement
      const bpMeasurement = await db.insert(measurements).values({
        userId: patientId,
        type: "blood_pressure",
        timestamp: addHours(morningTime, 0.5), // 30 minutes after glucose
        notes: "Misurazione mattutina"
      }).returning();
      
      await db.insert(bloodPressureMeasurements).values({
        measurementId: bpMeasurement[0].id,
        systolic: Math.round(baseValues.systolic + (Math.random() * 10 - 5)),
        diastolic: Math.round(baseValues.diastolic + (Math.random() * 10 - 5)),
        heartRate: Math.round(70 + (Math.random() * 10 - 5))
      });
      
      // Weight measurement
      const weightMeasurement = await db.insert(measurements).values({
        userId: patientId,
        type: "weight",
        timestamp: addHours(date, 7), // Early morning 7am
        notes: "Peso del giorno"
      }).returning();
      
      await db.insert(weightMeasurements).values({
        measurementId: weightMeasurement[0].id,
        value: Math.round(baseValues.weight * 1000 + (Math.random() * 1000 - 500))
      });
    }
  }
  
  // Add minimal data from last week for comparison
  for (const patientId of patientIds) {
    const baseValues = patientBaseValues[patientId];
    const date = subDays(startOfDay(new Date()), 7); // 7 days ago
    const morningTime = addHours(date, 9); // 9am
    
    // Glucose measurement
    const glucoseValue = Math.round(baseValues.glucose * 1.05); // 5% higher
    const glucoseMeasurement = await db.insert(measurements).values({
      userId: patientId,
      type: "glucose",
      timestamp: morningTime,
      notes: "Misurazione mattutina"
    }).returning();
    
    await db.insert(glucoseMeasurements).values({
      measurementId: glucoseMeasurement[0].id,
      value: glucoseValue
    });
    
    // Blood pressure measurement
    const bpMeasurement = await db.insert(measurements).values({
      userId: patientId,
      type: "blood_pressure",
      timestamp: addHours(morningTime, 0.5), // 30 minutes after glucose
      notes: "Misurazione mattutina"
    }).returning();
    
    await db.insert(bloodPressureMeasurements).values({
      measurementId: bpMeasurement[0].id,
      systolic: Math.round(baseValues.systolic * 1.03), // 3% higher
      diastolic: Math.round(baseValues.diastolic * 1.03), // 3% higher
      heartRate: 75
    });
    
    // Weight measurement
    const weightMeasurement = await db.insert(measurements).values({
      userId: patientId,
      type: "weight",
      timestamp: addHours(date, 7), // Early morning 7am
      notes: "Peso del giorno"
    }).returning();
    
    await db.insert(weightMeasurements).values({
      measurementId: weightMeasurement[0].id,
      value: Math.round(baseValues.weight * 1000 * 1.02) // 2% higher
    });
  }
  
  console.log("Test data created successfully!");
  console.log("Database populated with test data.");
  console.log("You can now login with:")
  console.log("- admin / admin123 (role: admin)");
  console.log("- doctor1 / doctor123 (role: doctor)");
  console.log("- patient1 / patient123 (role: user)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding data:", error);
    process.exit(1);
  });