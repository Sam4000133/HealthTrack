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
import { eq, sql, and } from "drizzle-orm";
import { addDays, addHours, format, startOfDay } from "date-fns";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log("Seeding 30 days of test data starting from today...");
  
  // Clear existing measurements
  await db.delete(glucoseMeasurements);
  await db.delete(bloodPressureMeasurements);
  await db.delete(weightMeasurements);
  await db.delete(measurements);
  
  // Clear existing patients and non-admin users
  await db.delete(patients);
  await db.delete(users).where(eq(users.role, "doctor"));
  await db.delete(users).where(eq(users.role, "user"));
  
  // Create admin user if not exists
  const existingAdmin = await db.select().from(users).where(eq(users.role, "admin"));
  let adminUser;
  
  if (existingAdmin.length === 0) {
    const [admin] = await db.insert(users).values({
      username: "admin",
      password: await hashPassword("admin123"),
      name: "Admin",
      role: "admin",
      email: "admin@example.com",
      createdAt: new Date(),
      twoFactorSecret: null,
      twoFactorEnabled: false
    }).returning();
    adminUser = admin;
  } else {
    adminUser = existingAdmin[0];
  }
  
  // Create doctor users
  const doctorNames = ["Mario Rossi", "Laura Bianchi", "Andrea Verdi"];
  const doctors = [];
  
  for (let i = 0; i < doctorNames.length; i++) {
    const [doctor] = await db.insert(users).values({
      username: `doctor${i+1}`,
      password: await hashPassword("doctor123"),
      name: `Dr. ${doctorNames[i]}`,
      role: "doctor",
      email: `doctor${i+1}@example.com`,
      createdAt: new Date(),
      twoFactorSecret: null,
      twoFactorEnabled: false
    }).returning();
    doctors.push(doctor);
  }
  
  // Create patient users
  const patientData = [
    { name: "Giuseppe Verdi", condition: "Diabete tipo 2", values: { glucose: 140, weight: 80000, systolic: 130, diastolic: 85 } },
    { name: "Anna Neri", condition: "Ipertensione", values: { glucose: 100, weight: 65000, systolic: 150, diastolic: 95 } },
    { name: "Marco Bruni", condition: "Sovrappeso", values: { glucose: 105, weight: 90000, systolic: 125, diastolic: 82 } },
    { name: "Lucia Ricci", condition: "Ipotensione", values: { glucose: 95, weight: 55000, systolic: 100, diastolic: 65 } },
    { name: "Paolo Belli", condition: "Diabete tipo 1", values: { glucose: 160, weight: 70000, systolic: 120, diastolic: 80 } },
    { name: "Claudia Marini", condition: "Monitoraggio peso", values: { glucose: 100, weight: 85000, systolic: 118, diastolic: 78 } }
  ];
  
  const patientUsers = [];
  
  for (let i = 0; i < patientData.length; i++) {
    const [patient] = await db.insert(users).values({
      username: `patient${i+1}`,
      password: await hashPassword("patient123"),
      name: patientData[i].name,
      role: "user",
      email: `patient${i+1}@example.com`,
      createdAt: new Date(),
      twoFactorSecret: null,
      twoFactorEnabled: false
    }).returning();
    patientUsers.push(patient);
    
    // Assign to doctor (distributing evenly)
    const doctorIndex = i % doctors.length;
    await db.insert(patients).values({
      userId: patient.id,
      doctorId: doctors[doctorIndex].id,
      notes: patientData[i].condition
    });
  }
  
  // Register admin as a patient too for testing
  await db.insert(patients).values({
    userId: adminUser.id,
    doctorId: doctors[0].id,
    notes: "Paziente per test di sistema"
  });
  
  console.log(`Created ${doctors.length} doctors and ${patientUsers.length} patients`);
  
  // Trends for each patient (different patterns)
  const trends = ["improving", "worsening", "stable", "fluctuating", "improving", "worsening", "fluctuating"];
  
  // Create measurement data for current date and 30 days back
  // Hardcode April 10, 2025 as "today" as requested
  const today = new Date(2025, 3, 10); // April 10, 2025 (month is 0-indexed)
  const start = startOfDay(today);
  const allPatients = [...patientUsers, adminUser];
  
  console.log(`Generating 30 days of data for ${allPatients.length} patients starting from ${format(today, 'dd/MM/yyyy')}...`);
  
  // Create bulk data generation to make it faster
  const measurementsToInsert = [];
  const glucoseMeasurementsToInsert = [];
  const bpMeasurementsToInsert = [];
  const weightMeasurementsToInsert = [];
  
  // Generate every day to ensure we have continuous data
  for (let day = -29; day <= 0; day++) {
    const currentDate = addDays(start, day);
    
    for (let p = 0; p < allPatients.length; p++) {
      const patient = allPatients[p];
      const baseValues = patientData[p % patientData.length].values;
      const trend = trends[p % trends.length];
      
      // Calculate trend effect (day 0 is today, day -29 is 30 days ago)
      const trendFactor = day / -29; // 0 to 1 (0 = today, 1 = oldest)
      
      let trendMultiplier = 1;
      switch (trend) {
        case "improving":
          // Starts 10% worse and improves to baseline
          trendMultiplier = 1 + (0.1 * trendFactor);
          break;
        case "worsening":
          // Starts at baseline and gets 15% worse
          trendMultiplier = 1 + (0.15 * (1 - trendFactor));
          break;
        case "fluctuating":
          // Sine wave pattern
          trendMultiplier = 1 + (Math.sin(day * 0.5) * 0.08);
          break;
        case "stable":
        default:
          // Random small variations
          trendMultiplier = 1 + (Math.random() * 0.04 - 0.02);
          break;
      }
      
      // Just one measurement per day to reduce data volume
      const time = addHours(currentDate, 8 + Math.floor(Math.random() * 4)); // Morning 8am-12pm
      
      // Add some time-of-day effect
      const hourEffect = 1 + ((time.getHours() - 12) * 0.005);
      
      // Always create all measurement types
      // Generate glucose measurement
      const glucoseValue = Math.round(baseValues.glucose * trendMultiplier * hourEffect);
      const glucoseRandomVariation = Math.round(glucoseValue * (Math.random() * 0.1 - 0.05));
      const finalGlucoseValue = glucoseValue + glucoseRandomVariation;
      
      const timeOfDay = time.getHours() < 11 ? "mattina" : "pomeriggio";
      const activities = ["A digiuno", "Dopo pasto", "Prima di pasto", "Controllo"];
      const activity = activities[Math.floor(Math.random() * activities.length)];
      
      const glucoseNotes = `${activity} ${timeOfDay} - ${format(time, 'dd/MM/yyyy')}`;
      
      // Create blood pressure values
      const systolicValue = Math.round(baseValues.systolic * trendMultiplier);
      const diastolicValue = Math.round(baseValues.diastolic * trendMultiplier);
      
      // Add some random variation
      const systolicVariation = Math.round(systolicValue * (Math.random() * 0.06 - 0.03));
      const diastolicVariation = Math.round(diastolicValue * (Math.random() * 0.06 - 0.03));
      const finalSystolic = systolicValue + systolicVariation;
      const finalDiastolic = diastolicValue + diastolicVariation;
      
      // Heart rate varies more
      const heartRate = Math.round(70 + (Math.random() * 20));
      
      const bpActivities = ["Riposo", "Dopo attività", "Controllo", "Seduta"];
      const bpActivity = bpActivities[Math.floor(Math.random() * bpActivities.length)];
      const bpNotes = `${bpActivity} - ${format(time, 'dd/MM/yyyy')}`;
      
      // Create weight value
      const weightValue = Math.round(baseValues.weight * trendMultiplier);
      // Very small daily variations in weight
      const weightVariation = Math.round(weightValue * (Math.random() * 0.01 - 0.005));
      const finalWeightValue = weightValue + weightVariation;
      
      const weightNotes = `Peso ${format(time, 'dd/MM/yyyy')}`;
      
      // Add to arrays for bulk insert later
      // For glucose
      const glucoseMeasurement = {
        userId: patient.id,
        type: "glucose",
        timestamp: time,
        notes: glucoseNotes
      };
      measurementsToInsert.push(glucoseMeasurement);
      
      // For blood pressure (add a bit later)
      const bpTime = new Date(time.getTime() + 30 * 60000); // 30 minutes later
      const bpMeasurement = {
        userId: patient.id,
        type: "blood_pressure",
        timestamp: bpTime,
        notes: bpNotes
      };
      measurementsToInsert.push(bpMeasurement);
      
      // For weight (add a bit earlier)
      const weightTime = new Date(time.getTime() - 30 * 60000); // 30 minutes earlier
      const weightMeasurement = {
        userId: patient.id,
        type: "weight",
        timestamp: weightTime,
        notes: weightNotes
      };
      measurementsToInsert.push(weightMeasurement);
    }
    
    // Progress indicator
    if ((day + 29) % 9 === 0 || day === 0) {
      console.log(`Generated data for day ${day + 30} of 30...`);
    }
  }
  
  // Bulk insert the measurements
  console.log(`Inserting ${measurementsToInsert.length} measurements...`);
  
  // Insert in chunks to avoid memory issues
  const chunkSize = 50;
  for (let i = 0; i < measurementsToInsert.length; i += chunkSize) {
    const chunk = measurementsToInsert.slice(i, i + chunkSize);
    const insertedMeasurements = await db.insert(measurements).values(chunk).returning();
    
    // Create the detailed measurements with realistic values based on patient profile and date
    const measurementDetailMap = new Map();
    
    // Prepare patient data map for quick lookup
    const patientDataMap = new Map();
    allPatients.forEach((patient, index) => {
      patientDataMap.set(patient.id, {
        baseValues: patientData[index % patientData.length].values,
        trend: trends[index % trends.length]
      });
    });
    
    // First, prepare glucose measurement details
    for (const measurement of insertedMeasurements) {
      const measurementDate = measurement.timestamp;
      const day = Math.floor((measurementDate.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      const patientInfo = patientDataMap.get(measurement.userId);
      
      if (!patientInfo) continue;
      
      const baseValues = patientInfo.baseValues;
      const trend = patientInfo.trend;
      
      // Calculate trend effect
      const trendFactor = day / -29; // 0 to 1 (0 = today, 1 = oldest)
      
      let trendMultiplier = 1;
      switch (trend) {
        case "improving":
          trendMultiplier = 1 + (0.1 * trendFactor);
          break;
        case "worsening":
          trendMultiplier = 1 + (0.15 * (1 - trendFactor));
          break;
        case "fluctuating":
          trendMultiplier = 1 + (Math.sin(day * 0.5) * 0.08);
          break;
        case "stable":
        default:
          trendMultiplier = 1 + (Math.random() * 0.04 - 0.02);
          break;
      }
      
      // Time of day effect
      const hourEffect = 1 + ((measurementDate.getHours() - 12) * 0.005);
      
      if (measurement.type === "glucose") {
        const glucoseValue = Math.round(baseValues.glucose * trendMultiplier * hourEffect);
        const glucoseRandomVariation = Math.round(glucoseValue * (Math.random() * 0.1 - 0.05));
        const finalGlucoseValue = glucoseValue + glucoseRandomVariation;
        
        await db.insert(glucoseMeasurements).values({
          measurementId: measurement.id,
          value: finalGlucoseValue // Realistic glucose value based on patient profile
        });
      } else if (measurement.type === "blood_pressure") {
        const systolicValue = Math.round(baseValues.systolic * trendMultiplier);
        const diastolicValue = Math.round(baseValues.diastolic * trendMultiplier);
        
        // Add some random variation
        const systolicVariation = Math.round(systolicValue * (Math.random() * 0.06 - 0.03));
        const diastolicVariation = Math.round(diastolicValue * (Math.random() * 0.06 - 0.03));
        const finalSystolic = systolicValue + systolicVariation;
        const finalDiastolic = diastolicValue + diastolicVariation;
        
        // Heart rate varies more
        const heartRate = Math.round(72 + (Math.random() * 20 - 10));
        
        await db.insert(bloodPressureMeasurements).values({
          measurementId: measurement.id,
          systolic: finalSystolic,
          diastolic: finalDiastolic,
          heartRate: heartRate
        });
      } else if (measurement.type === "weight") {
        const weightValue = Math.round(baseValues.weight * trendMultiplier);
        const weightVariation = Math.round(weightValue * (Math.random() * 0.01 - 0.005));
        const finalWeightValue = weightValue + weightVariation;
        
        await db.insert(weightMeasurements).values({
          measurementId: measurement.id,
          value: finalWeightValue // Weight in grams
        });
      }
    }
    
    console.log(`Inserted ${i + chunk.length} of ${measurementsToInsert.length} measurements...`);
  }
  
  console.log("Test data creation completed successfully!");
  console.log(`
Data Summary:
- Created/maintained admin user (admin/admin123)
- Created 3 doctors (doctor1, doctor2, doctor3 - all password: doctor123)
- Created 6 patients (patient1-patient6 - all password: patient123)
- Generated 30 days of health measurements with varying patterns
- Different patients have different health trends

You can now log in with any of the created accounts to see the data.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding data:", error);
    process.exit(1);
  });