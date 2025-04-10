import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Patient } from "@shared/schema";

interface PatientInfoProps {
  userId?: number;
}

interface PatientWithDetails extends Patient {
  user?: User;
}

export default function PatientInfo({ userId }: PatientInfoProps) {
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: userId ? ["/api/user", userId] : ["/api/user"],
  });

  const { data: patientData, isLoading: isPatientLoading } = useQuery<PatientWithDetails>({
    queryKey: ["/api/patients/user", userId || user?.id],
    enabled: !!user?.id || !!userId,
  });

  const isLoading = isUserLoading || isPatientLoading;

  // Parse conditions from notes
  const conditions = patientData?.notes
    ? patientData.notes.split(',').map(condition => condition.trim())
    : [];

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <CardTitle className="text-lg leading-6 font-medium">
            Informazioni Paziente
          </CardTitle>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? (
              <Skeleton className="h-4 w-36" />
            ) : (
              `ID: ${user?.id || "-"}`
            )}
          </p>
        </div>
        <div className="text-right">
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <span className="-ml-0.5 mr-1.5 h-2 w-2 rounded-full bg-green-400 inline-block"></span>
            Monitorato
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-700">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome completo</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                user?.name || "-"
              )}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {isLoading ? (
                <Skeleton className="h-4 w-48" />
              ) : (
                user?.email || "-"
              )}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Patologie</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {isLoading ? (
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ) : conditions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {conditions.map((condition, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {condition}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">Nessuna patologia registrata</span>
              )}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Medico curante</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {isLoading ? (
                <Skeleton className="h-4 w-40" />
              ) : patientData?.doctorId ? (
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  <span className="flex items-center">
                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Dr. {patientData?.doctorId}
                  </span>
                </Badge>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">Nessun medico assegnato</span>
              )}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
