import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum for user roles
export const rolesEnum = pgEnum('role', ['admin', 'doctor', 'user']);

// Enum for measurement types
export const measurementTypeEnum = pgEnum('measurement_type', ['glucose', 'blood_pressure', 'weight']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: rolesEnum("role").notNull().default('user'),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Patients table (for doctor-patient relationships)
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  doctorId: integer("doctor_id").references(() => users.id),
  notes: text("notes"),
});

// Measurements table
export const measurements = pgTable("measurements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: measurementTypeEnum("type").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  notes: text("notes"),
});

// Glucose measurements
export const glucoseMeasurements = pgTable("glucose_measurements", {
  id: serial("id").primaryKey(),
  measurementId: integer("measurement_id").notNull().references(() => measurements.id),
  value: integer("value").notNull(), // in mg/dL
});

// Blood pressure measurements
export const bloodPressureMeasurements = pgTable("blood_pressure_measurements", {
  id: serial("id").primaryKey(),
  measurementId: integer("measurement_id").notNull().references(() => measurements.id),
  systolic: integer("systolic").notNull(),
  diastolic: integer("diastolic").notNull(),
  heartRate: integer("heart_rate"),
});

// Weight measurements
export const weightMeasurements = pgTable("weight_measurements", {
  id: serial("id").primaryKey(),
  measurementId: integer("measurement_id").notNull().references(() => measurements.id),
  value: integer("value").notNull(), // in grams (to avoid float)
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true
});

export const insertMeasurementSchema = createInsertSchema(measurements).omit({
  id: true,
});

export const insertGlucoseMeasurementSchema = createInsertSchema(glucoseMeasurements).omit({
  id: true,
});

export const insertBloodPressureMeasurementSchema = createInsertSchema(bloodPressureMeasurements).omit({
  id: true,
});

export const insertWeightMeasurementSchema = createInsertSchema(weightMeasurements).omit({
  id: true,
});

// Extended schema for creating glucose measurement (combined)
export const createGlucoseMeasurementSchema = z.object({
  userId: z.number(),
  value: z.number().min(20).max(600),
  timestamp: z.date().optional(),
  notes: z.string().optional(),
});

// Extended schema for creating blood pressure measurement (combined)
export const createBloodPressureMeasurementSchema = z.object({
  userId: z.number(),
  systolic: z.number().min(70).max(250),
  diastolic: z.number().min(40).max(150),
  heartRate: z.number().min(30).max(220).optional(),
  timestamp: z.date().optional(),
  notes: z.string().optional(),
});

// Extended schema for creating weight measurement (combined)
export const createWeightMeasurementSchema = z.object({
  userId: z.number(),
  value: z.number().min(1000).max(300000), // 1kg to 300kg in grams
  timestamp: z.date().optional(),
  notes: z.string().optional(),
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

// Types
export type Role = "admin" | "doctor" | "user";
export type MeasurementType = "glucose" | "blood_pressure" | "weight";

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Measurement = typeof measurements.$inferSelect;
export type InsertMeasurement = z.infer<typeof insertMeasurementSchema>;
export type GlucoseMeasurement = typeof glucoseMeasurements.$inferSelect;
export type InsertGlucoseMeasurement = z.infer<typeof insertGlucoseMeasurementSchema>;
export type BloodPressureMeasurement = typeof bloodPressureMeasurements.$inferSelect;
export type InsertBloodPressureMeasurement = z.infer<typeof insertBloodPressureMeasurementSchema>;
export type WeightMeasurement = typeof weightMeasurements.$inferSelect;
export type InsertWeightMeasurement = z.infer<typeof insertWeightMeasurementSchema>;

// Combined measurement types
export type CreateGlucoseMeasurement = z.infer<typeof createGlucoseMeasurementSchema>;
export type CreateBloodPressureMeasurement = z.infer<typeof createBloodPressureMeasurementSchema>;
export type CreateWeightMeasurement = z.infer<typeof createWeightMeasurementSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// Combined measurement response type
export type MeasurementWithDetails = Measurement & {
  glucose?: GlucoseMeasurement;
  bloodPressure?: BloodPressureMeasurement;
  weight?: WeightMeasurement;
  user?: User;
};
