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
import { createGlucoseMeasurementSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { GLUCOSE_THRESHOLDS } from "@shared/constants";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Create a custom schema for the form
const glucoseFormSchema = z.object({
  value: z.number()
    .min(GLUCOSE_THRESHOLDS.LOW, `Il valore deve essere almeno ${GLUCOSE_THRESHOLDS.LOW} mg/dL`)
    .max(600, "Il valore non può superare 600 mg/dL"),
  condition: z.enum(["rest", "activity"]),
  notes: z.string().optional(),
});

interface GlucoseFormProps {
  timestamp: string;
  notes: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function GlucoseForm({ timestamp, notes, onCancel, onSuccess }: GlucoseFormProps) {
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

  const form = useForm<z.infer<typeof glucoseFormSchema>>({
    resolver: zodResolver(glucoseFormSchema),
    defaultValues: {
      value: 100,
      condition: "rest",
      notes: "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof glucoseFormSchema>) => {
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
        value: formData.value,
        timestamp: currentDateTime,
        notes: noteText,
      };

      const res = await apiRequest("POST", "/api/measurements/glucose", measurementData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements/stats/glucose"] });
      form.reset({
        value: 100,
        condition: "rest",
        notes: "",
      });
      onSuccess();
    },
  });

  const onSubmit = (formData: z.infer<typeof glucoseFormSchema>) => {
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
                  placeholder="Inserisci eventuali note (es. cibi consumati, sintomi, ecc.)"
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
