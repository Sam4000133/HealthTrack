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
  console.log("Seeding test data...");
  
  // Clear existing data
  await db.delete(glucoseMeasurements);
  await db.delete(bloodPressureMeasurements);
  await db.delete(weightMeasurements);
  await db.delete(measurements);
  await db.delete(patients);
  await db.delete(users);
  
  console.log("Existing data cleared...");
  
  // Create users with different roles
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
  
  // Create doctor users
  const doctor1 = await db.insert(users).values({
    username: "doctor1",
    password: await hashPassword("doctor123"),
    name: "Dr. Mario Rossi",
    role: "doctor",
    email: "dr.rossi@example.com",
    createdAt: new Date(),
    twoFactorSecret: null,
    twoFactorEnabled: false
  }).returning();
  
  const doctor2 = await db.insert(users).values({
    username: "doctor2",
    password: await hashPassword("doctor123"),
    name: "Dr. Laura Bianchi",
    role: "doctor",
    email: "dr.bianchi@example.com",
    createdAt: new Date(),
    twoFactorSecret: null,
    twoFactorEnabled: false
  }).returning();
  
  // Create patient users
  const patient1 = await db.insert(users).values({
    username: "patient1",
    password: await hashPassword("patient123"),
    name: "Giuseppe Verdi",
    role: "user",
    email: "giuseppe@example.com",
    createdAt: new Date(),
    twoFactorSecret: null,
    twoFactorEnabled: false
  }).returning();
  
  const patient2 = await db.insert(users).values({
    username: "patient2",
    password: await hashPassword("patient123"),
    name: "Anna Neri",
    role: "user",
    email: "anna@example.com",
    createdAt: new Date(),
    twoFactorSecret: null,
    twoFactorEnabled: false
  }).returning();
  
  const patient3 = await db.insert(users).values({
    username: "patient3",
    password: await hashPassword("patient123"),
    name: "Marco Bruni",
    role: "user",
    email: "marco@example.com",
    createdAt: new Date(),
    twoFactorSecret: null,
    twoFactorEnabled: false
  }).returning();
  
  console.log("Users created...");
  
  // Register patients
  const patientRecord1 = await db.insert(patients).values({
    userId: patient1[0].id,
    doctorId: doctor1[0].id,
    notes: "Paziente con diabete di tipo 2"
  }).returning();
  
  const patientRecord2 = await db.insert(patients).values({
    userId: patient2[0].id,
    doctorId: doctor1[0].id,
    notes: "Paziente con ipertensione"
  }).returning();
  
  const patientRecord3 = await db.insert(patients).values({
    userId: patient3[0].id,
    doctorId: doctor2[0].id,
    notes: "Paziente con problemi di peso"
  }).returning();
  
  // Also register admin as a patient for testing
  const adminPatient = await db.insert(patients).values({
    userId: adminUser[0].id,
    doctorId: doctor2[0].id,
    notes: "Paziente per test di sistema"
  }).returning();
  
  console.log("Patients registered...");
  
  // Create measurement data for the last 7 days (including today)
  const patientIds = [
    adminUser[0].id,
    patient1[0].id,
    patient2[0].id,
    patient3[0].id
  ];
  
  // Random data generation functions
  const getRandomGlucose = (baseValue: number) => {
    // Random value around baseValue ±20
    return Math.round(baseValue + (Math.random() * 40 - 20));
  };
  
  const getRandomWeight = (baseValue: number) => {
    // Random value around baseValue ±2kg, in grams
    return Math.round((baseValue + (Math.random() * 4 - 2)) * 1000);
  };
  
  const getRandomBloodPressure = (baseSystolic: number, baseDiastolic: number) => {
    // Random values around base ±10
    return {
      systolic: Math.round(baseSystolic + (Math.random() * 20 - 10)),
      diastolic: Math.round(baseDiastolic + (Math.random() * 20 - 10)),
      heartRate: Math.round(70 + (Math.random() * 20 - 10))
    };
  };
  
  // Base values for each patient
  const patientBaseValues = {
    [adminUser[0].id]: { glucose: 110, weight: 75, systolic: 120, diastolic: 80 },
    [patient1[0].id]: { glucose: 140, weight: 80, systolic: 130, diastolic: 85 },
    [patient2[0].id]: { glucose: 100, weight: 65, systolic: 150, diastolic: 95 },
    [patient3[0].id]: { glucose: 105, weight: 90, systolic: 125, diastolic: 82 }
  };
  
  // Generate measurements for each day
  for (let i = 0; i < 7; i++) {
    const date = subDays(startOfDay(new Date()), i);
    
    // For each patient
    for (const patientId of patientIds) {
      const baseValues = patientBaseValues[patientId];
      
      // Morning measurement
      const morningTime = addHours(date, 8 + Math.floor(Math.random() * 2)); // Between 8-10am
      
      // Glucose measurement
      const glucoseValue = getRandomGlucose(baseValues.glucose);
      const glucoseMeasurement = await db.insert(measurements).values({
        userId: patientId,
        type: "glucose",
        timestamp: morningTime,
        notes: "Misurazione mattutina"
      }).returning();
      
      await db.insert(glucoseMeasurements).values({
        measurementId: glucoseMeasurement[0].id,
        value: glucoseValue,
        beforeMeal: true,
        medication: true,
        activity: "Riposo"
      });
      
      // Blood pressure measurement
      const bpValue = getRandomBloodPressure(baseValues.systolic, baseValues.diastolic);
      const bpMeasurement = await db.insert(measurements).values({
        userId: patientId,
        type: "blood_pressure",
        timestamp: addHours(morningTime, 0.5), // 30 minutes after glucose
        notes: "Misurazione mattutina"
      }).returning();
      
      await db.insert(bloodPressureMeasurements).values({
        measurementId: bpMeasurement[0].id,
        systolic: bpValue.systolic,
        diastolic: bpValue.diastolic,
        heartRate: bpValue.heartRate,
        position: "Seduto",
        arm: "Sinistro"
      });
      
      // Evening measurement (only glucose and blood pressure)
      if (Math.random() > 0.3) { // 70% chance to have evening measurement
        const eveningTime = addHours(date, 18 + Math.floor(Math.random() * 3)); // Between 6-9pm
        
        // Evening glucose
        const eveningGlucoseValue = getRandomGlucose(baseValues.glucose + 10); // Slightly higher in evening
        const eveningGlucoseMeasurement = await db.insert(measurements).values({
          userId: patientId,
          type: "glucose",
          timestamp: eveningTime,
          notes: "Misurazione serale"
        }).returning();
        
        await db.insert(glucoseMeasurements).values({
          measurementId: eveningGlucoseMeasurement[0].id,
          value: eveningGlucoseValue,
          beforeMeal: false,
          medication: true,
          activity: "Leggera attività"
        });
        
        // Evening blood pressure
        const eveningBpValue = getRandomBloodPressure(baseValues.systolic + 5, baseValues.diastolic + 3);
        const eveningBpMeasurement = await db.insert(measurements).values({
          userId: patientId,
          type: "blood_pressure",
          timestamp: addHours(eveningTime, 0.5),
          notes: "Misurazione serale"
        }).returning();
        
        await db.insert(bloodPressureMeasurements).values({
          measurementId: eveningBpMeasurement[0].id,
          systolic: eveningBpValue.systolic,
          diastolic: eveningBpValue.diastolic,
          heartRate: eveningBpValue.heartRate + 5, // Higher in evening
          position: "Seduto",
          arm: "Destro"
        });
      }
      
      // Weight (only measured once per day, and not every day)
      if (i % 2 === 0 || i === 0) { // Every other day and today
        const weightTime = addHours(date, 7 + Math.floor(Math.random() * 2)); // Early morning 7-9am
        const weightValue = getRandomWeight(baseValues.weight);
        
        const weightMeasurement = await db.insert(measurements).values({
          userId: patientId,
          type: "weight",
          timestamp: weightTime,
          notes: "Peso del giorno"
        }).returning();
        
        await db.insert(weightMeasurements).values({
          measurementId: weightMeasurement[0].id,
          weight: weightValue,
          bodyFat: Math.round(20 + Math.random() * 10),
          bodyWater: Math.round(50 + Math.random() * 10),
          muscleMass: Math.round(weightValue * 0.4),
          clothesOn: false
        });
      }
    }
  }
  
  // Add older data from 2 weeks ago (for comparison)
  for (let i = 7; i < 14; i++) {
    const date = subDays(startOfDay(new Date()), i);
    
    // For each patient
    for (const patientId of patientIds) {
      const baseValues = patientBaseValues[patientId];
      
      // Older pattern - slightly different values for the trend
      const olderBaseValues = {
        glucose: baseValues.glucose * (Math.random() > 0.5 ? 1.05 : 0.95), // 5% higher or lower
        weight: baseValues.weight * (Math.random() > 0.5 ? 1.02 : 0.98), // 2% higher or lower
        systolic: baseValues.systolic * (Math.random() > 0.5 ? 1.03 : 0.97), // 3% higher or lower
        diastolic: baseValues.diastolic * (Math.random() > 0.5 ? 1.03 : 0.97) // 3% higher or lower
      };
      
      // Morning measurement
      const morningTime = addHours(date, 8 + Math.floor(Math.random() * 2));
      
      // Glucose measurement
      const glucoseValue = getRandomGlucose(olderBaseValues.glucose);
      const glucoseMeasurement = await db.insert(measurements).values({
        userId: patientId,
        type: "glucose",
        timestamp: morningTime,
        notes: "Misurazione mattutina"
      }).returning();
      
      await db.insert(glucoseMeasurements).values({
        measurementId: glucoseMeasurement[0].id,
        value: glucoseValue,
        beforeMeal: true,
        medication: true,
        activity: "Riposo"
      });
      
      // Blood pressure measurement
      const bpValue = getRandomBloodPressure(olderBaseValues.systolic, olderBaseValues.diastolic);
      const bpMeasurement = await db.insert(measurements).values({
        userId: patientId,
        type: "blood_pressure",
        timestamp: addHours(morningTime, 0.5),
        notes: "Misurazione mattutina"
      }).returning();
      
      await db.insert(bloodPressureMeasurements).values({
        measurementId: bpMeasurement[0].id,
        systolic: bpValue.systolic,
        diastolic: bpValue.diastolic,
        heartRate: bpValue.heartRate,
        position: "Seduto",
        arm: "Sinistro"
      });
      
      // Weight (only measured once per day, and not every day)
      if (i % 2 === 0) { // Every other day
        const weightTime = addHours(date, 7 + Math.floor(Math.random() * 2));
        const weightValue = getRandomWeight(olderBaseValues.weight);
        
        const weightMeasurement = await db.insert(measurements).values({
          userId: patientId,
          type: "weight",
          timestamp: weightTime,
          notes: "Peso del giorno"
        }).returning();
        
        await db.insert(weightMeasurements).values({
          measurementId: weightMeasurement[0].id,
          weight: weightValue,
          bodyFat: Math.round(20 + Math.random() * 10),
          bodyWater: Math.round(50 + Math.random() * 10),
          muscleMass: Math.round(weightValue * 0.4),
          clothesOn: false
        });
      }
    }
  }
  
  console.log("Test data created successfully!");
  
  // Summary of added data
  const userCount = (await db.select({ count: db.fn.count() }).from(users))[0].count;
  const patientCount = (await db.select({ count: db.fn.count() }).from(patients))[0].count;
  const measurementCount = (await db.select({ count: db.fn.count() }).from(measurements))[0].count;
  const glucoseCount = (await db.select({ count: db.fn.count() }).from(glucoseMeasurements))[0].count;
  const bpCount = (await db.select({ count: db.fn.count() }).from(bloodPressureMeasurements))[0].count;
  const weightCount = (await db.select({ count: db.fn.count() }).from(weightMeasurements))[0].count;
  
  console.log(`Created:
  - ${userCount} users (1 admin, 2 doctors, 3 patients)
  - ${patientCount} patient records
  - ${measurementCount} measurements total
  - ${glucoseCount} glucose measurements
  - ${bpCount} blood pressure measurements
  - ${weightCount} weight measurements`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding data:", error);
    process.exit(1);
  });