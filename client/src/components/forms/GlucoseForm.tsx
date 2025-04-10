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
import { Switch } from "@/components/ui/switch";
import { createGlucoseMeasurementSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { GLUCOSE_THRESHOLDS } from "@shared/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { format, parse } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";


// Create a custom schema for the form
const glucoseFormSchema = z.object({
  value: z.number()
    .min(GLUCOSE_THRESHOLDS.LOW, `Il valore deve essere almeno ${GLUCOSE_THRESHOLDS.LOW} mg/dL`)
    .max(600, "Il valore non può superare 600 mg/dL"),
  notes: z.string().optional(),
  customDate: z.boolean().default(false),
  dateTime: z.date().optional(),
});

interface GlucoseFormProps {
  timestamp: string;
  notes: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function GlucoseForm({ timestamp, notes, onCancel, onSuccess }: GlucoseFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [formattedDateTime, setFormattedDateTime] = useState("");
  const queryClient = useQueryClient();

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
      notes: "",
      customDate: false,
      dateTime: new Date(),
    },
  });

  const customDate = form.watch("customDate");
  const selectedDateTime = form.watch("dateTime");

  useEffect(() => {
    if (selectedDateTime && customDate) {
      setFormattedDateTime(format(selectedDateTime, "dd MMMM yyyy, HH:mm", { locale: it }));
    }
  }, [selectedDateTime, customDate]);

  const saveMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof glucoseFormSchema>) => {
      if (!user) throw new Error("Utente non autenticato");

      // Get notes from form
      const noteText = formData.notes || "";

      // Determine which timestamp to use
      const timestamp = formData.customDate && formData.dateTime 
        ? formData.dateTime 
        : currentDateTime;

      const measurementData = {
        userId: user.id,
        value: formData.value,
        timestamp: timestamp,
        notes: noteText,
      };

      try {
        const res = await apiRequest("POST", "/api/measurements/glucose", measurementData);
        return await res.json();
      } catch (error) {
        console.error("Error saving measurement:", error);
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante il salvataggio della misurazione",
          variant: "destructive",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements/stats/glucose"] });

      // Aggiorna la data/ora corrente
      const now = new Date();
      setCurrentDateTime(now);
      setFormattedDateTime(format(now, "dd MMMM yyyy, HH:mm", { locale: it }));

      form.reset({
        value: 100,
        notes: "",
        customDate: false,
        dateTime: now,
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
        <FormField
          control={form.control}
          name="customDate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Usa data e ora personalizzate</FormLabel>
                <FormDescription>
                  Attiva per inserire una misurazione con data e ora diverse da quelle attuali
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (!checked) {
                      // Reset to current date time when turning off
                      const now = new Date();
                      setCurrentDateTime(now);
                      setFormattedDateTime(
                        format(now, "dd MMMM yyyy, HH:mm", { locale: it })
                      );
                      form.setValue("dateTime", now);
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {customDate ? (
          <FormField
            control={form.control}
            name="dateTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data e ora della misurazione</FormLabel>
                <FormControl>
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const date = e.target.value;
                        if (date) {
                          const time = field.value ? format(field.value, "HH:mm") : "00:00";
                          const newDate = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
                          field.onChange(newDate);
                        }
                      }}
                      className="w-full"
                    />
                    <Input
                      type="time"
                      value={field.value ? format(field.value, "HH:mm") : ""}
                      onChange={(e) => {
                        const time = e.target.value;
                        if (time) {
                          const date = field.value ? format(field.value, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
                          const newDate = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
                          field.onChange(newDate);
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md mb-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Data e ora: {formattedDateTime}
            </p>
          </div>
        )}

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