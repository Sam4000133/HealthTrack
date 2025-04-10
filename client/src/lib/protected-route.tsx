import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Role } from "@shared/schema";

export function ProtectedRoute({
  path,
  component: Component,
  roles,
}: {
  path: string;
  component: () => React.JSX.Element;
  roles?: Role[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If roles are specified, check if user has the required role
  if (roles && !roles.includes(user.role)) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accesso negato</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
            Non hai i permessi necessari per accedere a questa pagina.
          </p>
          <a href="/" className="text-primary hover:underline">
            Torna alla Dashboard
          </a>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
