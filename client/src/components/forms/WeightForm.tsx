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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";

// Create a custom schema for the form
const weightFormSchema = z.object({
  weightKg: z.number()
    .min(1, "Il peso deve essere almeno 1 kg")
    .max(300, "Il peso non può superare 300 kg"),
});

interface WeightFormProps {
  timestamp: string;
  notes: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function WeightForm({ timestamp, notes, onCancel, onSuccess }: WeightFormProps) {
  const { user } = useAuth();

  const form = useForm<z.infer<typeof weightFormSchema>>({
    resolver: zodResolver(weightFormSchema),
    defaultValues: {
      weightKg: 70,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof weightFormSchema>) => {
      if (!user) throw new Error("Utente non autenticato");

      // Convert kg to grams for the API
      const valueInGrams = Math.round(formData.weightKg * 1000);

      const measurementData = {
        userId: user.id,
        value: valueInGrams,
        timestamp: timestamp ? new Date(timestamp) : undefined,
        notes,
      };

      const res = await apiRequest("POST", "/api/measurements/weight", measurementData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/measurements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/measurements/stats/weight"] });
      onSuccess();
    },
  });

  const onSubmit = (formData: z.infer<typeof weightFormSchema>) => {
    saveMutation.mutate(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
