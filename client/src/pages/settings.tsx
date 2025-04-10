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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  HardDrive, 
  Server, 
  Database, 
  FileText, 
  MailCheck, 
  Send 
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const { user } = useAuth();
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [showSystemLogs, setShowSystemLogs] = useState(false);

  // Funzione di dimostrazione per salvare le impostazioni
  const saveSettings = () => {
    toast({
      title: "Impostazioni salvate",
      description: "Le tue impostazioni sono state salvate con successo."
    });
  };

  // Funzione per inviare email di test
  const sendTestEmail = () => {
    toast({
      title: "Email di test inviata",
      description: "Se la configurazione è corretta, riceverai un'email di test a breve."
    });
  };

  // Dati di esempio per le informazioni di sistema
  const systemInfo = [
    { label: "Sistema Operativo", value: "Linux 5.15.0-58-generic" },
    { label: "Server Web", value: "Node.js v18.12.1 / Express 4.18.2" },
    { label: "Database", value: "PostgreSQL 14.8" },
    { label: "Ambiente", value: "Produzione" },
    { label: "Memoria allocata", value: "512 MB" },
    { label: "Limite upload", value: "10 MB" },
    { label: "Limite POST", value: "8 MB" },
    { label: "Spazio su disco", value: "15.8 GB / 20 GB" },
    { label: "Versione applicazione", value: "1.0.0" },
  ];

  // Dati di esempio per i log di sistema
  const systemLogs = [
    { timestamp: "2023-07-15 09:32:15", level: "INFO", message: "Applicazione avviata correttamente" },
    { timestamp: "2023-07-15 09:32:16", level: "INFO", message: "Connessione al database stabilita" },
    { timestamp: "2023-07-15 10:45:21", level: "WARNING", message: "Tentativo di accesso fallito: utente 'mario'" },
    { timestamp: "2023-07-15 11:23:45", level: "ERROR", message: "Errore nella query: violazione vincolo di chiave esterna" },
    { timestamp: "2023-07-15 12:05:12", level: "INFO", message: "Backup automatico completato con successo" },
    { timestamp: "2023-07-15 14:30:08", level: "INFO", message: "Nuovo utente registrato: giulia@example.com" },
    { timestamp: "2023-07-15 15:12:33", level: "WARNING", message: "Spazio su disco in esaurimento (85% utilizzato)" },
    { timestamp: "2023-07-15 16:45:01", level: "INFO", message: "Aggiornamento sistema completato" },
    { timestamp: "2023-07-15 18:32:56", level: "ERROR", message: "Errore di connessione al servizio email" },
    { timestamp: "2023-07-15 20:15:22", level: "INFO", message: "Manutenzione pianificata completata" },
    { timestamp: "2023-07-16 07:45:12", level: "INFO", message: "Backup quotidiano avviato" },
    { timestamp: "2023-07-16 07:48:33", level: "INFO", message: "Backup quotidiano completato con successo" },
  ];

  return (
    <DashboardLayout currentPage="settings">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Impostazioni</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestisci le tue preferenze e configurazioni dell'applicazione.
          </p>
          
          <div className="flex space-x-4 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowSystemInfo(true)}
              className="flex items-center"
            >
              <Server className="mr-2 h-4 w-4" />
              Informazioni Sistema
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowSystemLogs(true)}
              className="flex items-center"
            >
              <FileText className="mr-2 h-4 w-4" />
              Log Sistema
            </Button>
          </div>
          
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Generali</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
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
              
              <TabsContent value="email">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurazione Email</CardTitle>
                    <CardDescription>
                      Configura il server SMTP per l'invio di email dall'applicazione.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-host">Server SMTP</Label>
                        <Input id="smtp-host" placeholder="smtp.example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">Porta SMTP</Label>
                        <Input id="smtp-port" type="number" placeholder="587" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-username">Username</Label>
                        <Input id="smtp-username" placeholder="username@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-password">Password</Label>
                        <Input id="smtp-password" type="password" placeholder="********" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email-from">Indirizzo mittente</Label>
                      <Input id="email-from" placeholder="noreply@example.com" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email-name">Nome mittente</Label>
                      <Input id="email-name" placeholder="Sistema Monitoraggio Salute" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="smtp-secure">Connessione sicura (SSL/TLS)</Label>
                        <p className="text-sm text-muted-foreground">
                          Utilizza una connessione sicura per l'invio di email
                        </p>
                      </div>
                      <Switch id="smtp-secure" defaultChecked={true} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="test-email">Email di test</Label>
                      <div className="flex space-x-2">
                        <Input id="test-email" placeholder="test@example.com" className="flex-1" />
                        <Button onClick={sendTestEmail} className="flex items-center">
                          <Send className="mr-2 h-4 w-4" />
                          Invia test
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={saveSettings} className="flex items-center">
                      <MailCheck className="mr-2 h-4 w-4" />
                      Salva configurazione email
                    </Button>
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
      
      {/* Modal Informazioni Sistema */}
      <Dialog open={showSystemInfo} onOpenChange={setShowSystemInfo}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              Informazioni di Sistema
            </DialogTitle>
            <DialogDescription>
              Dettagli tecnici del sistema e dell'ambiente di esecuzione.
            </DialogDescription>
          </DialogHeader>
          
          <Table>
            <TableBody>
              {systemInfo.map((info, index) => (
                <TableRow key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                  <TableCell className="font-medium">{info.label}</TableCell>
                  <TableCell>{info.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <DialogFooter>
            <Button onClick={() => setShowSystemInfo(false)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal Log Sistema */}
      <Dialog open={showSystemLogs} onOpenChange={setShowSystemLogs}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Log di Sistema
            </DialogTitle>
            <DialogDescription>
              Registro delle attività e degli eventi di sistema.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Data e Ora</TableHead>
                  <TableHead className="w-[100px]">Livello</TableHead>
                  <TableHead>Messaggio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemLogs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell>
                      <Badge variant={
                        log.level === "ERROR" ? "destructive" : 
                        log.level === "WARNING" ? "outline" : 
                        "secondary"
                      }>
                        {log.level}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" className="mr-2">
              Scarica log
            </Button>
            <Button onClick={() => setShowSystemLogs(false)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}