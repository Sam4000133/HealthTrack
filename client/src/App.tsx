import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Measurements from "@/pages/measurements";
import Statistics from "@/pages/statistics";
import Patients from "@/pages/patients";
import UserManagement from "@/pages/user-management";
import Profile from "@/pages/profile";
import SecurityPage from "@/pages/security-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/measurements" component={Measurements} />
      <ProtectedRoute path="/statistics" component={Statistics} />
      <ProtectedRoute path="/patients" component={Patients} roles={["admin", "doctor"]} />
      <ProtectedRoute path="/users" component={UserManagement} roles={["admin"]} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/security" component={SecurityPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
