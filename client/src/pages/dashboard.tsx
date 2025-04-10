import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PatientInfo from "@/components/dashboard/PatientInfo";
import StatsCard from "@/components/dashboard/StatsCard";
import VitalChart from "@/components/dashboard/VitalChart";
import MeasurementTable from "@/components/dashboard/MeasurementTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import { MeasurementWithDetails } from "@shared/schema";
import { 
  GLUCOSE_THRESHOLDS, 
  BLOOD_PRESSURE_THRESHOLDS, 
  StatusCategory 
} from "@shared/constants";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch latest measurements
  const { data: latestMeasurements, isLoading: isLatestLoading } = useQuery({
    queryKey: ["/api/measurements/latest"],
  });

  // Fetch recent glucose data for chart
  const { data: glucoseData, isLoading: isGlucoseLoading } = useQuery<MeasurementWithDetails[]>({
    queryKey: ["/api/measurements/stats/glucose/7"],
  });
  
  // Fetch previous period glucose data for comparison
  const { data: previousGlucoseData, isLoading: isPrevGlucoseLoading } = useQuery<MeasurementWithDetails[]>({
    queryKey: ["/api/measurements/stats/previous/glucose/7"],
  });

  // Fetch recent blood pressure data for chart
  const { data: bpData, isLoading: isBPLoading } = useQuery<MeasurementWithDetails[]>({
    queryKey: ["/api/measurements/stats/blood_pressure/7"],
  });
  
  // Fetch previous period blood pressure data for comparison
  const { data: previousBpData, isLoading: isPrevBpLoading } = useQuery<MeasurementWithDetails[]>({
    queryKey: ["/api/measurements/stats/previous/blood_pressure/7"],
  });
  
  // Fetch recent weight data for chart
  const { data: weightData, isLoading: isWeightLoading } = useQuery<MeasurementWithDetails[]>({
    queryKey: ["/api/measurements/stats/weight/7"],
  });
  
  // Fetch previous period weight data for comparison
  const { data: previousWeightData, isLoading: isPrevWeightLoading } = useQuery<MeasurementWithDetails[]>({
    queryKey: ["/api/measurements/stats/previous/weight/7"],
  });

  // Fetch recent measurements for table
  const { data: recentMeasurements, isLoading: isMeasurementsLoading } = useQuery<MeasurementWithDetails[]>({
    queryKey: ["/api/measurements", { limit: 20 }],
  });

  // Functions to determine status for different measurement types
  const getGlucoseStatus = (measurement: MeasurementWithDetails): StatusCategory => {
    if (!measurement.glucose) return StatusCategory.NORMAL;
    
    const value = measurement.glucose.value;
    
    if (value > GLUCOSE_THRESHOLDS.VERY_HIGH) return StatusCategory.VERY_HIGH;
    if (value > GLUCOSE_THRESHOLDS.HIGH) return StatusCategory.HIGH;
    if (value < GLUCOSE_THRESHOLDS.LOW) return StatusCategory.LOW;
    return StatusCategory.NORMAL;
  };

  const getBloodPressureStatus = (measurement: MeasurementWithDetails): StatusCategory => {
    if (!measurement.bloodPressure) return StatusCategory.NORMAL;
    
    const { systolic, diastolic } = measurement.bloodPressure;
    
    if (systolic > BLOOD_PRESSURE_THRESHOLDS.SYSTOLIC.VERY_HIGH || 
        diastolic > BLOOD_PRESSURE_THRESHOLDS.DIASTOLIC.VERY_HIGH) {
      return StatusCategory.VERY_HIGH;
    }
    
    if (systolic > BLOOD_PRESSURE_THRESHOLDS.SYSTOLIC.HIGH || 
        diastolic > BLOOD_PRESSURE_THRESHOLDS.DIASTOLIC.HIGH) {
      return StatusCategory.HIGH;
    }
    
    if (systolic < BLOOD_PRESSURE_THRESHOLDS.SYSTOLIC.LOW || 
        diastolic < BLOOD_PRESSURE_THRESHOLDS.DIASTOLIC.LOW) {
      return StatusCategory.LOW;
    }
    
    return StatusCategory.NORMAL;
  };

  const getWeightStatus = (_: MeasurementWithDetails): StatusCategory => {
    // We don't have specific thresholds for weight in this implementation
    return StatusCategory.NORMAL;
  };

  const handleExportCSV = async () => {
    try {
      window.open('/api/export/measurements', '_blank');
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  // Format values for different measurement types
  const formatGlucoseValue = (measurement: MeasurementWithDetails): string => {
    return measurement.glucose ? `${measurement.glucose.value} mg/dL` : "";
  };

  const formatBloodPressureValue = (measurement: MeasurementWithDetails): string => {
    return measurement.bloodPressure 
      ? `${measurement.bloodPressure.systolic}/${measurement.bloodPressure.diastolic} mmHg` 
      : "";
  };

  const formatWeightValue = (measurement: MeasurementWithDetails): string => {
    return measurement.weight 
      ? `${(measurement.weight.value / 1000).toFixed(1)} kg` 
      : "";
  };

  // Type labels for the table
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "glucose": return "Glicemia";
      case "blood_pressure": return "Pressione";
      case "weight": return "Peso";
      default: return type;
    }
  };

  // Get value label for the table
  const getValueLabel = (measurement: MeasurementWithDetails): string => {
    switch (measurement.type) {
      case "glucose":
        return formatGlucoseValue(measurement);
      case "blood_pressure":
        return formatBloodPressureValue(measurement);
      case "weight":
        return formatWeightValue(measurement);
      default:
        return "";
    }
  };

  // Get value for chart
  const getGlucoseValue = (measurement: MeasurementWithDetails): number => {
    return measurement.glucose?.value || 0;
  };

  const getBloodPressureValue = (measurement: MeasurementWithDetails): { systolic: number; diastolic: number; heartRate: number } => {
    return {
      systolic: measurement.bloodPressure?.systolic || 0,
      diastolic: measurement.bloodPressure?.diastolic || 0,
      heartRate: measurement.bloodPressure?.heartRate || 0
    };
  };

  const getWeightValue = (measurement: MeasurementWithDetails): number => {
    return measurement.weight?.value || 0;
  };

  return (
    <DashboardLayout currentPage="dashboard">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          
          {/* Patient Info Card */}
          <div className="mt-4">
            <PatientInfo userId={user?.id} />
          </div>
          
          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Glicemia */}
            <StatsCard
              title="Glicemia"
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                </svg>
              }
              color="indigo"
              measurement={latestMeasurements?.glucose}
              isLoading={isLatestLoading}
              formatValue={formatGlucoseValue}
              getStatus={getGlucoseStatus}
            />
            
            {/* Pressione */}
            <StatsCard
              title="Pressione"
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              }
              color="red"
              measurement={latestMeasurements?.blood_pressure}
              isLoading={isLatestLoading}
              formatValue={formatBloodPressureValue}
              getStatus={getBloodPressureStatus}
            />
            
            {/* Peso */}
            <StatsCard
              title="Peso"
              icon={
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
                </svg>
              }
              color="green"
              measurement={latestMeasurements?.weight}
              isLoading={isLatestLoading}
              formatValue={formatWeightValue}
              getStatus={getWeightStatus}
            />
          </div>
          
          {/* Charts Section */}
          <div className="mt-6">
            {/* Charts stacked vertically */}
            <div className="grid grid-cols-1 gap-5 mb-5">
              {/* Blood Glucose Chart */}
              <Card>
                <CardContent className="p-0">
                  <VitalChart
                    title="Andamento Glicemia"
                    subtitle="Ultimi 7 giorni"
                    data={glucoseData || []}
                    isLoading={isGlucoseLoading}
                    type="glucose"
                    getValue={getGlucoseValue}
                    upperLimit={GLUCOSE_THRESHOLDS.HIGH}
                    lowerLimit={GLUCOSE_THRESHOLDS.LOW}
                    previousData={previousGlucoseData || []}
                    isPreviousLoading={isPrevGlucoseLoading}
                  />
                </CardContent>
              </Card>
              
              {/* Blood Pressure Chart */}
              <Card>
                <CardContent className="p-0">
                  <VitalChart
                    title="Andamento Pressione"
                    subtitle="Ultimi 7 giorni"
                    data={bpData || []}
                    isLoading={isBPLoading}
                    type="blood_pressure"
                    getValue={getBloodPressureValue}
                    previousData={previousBpData || []}
                    isPreviousLoading={isPrevBpLoading}
                  />
                </CardContent>
              </Card>
              
              {/* Weight Chart */}
              <Card>
                <CardContent className="p-0">
                  <VitalChart
                    title="Andamento Peso"
                    subtitle="Ultimi 7 giorni"
                    data={weightData || []}
                    isLoading={isWeightLoading}
                    type="weight"
                    getValue={getWeightValue}
                    previousData={previousWeightData || []}
                    isPreviousLoading={isPrevWeightLoading}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Recent Measurements */}
          <div className="mt-6">
            <MeasurementTable
              measurements={recentMeasurements || []}
              isLoading={isMeasurementsLoading}
              getTypeLabel={getTypeLabel}
              getValueLabel={getValueLabel}
              getStatus={(m) => {
                switch (m.type) {
                  case "glucose": return getGlucoseStatus(m);
                  case "blood_pressure": return getBloodPressureStatus(m);
                  case "weight": return getWeightStatus(m);
                  default: return StatusCategory.NORMAL;
                }
              }}
              onExport={handleExportCSV}
            />
          </div>
          
          {/* Add Measurement Button (Fixed at bottom right on mobile) */}
          <div className="fixed bottom-20 right-4 lg:hidden">
            <Link href="/measurements">
              <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0">
                <Plus className="h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
