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
  CreateWeightMeasurement
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Patient operations
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByUserId(userId: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<Patient>): Promise<Patient | undefined>;
  getPatientsForDoctor(doctorId: number): Promise<(Patient & { user: User })[]>;
  assignDoctor(patientId: number, doctorId: number): Promise<Patient | undefined>;

  // Measurement operations
  createMeasurement(measurement: InsertMeasurement): Promise<Measurement>;
  getMeasurement(id: number): Promise<Measurement | undefined>;
  getMeasurementsByUser(userId: number, type?: MeasurementType): Promise<Measurement[]>;
  getMeasurementWithDetails(id: number): Promise<MeasurementWithDetails | undefined>;
  getMeasurementsWithDetailsByUser(userId: number, type?: MeasurementType, limit?: number): Promise<MeasurementWithDetails[]>;

  // Specific measurement operations
  createGlucoseMeasurement(data: CreateGlucoseMeasurement): Promise<MeasurementWithDetails>;
  createBloodPressureMeasurement(data: CreateBloodPressureMeasurement): Promise<MeasurementWithDetails>;
  createWeightMeasurement(data: CreateWeightMeasurement): Promise<MeasurementWithDetails>;
  
  // Statistics operations
  getRecentMeasurementsByType(userId: number, type: MeasurementType, days: number): Promise<MeasurementWithDetails[]>;
  getLatestMeasurementsByType(userId: number): Promise<Record<MeasurementType, MeasurementWithDetails | undefined>>;
  
  // Session store
  sessionStore: any; // Using any for now to resolve the session store type issue
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private measurements: Map<number, Measurement>;
  private glucoseMeasurements: Map<number, GlucoseMeasurement>;
  private bloodPressureMeasurements: Map<number, BloodPressureMeasurement>;
  private weightMeasurements: Map<number, WeightMeasurement>;
  private userIdCounter: number;
  private patientIdCounter: number;
  private measurementIdCounter: number;
  private glucoseMeasurementIdCounter: number;
  private bloodPressureMeasurementIdCounter: number;
  private weightMeasurementIdCounter: number;
  
  sessionStore: any; // Using any for now to resolve the session store type issue

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.measurements = new Map();
    this.glucoseMeasurements = new Map();
    this.bloodPressureMeasurements = new Map();
    this.weightMeasurements = new Map();
    
    this.userIdCounter = 1;
    this.patientIdCounter = 1;
    this.measurementIdCounter = 1;
    this.glucoseMeasurementIdCounter = 1;
    this.bloodPressureMeasurementIdCounter = 1;
    this.weightMeasurementIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });

    // Create admin user by default
    this.createUser({
      username: "admin",
      password: "admin123.cbd29512c1e547597319975439e9dc9b385485ec5363983669c8f26369e7b7dd82dc6e2a9b3b5be5c2da98c0a1cd0d8b6267fe6b02d9a0c99415ac7e81c71e7e.6c45ab07f03c53ad6b9a38db3f0d1509",
      role: "admin",
      name: "Administrator",
      email: "admin@healthtrack.com"
    });

    // Create doctor user
    this.createUser({
      username: "doctor",
      password: "doctor123.cbd29512c1e547597319975439e9dc9b385485ec5363983669c8f26369e7b7dd82dc6e2a9b3b5be5c2da98c0a1cd0d8b6267fe6b02d9a0c99415ac7e81c71e7e.6c45ab07f03c53ad6b9a38db3f0d1509",
      role: "doctor",
      name: "Dr. Mario Rossi",
      email: "doctor@healthtrack.com"
    });

    // Create regular user
    const user = this.createUser({
      username: "patient",
      password: "patient123.cbd29512c1e547597319975439e9dc9b385485ec5363983669c8f26369e7b7dd82dc6e2a9b3b5be5c2da98c0a1cd0d8b6267fe6b02d9a0c99415ac7e81c71e7e.6c45ab07f03c53ad6b9a38db3f0d1509",
      role: "user",
      name: "Giovanni Paziente",
      email: "patient@healthtrack.com"
    });

    // Create patient record
    this.createPatient({
      userId: user.id,
      doctorId: 2, // The doctor we created
      notes: "Diabete Tipo 2, Ipertensione"
    });

    // Create some sample measurements for the patient
    const today = new Date();
    
    // Create glucose measurements
    this.createGlucoseMeasurement({
      userId: user.id,
      value: 120,
      timestamp: new Date(today.setHours(8, 30, 0, 0)),
      notes: "A digiuno"
    });

    this.createGlucoseMeasurement({
      userId: user.id,
      value: 190,
      timestamp: new Date(today.setDate(today.getDate() - 1)),
      notes: "Post colazione"
    });

    // Reset date
    today.setDate(today.getDate() + 1);

    // Create blood pressure measurements
    this.createBloodPressureMeasurement({
      userId: user.id,
      systolic: 130,
      diastolic: 85,
      heartRate: 75,
      timestamp: new Date(today.setHours(8, 30, 0, 0)),
      notes: "Post caffè"
    });

    this.createBloodPressureMeasurement({
      userId: user.id,
      systolic: 145,
      diastolic: 95,
      heartRate: 80,
      timestamp: new Date(today.setDate(today.getDate() - 2)),
      notes: ""
    });

    // Reset date
    today.setDate(today.getDate() + 2);

    // Create weight measurements
    this.createWeightMeasurement({
      userId: user.id,
      value: 78500, // 78.5 kg in grams
      timestamp: new Date(today.setDate(today.getDate() - 1)),
      notes: ""
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Patient operations
  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatientByUserId(userId: number): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(
      (patient) => patient.userId === userId,
    );
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const id = this.patientIdCounter++;
    const newPatient: Patient = { ...patient, id };
    this.patients.set(id, newPatient);
    return newPatient;
  }

  async updatePatient(id: number, patientData: Partial<Patient>): Promise<Patient | undefined> {
    const patient = await this.getPatient(id);
    if (!patient) return undefined;
    
    const updatedPatient = { ...patient, ...patientData };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async getPatientsForDoctor(doctorId: number): Promise<(Patient & { user: User })[]> {
    const patients = Array.from(this.patients.values())
      .filter(patient => patient.doctorId === doctorId);
    
    return Promise.all(
      patients.map(async patient => {
        const user = await this.getUser(patient.userId);
        return { ...patient, user: user! };
      })
    );
  }

  async assignDoctor(patientId: number, doctorId: number): Promise<Patient | undefined> {
    const patient = await this.getPatient(patientId);
    if (!patient) return undefined;
    
    patient.doctorId = doctorId;
    this.patients.set(patientId, patient);
    return patient;
  }

  // Measurement operations
  async createMeasurement(measurement: InsertMeasurement): Promise<Measurement> {
    const id = this.measurementIdCounter++;
    const newMeasurement: Measurement = { ...measurement, id };
    this.measurements.set(id, newMeasurement);
    return newMeasurement;
  }

  async getMeasurement(id: number): Promise<Measurement | undefined> {
    return this.measurements.get(id);
  }

  async getMeasurementsByUser(userId: number, type?: MeasurementType): Promise<Measurement[]> {
    return Array.from(this.measurements.values())
      .filter(m => m.userId === userId && (!type || m.type === type))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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
    let measurements = await this.getMeasurementsByUser(userId, type);
    
    if (limit) {
      measurements = measurements.slice(0, limit);
    }
    
    return Promise.all(
      measurements.map(m => this.enrichMeasurementWithDetails(m))
    );
  }

  private async enrichMeasurementWithDetails(measurement: Measurement): Promise<MeasurementWithDetails> {
    const result: MeasurementWithDetails = { ...measurement };
    
    // Get user
    const user = await this.getUser(measurement.userId);
    if (user) {
      result.user = user;
    }
    
    // Get type-specific measurement details
    switch (measurement.type) {
      case 'glucose':
        const glucose = this.findDetailMeasurement(
          this.glucoseMeasurements, 
          m => m.measurementId === measurement.id
        );
        if (glucose) result.glucose = glucose;
        break;
        
      case 'blood_pressure':
        const bp = this.findDetailMeasurement(
          this.bloodPressureMeasurements, 
          m => m.measurementId === measurement.id
        );
        if (bp) result.bloodPressure = bp;
        break;
        
      case 'weight':
        const weight = this.findDetailMeasurement(
          this.weightMeasurements, 
          m => m.measurementId === measurement.id
        );
        if (weight) result.weight = weight;
        break;
    }
    
    return result;
  }

  private findDetailMeasurement<T>(
    map: Map<number, T>, 
    predicate: (item: T) => boolean
  ): T | undefined {
    return Array.from(map.values()).find(predicate);
  }

  // Specific measurement operations
  async createGlucoseMeasurement(data: CreateGlucoseMeasurement): Promise<MeasurementWithDetails> {
    // Create base measurement record
    const measurement = await this.createMeasurement({
      userId: data.userId,
      type: 'glucose',
      timestamp: data.timestamp || new Date(),
      notes: data.notes || "",
    });
    
    // Create glucose-specific record
    const glucoseId = this.glucoseMeasurementIdCounter++;
    const glucoseMeasurement: GlucoseMeasurement = {
      id: glucoseId,
      measurementId: measurement.id,
      value: data.value,
    };
    
    this.glucoseMeasurements.set(glucoseId, glucoseMeasurement);
    
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
      notes: data.notes || "",
    });
    
    // Create blood pressure-specific record
    const bpId = this.bloodPressureMeasurementIdCounter++;
    const bpMeasurement: BloodPressureMeasurement = {
      id: bpId,
      measurementId: measurement.id,
      systolic: data.systolic,
      diastolic: data.diastolic,
      heartRate: data.heartRate,
    };
    
    this.bloodPressureMeasurements.set(bpId, bpMeasurement);
    
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
      notes: data.notes || "",
    });
    
    // Create weight-specific record
    const weightId = this.weightMeasurementIdCounter++;
    const weightMeasurement: WeightMeasurement = {
      id: weightId,
      measurementId: measurement.id,
      value: data.value,
    };
    
    this.weightMeasurements.set(weightId, weightMeasurement);
    
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
    const measurements = await this.getMeasurementsByUser(userId, type);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentMeasurements = measurements.filter(
      m => m.timestamp >= cutoffDate
    );
    
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
      const measurements = await this.getMeasurementsByUser(userId, type);
      if (measurements.length > 0) {
        result[type] = await this.enrichMeasurementWithDetails(measurements[0]);
      }
    }));
    
    return result;
  }
}

export const storage = new MemStorage();
