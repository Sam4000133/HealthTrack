import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  AlertCircle,
  Bell,
  CheckCircle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeasurementWithDetails } from "@shared/schema";
import { 
  GLUCOSE_THRESHOLDS, 
  BLOOD_PRESSURE_THRESHOLDS, 
  StatusCategory 
} from "@shared/constants";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  severity: "high" | "medium" | "low" | "info";
  measurementId?: number;
};

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch recent measurements to check for abnormal values
  const { data: recentMeasurements } = useQuery<MeasurementWithDetails[]>({
    queryKey: ["/api/measurements", { limit: 10 }],
  });

  // Generate notifications based on measurement data
  useEffect(() => {
    if (!recentMeasurements) return;

    const newNotifications: Notification[] = [];

    recentMeasurements.forEach((measurement) => {
      let notification: Notification | null = null;

      if (measurement.type === "glucose" && measurement.glucose) {
        const value = measurement.glucose.value;
        
        if (value > GLUCOSE_THRESHOLDS.VERY_HIGH) {
          notification = {
            id: `glucose-${measurement.id}`,
            title: "Glicemia molto alta",
            description: `Valore ${value} mg/dL alle ${format(new Date(measurement.timestamp), 'HH:mm')} il ${format(new Date(measurement.timestamp), 'dd/MM/yyyy')}`,
            timestamp: new Date(measurement.timestamp),
            read: false,
            severity: "high",
            measurementId: measurement.id,
          };
        } else if (value > GLUCOSE_THRESHOLDS.HIGH) {
          notification = {
            id: `glucose-${measurement.id}`,
            title: "Glicemia alta",
            description: `Valore ${value} mg/dL alle ${format(new Date(measurement.timestamp), 'HH:mm')} il ${format(new Date(measurement.timestamp), 'dd/MM/yyyy')}`,
            timestamp: new Date(measurement.timestamp),
            read: false,
            severity: "medium",
            measurementId: measurement.id,
          };
        } else if (value < GLUCOSE_THRESHOLDS.LOW) {
          notification = {
            id: `glucose-${measurement.id}`,
            title: "Glicemia bassa",
            description: `Valore ${value} mg/dL alle ${format(new Date(measurement.timestamp), 'HH:mm')} il ${format(new Date(measurement.timestamp), 'dd/MM/yyyy')}`,
            timestamp: new Date(measurement.timestamp),
            read: false,
            severity: "medium",
            measurementId: measurement.id,
          };
        }
      } else if (measurement.type === "blood_pressure" && measurement.bloodPressure) {
        const { systolic, diastolic } = measurement.bloodPressure;
        
        if (systolic > BLOOD_PRESSURE_THRESHOLDS.SYSTOLIC.VERY_HIGH) {
          notification = {
            id: `bp-${measurement.id}`,
            title: "Pressione sistolica molto alta",
            description: `Valore ${systolic}/${diastolic} mmHg alle ${format(new Date(measurement.timestamp), 'HH:mm')} il ${format(new Date(measurement.timestamp), 'dd/MM/yyyy')}`,
            timestamp: new Date(measurement.timestamp),
            read: false,
            severity: "high",
            measurementId: measurement.id,
          };
        } else if (systolic > BLOOD_PRESSURE_THRESHOLDS.SYSTOLIC.HIGH || diastolic > BLOOD_PRESSURE_THRESHOLDS.DIASTOLIC.HIGH) {
          notification = {
            id: `bp-${measurement.id}`,
            title: "Pressione elevata",
            description: `Valore ${systolic}/${diastolic} mmHg alle ${format(new Date(measurement.timestamp), 'HH:mm')} il ${format(new Date(measurement.timestamp), 'dd/MM/yyyy')}`,
            timestamp: new Date(measurement.timestamp),
            read: false,
            severity: "medium",
            measurementId: measurement.id,
          };
        } else if (systolic < BLOOD_PRESSURE_THRESHOLDS.SYSTOLIC.LOW || diastolic < BLOOD_PRESSURE_THRESHOLDS.DIASTOLIC.LOW) {
          notification = {
            id: `bp-${measurement.id}`,
            title: "Pressione bassa",
            description: `Valore ${systolic}/${diastolic} mmHg alle ${format(new Date(measurement.timestamp), 'HH:mm')} il ${format(new Date(measurement.timestamp), 'dd/MM/yyyy')}`,
            timestamp: new Date(measurement.timestamp),
            read: false,
            severity: "medium",
            measurementId: measurement.id,
          };
        }
      }

      if (notification) {
        newNotifications.push(notification);
      }
    });

    // Sort by timestamp (most recent first)
    newNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setNotifications(newNotifications);
  }, [recentMeasurements]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return (
          <span className="inline-block h-8 w-8 rounded-full bg-red-100 dark:bg-red-800 text-red-500 dark:text-red-300 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </span>
        );
      case "medium":
        return (
          <span className="inline-block h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-800 text-amber-500 dark:text-amber-300 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </span>
        );
      case "low":
        return (
          <span className="inline-block h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-500 dark:text-blue-300 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </span>
        );
      default:
        return (
          <span className="inline-block h-8 w-8 rounded-full bg-green-100 dark:bg-green-800 text-green-500 dark:text-green-300 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </span>
        );
    }
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon"
        className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
        )}
      </Button>
      
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-sm font-medium">Notifiche</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary-dark"
                >
                  Segna tutte come lette
                </Button>
              )}
            </div>
            
            {notifications.length > 0 ? (
              <>
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`block px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 ${notification.read ? 'opacity-80' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {getSeverityIcon(notification.severity)}
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notification.title}</p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{notification.description}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="px-4 py-2 text-center">
                  <Button variant="link" className="text-sm font-medium text-primary hover:text-primary-dark">
                    Vedi tutte le notifiche
                  </Button>
                </div>
              </>
            ) : (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                <p>Nessuna notifica</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
