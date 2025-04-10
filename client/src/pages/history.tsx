import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Calendar, FileDown } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MeasurementWithDetails, MeasurementType } from "@shared/schema";

export default function History() {
  const [selectedType, setSelectedType] = useState<MeasurementType>("glucose");
  const [selectedPeriod, setSelectedPeriod] = useState("30");  // Default to 30 days

  // Fetch all measurements
  const { data: measurements, isLoading } = useQuery<MeasurementWithDetails[]>({
    queryKey: [`/api/measurements?type=${selectedType}&limit=${selectedPeriod}`],
  });

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
    <DashboardLayout currentPage="history">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Storico Misurazioni</h1>
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
                  <SelectItem value="365">Ultimo anno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto">
              <DateRangePicker />
            </div>
          </div>
          
          {/* Data table */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedType === "glucose" && "Storico Glicemia"}
                  {selectedType === "blood_pressure" && "Storico Pressione"}
                  {selectedType === "weight" && "Storico Peso"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={measurements || []}
                  columns={getColumns()}
                  searchable={true}
                  searchKey="timestamp"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}