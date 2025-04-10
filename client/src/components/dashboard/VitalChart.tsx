import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  LineController
} from "chart.js";
import { MeasurementWithDetails } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface VitalChartProps {
  title: string;
  subtitle: string;
  data: MeasurementWithDetails[];
  isLoading: boolean;
  type: "glucose" | "blood_pressure" | "weight";
  getValue: (measurement: MeasurementWithDetails) => number | { systolic: number; diastolic: number; heartRate: number };
  upperLimit?: number;
  lowerLimit?: number;
  // Optional previous period data for comparison
  previousData?: MeasurementWithDetails[];
  isPreviousLoading?: boolean;
}

export default function VitalChart({
  title,
  subtitle,
  data,
  isLoading,
  type,
  getValue,
  upperLimit,
  lowerLimit,
  previousData,
  isPreviousLoading,
}: VitalChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    // Cleanup previous chart on unmount or data change
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isLoading || !chartRef.current) return;

    // Imposta data al 10 aprile 2025 (per far coincidere con i dati generati)
    const refDate = new Date(2025, 3, 10); // 10 aprile 2025
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(refDate);
      date.setDate(refDate.getDate() - (6 - i)); // 6 giorni fa fino a oggi (7 giorni totali)
      return {
        date,
        dateString: format(date, "dd/MM")
      };
    });

    // Ordina i dati per timestamp
    const sortedData = [...data].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    // Crea etichette per tutti i 7 giorni
    const labels = last7Days.map(day => day.dateString);

    // Create datasets based on measurement type
    let datasets = [];
    
    if (type === "glucose") {
      // Map data to the 7 days
      const mappedData = last7Days.map(day => {
        // Find a measurement from this day (if any)
        const measurement = sortedData.find(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate.getDate() === day.date.getDate() && 
                 itemDate.getMonth() === day.date.getMonth() && 
                 itemDate.getFullYear() === day.date.getFullYear();
        });
        
        // Return the value or null if no measurement for this day
        return measurement ? (getValue(measurement) as number) : null;
      });

      datasets = [
        {
          label: "Glicemia (mg/dL)",
          data: mappedData,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          pointBackgroundColor: "#3b82f6",
          tension: 0.2,
          fill: true
        }
      ];

      // Add upper limit line if provided
      if (upperLimit) {
        datasets.push({
          label: "Limite superiore",
          data: Array(labels.length).fill(upperLimit),
          borderColor: "#ef4444",
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        });
      }

      // Add lower limit line if provided
      if (lowerLimit) {
        datasets.push({
          label: "Limite inferiore",
          data: Array(labels.length).fill(lowerLimit),
          borderColor: "#3b82f6",
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        });
      }
    } else if (type === "blood_pressure") {
      // Map data to the 7 days for each value
      const mappedSystolic = last7Days.map(day => {
        const measurement = sortedData.find(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate.getDate() === day.date.getDate() && 
                 itemDate.getMonth() === day.date.getMonth() && 
                 itemDate.getFullYear() === day.date.getFullYear();
        });
        
        return measurement 
          ? (getValue(measurement) as { systolic: number; diastolic: number; heartRate: number }).systolic 
          : null;
      });

      const mappedDiastolic = last7Days.map(day => {
        const measurement = sortedData.find(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate.getDate() === day.date.getDate() && 
                 itemDate.getMonth() === day.date.getMonth() && 
                 itemDate.getFullYear() === day.date.getFullYear();
        });
        
        return measurement 
          ? (getValue(measurement) as { systolic: number; diastolic: number; heartRate: number }).diastolic 
          : null;
      });
      
      const mappedHeartRate = last7Days.map(day => {
        const measurement = sortedData.find(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate.getDate() === day.date.getDate() && 
                 itemDate.getMonth() === day.date.getMonth() && 
                 itemDate.getFullYear() === day.date.getFullYear();
        });
        
        return measurement 
          ? (getValue(measurement) as { systolic: number; diastolic: number; heartRate: number }).heartRate 
          : null;
      });

      datasets = [
        {
          label: "Sistolica (mmHg)",
          data: mappedSystolic,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          pointBackgroundColor: "#ef4444",
          tension: 0.2
        },
        {
          label: "Diastolica (mmHg)",
          data: mappedDiastolic,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          pointBackgroundColor: "#10b981",
          tension: 0.2
        },
        {
          label: "Battito (BPM)",
          data: mappedHeartRate,
          borderColor: "#f97316",
          backgroundColor: "rgba(249, 115, 22, 0.1)",
          pointBackgroundColor: "#f97316",
          tension: 0.2
        }
      ];
    } else if (type === "weight") {
      // Map data to the 7 days
      const mappedData = last7Days.map(day => {
        // Find a measurement from this day (if any)
        const measurement = sortedData.find(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate.getDate() === day.date.getDate() && 
                 itemDate.getMonth() === day.date.getMonth() && 
                 itemDate.getFullYear() === day.date.getFullYear();
        });
        
        // Return the value or null if no measurement for this day
        return measurement ? (getValue(measurement) as number) / 1000 : null; // Convert from grams to kg
      });

      datasets = [
        {
          label: "Peso (kg)",
          data: mappedData,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.2)",
          pointBackgroundColor: "#10b981",
          tension: 0.2,
          fill: true
        }
      ];
    }

    // Create chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)'
                }
              },
              y: {
                grid: {
                  color: 'rgba(0, 0, 0, 0.1)'
                }
              }
            },
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              }
            }
          }
        });
      }
    }
  }, [data, isLoading, type, getValue, upperLimit, lowerLimit]);

  // Calculate average if data available
  const calculateAverage = () => {
    if (!data.length) return "N/A";

    if (type === "glucose") {
      const values = data.map(item => getValue(item) as number);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      return `${Math.round(avg)} mg/dL`;
    } else if (type === "blood_pressure") {
      const systolicValues = data.map(item => (getValue(item) as { systolic: number; diastolic: number; heartRate: number }).systolic);
      const diastolicValues = data.map(item => (getValue(item) as { systolic: number; diastolic: number; heartRate: number }).diastolic);
      const heartRateValues = data.map(item => (getValue(item) as { systolic: number; diastolic: number; heartRate: number }).heartRate);
      
      const avgSystolic = systolicValues.reduce((sum, val) => sum + val, 0) / systolicValues.length;
      const avgDiastolic = diastolicValues.reduce((sum, val) => sum + val, 0) / diastolicValues.length;
      const avgHeartRate = heartRateValues.reduce((sum, val) => sum + val, 0) / heartRateValues.length;
      
      return `${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg, ${Math.round(avgHeartRate)} BPM`;
    } else if (type === "weight") {
      const values = data.map(item => getValue(item) as number);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length / 1000; // Convert from grams to kg
      return `${avg.toFixed(1)} kg`;
    }

    return "N/A";
  };
  
  // Calculate trend percentage compared to previous period
  const calculateTrendPercentage = () => {
    if (!data.length || !previousData || !previousData.length) return null;

    if (type === "glucose") {
      const currentValues = data.map(item => getValue(item) as number);
      const previousValues = previousData.map(item => getValue(item) as number);
      
      const currentAvg = currentValues.reduce((sum, val) => sum + val, 0) / currentValues.length;
      const previousAvg = previousValues.reduce((sum, val) => sum + val, 0) / previousValues.length;
      
      if (previousAvg === 0) return null; // Avoid division by zero
      
      const percentChange = ((currentAvg - previousAvg) / previousAvg) * 100;
      return {
        percentage: Math.abs(percentChange).toFixed(1),
        isHigher: percentChange > 0
      };
    } else if (type === "blood_pressure") {
      const currentSystolicValues = data.map(item => (getValue(item) as { systolic: number; diastolic: number; heartRate: number }).systolic);
      const previousSystolicValues = previousData.map(item => (getValue(item) as { systolic: number; diastolic: number; heartRate: number }).systolic);
      
      const currentSystolicAvg = currentSystolicValues.reduce((sum, val) => sum + val, 0) / currentSystolicValues.length;
      const previousSystolicAvg = previousSystolicValues.reduce((sum, val) => sum + val, 0) / previousSystolicValues.length;
      
      if (previousSystolicAvg === 0) return null; // Avoid division by zero
      
      const percentChange = ((currentSystolicAvg - previousSystolicAvg) / previousSystolicAvg) * 100;
      return {
        percentage: Math.abs(percentChange).toFixed(1),
        isHigher: percentChange > 0
      };
    } else if (type === "weight") {
      const currentValues = data.map(item => getValue(item) as number);
      const previousValues = previousData.map(item => getValue(item) as number);
      
      const currentAvg = currentValues.reduce((sum, val) => sum + val, 0) / currentValues.length;
      const previousAvg = previousValues.reduce((sum, val) => sum + val, 0) / previousValues.length;
      
      if (previousAvg === 0) return null; // Avoid division by zero
      
      const percentChange = ((currentAvg - previousAvg) / previousAvg) * 100;
      return {
        percentage: Math.abs(percentChange).toFixed(1),
        isHigher: percentChange > 0
      };
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <h3 className="text-lg leading-6 font-medium">{title}</h3>
        <div className="mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 px-5">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="h-4/5 w-11/12" />
            </div>
          ) : data.length > 0 ? (
            <canvas ref={chartRef}></canvas>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              Nessun dato disponibile
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-3">
          <div className="text-sm font-medium flex items-center">
            <span>Media:</span> 
            <span className="ml-1 text-gray-700 dark:text-gray-300">
              {isLoading ? <Skeleton className="h-4 w-16 inline-block" /> : calculateAverage()}
            </span>
            
            {!isLoading && !isPreviousLoading && previousData && previousData.length > 0 && (
              <>
                {(() => {
                  const trend = calculateTrendPercentage();
                  if (!trend) return null;
                  
                  return (
                    <div className={`ml-2 flex items-center text-xs font-medium ${trend.isHigher ? 'text-red-500' : 'text-green-500'}`}>
                      {trend.isHigher ? 
                        <ArrowUpIcon className="h-3 w-3 mr-0.5" /> : 
                        <ArrowDownIcon className="h-3 w-3 mr-0.5" />
                      }
                      <span>{trend.percentage}%</span>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}