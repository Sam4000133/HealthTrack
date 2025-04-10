import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MeasurementWithDetails } from "@shared/schema";
import { StatusCategory, STATUS_CLASSES } from "@shared/constants";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface StatsCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  measurement?: MeasurementWithDetails;
  isLoading: boolean;
  formatValue: (measurement: MeasurementWithDetails) => string;
  getStatus: (measurement: MeasurementWithDetails) => StatusCategory;
}

export default function StatsCard({
  title,
  icon,
  color,
  measurement,
  isLoading,
  formatValue,
  getStatus,
}: StatsCardProps) {
  const status = measurement ? getStatus(measurement) : StatusCategory.NORMAL;
  const statusClass = STATUS_CLASSES[status].badge;
  const statusText = STATUS_CLASSES[status].text;

  const formattedDate = measurement?.timestamp 
    ? formatDistanceToNow(new Date(measurement.timestamp), { addSuffix: true, locale: it })
    : "";

  return (
    <Card className="overflow-hidden shadow">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-md p-3 bg-primary-500/20 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300`}>
              {icon}
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {title}
                </dt>
                <dd>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : measurement ? (
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-medium text-gray-900 dark:text-white">
                        {formatValue(measurement)}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusClass}`}>
                        {statusText}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Nessuna misurazione disponibile
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
          <div className="text-sm">
            {isLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : measurement ? (
              <Link to="/measurements">
                <a className="font-medium text-primary hover:text-primary-dark">
                  Ultima misurazione: {formattedDate}
                </a>
              </Link>
            ) : (
              <Link to="/measurements">
                <a className="font-medium text-primary hover:text-primary-dark">
                  Aggiungi prima misurazione
                </a>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
