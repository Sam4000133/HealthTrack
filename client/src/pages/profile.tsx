import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Il nome deve essere lungo almeno 2 caratteri" }),
  email: z.string().email({ message: "Email non valida" }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Password form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "La password attuale è richiesta" }),
  newPassword: z.string().min(6, { message: "La nuova password deve essere lunga almeno 6 caratteri" }),
  confirmPassword: z.string().min(1, { message: "La conferma della password è richiesta" }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// Notification settings schema
const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  abnormalValuesAlerts: z.boolean(),
  measurementReminders: z.boolean(),
  appUpdates: z.boolean(),
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form setup
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  // Password form setup
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notification settings form setup
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      abnormalValuesAlerts: true,
      measurementReminders: false,
      appUpdates: true,
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!user) throw new Error("Utente non autenticato");
      
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profilo aggiornato",
        description: "Le tue informazioni sono state aggiornate con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Aggiornamento fallito",
        description: error.message || "Si è verificato un errore durante l'aggiornamento del profilo.",
        variant: "destructive",
      });
    },
  });

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      if (!user) throw new Error("Utente non autenticato");
      
      const res = await apiRequest("POST", `/api/users/${user.id}/password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password aggiornata",
        description: "La tua password è stata aggiornata con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Aggiornamento password fallito",
        description: error.message || "Si è verificato un errore durante l'aggiornamento della password.",
        variant: "destructive",
      });
    },
  });

  // Notification settings update mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      if (!user) throw new Error("Utente non autenticato");
      
      // Mock API call, in a real app this would update user preferences
      toast({
        title: "Preferenze notifiche",
        description: "Funzionalità in fase di sviluppo",
      });
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Preferenze aggiornate",
        description: "Le tue preferenze di notifica sono state aggiornate.",
      });
    },
  });

  // Form submission handlers
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };

  const onNotificationSubmit = (data: NotificationFormValues) => {
    updateNotificationsMutation.mutate(data);
  };

  // Get initials for avatar
  const getInitials = () => {
    if (!user?.name) return "U";
    return user.name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <DashboardLayout currentPage="profile">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Profilo Utente
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gestisci le tue informazioni personali e le impostazioni dell'account
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profilo</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="notifications">Notifiche</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Dati personali</CardTitle>
                    <CardDescription>
                      Aggiorna le tue informazioni personali. Questi dati saranno mostrati pubblicamente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form id="profile-form" onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome completo</FormLabel>
                              <FormControl>
                                <Input placeholder="Mario Rossi" {...field} />
                              </FormControl>
                              <FormDescription>
                                Questo è il nome che sarà mostrato al tuo medico e agli altri utenti.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Indirizzo email</FormLabel>
                              <FormControl>
                                <Input placeholder="mario.rossi@example.com" {...field} />
                              </FormControl>
                              <FormDescription>
                                Il tuo indirizzo email verrà utilizzato per le notifiche e per il recupero dell'account.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button 
                      type="submit" 
                      form="profile-form"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Salvataggio..." : "Salva modifiche"}
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Dati account</CardTitle>
                    <CardDescription>
                      Queste informazioni sono utilizzate per l'accesso all'applicazione.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nome utente
                          </label>
                          <Input value={user?.username || ""} disabled />
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Il nome utente non può essere modificato.
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Ruolo
                          </label>
                          <Input 
                            value={
                              user?.role === "admin" 
                                ? "Amministratore" 
                                : user?.role === "doctor" 
                                  ? "Medico" 
                                  : "Utente"
                            } 
                            disabled 
                          />
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Il ruolo può essere modificato solo da un amministratore.
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Data registrazione
                        </label>
                        <Input 
                          value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""} 
                          disabled 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle>Aggiorna password</CardTitle>
                    <CardDescription>
                      Cambia la tua password per migliorare la sicurezza del tuo account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form id="password-form" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password attuale</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormDescription>
                                Inserisci la tua password attuale per confermare la tua identità.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Separator />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nuova password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormDescription>
                                La password deve essere lunga almeno 6 caratteri.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conferma nuova password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button 
                      type="submit" 
                      form="password-form"
                      disabled={updatePasswordMutation.isPending}
                    >
                      {updatePasswordMutation.isPending ? "Aggiornamento..." : "Aggiorna password"}
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Sicurezza account</CardTitle>
                    <CardDescription>
                      Gestisci le opzioni di sicurezza del tuo account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Autenticazione a due fattori</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Aggiungi un ulteriore livello di sicurezza al tuo account.
                          </p>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: "2FA",
                              description: "Funzionalità in fase di sviluppo",
                            });
                          }}
                        >
                          Configura
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Sessioni attive</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Gestisci i dispositivi su cui hai effettuato l'accesso.
                          </p>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: "Sessioni",
                              description: "Funzionalità in fase di sviluppo",
                            });
                          }}
                        >
                          Gestisci
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferenze di notifica</CardTitle>
                    <CardDescription>
                      Scegli quali notifiche desideri ricevere e come riceverle.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...notificationForm}>
                      <form id="notification-form" onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Notifiche email</FormLabel>
                                <FormDescription>
                                  Ricevi notifiche via email oltre che nell'app.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="abnormalValuesAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Avvisi valori anomali</FormLabel>
                                <FormDescription>
                                  Ricevi notifiche quando i tuoi valori sono fuori dai range normali.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="measurementReminders"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Promemoria misurazioni</FormLabel>
                                <FormDescription>
                                  Ricevi promemoria per inserire le tue misurazioni giornaliere.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="appUpdates"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Aggiornamenti app</FormLabel>
                                <FormDescription>
                                  Ricevi notifiche su nuove funzionalità e aggiornamenti dell'app.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button 
                      type="submit" 
                      form="notification-form"
                      disabled={updateNotificationsMutation.isPending}
                    >
                      {updateNotificationsMutation.isPending ? "Salvataggio..." : "Salva preferenze"}
                    </Button>
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
