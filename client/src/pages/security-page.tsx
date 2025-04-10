import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Lock, Key, AlertTriangle, RotateCw } from "lucide-react";

export default function SecurityPage() {
  const currentPage = "security";
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("password");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Cambio password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/users/change-password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password aggiornata",
        description: "La tua password è stata aggiornata con successo",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante l'aggiornamento della password",
        variant: "destructive",
      });
    },
  });

  // 2FA setup mutation
  const setupTwoFactorMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/users/setup-2fa");
      return res.json();
    },
    onSuccess: (data) => {
      setShowQrCode(true);
      toast({
        title: "2FA configurato",
        description: "Scansiona il codice QR con la tua app di autenticazione",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante la configurazione dell'autenticazione a due fattori",
        variant: "destructive",
      });
    },
  });

  // 2FA verify mutation
  const verifyTwoFactorMutation = useMutation({
    mutationFn: async (data: { verificationCode: string }) => {
      const res = await apiRequest("POST", "/api/users/verify-2fa", data);
      return res.json();
    },
    onSuccess: () => {
      setIsTwoFactorEnabled(true);
      setShowQrCode(false);
      setVerificationCode("");
      toast({
        title: "2FA attivato",
        description: "L'autenticazione a due fattori è stata attivata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Codice non valido",
        description: error.message || "Il codice di verifica inserito non è valido",
        variant: "destructive",
      });
    },
  });

  // 2FA disable mutation
  const disableTwoFactorMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/users/disable-2fa");
      return res.json();
    },
    onSuccess: () => {
      setIsTwoFactorEnabled(false);
      toast({
        title: "2FA disattivato",
        description: "L'autenticazione a due fattori è stata disattivata",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore durante la disattivazione dell'autenticazione a due fattori",
        variant: "destructive",
      });
    },
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non corrispondono",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Errore",
        description: "La password deve contenere almeno 8 caratteri",
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleTwoFactorSetup = () => {
    setupTwoFactorMutation.mutate();
  };

  const handleTwoFactorVerify = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      toast({
        title: "Errore",
        description: "Il codice deve contenere 6 cifre",
        variant: "destructive",
      });
      return;
    }
    
    verifyTwoFactorMutation.mutate({ verificationCode });
  };

  const handleTwoFactorDisable = () => {
    disableTwoFactorMutation.mutate();
  };

  return (
    <DashboardLayout currentPage={currentPage}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sicurezza</h1>
        <Shield className="h-8 w-8 text-primary" />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="2fa">Autenticazione a due fattori</TabsTrigger>
        </TabsList>
        
        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> Modifica password
              </CardTitle>
              <CardDescription>
                Aggiorna la tua password per mantenere il tuo account sicuro. Ti consigliamo di utilizzare una password forte e unica.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Password attuale</Label>
                  <Input 
                    id="current-password" 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nuova password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    La password deve contenere almeno 8 caratteri
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Conferma nuova password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button 
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="w-full"
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                      Aggiornamento in corso...
                    </>
                  ) : (
                    "Aggiorna password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Suggerimenti per la sicurezza
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span>Utilizza password diverse per ogni servizio</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span>Crea password complesse con lettere, numeri e simboli</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span>Attiva l'autenticazione a due fattori per maggiore sicurezza</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1 text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span>Cambia la tua password regolarmente</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="2fa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" /> Autenticazione a due fattori (2FA)
              </CardTitle>
              <CardDescription>
                Aggiungi un ulteriore livello di sicurezza al tuo account. Dopo aver configurato l'autenticazione a due fattori, dovrai inserire sia la password che un codice generato dall'app di autenticazione per accedere al tuo account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isTwoFactorEnabled && !showQrCode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Stato 2FA</h3>
                      <p className="text-sm text-gray-500">L'autenticazione a due fattori è disattivata</p>
                    </div>
                    <Button onClick={handleTwoFactorSetup}>Configura 2FA</Button>
                  </div>
                </div>
              ) : showQrCode ? (
                <div className="space-y-4">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-4">
                        Scansiona questo codice QR con la tua app di autenticazione (Google Authenticator, Authy, ecc.)
                      </p>
                      <div className="bg-white p-4 rounded-lg inline-block">
                        {/* Placeholder for QR code - in a real app, this would be an image from the API */}
                        <div className="w-48 h-48 border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <p className="text-gray-500">QR Code</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <form onSubmit={handleTwoFactorVerify} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="verification-code">Codice di verifica</Label>
                      <Input 
                        id="verification-code" 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Inserisci il codice a 6 cifre generato dalla tua app di autenticazione
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        type="submit"
                        disabled={verifyTwoFactorMutation.isPending}
                      >
                        {verifyTwoFactorMutation.isPending ? (
                          <>
                            <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                            Verifica in corso...
                          </>
                        ) : (
                          "Verifica codice"
                        )}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setShowQrCode(false)}
                      >
                        Annulla
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Stato 2FA</h3>
                      <p className="text-sm text-gray-500">L'autenticazione a due fattori è attivata</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="2fa-toggle" className="sr-only">
                        Autenticazione a due fattori
                      </Label>
                      <Switch 
                        id="2fa-toggle" 
                        checked={isTwoFactorEnabled} 
                        onCheckedChange={(checked) => {
                          if (!checked) {
                            handleTwoFactorDisable();
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium mb-2">Codici di backup</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      I codici di backup ti permettono di accedere al tuo account se perdi l'accesso al tuo dispositivo di autenticazione. Conservali in un luogo sicuro.
                    </p>
                    <Button variant="outline" size="sm">
                      Genera nuovi codici di backup
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Informazioni
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm">
                  L'autenticazione a due fattori (2FA) aggiunge un ulteriore livello di sicurezza al tuo account. Dopo averla attivata, dovrai fornire sia la tua password che un codice temporaneo generato dalla tua app di autenticazione ogni volta che accedi.
                </p>
                
                <div className="space-y-2">
                  <h4 className="font-medium">App di autenticazione consigliate:</h4>
                  <ul className="text-sm space-y-1">
                    <li>Google Authenticator (Android, iOS)</li>
                    <li>Authy (Android, iOS, Desktop)</li>
                    <li>Microsoft Authenticator (Android, iOS)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}