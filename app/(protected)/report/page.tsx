"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GeneralReport } from "@/components/report/GeneralReport"; // Ajusta la ruta
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale"; // Para fechas en español
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Hooks de React Query
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useResources } from "@/hooks/useResources";
import { useAssignments } from "@/hooks/useAssignments";
import { useAuthStore } from "@/store/authStore";

export default function GeneralReportPage() {
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // --- Estado para el Rango de Fechas ---
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30), // Por defecto, últimos 30 días
    to: new Date(),
  });

  // --- Carga de TODOS los datos ---
  const { data: projects = [], isLoading: pLoading } = useProjects();
  const { data: tasks = [], isLoading: tLoading } = useTasks();
  const { data: resources = [], isLoading: rLoading } = useResources();
  const { data: resourceAssignments = [], isLoading: aLoading } =
    useAssignments();

  const isLoading = pLoading || tLoading || rLoading || aLoading;
  const currentUser = useAuthStore((state)=>state.currentUser)
  // Lógica de descarga de PDF
  useEffect(() => {
    if (isDownloading) {
      const generatePdf = async () => {
        if (!reportRef.current) {
          setIsDownloading(false);
          return;
        }
        try {
          const canvas = await html2canvas(reportRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
          });
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = pageWidth;
          const imgHeight = (canvas.height * pageWidth) / canvas.width;
          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          while (heightLeft > 0) {
            position = position - pageHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
          pdf.save("Reporte_General_Proyectos.pdf");
        } catch (error) {
          console.error("Error al generar el PDF:", error);
          alert("Hubo un error al generar el PDF.");
        } finally {
          setIsDownloading(false);
        }
      };
      setTimeout(generatePdf, 100);
    }
  }, [isDownloading]);

  const handleDownloadClick = () => {
    if (!isDownloading) {
      setIsDownloading(true);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[800px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Barra de Controles */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          ← Volver
        </Button>

        {/* Selector de Fechas */}
        <div className={cn("grid gap-2")}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                      {format(date.to, "LLL dd, y", { locale: es })}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y", { locale: es })
                  )
                ) : (
                  <span>Elige un rango de fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button onClick={handleDownloadClick} disabled={isDownloading}>
          {isDownloading ? "Generando..." : "Descargar PDF"}
        </Button>
      </div>

      {/* Contenedor del Reporte */}
      <div
        ref={reportRef}
        className={`rounded-xl shadow-lg p-6 ${
          isDownloading ? "bg-white text-black" : "bg-card text-foreground"
        }`}
        style={
          isDownloading ? { backgroundColor: "#ffffff", color: "#000000" } : undefined
        }
      >
        <GeneralReport
          projects={projects}
          tasks={tasks}
          currentUser={currentUser}
          resources={resources}
          assignments={resourceAssignments}
          startDate={date?.from}
          endDate={date?.to}
          isPdfMode={isDownloading}
        />
      </div>
    </div>
  );
}