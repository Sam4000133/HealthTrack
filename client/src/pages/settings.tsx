import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const { user } = useAuth();

  // Funzione di dimostrazione per salvare le impostazioni
  const saveSettings = () => {
    toast({
      title: "Impostazioni salvate",
      description: "Le tue impostazioni sono state salvate con successo."
    });
  };

  return (
    <DashboardLayout currentPage="settings">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Impostazioni</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestisci le tue preferenze e configurazioni dell'applicazione.
          </p>
          
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Generali</TabsTrigger>
                <TabsTrigger value="appearance">Aspetto</TabsTrigger>
                <TabsTrigger value="notifications">Notifiche</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>Impostazioni Generali</CardTitle>
                    <CardDescription>
                      Configura le impostazioni base dell'applicazione.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="app-language">Lingua</Label>
                      <select 
                        id="app-language"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="it">Italiano</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuso orario</Label>
                      <select 
                        id="timezone"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="Europe/Rome">Europe/Rome (GMT+1)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (GMT-5)</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-save">Salvataggio automatico</Label>
                        <p className="text-sm text-muted-foreground">
                          Salva automaticamente le misurazioni mentre le stai inserendo
                        </p>
                      </div>
                      <Switch id="auto-save" defaultChecked={true} />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={saveSettings}>Salva impostazioni</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="appearance">
                <Card>
                  <CardHeader>
                    <CardTitle>Aspetto</CardTitle>
                    <CardDescription>
                      Personalizza l'aspetto dell'applicazione.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Tema</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <div 
                          className="flex flex-col items-center space-y-2 border rounded-md p-4 cursor-pointer hover:border-primary"
                        >
                          <div className="w-full h-20 bg-white rounded border"></div>
                          <span>Chiaro</span>
                        </div>
                        <div 
                          className="flex flex-col items-center space-y-2 border rounded-md p-4 cursor-pointer hover:border-primary"
                        >
                          <div className="w-full h-20 bg-gray-900 rounded border"></div>
                          <span>Scuro</span>
                        </div>
                        <div 
                          className="flex flex-col items-center space-y-2 border rounded-md p-4 cursor-pointer hover:border-primary"
                        >
                          <div className="w-full h-20 bg-gradient-to-b from-white to-gray-900 rounded border"></div>
                          <span>Sistema</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="density">Densità interfaccia</Label>
                      <select 
                        id="density"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="compact">Compatta</option>
                        <option value="normal" selected>Normale</option>
                        <option value="comfortable">Confortevole</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="animations">Animazioni</Label>
                        <p className="text-sm text-muted-foreground">
                          Abilita le animazioni dell'interfaccia
                        </p>
                      </div>
                      <Switch id="animations" defaultChecked={true} />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={saveSettings}>Salva impostazioni</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notifiche</CardTitle>
                    <CardDescription>
                      Configura le preferenze di notifica.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Notifiche email</Label>
                        <p className="text-sm text-muted-foreground">
                          Ricevi notifiche via email
                        </p>
                      </div>
                      <Switch id="email-notifications" defaultChecked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-notifications">Notifiche push</Label>
                        <p className="text-sm text-muted-foreground">
                          Ricevi notifiche push sul browser
                        </p>
                      </div>
                      <Switch id="push-notifications" defaultChecked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="reminders">Promemoria</Label>
                        <p className="text-sm text-muted-foreground">
                          Ricevi promemoria per le misurazioni
                        </p>
                      </div>
                      <Switch id="reminders" defaultChecked={true} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reminder-time">Orario promemoria</Label>
                      <Input id="reminder-time" type="time" defaultValue="09:00" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={saveSettings}>Salva impostazioni</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}