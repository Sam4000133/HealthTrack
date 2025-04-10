import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GlucoseForm from "@/components/forms/GlucoseForm";
import BloodPressureForm from "@/components/forms/BloodPressureForm";
import WeightForm from "@/components/forms/WeightForm";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Measurements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("glucose");

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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="glucose">Glicemia</TabsTrigger>
                <TabsTrigger value="blood-pressure">Pressione</TabsTrigger>
                <TabsTrigger value="weight">Peso</TabsTrigger>
              </TabsList>
              
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
        </div>
      </div>
    </DashboardLayout>
  );
}
