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
  users, patients, measurements, glucoseMeasurements, bloodPressureMeasurements, weightMeasurements,
  twoFactorBackupCodes
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
  
  async updateGlucoseMeasurement(measurementId: number, data: { value: number, notes?: string | null }): Promise<MeasurementWithDetails> {
    // Update base measurement notes if provided
    if (data.notes !== undefined) {
      await db.update(measurements)
        .set({ notes: data.notes })
        .where(eq(measurements.id, measurementId));
    }
    
    // Update glucose-specific measurement
    await db.update(glucoseMeasurements)
      .set({ value: data.value })
      .where(eq(glucoseMeasurements.measurementId, measurementId));
    
    return this.getMeasurementWithDetails(measurementId);
  }
  
  async updateBloodPressureMeasurement(measurementId: number, data: { systolic?: number, diastolic?: number, heartRate?: number | null, notes?: string | null }): Promise<MeasurementWithDetails> {
    // Update base measurement notes if provided
    if (data.notes !== undefined) {
      await db.update(measurements)
        .set({ notes: data.notes })
        .where(eq(measurements.id, measurementId));
    }
    
    // Build update object with only provided fields
    const updateData: Partial<{ systolic: number, diastolic: number, heartRate: number | null }> = {};
    if (data.systolic !== undefined) updateData.systolic = data.systolic;
    if (data.diastolic !== undefined) updateData.diastolic = data.diastolic;
    if (data.heartRate !== undefined) updateData.heartRate = data.heartRate;
    
    // Only update if there's something to update
    if (Object.keys(updateData).length > 0) {
      await db.update(bloodPressureMeasurements)
        .set(updateData)
        .where(eq(bloodPressureMeasurements.measurementId, measurementId));
    }
    
    return this.getMeasurementWithDetails(measurementId);
  }
  
  async updateWeightMeasurement(measurementId: number, data: { value: number, notes?: string | null }): Promise<MeasurementWithDetails> {
    // Update base measurement notes if provided
    if (data.notes !== undefined) {
      await db.update(measurements)
        .set({ notes: data.notes })
        .where(eq(measurements.id, measurementId));
    }
    
    // Update weight-specific measurement
    await db.update(weightMeasurements)
      .set({ value: data.value })
      .where(eq(weightMeasurements.measurementId, measurementId));
    
    return this.getMeasurementWithDetails(measurementId);
  }
  
  async deleteMeasurement(id: number): Promise<boolean> {
    const measurement = await this.getMeasurement(id);
    if (!measurement) {
      return false;
    }
    
    // Delete type-specific measurement data first (due to foreign key constraints)
    switch (measurement.type) {
      case 'glucose':
        await db.delete(glucoseMeasurements)
          .where(eq(glucoseMeasurements.measurementId, id));
        break;
        
      case 'blood_pressure':
        await db.delete(bloodPressureMeasurements)
          .where(eq(bloodPressureMeasurements.measurementId, id));
        break;
        
      case 'weight':
        await db.delete(weightMeasurements)
          .where(eq(weightMeasurements.measurementId, id));
        break;
    }
    
    // Delete base measurement
    const result = await db.delete(measurements)
      .where(eq(measurements.id, id))
      .returning();
    
    return result.length > 0;
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
  
  async getPreviousPeriodMeasurementsByType(
    userId: number, 
    type: MeasurementType, 
    days: number = 7
  ): Promise<MeasurementWithDetails[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - days); // End date is days ago (the start of current period)
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days); // Start date is 2*days ago
    
    const previousMeasurements = await db
      .select()
      .from(measurements)
      .where(and(
        eq(measurements.userId, userId),
        eq(measurements.type, type),
        sql`${measurements.timestamp} >= ${startDate}`,
        sql`${measurements.timestamp} < ${endDate}`
      ))
      .orderBy(desc(measurements.timestamp));
    
    return Promise.all(
      previousMeasurements.map(m => this.enrichMeasurementWithDetails(m))
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
  
  // 2FA operations
  async saveTwoFactorBackupCodes(userId: number, codes: string[]): Promise<void> {
    // First remove any existing codes
    await db.delete(twoFactorBackupCodes).where(eq(twoFactorBackupCodes.userId, userId));
    
    // Insert new codes
    await Promise.all(
      codes.map(code => 
        db.insert(twoFactorBackupCodes).values({
          userId,
          code,
          used: false
        })
      )
    );
  }

  async getTwoFactorBackupCodes(userId: number): Promise<string[]> {
    const codes = await db
      .select()
      .from(twoFactorBackupCodes)
      .where(
        and(
          eq(twoFactorBackupCodes.userId, userId),
          eq(twoFactorBackupCodes.used, false)
        )
      );
    
    return codes.map(code => code.code);
  }

  async validateTwoFactorBackupCode(userId: number, code: string): Promise<boolean> {
    const [backupCode] = await db
      .select()
      .from(twoFactorBackupCodes)
      .where(
        and(
          eq(twoFactorBackupCodes.userId, userId),
          eq(twoFactorBackupCodes.code, code),
          eq(twoFactorBackupCodes.used, false)
        )
      )
      .limit(1);
    
    if (backupCode) {
      // Mark the code as used
      await db
        .update(twoFactorBackupCodes)
        .set({ used: true })
        .where(eq(twoFactorBackupCodes.id, backupCode.id));
      
      return true;
    }
    
    return false;
  }

  async removeTwoFactorBackupCodes(userId: number): Promise<void> {
    await db.delete(twoFactorBackupCodes).where(eq(twoFactorBackupCodes.userId, userId));
  }
}