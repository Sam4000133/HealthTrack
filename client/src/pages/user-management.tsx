import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { User, insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Edit, Trash2, UserCog, Shield } from "lucide-react";
import { format } from "date-fns";

// Form schema for adding a new user
const newUserSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Le password non corrispondono",
  path: ["confirmPassword"],
});

type NewUserFormValues = z.infer<typeof newUserSchema>;

export default function UserManagement() {
  const { toast } = useToast();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Form for adding a new user
  const form = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      role: "user",
      email: "",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: NewUserFormValues) => {
      // Remove confirmPassword before sending to server
      const { confirmPassword, ...createUserData } = userData;
      const res = await apiRequest("POST", "/api/users", createUserData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddUserOpen(false);
      form.reset();
      toast({
        title: "Utente creato",
        description: "Il nuovo utente è stato creato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore nella creazione",
        description: error.message || "Si è verificato un errore durante la creazione dell'utente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NewUserFormValues) => {
    createUserMutation.mutate(data);
  };

  // User list columns
  const userColumns = [
    {
      header: "Nome",
      accessorKey: "name",
    },
    {
      header: "Username",
      accessorKey: "username",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Ruolo",
      accessorKey: "role",
      cell: (row: User) => {
        let badgeClass = "";
        switch (row.role) {
          case "admin":
            badgeClass = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
            break;
          case "doctor":
            badgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            break;
          default:
            badgeClass = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {row.role === "admin" ? "Amministratore" : row.role === "doctor" ? "Medico" : "Utente"}
          </Badge>
        );
      },
    },
    {
      header: "Registrato",
      accessorKey: "createdAt",
      cell: (row: User) => 
        row.createdAt ? format(new Date(row.createdAt), 'dd/MM/yyyy') : "-",
    },
    {
      header: "Azioni",
      accessorKey: (row: User) => row.id,
      cell: (row: User) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              toast({
                title: "Modifica utente",
                description: "Funzionalità in fase di sviluppo",
              });
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              toast({
                title: "Gestione ruolo",
                description: "Funzionalità in fase di sviluppo",
              });
            }}
          >
            <UserCog className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              toast({
                title: "Elimina utente",
                description: "Funzionalità in fase di sviluppo",
              });
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout currentPage="users">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Gestione Utenti</h1>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="inline-flex items-center">
                  <UserPlus className="mr-2 -ml-1 h-5 w-5" />
                  Nuovo Utente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Crea nuovo utente</DialogTitle>
                  <DialogDescription>
                    Inserisci i dati del nuovo utente. Clicca su salva quando hai finito.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome utente</FormLabel>
                          <FormControl>
                            <Input placeholder="nome.utente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Mario Rossi" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="mario.rossi@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ruolo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona un ruolo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">Paziente</SelectItem>
                              <SelectItem value="doctor">Medico</SelectItem>
                              <SelectItem value="admin">Amministratore</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Scegli il tipo di account.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            La password deve essere lunga almeno 6 caratteri.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conferma password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? "Creazione..." : "Crea utente"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="users">Utenti</TabsTrigger>
                <TabsTrigger value="roles">Ruoli e Permessi</TabsTrigger>
                <TabsTrigger value="activity">Attività</TabsTrigger>
              </TabsList>
              
              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>Tutti gli utenti</CardTitle>
                    <CardDescription>Gestisci gli utenti della piattaforma.</CardDescription>
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
                        data={users || []}
                        columns={userColumns}
                        searchable
                        searchKey="name"
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="roles">
                <Card>
                  <CardHeader>
                    <CardTitle>Ruoli e Permessi</CardTitle>
                    <CardDescription>Gestisci i ruoli degli utenti e i relativi permessi.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <Shield className="h-6 w-6 text-red-500 mr-2" />
                          <h3 className="text-lg font-medium">Amministratore</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Accesso completo alla piattaforma e a tutte le sue funzionalità.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
                          <Badge className="justify-center bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Gestione utenti</Badge>
                          <Badge className="justify-center bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Gestione ruoli</Badge>
                          <Badge className="justify-center bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Gestione pazienti</Badge>
                          <Badge className="justify-center bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Visualizzazione dati</Badge>
                          <Badge className="justify-center bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Modifica dati</Badge>
                          <Badge className="justify-center bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Impostazioni</Badge>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <Shield className="h-6 w-6 text-blue-500 mr-2" />
                          <h3 className="text-lg font-medium">Medico</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Accesso ai dati dei pazienti assegnati e alla gestione delle loro misurazioni.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
                          <Badge className="justify-center bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Gestione pazienti</Badge>
                          <Badge className="justify-center bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Visualizzazione dati</Badge>
                          <Badge className="justify-center bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Analisi statistiche</Badge>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <Shield className="h-6 w-6 text-green-500 mr-2" />
                          <h3 className="text-lg font-medium">Utente (Paziente)</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Accesso limitato ai propri dati e misurazioni.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
                          <Badge className="justify-center bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Inserimento misurazioni</Badge>
                          <Badge className="justify-center bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Visualizzazione personale</Badge>
                          <Badge className="justify-center bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Profilo personale</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Attività utenti</CardTitle>
                    <CardDescription>Monitora le attività recenti degli utenti sulla piattaforma.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>Il monitoraggio delle attività sarà disponibile a breve.</p>
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
