import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MeasurementForm from "@/components/forms/MeasurementForm";
import GlucoseForm from "@/components/forms/GlucoseForm";
import BloodPressureForm from "@/components/forms/BloodPressureForm";
import WeightForm from "@/components/forms/WeightForm";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Measurements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("general");

  const handleSuccess = () => {
    toast({
      title: "Misurazione salvata",
      description: "La misurazione è stata salvata con successo.",
    });
    
    // Invalidate related queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
    queryClient.invalidateQueries({ queryKey: ["/api/measurements/latest"] });
    queryClient.invalidateQueries({ queryKey: ["/api/measurements/stats"] });
  };

  return (
    <DashboardLayout currentPage="measurements">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Nuova Misurazione</h1>
          
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">Generale</TabsTrigger>
                <TabsTrigger value="glucose">Glicemia</TabsTrigger>
                <TabsTrigger value="blood-pressure">Pressione</TabsTrigger>
                <TabsTrigger value="weight">Peso</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general">
                <Card>
                  <CardContent className="pt-6">
                    <MeasurementForm onSubmitSuccess={handleSuccess} />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="glucose">
                <Card>
                  <CardContent className="pt-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Misurazione Glicemia
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Inserisci il valore della glicemia in mg/dL
                      </p>
                    </div>
                    
                    <GlucoseForm 
                      timestamp=""
                      notes=""
                      onCancel={() => {}}
                      onSuccess={handleSuccess}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="blood-pressure">
                <Card>
                  <CardContent className="pt-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Misurazione Pressione Arteriosa
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Inserisci i valori della pressione sistolica e diastolica in mmHg
                      </p>
                    </div>
                    
                    <BloodPressureForm 
                      timestamp=""
                      notes=""
                      onCancel={() => {}}
                      onSuccess={handleSuccess}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="weight">
                <Card>
                  <CardContent className="pt-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Misurazione Peso Corporeo
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Inserisci il peso corporeo in kg
                      </p>
                    </div>
                    
                    <WeightForm 
                      timestamp=""
                      notes=""
                      onCancel={() => {}}
                      onSuccess={handleSuccess}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Alternative quick input cards */}
            <Card className="overflow-hidden shadow">
              <CardContent className="p-0">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Glicemia</h3>
                  <div className="mt-4 max-w-xl">
                    <div className="flex items-center">
                      <input type="number" className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md" placeholder="Valore in mg/dL" />
                      <span className="ml-2 text-gray-500 dark:text-gray-400">mg/dL</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        toast({
                          title: "Funzionalità rapida",
                          description: "Utilizzare il modulo completo per aggiungere misurazioni",
                        });
                      }}
                    >
                      Aggiungi
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden shadow">
              <CardContent className="p-0">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Pressione</h3>
                  <div className="mt-4 max-w-xl space-y-4">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sistolica</label>
                        <input type="number" className="mt-1 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md" placeholder="Sistolica" />
                      </div>
                      <span className="mx-2 text-gray-500 dark:text-gray-400">/</span>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Diastolica</label>
                        <input type="number" className="mt-1 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md" placeholder="Diastolica" />
                      </div>
                      <span className="ml-2 text-gray-500 dark:text-gray-400">mmHg</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Battiti cardiaci</label>
                      <div className="mt-1 flex items-center">
                        <input type="number" className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md" placeholder="Battiti" />
                        <span className="ml-2 text-gray-500 dark:text-gray-400">BPM</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Funzionalità rapida",
                          description: "Utilizzare il modulo completo per aggiungere misurazioni",
                        });
                      }}
                    >
                      Aggiungi
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden shadow">
              <CardContent className="p-0">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Peso</h3>
                  <div className="mt-4 max-w-xl">
                    <div className="flex items-center">
                      <input type="number" step="0.1" className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md" placeholder="Valore in kg" />
                      <span className="ml-2 text-gray-500 dark:text-gray-400">kg</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        toast({
                          title: "Funzionalità rapida",
                          description: "Utilizzare il modulo completo per aggiungere misurazioni",
                        });
                      }}
                    >
                      Aggiungi
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
