import { 
  User, InsertUser, MeasurementType, 
  Measurement, InsertMeasurement,
  GlucoseMeasurement, InsertGlucoseMeasurement,
  BloodPressureMeasurement, InsertBloodPressureMeasurement,
  WeightMeasurement, InsertWeightMeasurement,
  Patient, InsertPatient,
  MeasurementWithDetails,
  CreateGlucoseMeasurement,
  CreateBloodPressureMeasurement,
  CreateWeightMeasurement,
  users, patients, measurements, glucoseMeasurements, bloodPressureMeasurements, weightMeasurements
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Patient operations
  async getPatient(id: number): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.id, id));
    return result[0];
  }

  async getPatientByUserId(userId: number): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.userId, userId));
    return result[0];
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const result = await db.insert(patients).values(patient).returning();
    return result[0];
  }

  async updatePatient(id: number, patientData: Partial<Patient>): Promise<Patient | undefined> {
    const result = await db
      .update(patients)
      .set(patientData)
      .where(eq(patients.id, id))
      .returning();
    return result[0];
  }

  async getPatientsForDoctor(doctorId: number): Promise<(Patient & { user: User })[]> {
    const patientsWithDoctors = await db.select({
      patient: patients,
      user: users
    })
    .from(patients)
    .innerJoin(users, eq(patients.userId, users.id))
    .where(eq(patients.doctorId, doctorId));
    
    return patientsWithDoctors.map(p => ({
      ...p.patient,
      user: p.user
    }));
  }

  async assignDoctor(patientId: number, doctorId: number): Promise<Patient | undefined> {
    const result = await db
      .update(patients)
      .set({ doctorId })
      .where(eq(patients.id, patientId))
      .returning();
    return result[0];
  }

  // Measurement operations
  async createMeasurement(measurement: InsertMeasurement): Promise<Measurement> {
    const result = await db.insert(measurements).values(measurement).returning();
    return result[0];
  }

  async getMeasurement(id: number): Promise<Measurement | undefined> {
    const result = await db.select().from(measurements).where(eq(measurements.id, id));
    return result[0];
  }

  async getMeasurementsByUser(userId: number, type?: MeasurementType): Promise<Measurement[]> {
    if (type) {
      return await db.select()
        .from(measurements)
        .where(and(
          eq(measurements.userId, userId),
          eq(measurements.type, type)
        ))
        .orderBy(desc(measurements.timestamp));
    } else {
      return await db.select()
        .from(measurements)
        .where(eq(measurements.userId, userId))
        .orderBy(desc(measurements.timestamp));
    }
  }

  async getMeasurementWithDetails(id: number): Promise<MeasurementWithDetails | undefined> {
    const measurement = await this.getMeasurement(id);
    if (!measurement) return undefined;
    
    return this.enrichMeasurementWithDetails(measurement);
  }

  async getMeasurementsWithDetailsByUser(
    userId: number, 
    type?: MeasurementType,
    limit?: number
  ): Promise<MeasurementWithDetails[]> {
    let query;
    
    if (type) {
      query = db.select()
        .from(measurements)
        .where(and(
          eq(measurements.userId, userId),
          eq(measurements.type, type)
        ))
        .orderBy(desc(measurements.timestamp));
    } else {
      query = db.select()
        .from(measurements)
        .where(eq(measurements.userId, userId))
        .orderBy(desc(measurements.timestamp));
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const measurementsList = await query;
    
    return Promise.all(
      measurementsList.map(m => this.enrichMeasurementWithDetails(m))
    );
  }

  // Helper method to enrich measurement with type-specific details
  private async enrichMeasurementWithDetails(measurement: Measurement): Promise<MeasurementWithDetails> {
    const result: MeasurementWithDetails = { ...measurement };
    
    // Get user
    const user = await this.getUser(measurement.userId);
    if (user) {
      result.user = user;
    }
    
    // Get type-specific measurement details
    switch (measurement.type) {
      case 'glucose': {
        const [glucose] = await db
          .select()
          .from(glucoseMeasurements)
          .where(eq(glucoseMeasurements.measurementId, measurement.id));
        if (glucose) result.glucose = glucose;
        break;
      }
      case 'blood_pressure': {
        const [bp] = await db
          .select()
          .from(bloodPressureMeasurements)
          .where(eq(bloodPressureMeasurements.measurementId, measurement.id));
        if (bp) result.bloodPressure = bp;
        break;
      }
      case 'weight': {
        const [weight] = await db
          .select()
          .from(weightMeasurements)
          .where(eq(weightMeasurements.measurementId, measurement.id));
        if (weight) result.weight = weight;
        break;
      }
    }
    
    return result;
  }

  // Specific measurement operations
  async createGlucoseMeasurement(data: CreateGlucoseMeasurement): Promise<MeasurementWithDetails> {
    // Create base measurement record
    const measurement = await this.createMeasurement({
      userId: data.userId,
      type: 'glucose',
      timestamp: data.timestamp || new Date(),
      notes: data.notes || null,
    });
    
    // Create glucose-specific record
    const [glucoseMeasurement] = await db
      .insert(glucoseMeasurements)
      .values({
        measurementId: measurement.id,
        value: data.value,
      })
      .returning();
    
    // Return combined record
    return {
      ...measurement,
      glucose: glucoseMeasurement,
    };
  }

  async createBloodPressureMeasurement(data: CreateBloodPressureMeasurement): Promise<MeasurementWithDetails> {
    // Create base measurement record
    const measurement = await this.createMeasurement({
      userId: data.userId,
      type: 'blood_pressure',
      timestamp: data.timestamp || new Date(),
      notes: data.notes || null,
    });
    
    // Create blood pressure-specific record
    const [bpMeasurement] = await db
      .insert(bloodPressureMeasurements)
      .values({
        measurementId: measurement.id,
        systolic: data.systolic,
        diastolic: data.diastolic,
        heartRate: data.heartRate || null,
      })
      .returning();
    
    // Return combined record
    return {
      ...measurement,
      bloodPressure: bpMeasurement,
    };
  }

  async createWeightMeasurement(data: CreateWeightMeasurement): Promise<MeasurementWithDetails> {
    // Create base measurement record
    const measurement = await this.createMeasurement({
      userId: data.userId,
      type: 'weight',
      timestamp: data.timestamp || new Date(),
      notes: data.notes || null,
    });
    
    // Create weight-specific record
    const [weightMeasurement] = await db
      .insert(weightMeasurements)
      .values({
        measurementId: measurement.id,
        value: data.value,
      })
      .returning();
    
    // Return combined record
    return {
      ...measurement,
      weight: weightMeasurement,
    };
  }

  // Statistics operations
  async getRecentMeasurementsByType(
    userId: number, 
    type: MeasurementType, 
    days: number = 7
  ): Promise<MeasurementWithDetails[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentMeasurements = await db
      .select()
      .from(measurements)
      .where(and(
        eq(measurements.userId, userId),
        eq(measurements.type, type),
        sql`${measurements.timestamp} >= ${cutoffDate}`
      ))
      .orderBy(desc(measurements.timestamp));
    
    return Promise.all(
      recentMeasurements.map(m => this.enrichMeasurementWithDetails(m))
    );
  }

  async getLatestMeasurementsByType(
    userId: number
  ): Promise<Record<MeasurementType, MeasurementWithDetails | undefined>> {
    const result: Record<MeasurementType, MeasurementWithDetails | undefined> = {
      glucose: undefined,
      blood_pressure: undefined,
      weight: undefined
    };
    
    const types: MeasurementType[] = ['glucose', 'blood_pressure', 'weight'];
    
    await Promise.all(types.map(async type => {
      const [measurement] = await db
        .select()
        .from(measurements)
        .where(and(
          eq(measurements.userId, userId),
          eq(measurements.type, type)
        ))
        .orderBy(desc(measurements.timestamp))
        .limit(1);
      
      if (measurement) {
        result[type] = await this.enrichMeasurementWithDetails(measurement);
      }
    }));
    
    return result;
  }
}