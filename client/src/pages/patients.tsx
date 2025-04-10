import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { User, Patient } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, FileText, Activity, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface PatientWithUser extends Patient {
  user: User;
}

export default function Patients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");

  // Fetch doctor's patients
  const { data: patients, isLoading } = useQuery<PatientWithUser[]>({
    queryKey: ["/api/patients/doctor", user?.id],
    enabled: user?.role === "doctor" || user?.role === "admin",
  });

  // Handle view patient details
  const handleViewPatient = (patientId: number) => {
    toast({
      title: "Visualizzazione paziente",
      description: "Funzionalità in fase di sviluppo",
    });
  };

  // Handle view patient measurements
  const handleViewMeasurements = (patientId: number) => {
    toast({
      title: "Misurazioni paziente",
      description: "Funzionalità in fase di sviluppo",
    });
  };

  // Patient list columns
  const columns = [
    {
      header: "Nome",
      accessorKey: "user.name",
    },
    {
      header: "Email",
      accessorKey: "user.email",
    },
    {
      header: "Patologie",
      accessorKey: "notes",
      cell: (row: PatientWithUser) => (
        <div className="flex flex-wrap gap-1">
          {row.notes ? row.notes.split(',').map((condition, index) => (
            <Badge key={index} variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {condition.trim()}
            </Badge>
          )) : "-"}
        </div>
      ),
    },
    {
      header: "Registrato",
      accessorKey: "user.createdAt",
      cell: (row: PatientWithUser) => 
        row.user.createdAt ? format(new Date(row.user.createdAt), 'dd/MM/yyyy') : "-",
    },
    {
      header: "Azioni",
      accessorKey: (row: PatientWithUser) => row.id,
      cell: (row: PatientWithUser) => (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleViewPatient(row.id)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Dettagli
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleViewMeasurements(row.userId)}
          >
            <Activity className="h-4 w-4 mr-1" />
            Misurazioni
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout currentPage="patients">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Pazienti</h1>
            <Button className="inline-flex items-center">
              <UserPlus className="mr-2 -ml-1 h-5 w-5" />
              Nuovo Paziente
            </Button>
          </div>
          
          {/* Patient Management Tabs */}
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="list">Lista Pazienti</TabsTrigger>
                <TabsTrigger value="assignments">Assegnazioni</TabsTrigger>
                <TabsTrigger value="stats">Statistiche</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list">
                <Card>
                  <CardHeader>
                    <CardTitle>I tuoi pazienti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : (
                      <DataTable
                        data={patients || []}
                        columns={columns}
                        searchable
                        searchKey="user.name"
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="assignments">
                <Card>
                  <CardHeader>
                    <CardTitle>Assegnazione Pazienti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Assegna un nuovo paziente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Paziente
                            </label>
                            <Input placeholder="Cerca paziente..." />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Medico
                            </label>
                            <Input placeholder="Cerca medico..." defaultValue={user?.name || ''} />
                          </div>
                        </div>
                        <Button className="mt-4">
                          Assegna
                        </Button>
                      </div>
                      
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium mb-4">Pazienti recentemente assegnati</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Nessuna assegnazione recente
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="stats">
                <Card>
                  <CardHeader>
                    <CardTitle>Statistiche Pazienti</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-4xl font-bold mb-2">{patients?.length || 0}</div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Pazienti totali
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-4xl font-bold mb-2">0</div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Nuovi questa settimana
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-4xl font-bold mb-2">0</div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Misurazioni oggi
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">Attività recenti</h3>
                      <div className="space-y-4">
                        {/* Activity items would go here */}
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <span className="inline-block h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-500 dark:text-blue-300 flex items-center justify-center">
                              <FileText className="w-5 h-5" />
                            </span>
                          </div>
                          <div className="ml-3 w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Nessuna attività recente
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              Le attività dei pazienti appariranno qui
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
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
