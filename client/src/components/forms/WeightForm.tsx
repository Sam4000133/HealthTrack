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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Create a custom schema for the form
const weightFormSchema = z.object({
  weightKg: z.number()
    .min(1, "Il peso deve essere almeno 1 kg")
    .max(300, "Il peso non può superare 300 kg"),
  notes: z.string().optional(),
});

interface WeightFormProps {
  timestamp: string;
  notes: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function WeightForm({ timestamp, notes, onCancel, onSuccess }: WeightFormProps) {
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

  const form = useForm<z.infer<typeof weightFormSchema>>({
    resolver: zodResolver(weightFormSchema),
    defaultValues: {
      weightKg: 70,
      notes: "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof weightFormSchema>) => {
      if (!user) throw new Error("Utente non autenticato");

      // Convert kg to grams for the API
      const valueInGrams = Math.round(formData.weightKg * 1000);

      // Get notes from form
      const noteText = formData.notes || "";

      const measurementData = {
        userId: user.id,
        value: valueInGrams,
        timestamp: currentDateTime,
        notes: noteText,
      };

      const res = await apiRequest("POST", "/api/measurements/weight", measurementData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements/stats/weight"] });
      form.reset({
        weightKg: 70,
        notes: "",
      });
      onSuccess();
    },
  });

  const onSubmit = (formData: z.infer<typeof weightFormSchema>) => {
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
          name="weightKg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peso (kg)</FormLabel>
              <FormControl>
                <div className="flex">
                  <Input
                    type="number"
                    step="0.1"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="rounded-r-none"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                    kg
                  </span>
                </div>
              </FormControl>
              <FormDescription>
                Inserisci il peso corporeo in chilogrammi (es. 70.5)
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
                  placeholder="Inserisci eventuali note (es. orario del giorno, abbigliamento indossato, ecc.)"
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
