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
  getValue: (measurement: MeasurementWithDetails) => number | { systolic: number; diastolic: number };
  upperLimit?: number;
  lowerLimit?: number;
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
    if (isLoading || !chartRef.current || !data.length) return;

    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    // Create labels (dates)
    const labels = sortedData.map(item => 
      format(new Date(item.timestamp), "dd/MM")
    );

    // Create datasets based on measurement type
    let datasets = [];
    
    if (type === "glucose") {
      const values = sortedData.map(item => {
        const value = getValue(item) as number;
        return value;
      });

      datasets = [
        {
          label: "Glicemia (mg/dL)",
          data: values,
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
      const systolicValues = sortedData.map(item => {
        const value = getValue(item) as { systolic: number; diastolic: number };
        return value.systolic;
      });

      const diastolicValues = sortedData.map(item => {
        const value = getValue(item) as { systolic: number; diastolic: number };
        return value.diastolic;
      });

      datasets = [
        {
          label: "Sistolica (mmHg)",
          data: systolicValues,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          pointBackgroundColor: "#ef4444",
          tension: 0.2
        },
        {
          label: "Diastolica (mmHg)",
          data: diastolicValues,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          pointBackgroundColor: "#10b981",
          tension: 0.2
        }
      ];
    } else if (type === "weight") {
      const values = sortedData.map(item => {
        const value = getValue(item) as number;
        return value / 1000; // Convert from grams to kg
      });

      datasets = [
        {
          label: "Peso (kg)",
          data: values,
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
      const systolicValues = data.map(item => (getValue(item) as { systolic: number; diastolic: number }).systolic);
      const diastolicValues = data.map(item => (getValue(item) as { systolic: number; diastolic: number }).diastolic);
      
      const avgSystolic = systolicValues.reduce((sum, val) => sum + val, 0) / systolicValues.length;
      const avgDiastolic = diastolicValues.reduce((sum, val) => sum + val, 0) / diastolicValues.length;
      
      return `${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg`;
    } else if (type === "weight") {
      const values = data.map(item => getValue(item) as number);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length / 1000; // Convert from grams to kg
      return `${avg.toFixed(1)} kg`;
    }

    return "N/A";
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
        <div className="flex justify-end px-5">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-md">
            <span className="font-medium">Media:</span> {isLoading ? <Skeleton className="h-4 w-16 inline-block" /> : calculateAverage()}
          </div>
        </div>
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
      </div>
    </div>
  );
}
