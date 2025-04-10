import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BLOOD_PRESSURE_THRESHOLDS, HEART_RATE_THRESHOLDS } from "@shared/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Create a custom schema for the form
const bloodPressureFormSchema = z.object({
  systolic: z.number()
    .min(BLOOD_PRESSURE_THRESHOLDS.SYSTOLIC.LOW, `Il valore deve essere almeno ${BLOOD_PRESSURE_THRESHOLDS.SYSTOLIC.LOW} mmHg`)
    .max(250, "Il valore non può superare 250 mmHg"),
  diastolic: z.number()
    .min(BLOOD_PRESSURE_THRESHOLDS.DIASTOLIC.LOW, `Il valore deve essere almeno ${BLOOD_PRESSURE_THRESHOLDS.DIASTOLIC.LOW} mmHg`)
    .max(150, "Il valore non può superare 150 mmHg"),
  heartRate: z.number()
    .min(HEART_RATE_THRESHOLDS.LOW, `Il valore deve essere almeno ${HEART_RATE_THRESHOLDS.LOW} BPM`)
    .max(220, "Il valore non può superare 220 BPM")
    .optional(),
  condition: z.enum(["rest", "activity"]),
  notes: z.string().optional(),
});

interface BloodPressureFormProps {
  timestamp: string;
  notes: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function BloodPressureForm({ timestamp, notes, onCancel, onSuccess }: BloodPressureFormProps) {
  const { user } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [formattedDateTime, setFormattedDateTime] = useState("");

  useEffect(() => {
    // Update the current date and time when the component mounts
    const now = new Date();
    setCurrentDateTime(now);
    setFormattedDateTime(
      format(now, "dd MMMM yyyy, HH:mm", { locale: it })
    );
  }, []);

  const form = useForm<z.infer<typeof bloodPressureFormSchema>>({
    resolver: zodResolver(bloodPressureFormSchema),
    defaultValues: {
      systolic: 120,
      diastolic: 80,
      heartRate: 72,
      condition: "rest",
      notes: "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof bloodPressureFormSchema>) => {
      if (!user) throw new Error("Utente non autenticato");

      // Prepare notes with condition information
      let noteText = formData.notes || "";
      const conditionText = formData.condition === "rest" ? "A riposo" : "Dopo attività fisica";
      if (noteText) {
        noteText = `${conditionText}. ${noteText}`;
      } else {
        noteText = conditionText;
      }

      const measurementData = {
        userId: user.id,
        systolic: formData.systolic,
        diastolic: formData.diastolic,
        heartRate: formData.heartRate,
        timestamp: currentDateTime,
        notes: noteText,
      };

      const res = await apiRequest("POST", "/api/measurements/blood-pressure", measurementData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements/stats/blood_pressure"] });
      form.reset({
        systolic: 120,
        diastolic: 80,
        heartRate: 72,
        condition: "rest",
        notes: "",
      });
      onSuccess();
    },
  });

  const onSubmit = (formData: z.infer<typeof bloodPressureFormSchema>) => {
    saveMutation.mutate(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md mb-4">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Data e ora: {formattedDateTime}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="systolic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sistolica (mmHg)</FormLabel>
                <FormControl>
                  <div className="flex">
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="rounded-r-none"
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                      mmHg
                    </span>
                  </div>
                </FormControl>
                <FormDescription>
                  Valori normali: {BLOOD_PRESSURE_THRESHOLDS.SYSTOLIC.NORMAL_MIN}-{BLOOD_PRESSURE_THRESHOLDS.SYSTOLIC.NORMAL_MAX} mmHg
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="diastolic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Diastolica (mmHg)</FormLabel>
                <FormControl>
                  <div className="flex">
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="rounded-r-none"
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                      mmHg
                    </span>
                  </div>
                </FormControl>
                <FormDescription>
                  Valori normali: {BLOOD_PRESSURE_THRESHOLDS.DIASTOLIC.NORMAL_MIN}-{BLOOD_PRESSURE_THRESHOLDS.DIASTOLIC.NORMAL_MAX} mmHg
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="heartRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Battiti cardiaci (BPM)</FormLabel>
              <FormControl>
                <div className="flex">
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                    className="rounded-r-none"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                    BPM
                  </span>
                </div>
              </FormControl>
              <FormDescription>
                Valori normali: {HEART_RATE_THRESHOLDS.NORMAL_MIN}-{HEART_RATE_THRESHOLDS.NORMAL_MAX} BPM (a riposo)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="condition"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Condizione</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="rest" />
                    </FormControl>
                    <FormLabel className="font-normal">A riposo</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="activity" />
                    </FormControl>
                    <FormLabel className="font-normal">Dopo attività fisica</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Inserisci eventuali note (es. sintomi, farmaci assunti, ecc.)"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Indietro
          </Button>
          <Button 
            type="submit" 
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
