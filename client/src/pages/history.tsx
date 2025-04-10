import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar as CalendarIcon, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { MeasurementWithDetails } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function History() {
  const [activeTab, setActiveTab] = useState("glucose");
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<MeasurementWithDetails | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: measurements,
    isLoading,
    error,
  } = useQuery<MeasurementWithDetails[]>({
    queryKey: ["/api/measurements"],
    refetchOnWindowFocus: false,
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/measurements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      toast({
        title: "Misurazione eliminata",
        description: "La misurazione è stata eliminata con successo",
        variant: "default",
      });
      setDeleteModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'eliminazione della misurazione",
        variant: "destructive",
      });
      console.error("Error deleting measurement:", error);
    }
  });
  
  const updateGlucoseMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PATCH", `/api/measurements/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      toast({
        title: "Misurazione aggiornata",
        description: "La misurazione è stata aggiornata con successo",
        variant: "default",
      });
      setEditModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento della misurazione",
        variant: "destructive",
      });
      console.error("Error updating measurement:", error);
    }
  });
  
  const updateBloodPressureMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PATCH", `/api/measurements/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      toast({
        title: "Misurazione aggiornata",
        description: "La misurazione è stata aggiornata con successo",
        variant: "default",
      });
      setEditModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento della misurazione",
        variant: "destructive",
      });
      console.error("Error updating measurement:", error);
    }
  });
  
  const updateWeightMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PATCH", `/api/measurements/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      toast({
        title: "Misurazione aggiornata",
        description: "La misurazione è stata aggiornata con successo",
        variant: "default",
      });
      setEditModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento della misurazione",
        variant: "destructive",
      });
      console.error("Error updating measurement:", error);
    }
  });
  
  const handleDeleteClick = (id: number) => {
    setSelectedMeasurement({ id } as MeasurementWithDetails);
    setDeleteModalOpen(true);
  };
  
  const handleEditClick = (measurement: MeasurementWithDetails) => {
    setSelectedMeasurement(measurement);
    setEditModalOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (selectedMeasurement?.id) {
      deleteMutation.mutate(selectedMeasurement.id);
    }
  };

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

  // Definisce la colonna delle azioni da aggiungere a tutte le tabelle
  const actionsColumn = {
    header: "Azioni",
    accessorKey: "actions",
    cell: (row: MeasurementWithDetails) => (
      <div className="flex gap-2 justify-end">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40"
          title="Modifica"
          onClick={() => handleEditClick(row)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40"
          title="Elimina"
          onClick={() => handleDeleteClick(row.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  };

  const columns = [
    ...(activeTab === "glucose" 
      ? glucoseColumns 
      : activeTab === "blood_pressure" 
        ? bloodPressureColumns 
        : weightColumns),
    actionsColumn
  ];

  return (
    <DashboardLayout
      currentPage="history"
    >
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Questo eliminerà permanentemente la misurazione dal database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Eliminazione...
                </span>
              ) : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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

      {/* Modal per modifica glicemia */}
      <Dialog open={editModalOpen && selectedMeasurement?.type === "glucose"} onOpenChange={(open) => !open && setEditModalOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifica Misurazione Glicemia</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della misurazione di glicemia.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="glucose-value" className="text-right">
                Valore
              </Label>
              <Input
                id="glucose-value"
                type="number"
                className="col-span-3"
                defaultValue={selectedMeasurement?.glucose?.value}
                onChange={(e) => {
                  if (selectedMeasurement) {
                    setSelectedMeasurement({
                      ...selectedMeasurement,
                      glucose: {
                        ...selectedMeasurement.glucose,
                        value: parseInt(e.target.value)
                      }
                    });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Note
              </Label>
              <Input
                id="notes"
                className="col-span-3"
                defaultValue={selectedMeasurement?.notes || ""}
                onChange={(e) => {
                  if (selectedMeasurement) {
                    setSelectedMeasurement({
                      ...selectedMeasurement,
                      notes: e.target.value
                    });
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditModalOpen(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (selectedMeasurement) {
                  updateGlucoseMutation.mutate({
                    id: selectedMeasurement.id,
                    type: selectedMeasurement.type,
                    notes: selectedMeasurement.notes,
                    glucose: selectedMeasurement.glucose
                  });
                }
              }}
              disabled={updateGlucoseMutation.isPending}
            >
              {updateGlucoseMutation.isPending ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio...
                </span>
              ) : "Salva modifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal per modifica pressione */}
      <Dialog open={editModalOpen && selectedMeasurement?.type === "blood_pressure"} onOpenChange={(open) => !open && setEditModalOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifica Misurazione Pressione</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della misurazione di pressione sanguigna.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="systolic" className="text-right">
                Sistolica
              </Label>
              <Input
                id="systolic"
                type="number"
                className="col-span-3"
                defaultValue={selectedMeasurement?.bloodPressure?.systolic}
                onChange={(e) => {
                  if (selectedMeasurement) {
                    setSelectedMeasurement({
                      ...selectedMeasurement,
                      bloodPressure: {
                        ...selectedMeasurement.bloodPressure,
                        systolic: parseInt(e.target.value)
                      }
                    });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="diastolic" className="text-right">
                Diastolica
              </Label>
              <Input
                id="diastolic"
                type="number"
                className="col-span-3"
                defaultValue={selectedMeasurement?.bloodPressure?.diastolic}
                onChange={(e) => {
                  if (selectedMeasurement) {
                    setSelectedMeasurement({
                      ...selectedMeasurement,
                      bloodPressure: {
                        ...selectedMeasurement.bloodPressure,
                        diastolic: parseInt(e.target.value)
                      }
                    });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="heart-rate" className="text-right">
                Freq. cardiaca
              </Label>
              <Input
                id="heart-rate"
                type="number"
                className="col-span-3"
                defaultValue={selectedMeasurement?.bloodPressure?.heartRate}
                onChange={(e) => {
                  if (selectedMeasurement) {
                    setSelectedMeasurement({
                      ...selectedMeasurement,
                      bloodPressure: {
                        ...selectedMeasurement.bloodPressure,
                        heartRate: parseInt(e.target.value)
                      }
                    });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes-bp" className="text-right">
                Note
              </Label>
              <Input
                id="notes-bp"
                className="col-span-3"
                defaultValue={selectedMeasurement?.notes || ""}
                onChange={(e) => {
                  if (selectedMeasurement) {
                    setSelectedMeasurement({
                      ...selectedMeasurement,
                      notes: e.target.value
                    });
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditModalOpen(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (selectedMeasurement) {
                  updateBloodPressureMutation.mutate({
                    id: selectedMeasurement.id,
                    type: selectedMeasurement.type,
                    notes: selectedMeasurement.notes,
                    bloodPressure: selectedMeasurement.bloodPressure
                  });
                }
              }}
              disabled={updateBloodPressureMutation.isPending}
            >
              {updateBloodPressureMutation.isPending ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio...
                </span>
              ) : "Salva modifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal per modifica peso */}
      <Dialog open={editModalOpen && selectedMeasurement?.type === "weight"} onOpenChange={(open) => !open && setEditModalOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifica Misurazione Peso</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della misurazione del peso.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weight-value" className="text-right">
                Peso (kg)
              </Label>
              <Input
                id="weight-value"
                type="number"
                step="0.1"
                className="col-span-3"
                defaultValue={selectedMeasurement?.weight ? (selectedMeasurement.weight.value / 1000).toFixed(1) : ""}
                onChange={(e) => {
                  if (selectedMeasurement) {
                    const weightKg = parseFloat(e.target.value);
                    setSelectedMeasurement({
                      ...selectedMeasurement,
                      weight: {
                        ...selectedMeasurement.weight,
                        value: Math.round(weightKg * 1000) // Convertire in grammi
                      }
                    });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes-weight" className="text-right">
                Note
              </Label>
              <Input
                id="notes-weight"
                className="col-span-3"
                defaultValue={selectedMeasurement?.notes || ""}
                onChange={(e) => {
                  if (selectedMeasurement) {
                    setSelectedMeasurement({
                      ...selectedMeasurement,
                      notes: e.target.value
                    });
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditModalOpen(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (selectedMeasurement) {
                  updateWeightMutation.mutate({
                    id: selectedMeasurement.id,
                    type: selectedMeasurement.type,
                    notes: selectedMeasurement.notes,
                    weight: selectedMeasurement.weight
                  });
                }
              }}
              disabled={updateWeightMutation.isPending}
            >
              {updateWeightMutation.isPending ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio...
                </span>
              ) : "Salva modifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}