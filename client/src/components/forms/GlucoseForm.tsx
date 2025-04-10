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
import { createGlucoseMeasurementSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { GLUCOSE_THRESHOLDS } from "@shared/constants";
import { useMutation } from "@tanstack/react-query";

// Create a custom schema for the form
const glucoseFormSchema = z.object({
  value: z.number()
    .min(GLUCOSE_THRESHOLDS.LOW, `Il valore deve essere almeno ${GLUCOSE_THRESHOLDS.LOW} mg/dL`)
    .max(600, "Il valore non può superare 600 mg/dL"),
});

interface GlucoseFormProps {
  timestamp: string;
  notes: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function GlucoseForm({ timestamp, notes, onCancel, onSuccess }: GlucoseFormProps) {
  const { user } = useAuth();

  const form = useForm<z.infer<typeof glucoseFormSchema>>({
    resolver: zodResolver(glucoseFormSchema),
    defaultValues: {
      value: 100,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof glucoseFormSchema>) => {
      if (!user) throw new Error("Utente non autenticato");

      const measurementData = {
        userId: user.id,
        value: formData.value,
        timestamp: timestamp ? new Date(timestamp) : undefined,
        notes,
      };

      const res = await apiRequest("POST", "/api/measurements/glucose", measurementData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements/stats/glucose"] });
      onSuccess();
    },
  });

  const onSubmit = (formData: z.infer<typeof glucoseFormSchema>) => {
    saveMutation.mutate(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valore (mg/dL)</FormLabel>
              <FormControl>
                <div className="flex">
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="rounded-r-none"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                    mg/dL
                  </span>
                </div>
              </FormControl>
              <FormDescription>
                Valori normali: {GLUCOSE_THRESHOLDS.NORMAL_MIN}-{GLUCOSE_THRESHOLDS.NORMAL_MAX} mg/dL (a digiuno)
              </FormDescription>
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
