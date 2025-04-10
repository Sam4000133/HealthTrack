import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import VitalChart from "@/components/dashboard/VitalChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MeasurementWithDetails, MeasurementType } from "@shared/schema";
import { 
  GLUCOSE_THRESHOLDS, 
  BLOOD_PRESSURE_THRESHOLDS 
} from "@shared/constants";
import { format, subDays } from "date-fns";
import { it } from "date-fns/locale";
import { FileDown, Calendar } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DataTable } from "@/components/ui/data-table";

export default function Statistics() {
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [selectedType, setSelectedType] = useState<MeasurementType>("glucose");

  // Fetch measurements based on selected type and period
  const { data: measurements, isLoading } = useQuery<MeasurementWithDetails[]>({
    queryKey: ["/api/measurements/stats", selectedType, selectedPeriod],
  });

  // Get value functions for charts
  const getGlucoseValue = (measurement: MeasurementWithDetails): number => {
    return measurement.glucose?.value || 0;
  };

  const getBloodPressureValue = (measurement: MeasurementWithDetails): { systolic: number; diastolic: number } => {
    return {
      systolic: measurement.bloodPressure?.systolic || 0,
      diastolic: measurement.bloodPressure?.diastolic || 0
    };
  };

  const getWeightValue = (measurement: MeasurementWithDetails): number => {
    return measurement.weight?.value || 0;
  };

  // Format values for different measurement types
  const formatGlucoseValue = (value: number): string => {
    return `${value} mg/dL`;
  };

  const formatBloodPressureValue = (systolic: number, diastolic: number, heartRate?: number): string => {
    return heartRate 
      ? `${systolic}/${diastolic} mmHg, ${heartRate} BPM` 
      : `${systolic}/${diastolic} mmHg`;
  };

  const formatWeightValue = (value: number): string => {
    return `${(value / 1000).toFixed(1)} kg`;
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!measurements || measurements.length === 0) {
      return {
        average: "N/A",
        min: "N/A",
        max: "N/A",
        count: 0
      };
    }

    if (selectedType === "glucose") {
      const values = measurements.map(m => m.glucose?.value || 0).filter(v => v > 0);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      return {
        average: formatGlucoseValue(Math.round(avg)),
        min: formatGlucoseValue(min),
        max: formatGlucoseValue(max),
        count: values.length
      };
    } else if (selectedType === "blood_pressure") {
      const systolicValues = measurements.map(m => m.bloodPressure?.systolic || 0).filter(v => v > 0);
      const diastolicValues = measurements.map(m => m.bloodPressure?.diastolic || 0).filter(v => v > 0);
      
      const avgSystolic = systolicValues.reduce((sum, val) => sum + val, 0) / systolicValues.length;
      const avgDiastolic = diastolicValues.reduce((sum, val) => sum + val, 0) / diastolicValues.length;
      
      const minSystolic = Math.min(...systolicValues);
      const minDiastolic = Math.min(...diastolicValues);
      
      const maxSystolic = Math.max(...systolicValues);
      const maxDiastolic = Math.max(...diastolicValues);
      
      return {
        average: formatBloodPressureValue(Math.round(avgSystolic), Math.round(avgDiastolic)),
        min: formatBloodPressureValue(minSystolic, minDiastolic),
        max: formatBloodPressureValue(maxSystolic, maxDiastolic),
        count: systolicValues.length
      };
    } else if (selectedType === "weight") {
      const values = measurements.map(m => m.weight?.value || 0).filter(v => v > 0);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      return {
        average: formatWeightValue(avg),
        min: formatWeightValue(min),
        max: formatWeightValue(max),
        count: values.length
      };
    }

    return {
      average: "N/A",
      min: "N/A",
      max: "N/A",
      count: 0
    };
  };

  const stats = calculateStats();

  // Table columns for different measurement types
  const glucoseColumns = [
    {
      header: "Data",
      accessorKey: "timestamp",
      cell: (row: MeasurementWithDetails) => format(new Date(row.timestamp), 'dd/MM/yyyy HH:mm', { locale: it })
    },
    {
      header: "Valore (mg/dL)",
      accessorKey: (row: MeasurementWithDetails) => row.glucose?.value || "-",
    },
    {
      header: "Note",
      accessorKey: "notes",
    }
  ];

  const bloodPressureColumns = [
    {
      header: "Data",
      accessorKey: "timestamp",
      cell: (row: MeasurementWithDetails) => format(new Date(row.timestamp), 'dd/MM/yyyy HH:mm', { locale: it })
    },
    {
      header: "Sistolica (mmHg)",
      accessorKey: (row: MeasurementWithDetails) => row.bloodPressure?.systolic || "-",
    },
    {
      header: "Diastolica (mmHg)",
      accessorKey: (row: MeasurementWithDetails) => row.bloodPressure?.diastolic || "-",
    },
    {
      header: "Battiti (BPM)",
      accessorKey: (row: MeasurementWithDetails) => row.bloodPressure?.heartRate || "-",
    },
    {
      header: "Note",
      accessorKey: "notes",
    }
  ];

  const weightColumns = [
    {
      header: "Data",
      accessorKey: "timestamp",
      cell: (row: MeasurementWithDetails) => format(new Date(row.timestamp), 'dd/MM/yyyy HH:mm', { locale: it })
    },
    {
      header: "Peso (kg)",
      accessorKey: (row: MeasurementWithDetails) => row.weight ? (row.weight.value / 1000).toFixed(1) : "-",
    },
    {
      header: "Note",
      accessorKey: "notes",
    }
  ];

  // Get current columns based on selected type
  const getColumns = () => {
    switch (selectedType) {
      case "glucose": return glucoseColumns;
      case "blood_pressure": return bloodPressureColumns;
      case "weight": return weightColumns;
      default: return glucoseColumns;
    }
  };

  // Handle export CSV
  const handleExportCSV = () => {
    window.open(`/api/export/measurements?type=${selectedType}`, '_blank');
  };

  return (
    <DashboardLayout currentPage="statistics">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Statistiche</h1>
            <Button className="inline-flex items-center" onClick={handleExportCSV}>
              <FileDown className="mr-2 -ml-1 h-5 w-5" />
              Esporta CSV
            </Button>
          </div>
          
          {/* Filter controls */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-auto">
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as MeasurementType)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tipo di misurazione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="glucose">Glicemia</SelectItem>
                  <SelectItem value="blood_pressure">Pressione</SelectItem>
                  <SelectItem value="weight">Peso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Ultimi 7 giorni</SelectItem>
                  <SelectItem value="14">Ultimi 14 giorni</SelectItem>
                  <SelectItem value="30">Ultimi 30 giorni</SelectItem>
                  <SelectItem value="90">Ultimi 3 mesi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto">
              <DateRangePicker />
            </div>
          </div>
          
          {/* Statistics cards */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.average}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Minimo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.min}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Massimo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.max}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Misurazioni
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.count}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts and Data Tabs */}
          <div className="mt-6">
            <Tabs defaultValue="chart" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chart">Grafico</TabsTrigger>
                <TabsTrigger value="data">Dati</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart">
                <Card>
                  <CardContent className="pt-6">
                    <div className="h-[400px]">
                      {selectedType === "glucose" && (
                        <VitalChart
                          title={`Andamento Glicemia - Ultimi ${selectedPeriod} giorni`}
                          subtitle="Misurazioni registrate"
                          data={measurements || []}
                          isLoading={isLoading}
                          type="glucose"
                          getValue={getGlucoseValue}
                          upperLimit={GLUCOSE_THRESHOLDS.HIGH}
                          lowerLimit={GLUCOSE_THRESHOLDS.LOW}
                        />
                      )}
                      
                      {selectedType === "blood_pressure" && (
                        <VitalChart
                          title={`Andamento Pressione - Ultimi ${selectedPeriod} giorni`}
                          subtitle="Misurazioni registrate"
                          data={measurements || []}
                          isLoading={isLoading}
                          type="blood_pressure"
                          getValue={getBloodPressureValue}
                          upperLimit={BLOOD_PRESSURE_THRESHOLDS.SYSTOLIC.HIGH}
                        />
                      )}
                      
                      {selectedType === "weight" && (
                        <VitalChart
                          title={`Andamento Peso - Ultimi ${selectedPeriod} giorni`}
                          subtitle="Misurazioni registrate"
                          data={measurements || []}
                          isLoading={isLoading}
                          type="weight"
                          getValue={getWeightValue}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="data">
                <Card>
                  <CardContent className="pt-6">
                    <DataTable
                      data={measurements || []}
                      columns={getColumns()}
                      searchable={true}
                      searchKey="timestamp"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
