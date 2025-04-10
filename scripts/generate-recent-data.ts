import { db } from "../server/db";
import { 
  users, 
  patients, 
  measurements, 
  glucoseMeasurements, 
  weightMeasurements, 
  bloodPressureMeasurements 
} from "../shared/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { addDays, addHours, startOfToday, format, subHours } from "date-fns";

/**
 * Questo script genera dati di test per il 10 aprile 2025 (oggi) e i 29 giorni precedenti.
 * A differenza degli altri script, questo NON cancella i dati esistenti ma aggiunge solo nuovi dati.
 */
async function main() {
  console.log("Generazione dati recenti per i parametri vitali...");
  
  // Verifica gli utenti esistenti
  const allUsers = await db.select().from(users);
  
  if (allUsers.length === 0) {
    console.error("Errore: nessun utente trovato nel database. Esegui prima lo script seed-minimal.ts");
    process.exit(1);
  }
  
  // Seleziona solo pazienti e admin
  const patientUsers = await db.select()
    .from(users)
    .where(sql`${users.role} IN ('user', 'admin')`);
  
  console.log(`Trovati ${patientUsers.length} pazienti nel database`);
  
  if (patientUsers.length === 0) {
    console.error("Errore: nessun paziente trovato");
    process.exit(1);
  }

  // Definisci valori di base per ciascun paziente
  const patientBaseValues: Record<number, { 
    glucose: number, 
    weight: number, 
    systolic: number, 
    diastolic: number,
    trend: 'stable' | 'improving' | 'worsening' | 'fluctuating'
  }> = {};
  
  const trends = ['stable', 'improving', 'worsening', 'fluctuating'];
  
  // Assegna valori di base specifici per ciascun paziente
  patientUsers.forEach((patient, index) => {
    // Varia i valori di base tra i pazienti
    const baseGlucose = 110 + (index * 10);
    const baseWeight = 70000 + (index * 5000);
    const baseSystolic = 120 + (index * 5);
    const baseDiastolic = 80 + (index * 2);
    const trend = trends[index % trends.length] as 'stable' | 'improving' | 'worsening' | 'fluctuating';
    
    patientBaseValues[patient.id] = {
      glucose: baseGlucose,
      weight: baseWeight,
      systolic: baseSystolic,
      diastolic: baseDiastolic,
      trend
    };
  });
  
  // Fissiamo il 10 aprile 2025 come "oggi"
  const today = new Date(2025, 3, 10); // (mese è 0-based, quindi 3 = aprile)
  
  console.log(`Data corrente fissata al: ${format(today, 'dd/MM/yyyy')}`);
  console.log("Generazione dati per un periodo di 30 giorni (oggi più 29 giorni precedenti)...");
  
  // Misura il tempo totale di esecuzione
  const startTime = Date.now();
  
  // Genera dati per i 30 giorni (oggi + 29 giorni precedenti)
  for (let dayOffset = 0; dayOffset >= -29; dayOffset--) {
    const currentDate = addDays(today, dayOffset);
    const formattedDate = format(currentDate, 'dd/MM/yyyy');
    
    console.log(`Generazione dati per: ${formattedDate} (giorno ${Math.abs(dayOffset) + 1} di 30)`);
    
    for (const patient of patientUsers) {
      const baseValues = patientBaseValues[patient.id];
      
      if (!baseValues) {
        console.warn(`Valori base non trovati per il paziente ${patient.id}, viene saltato`);
        continue;
      }
      
      // Calcola l'effetto del trend (normalizzato da 0 a 1, dove 0 = oggi e 1 = giorno più vecchio)
      const trendProgress = Math.abs(dayOffset) / 29;
      
      // Calcola il moltiplicatore del trend
      let trendMultiplier = 1;
      switch (baseValues.trend) {
        case 'improving':
          // Migliora nel tempo (era peggiore nel passato)
          trendMultiplier = 1 + (0.15 * trendProgress);
          break;
        case 'worsening':
          // Peggiora nel tempo (era migliore nel passato)
          trendMultiplier = 1 - (0.1 * trendProgress);
          break;
        case 'fluctuating':
          // Varia seguendo un pattern sinusoidale
          trendMultiplier = 1 + (Math.sin(dayOffset * 0.5) * 0.08);
          break;
        case 'stable':
        default:
          // Piccole variazioni casuali intorno alla baseline
          trendMultiplier = 1 + (Math.random() * 0.04 - 0.02);
          break;
      }
      
      // Genera 1-3 misurazioni per giorno
      const measurementCount = Math.floor(Math.random() * 3) + 1;
      
      for (let m = 0; m < measurementCount; m++) {
        // Genera orari per mattina, metà giornata e sera
        let timeHour;
        if (m === 0) {
          timeHour = 7 + Math.floor(Math.random() * 3); // 7-10am
        } else if (m === 1) {
          timeHour = 12 + Math.floor(Math.random() * 3); // 12-3pm
        } else {
          timeHour = 18 + Math.floor(Math.random() * 3); // 6-9pm
        }
        
        // Crea timestamp con data corrente e orario generato
        const timestamp = addHours(currentDate, timeHour);
        
        // Effetto dell'ora del giorno (valori di glucosio più alti dopo i pasti, ecc.)
        const hourEffect = 1 + ((Math.abs(timeHour - 12)) * 0.01);
        
        // Genera misurazione glicemia
        const glucoseBase = baseValues.glucose * trendMultiplier;
        const glucoseValue = Math.round(glucoseBase * hourEffect + (Math.random() * 10 - 5));
        const glucoseActivity = timeHour < 11 ? "A digiuno" : (timeHour < 15 ? "Dopo pranzo" : "Prima di cena");
        
        const glucoseMeasurement = await db.insert(measurements)
          .values({
            userId: patient.id,
            type: "glucose",
            timestamp: new Date(timestamp),
            notes: `${glucoseActivity} - ${format(timestamp, 'dd/MM/yyyy HH:mm')}`
          })
          .returning();
        
        await db.insert(glucoseMeasurements)
          .values({
            measurementId: glucoseMeasurement[0].id,
            value: glucoseValue
          });
        
        // Genera misurazione pressione sanguigna (se non è una misurazione serale)
        if (timeHour < 19) {
          const systolicBase = baseValues.systolic * trendMultiplier;
          const diastolicBase = baseValues.diastolic * trendMultiplier;
          
          const systolicValue = Math.round(systolicBase + (Math.random() * 6 - 3));
          const diastolicValue = Math.round(diastolicBase + (Math.random() * 4 - 2));
          const heartRateValue = Math.round(75 + (Math.random() * 10 - 5));
          
          const bpActivity = timeHour < 11 ? "Mattina" : "Pomeriggio";
          
          const bpMeasurement = await db.insert(measurements)
            .values({
              userId: patient.id,
              type: "blood_pressure",
              timestamp: new Date(subHours(timestamp, 1)), // Misurazione un'ora prima
              notes: `${bpActivity} - ${format(subHours(timestamp, 1), 'dd/MM/yyyy HH:mm')}`
            })
            .returning();
            
          await db.insert(bloodPressureMeasurements)
            .values({
              measurementId: bpMeasurement[0].id,
              systolic: systolicValue,
              diastolic: diastolicValue,
              heartRate: heartRateValue
            });
        }
        
        // Genera misurazione peso (solo una volta al giorno, preferibilmente mattina)
        if (m === 0 && timeHour < 11) {
          const weightBase = baseValues.weight * trendMultiplier;
          const weightValue = Math.round(weightBase + (Math.random() * 300 - 150)); // ±150g variazione
          
          const weightMeasurement = await db.insert(measurements)
            .values({
              userId: patient.id,
              type: "weight",
              timestamp: new Date(addHours(timestamp, 1)), // Misurazione un'ora dopo
              notes: `Peso mattina - ${format(addHours(timestamp, 1), 'dd/MM/yyyy HH:mm')}`
            })
            .returning();
            
          await db.insert(weightMeasurements)
            .values({
              measurementId: weightMeasurement[0].id,
              value: weightValue
            });
        }
      }
    }
  }
  
  // Calcola tempo totale di esecuzione
  const endTime = Date.now();
  const executionTime = (endTime - startTime) / 1000;
  
  console.log(`\nGenerazione dati completata in ${executionTime.toFixed(2)} secondi!`);
  console.log(`
Riepilogo:
- Generati dati per 30 giorni a partire dal 10/04/2025
- Per ${patientUsers.length} pazienti
- Ogni paziente ha 1-3 misurazioni al giorno per tipo
- Sono stati applicati trend personalizzati per ogni paziente

Le misurazioni dovrebbero ora apparire nei grafici e nelle statistiche.
`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Errore durante la generazione dei dati:", error);
    process.exit(1);
  });