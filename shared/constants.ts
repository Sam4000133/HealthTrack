// Health status thresholds

// Glucose thresholds in mg/dL
export const GLUCOSE_THRESHOLDS = {
  LOW: 70,
  NORMAL_MIN: 70,
  NORMAL_MAX: 140,
  HIGH: 140,
  VERY_HIGH: 200,
};

// Blood pressure thresholds in mmHg
export const BLOOD_PRESSURE_THRESHOLDS = {
  SYSTOLIC: {
    LOW: 90,
    NORMAL_MIN: 90,
    NORMAL_MAX: 120,
    HIGH: 140,
    VERY_HIGH: 180,
  },
  DIASTOLIC: {
    LOW: 60,
    NORMAL_MIN: 60,
    NORMAL_MAX: 80,
    HIGH: 90,
    VERY_HIGH: 120,
  },
};

// Heart rate thresholds in BPM
export const HEART_RATE_THRESHOLDS = {
  LOW: 60,
  NORMAL_MIN: 60,
  NORMAL_MAX: 100,
  HIGH: 100,
};

// BMI categories
export const BMI_CATEGORIES = {
  UNDERWEIGHT: 18.5,
  NORMAL_MIN: 18.5,
  NORMAL_MAX: 24.9,
  OVERWEIGHT: 25,
  OBESE: 30,
};

// Status categories for UI display
export enum StatusCategory {
  NORMAL = "normal",
  LOW = "low",
  HIGH = "high",
  VERY_HIGH = "very_high",
}

// Map measurement status to UI classes
export const STATUS_CLASSES = {
  [StatusCategory.NORMAL]: {
    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    text: "Normale",
  },
  [StatusCategory.LOW]: {
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    text: "Bassa",
  },
  [StatusCategory.HIGH]: {
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    text: "Alta",
  },
  [StatusCategory.VERY_HIGH]: {
    badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    text: "Molto Alta",
  },
};
