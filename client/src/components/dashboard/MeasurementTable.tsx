import { useState } from "react";
import { format } from "date-fns";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MeasurementWithDetails } from "@shared/schema";
import { StatusCategory, STATUS_CLASSES } from "@shared/constants";
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  FileDown, 
  Eye 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface MeasurementTableProps {
  measurements: MeasurementWithDetails[];
  isLoading: boolean;
  getTypeLabel: (type: string) => string;
  getValueLabel: (measurement: MeasurementWithDetails) => string;
  getStatus: (measurement: MeasurementWithDetails) => StatusCategory;
  onExport?: () => void;
}

export default function MeasurementTable({
  measurements,
  isLoading,
  getTypeLabel,
  getValueLabel,
  getStatus,
  onExport
}: MeasurementTableProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;

  // Calculate pagination
  const totalItems = measurements?.length || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = measurements?.slice(startIndex, endIndex) || [];

  const handleViewDetails = (id: number) => {
    toast({
      title: "Dettagli misurazione",
      description: `Visualizzando i dettagli della misurazione #${id}`,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Ultime Misurazioni
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Tutte le rilevazioni recenti
          </p>
        </div>
        <div>
          <Button className="inline-flex items-center" onClick={() => onExport && onExport()}>
            <FileDown className="mr-2 -ml-1 h-5 w-5" />
            Esporta CSV
          </Button>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-700">
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valore
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stato
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Note
                </TableHead>
                <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Azioni
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                Array(4).fill(0).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : currentItems.length > 0 ? (
                currentItems.map((measurement) => {
                  const status = getStatus(measurement);
                  const statusClass = STATUS_CLASSES[status].badge;
                  const statusText = STATUS_CLASSES[status].text;

                  return (
                    <TableRow key={measurement.id}>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {format(new Date(measurement.timestamp), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getTypeLabel(measurement.type)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getValueLabel(measurement)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                          {statusText}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {measurement.notes || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(measurement.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Dettagli</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Nessuna misurazione disponibile
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          {totalPages > 1 && (
            <>
              <div className="flex-1 flex justify-between sm:hidden">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Precedente
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Successivo
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Visualizzati <span className="font-medium">{startIndex + 1}</span> - <span className="font-medium">{endIndex}</span> di <span className="font-medium">{totalItems}</span> risultati
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <Button
                      variant="outline"
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <span className="sr-only">Precedente</span>
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <Button
                        key={index}
                        variant={currentPage === index + 1 ? "default" : "outline"}
                        className={`relative inline-flex items-center px-4 py-2 border ${
                          currentPage === index + 1
                            ? "bg-primary text-white"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        }`}
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <span className="sr-only">Successivo</span>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </nav>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
