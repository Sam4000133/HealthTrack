import { useState } from "react";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { MeasurementType } from "@shared/schema";
import GlucoseForm from "./GlucoseForm";
import BloodPressureForm from "./BloodPressureForm";
import WeightForm from "./WeightForm";
import { useToast } from "@/hooks/use-toast";

interface MeasurementFormProps {
  onSubmitSuccess?: () => void;
}

// Form schema for measurement type selection
const measurementTypeSchema = z.object({
  type: z.enum(["glucose", "blood_pressure", "weight"] as const),
  timestamp: z.string().optional(),
  notes: z.string().optional(),
});

type MeasurementTypeFormValues = z.infer<typeof measurementTypeSchema>;

export default function MeasurementForm({ onSubmitSuccess }: MeasurementFormProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<MeasurementType | null>(null);

  // Form for selecting measurement type
  const form = useForm<MeasurementTypeFormValues>({
    resolver: zodResolver(measurementTypeSchema),
    defaultValues: {
      type: "glucose",
      timestamp: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:MM
      notes: "",
    },
  });

  const onSubmit = (data: MeasurementTypeFormValues) => {
    setSelectedType(data.type as MeasurementType);
  };

  const handleReset = () => {
    form.reset();
    setSelectedType(null);
  };

  return (
    <div className="space-y-6">
      {!selectedType ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo di misurazione</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona il tipo di misurazione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="glucose">Glicemia</SelectItem>
                      <SelectItem value="blood_pressure">Pressione arteriosa</SelectItem>
                      <SelectItem value="weight">Peso corporeo</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timestamp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e ora</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>
                    Data e ora della misurazione
                  </FormDescription>
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
                      placeholder="Aggiungi informazioni rilevanti (es. prima/dopo i pasti, attività fisica, ecc.)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Informazioni aggiuntive sulla misurazione (opzionale)
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={handleReset}>
                Annulla
              </Button>
              <Button type="submit">
                Continua
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {selectedType === "glucose" && "Misurazione Glicemia"}
              {selectedType === "blood_pressure" && "Misurazione Pressione Arteriosa"}
              {selectedType === "weight" && "Misurazione Peso Corporeo"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Inserisci i valori per la misurazione selezionata
            </p>
          </div>

          {selectedType === "glucose" && (
            <GlucoseForm 
              timestamp={form.getValues().timestamp} 
              notes={form.getValues().notes || ""}
              onCancel={() => setSelectedType(null)}
              onSuccess={() => {
                toast({
                  title: "Misurazione salvata",
                  description: "La misurazione della glicemia è stata salvata con successo.",
                });
                setSelectedType(null);
                form.reset();
                onSubmitSuccess?.();
              }}
            />
          )}

          {selectedType === "blood_pressure" && (
            <BloodPressureForm 
              timestamp={form.getValues().timestamp} 
              notes={form.getValues().notes || ""}
              onCancel={() => setSelectedType(null)}
              onSuccess={() => {
                toast({
                  title: "Misurazione salvata",
                  description: "La misurazione della pressione arteriosa è stata salvata con successo.",
                });
                setSelectedType(null);
                form.reset();
                onSubmitSuccess?.();
              }}
            />
          )}

          {selectedType === "weight" && (
            <WeightForm 
              timestamp={form.getValues().timestamp} 
              notes={form.getValues().notes || ""}
              onCancel={() => setSelectedType(null)}
              onSuccess={() => {
                toast({
                  title: "Misurazione salvata",
                  description: "La misurazione del peso è stata salvata con successo.",
                });
                setSelectedType(null);
                form.reset();
                onSubmitSuccess?.();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
