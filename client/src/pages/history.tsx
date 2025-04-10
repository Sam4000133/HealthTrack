import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { MeasurementWithDetails } from "@shared/schema";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function History() {
  const [activeTab, setActiveTab] = useState("glucose");
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const {
    data: measurements,
    isLoading,
    error,
  } = useQuery<MeasurementWithDetails[]>({
    queryKey: ["/api/measurements"],
    refetchOnWindowFocus: false,
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  const filteredMeasurements = measurements
    ? measurements
        .filter((m) => m.type === activeTab)
        .filter((m) => {
          if (!searchText) return true;
          return (
            m.notes?.toLowerCase().includes(searchText.toLowerCase()) || 
            false
          );
        })
        .filter((m) => {
          if (!dateRange.from && !dateRange.to) return true;
          const measurementDate = new Date(m.timestamp);
          if (dateRange.from && !dateRange.to) {
            return measurementDate >= dateRange.from;
          }
          if (!dateRange.from && dateRange.to) {
            return measurementDate <= dateRange.to;
          }
          if (dateRange.from && dateRange.to) {
            return measurementDate >= dateRange.from && measurementDate <= dateRange.to;
          }
          return true;
        })
        .sort((a, b) => {
          let valueA, valueB;
          
          if (sortBy === "timestamp") {
            valueA = new Date(a.timestamp).getTime();
            valueB = new Date(b.timestamp).getTime();
          } else if (sortBy === "value" && activeTab === "glucose") {
            valueA = a.glucose?.value || 0;
            valueB = b.glucose?.value || 0;
          } else if (sortBy === "systolic" && activeTab === "blood_pressure") {
            valueA = a.bloodPressure?.systolic || 0;
            valueB = b.bloodPressure?.systolic || 0;
          } else if (sortBy === "diastolic" && activeTab === "blood_pressure") {
            valueA = a.bloodPressure?.diastolic || 0;
            valueB = b.bloodPressure?.diastolic || 0;
          } else if (sortBy === "heartRate" && activeTab === "blood_pressure") {
            valueA = a.bloodPressure?.heartRate || 0;
            valueB = b.bloodPressure?.heartRate || 0;
          } else if (sortBy === "weight" && activeTab === "weight") {
            valueA = a.weight?.value || 0;
            valueB = b.weight?.value || 0;
          } else {
            valueA = a.notes || "";
            valueB = b.notes || "";
          }
          
          if (sortDirection === "asc") {
            return valueA > valueB ? 1 : -1;
          } else {
            return valueA < valueB ? 1 : -1;
          }
        })
    : [];

  const glucoseColumns = [
    {
      header: "Data e ora",
      accessorKey: "timestamp",
      cell: (row: MeasurementWithDetails) => format(new Date(row.timestamp), 'dd/MM/yyyy HH:mm', { locale: it })
    },
    {
      header: "Valore",
      accessorKey: (row: MeasurementWithDetails) => row.glucose?.value || "-",
    },
    {
      header: "Note",
      accessorKey: "notes",
      cell: (row: MeasurementWithDetails) => row.notes || "-"
    },
  ];

  const bloodPressureColumns = [
    {
      header: "Data e ora",
      accessorKey: "timestamp",
      cell: (row: MeasurementWithDetails) => format(new Date(row.timestamp), 'dd/MM/yyyy HH:mm', { locale: it })
    },
    {
      header: "Sistolica",
      accessorKey: (row: MeasurementWithDetails) => row.bloodPressure?.systolic || "-",
    },
    {
      header: "Diastolica",
      accessorKey: (row: MeasurementWithDetails) => row.bloodPressure?.diastolic || "-",
    },
    {
      header: "Freq. cardiaca",
      accessorKey: (row: MeasurementWithDetails) => row.bloodPressure?.heartRate || "-",
    },
    {
      header: "Note",
      accessorKey: "notes",
      cell: (row: MeasurementWithDetails) => row.notes || "-"
    },
  ];

  const weightColumns = [
    {
      header: "Data e ora",
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
      cell: (row: MeasurementWithDetails) => row.notes || "-"
    },
  ];

  const columns = activeTab === "glucose" 
    ? glucoseColumns 
    : activeTab === "blood_pressure" 
      ? bloodPressureColumns 
      : weightColumns;

  return (
    <DashboardLayout
      currentPage="history"
    >
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Storico Misurazioni</CardTitle>
          <CardDescription>
            Visualizza e filtra lo storico delle tue misurazioni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="glucose" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 grid grid-cols-3">
              <TabsTrigger value="glucose">Glicemia</TabsTrigger>
              <TabsTrigger value="blood_pressure">Pressione</TabsTrigger>
              <TabsTrigger value="weight">Peso</TabsTrigger>
            </TabsList>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca nelle note..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal w-[240px]"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                            {format(dateRange.to, "dd/MM/yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy")
                        )
                      ) : (
                        "Seleziona data..."
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to,
                      }}
                      onSelect={(range) => 
                        setDateRange({ 
                          from: range?.from, 
                          to: range?.to 
                        })
                      }
                      numberOfMonths={2}
                    />
                    <div className="p-3 border-t border-border flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDateRange({ from: undefined, to: undefined })}
                      >
                        Reset
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">
                Si è verificato un errore nel caricamento dei dati.
              </div>
            ) : filteredMeasurements.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Nessuna misurazione trovata. 
                {searchText && <span> Prova a modificare la ricerca.</span>}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column, i) => {
                        const columnKey = typeof column.accessorKey === 'string'
                          ? column.accessorKey
                          : column.header.toLowerCase().replace(' ', '');
                        
                        return (
                          <TableHead 
                            key={i}
                            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none"
                            onClick={() => handleSort(columnKey)}
                          >
                            <div className="flex items-center space-x-1">
                              <span>{column.header}</span>
                              {sortBy === columnKey && (
                                <span className="ml-1">
                                  {sortDirection === "asc" ? "▲" : "▼"}
                                </span>
                              )}
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMeasurements.map((measurement) => (
                      <TableRow key={measurement.id}>
                        {columns.map((column, i) => (
                          <TableCell key={i}>
                            {column.cell
                              ? column.cell(measurement)
                              : typeof column.accessorKey === 'function'
                                ? column.accessorKey(measurement)
                                : (measurement as any)[column.accessorKey]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}