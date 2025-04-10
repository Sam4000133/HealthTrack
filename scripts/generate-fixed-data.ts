import { db } from "../server/db";
import { 
  measurements, 
  glucoseMeasurements, 
  bloodPressureMeasurements, 
  weightMeasurements 
} from "../shared/schema";

/**
 * Questo script genera dati di test per 14 giorni (7 giorni recenti e 7 giorni precedenti)
 * con date corrette dal 10/04/2025 (oggi) a ritroso.
 */
async function main() {
  try {
    console.log("Eliminazione dati esistenti...");
    await db.delete(glucoseMeasurements);
    await db.delete(bloodPressureMeasurements);
    await db.delete(weightMeasurements);
    await db.delete(measurements);
    
    console.log("Creazione dati per 14 giorni...");
    const userId = 22; // Admin user
    const baseDate = new Date(2025, 3, 10); // 10 aprile 2025
    
    // Crea dati per i 7 giorni recenti (0 a -6 giorni)
    for (let day = 0; day > -7; day--) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + day);
      
      console.log(`Periodo recente - Giorno ${Math.abs(day)} - ${date.toISOString().split('T')[0]}`);
      
      // Crea dati glicemia (trend in miglioramento)
      const glucoseValue = 110 + (day * 2) + Math.floor(Math.random() * 10) - 5;
      const [glucoseMeasurement] = await db.insert(measurements).values({
        userId,
        type: 'glucose',
        timestamp: date,
        notes: `Misurazione del ${date.toISOString().split('T')[0]}`
      }).returning();
      
      await db.insert(glucoseMeasurements).values({
        measurementId: glucoseMeasurement.id,
        value: glucoseValue
      });
      
      // Crea dati pressione (trend in miglioramento)
      const systolic = 120 + Math.floor(day * 1) + Math.floor(Math.random() * 8) - 4;
      const diastolic = 80 + Math.floor(day * 0.5) + Math.floor(Math.random() * 4) - 2;
      const heartRate = 70 + Math.floor(Math.random() * 10) - 5;
      
      const [bpMeasurement] = await db.insert(measurements).values({
        userId,
        type: 'blood_pressure',
        timestamp: date,
        notes: `Misurazione del ${date.toISOString().split('T')[0]}`
      }).returning();
      
      await db.insert(bloodPressureMeasurements).values({
        measurementId: bpMeasurement.id,
        systolic,
        diastolic,
        heartRate
      });
      
      // Crea dati peso (trend in miglioramento)
      const weight = 70000 + (day * 150) + Math.floor(Math.random() * 500) - 250;
      
      const [weightMeasurement] = await db.insert(measurements).values({
        userId,
        type: 'weight',
        timestamp: date,
        notes: `Misurazione del ${date.toISOString().split('T')[0]}`
      }).returning();
      
      await db.insert(weightMeasurements).values({
        measurementId: weightMeasurement.id,
        value: weight
      });
    }
    
    // Crea dati per periodo precedente (7-14 giorni fa)
    for (let day = -7; day > -14; day--) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + day);
      
      console.log(`Periodo precedente - Giorno ${Math.abs(day)} - ${date.toISOString().split('T')[0]}`);
      
      // Glicemia (valori più alti nel periodo precedente)
      const glucoseValue = 120 + (day * 2) + Math.floor(Math.random() * 10) - 5;
      const [glucoseMeasurement] = await db.insert(measurements).values({
        userId,
        type: 'glucose',
        timestamp: date,
        notes: `Misurazione del ${date.toISOString().split('T')[0]}`
      }).returning();
      
      await db.insert(glucoseMeasurements).values({
        measurementId: glucoseMeasurement.id,
        value: glucoseValue
      });
      
      // Pressione (valori più alti nel periodo precedente)
      const systolic = 130 + Math.floor(day * 1) + Math.floor(Math.random() * 8) - 4;
      const diastolic = 85 + Math.floor(day * 0.5) + Math.floor(Math.random() * 4) - 2;
      const heartRate = 75 + Math.floor(Math.random() * 10) - 5;
      
      const [bpMeasurement] = await db.insert(measurements).values({
        userId,
        type: 'blood_pressure',
        timestamp: date,
        notes: `Misurazione del ${date.toISOString().split('T')[0]}`
      }).returning();
      
      await db.insert(bloodPressureMeasurements).values({
        measurementId: bpMeasurement.id,
        systolic,
        diastolic,
        heartRate
      });
      
      // Peso (valori più alti nel periodo precedente)
      const weight = 72000 + (day * 150) + Math.floor(Math.random() * 500) - 250;
      
      const [weightMeasurement] = await db.insert(measurements).values({
        userId,
        type: 'weight',
        timestamp: date,
        notes: `Misurazione del ${date.toISOString().split('T')[0]}`
      }).returning();
      
      await db.insert(weightMeasurements).values({
        measurementId: weightMeasurement.id,
        value: weight
      });
    }
    
    console.log("Creazione dati completata!");
  } catch (error) {
    console.error("Errore durante la creazione dei dati:", error);
    process.exit(1);
  }
}

main();