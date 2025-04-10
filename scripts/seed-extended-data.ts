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
import { subDays, startOfDay, addHours, format } from "date-fns";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log("Seeding 30 days of test data starting from today...");
  
  // Clear existing measurements and users except admin
  await db.delete(glucoseMeasurements);
  await db.delete(bloodPressureMeasurements);
  await db.delete(weightMeasurements);
  await db.delete(measurements);
  
  // Delete patient records for non-admin users
  const adminIds = db.select({ id: users.id })
                     .from(users)
                     .where(users => users.role.equals("admin"));
  
  await db.delete(patients).where(patients => {
    return patients.userId.notInArray(adminIds);
  });
  
  // Delete non-admin users
  await db.delete(users).where(users => users.role.notEquals("admin"));
  
  console.log("Existing data cleared except admin users...");
  
  // Fetch existing admin user
  const adminUser = await db.select().from(users).where(users => users.role.equals("admin"));
  
  // Create doctor users (3 doctors)
  const doctors = [];
  for (let i = 1; i <= 3; i++) {
    const doctor = await db.insert(users).values({
      username: `doctor${i}`,
      password: await hashPassword("doctor123"),
      name: [`Dr. Mario Rossi`, `Dr. Laura Bianchi`, `Dr. Andrea Verdi`][i-1],
      role: "doctor",
      email: `doctor${i}@example.com`,
      createdAt: new Date(),
      twoFactorSecret: null,
      twoFactorEnabled: false
    }).returning();
    doctors.push(doctor[0]);
  }
  
  // Create patient users (6 patients with varying conditions)
  const patientUsers = [];
  const patientNames = [
    "Giuseppe Verdi", "Anna Neri", "Marco Bruni", 
    "Lucia Ricci", "Paolo Belli", "Claudia Marini"
  ];
  const patientConditions = [
    "Diabete tipo 2", "Ipertensione", "Sovrappeso",
    "Ipotensione", "Diabete tipo 1", "Monitoraggio peso"
  ];
  
  for (let i = 1; i <= 6; i++) {
    const patient = await db.insert(users).values({
      username: `patient${i}`,
      password: await hashPassword("patient123"),
      name: patientNames[i-1],
      role: "user",
      email: `patient${i}@example.com`,
      createdAt: new Date(),
      twoFactorSecret: null,
      twoFactorEnabled: false
    }).returning();
    patients.push(patient[0]);
  }
  
  console.log("Created 3 doctors and 6 patients");
  
  // Register patients with doctors
  for (let i = 0; i < patients.length; i++) {
    // Assign patients to doctors (2 patients per doctor)
    const doctorIndex = Math.floor(i / 2);
    
    await db.insert(patients).values({
      userId: patients[i].id,
      doctorId: doctors[doctorIndex].id,
      notes: patientConditions[i]
    });
  }
  
  // Also register admin as a patient for testing if admin exists
  if (adminUser.length > 0) {
    // Check if admin patient record already exists
    const adminPatient = await db.select().from(patients).where(patients => 
      patients.userId.equals(adminUser[0].id)
    );
    
    if (adminPatient.length === 0) {
      await db.insert(patients).values({
        userId: adminUser[0].id,
        doctorId: doctors[0].id,
        notes: "Paziente per test di sistema"
      });
    }
  }
  
  console.log("Patients registered with doctors");
  
  // Create measurement data for the last 30 days
  const allPatients = [...patients];
  if (adminUser.length > 0) {
    allPatients.push(adminUser[0]);
  }
  
  // Base values for each patient - different for each patient to make the data more interesting
  const patientBaseValues: Record<number, { 
    glucose: number, 
    weight: number, 
    systolic: number, 
    diastolic: number,
    trend: 'stable' | 'improving' | 'worsening' | 'fluctuating'
  }> = {};
  
  // Assign base values and trends to patients
  allPatients.forEach((patient, index) => {
    const trends = ['stable', 'improving', 'worsening', 'fluctuating'];
    const trend = trends[index % trends.length] as 'stable' | 'improving' | 'worsening' | 'fluctuating';
    
    // Different base values for different conditions
    const baseValues = {
      // Patient1 (diabetes type 2)
      0: { glucose: 140, weight: 80000, systolic: 130, diastolic: 85 },
      // Patient2 (hypertension)
      1: { glucose: 100, weight: 65000, systolic: 150, diastolic: 95 },
      // Patient3 (overweight)
      2: { glucose: 105, weight: 90000, systolic: 125, diastolic: 82 },
      // Patient4 (hypotension)
      3: { glucose: 95, weight: 55000, systolic: 100, diastolic: 65 },
      // Patient5 (diabetes type 1)
      4: { glucose: 160, weight: 70000, systolic: 120, diastolic: 80 },
      // Patient6 (weight monitoring)
      5: { glucose: 100, weight: 85000, systolic: 118, diastolic: 78 },
      // Admin or extras
      6: { glucose: 110, weight: 75000, systolic: 120, diastolic: 80 },
      7: { glucose: 120, weight: 72000, systolic: 125, diastolic: 82 }
    };
    
    patientBaseValues[patient.id] = {
      ...baseValues[index % 8],
      trend
    };
  });
  
  // Functions to generate values based on trend over time
  function getTrendMultiplier(day: number, totalDays: number, trend: string) {
    const progress = day / totalDays;
    
    switch(trend) {
      case 'improving':
        // Values improve (decrease) by up to 10% over time
        return 1 - (progress * 0.1);
      case 'worsening':
        // Values worsen (increase) by up to 15% over time
        return 1 + (progress * 0.15);
      case 'fluctuating':
        // Values fluctuate in a sine wave pattern
        return 1 + (Math.sin(day * 0.5) * 0.08);
      case 'stable':
      default:
        // Values stay relatively constant with small random variation
        return 1 + (Math.random() * 0.04 - 0.02);
    }
  }
  
  function getRandomVariation(baseValue: number, variationPercent: number) {
    // Add daily random variation
    const variation = baseValue * (Math.random() * variationPercent - variationPercent/2);
    return Math.round(baseValue + variation);
  }
  
  // Generate consistent data based on date hash for activities
  function getActivityForDate(patientId: number, date: Date, type: string): string {
    const activities = {
      glucose: [
        "A digiuno", "Dopo colazione", "Prima di pranzo", "Dopo pranzo", 
        "Prima di cena", "Dopo cena", "Prima di dormire"
      ],
      blood_pressure: [
        "Riposo", "Dopo attività fisica", "Mattina", "Sera", 
        "Dopo stress", "Dopo farmaci", "Seduta"
      ],
      weight: [
        "A digiuno mattina", "Dopo allenamento", "Sera", "Prima di dormire",
        "Controllo settimanale", "Dopo dieta", "Normale"
      ]
    };
    
    // Create a hash of the date and patient for consistent random selection
    const dateHash = date.getDate() + (date.getMonth() * 31) + (patientId * 100);
    const activityList = activities[type as keyof typeof activities] || activities.glucose;
    
    return activityList[dateHash % activityList.length];
  }
  
  // Generate daily messages for notes
  function getNoteForDate(patientId: number, date: Date, type: string, value: number, baseValue: number): string {
    // Calculate percent change from baseline
    const percentChange = ((value - baseValue) / baseValue) * 100;
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Common notes templates
    const notes = {
      glucose: {
        low: [
          `Valore basso ${dateStr}`, 
          `Ho mangiato poco oggi`, 
          `Dopo attività fisica intensa`
        ],
        normal: [
          `Normale ${dateStr}`, 
          `Controllo di routine`, 
          `Stabile dopo pasto`
        ],
        high: [
          `Elevato ${dateStr}`, 
          `Dopo pasto abbondante`, 
          `Stress lavorativo`
        ]
      },
      blood_pressure: {
        low: [
          `Pressione bassa ${dateStr}`, 
          `Sensazione di spossatezza`, 
          `Dopo riposo prolungato`
        ],
        normal: [
          `Pressione normale ${dateStr}`, 
          `Misurazione di routine`, 
          `Stabile dopo assunzione farmaci`
        ],
        high: [
          `Pressione alta ${dateStr}`, 
          `Dopo caffè`, 
          `Periodo di stress`
        ]
      },
      weight: {
        low: [
          `Peso in diminuzione ${dateStr}`, 
          `Dieta in corso`, 
          `Dopo allenamento intenso`
        ],
        normal: [
          `Peso stabile ${dateStr}`, 
          `Controllo di routine`, 
          `Alimentazione equilibrata`
        ],
        high: [
          `Peso in aumento ${dateStr}`, 
          `Periodo festivo`, 
          `Ritenzione idrica`
        ]
      }
    };
    
    // Select category based on percent change
    let category;
    if (percentChange < -5) {
      category = 'low';
    } else if (percentChange > 5) {
      category = 'high';
    } else {
      category = 'normal';
    }
    
    // Get notes for the selected type and category
    const notesList = notes[type as keyof typeof notes]?.[category as keyof typeof notes.glucose] || 
                     notes.glucose.normal;
    
    // Select a note based on hash of date and patient for consistency
    const dateHash = date.getDate() + (date.getMonth() * 31) + (patientId * 100);
    return notesList[dateHash % notesList.length];
  }
  
  // Generate data for each day for each patient
  const totalDays = 30;
  console.log(`Generating data for ${totalDays} days for ${allPatients.length} patients...`);
  
  for (let day = 0; day < totalDays; day++) {
    const date = subDays(startOfDay(new Date()), totalDays - day - 1);
    
    // For each patient
    for (const patient of allPatients) {
      const baseValues = patientBaseValues[patient.id];
      const trendMultiplier = getTrendMultiplier(day, totalDays, baseValues.trend);
      
      // Possible times during the day for measurements
      const times = [
        // Morning
        addHours(date, 7 + Math.floor(Math.random() * 3)), // 7-9am
        // Noon
        addHours(date, 12 + Math.floor(Math.random() * 2)), // 12-1pm
        // Evening
        addHours(date, 18 + Math.floor(Math.random() * 3)), // 6-8pm
      ];
      
      // Measurements won't happen every time for every patient - add some randomness
      // Determine how many measurements we'll take today (1-3)
      const measurementTimes = times.filter(() => Math.random() > 0.2);
      
      // Skip some days randomly for some patients (except for diabetes patients who measure daily)
      const isDiabetic = baseValues.glucose > 120;
      if (!isDiabetic && Math.random() > 0.8 && day % 3 !== 0) {
        continue; // Skip this day for this patient
      }
      
      // For each measurement time
      for (const time of measurementTimes) {
        // Determine which measurements to take at this time
        const takeMeasurements = {
          glucose: isDiabetic || Math.random() > 0.3, // Diabetics measure more often
          blood_pressure: Math.random() > 0.4,
          weight: day % 3 === 0 || Math.random() > 0.7 // Weight measured less frequently
        };
        
        // Adjust base values based on trend for today
        const adjustedBase = {
          glucose: baseValues.glucose * trendMultiplier,
          weight: baseValues.weight * trendMultiplier,
          systolic: baseValues.systolic * trendMultiplier,
          diastolic: baseValues.diastolic * trendMultiplier
        };
        
        // Glucose measurement
        if (takeMeasurements.glucose) {
          // More variation in glucose
          const glucoseValue = getRandomVariation(adjustedBase.glucose, 0.15);
          // Adjust for time of day - higher after meals
          const hourFactor = 1 + (Math.abs(time.getHours() - 12) / 40); // Slightly higher in morning/evening
          const finalGlucoseValue = Math.round(glucoseValue * hourFactor);
          
          const activity = getActivityForDate(patient.id, time, "glucose");
          const notes = getNoteForDate(patient.id, time, "glucose", finalGlucoseValue, baseValues.glucose);
          
          const glucoseMeasurement = await db.insert(measurements).values({
            userId: patient.id,
            type: "glucose",
            timestamp: time,
            notes: notes
          }).returning();
          
          await db.insert(glucoseMeasurements).values({
            measurementId: glucoseMeasurement[0].id,
            value: finalGlucoseValue
          });
        }
        
        // Blood pressure measurement
        if (takeMeasurements.blood_pressure) {
          // Less variation in blood pressure
          const systolicValue = getRandomVariation(adjustedBase.systolic, 0.08);
          // Diastolic correlates somewhat with systolic
          const diastolicValue = getRandomVariation(adjustedBase.diastolic, 0.06);
          // Heart rate varies more
          const heartRate = Math.round(72 + (Math.random() * 20 - 10));
          
          const activity = getActivityForDate(patient.id, time, "blood_pressure");
          const notes = getNoteForDate(patient.id, time, "blood_pressure", systolicValue, baseValues.systolic);
          
          const bpMeasurement = await db.insert(measurements).values({
            userId: patient.id,
            type: "blood_pressure",
            timestamp: time,
            notes: notes
          }).returning();
          
          await db.insert(bloodPressureMeasurements).values({
            measurementId: bpMeasurement[0].id,
            systolic: systolicValue,
            diastolic: diastolicValue,
            heartRate: heartRate
          });
        }
        
        // Weight measurement - typically done in the morning and less frequently
        if (takeMeasurements.weight && time.getHours() < 10) {
          // Very little daily variation in weight
          const weightValue = getRandomVariation(adjustedBase.weight, 0.02);
          
          const activity = getActivityForDate(patient.id, time, "weight");
          const notes = getNoteForDate(patient.id, time, "weight", weightValue, baseValues.weight);
          
          const weightMeasurement = await db.insert(measurements).values({
            userId: patient.id,
            type: "weight",
            timestamp: time,
            notes: notes
          }).returning();
          
          await db.insert(weightMeasurements).values({
            measurementId: weightMeasurement[0].id,
            value: weightValue
          });
        }
      }
    }
    
    // Progress indicator
    if (day % 5 === 0 || day === totalDays - 1) {
      console.log(`Generated data for day ${day + 1} of ${totalDays}...`);
    }
  }
  
  console.log("Test data creation completed successfully!");
  console.log(`
Data Summary:
- Kept existing admin user(s)
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