"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProjectReport } from "@/components/report/ProjectReport";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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

// --- CAMBIO: Importar el store de autenticación ---
import { useAuthStore } from "@/store/authStore"; // Ajusta la ruta

export default function ProjectReportPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  
  // --- CAMBIO: Estado para el rango de fechas ---
  // A diferencia del general, aquí empezamos sin rango por defecto
  // para mostrar el reporte completo del proyecto.
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  // --- CAMBIO: Obtener el usuario logueado ---
  const { currentUser } = useAuthStore();

  // --- Carga de datos con React Query ---
  const { data: projects = [], isLoading: pLoading } = useProjects();
  const { data: tasks = [], isLoading: tLoading } = useTasks();
  const { data: resources = [], isLoading: rLoading } = useResources();
  const { data: resourceAssignments = [], isLoading: aLoading } =
    useAssignments();

  const project = projects.find((p) => p.id === projectId);
  const projectTasks = tasks.filter((t) => t.project_id === projectId);
  const projectAssignments = resourceAssignments.filter((a) =>
    projectTasks.some((t) => t.id === a.task_id)
  );
  const projectResourceIds = new Set(
    projectAssignments.map((a) => a.resource_id)
  );
  const projectResources = resources.filter((r) =>
    projectResourceIds.has(r.id)
  );

  const isLoading = pLoading || tLoading || rLoading || aLoading;

  // Lógica de PDF (actualizada para depender de 'date')
  useEffect(() => {
    if (isDownloading) {
      const generatePdf = async () => {
        if (!reportRef.current || !project) {
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

          const fileName = `Reporte_${project.name.replace(/\s+/g, "_")}.pdf`;
          pdf.save(fileName);
        } catch (error) {
          console.error("Error al generar el PDF:", error);
          alert("Hubo un error al generar el PDF.");
        } finally {
          setIsDownloading(false);
        }
      };
      setTimeout(generatePdf, 100);
    }
  }, [isDownloading, project, date]); // 'date' añadido como dependencia

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
          <Skeleton className="h-10 w-64" /> {/* Espacio para el picker */}
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[800px] w-full rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Proyecto no encontrado
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* --- CAMBIO: Barra de controles actualizada --- */}
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
                  <span>Filtrar por rango de fechas</span>
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

      <div
        ref={reportRef}
        className={`rounded-xl shadow-lg p-6 ${
          isDownloading ? "bg-white text-black" : "bg-card text-foreground"
        }`}
        style={
          isDownloading
            ? { backgroundColor: "#ffffff", color: "#000000" }
            : undefined
        }
      >
        <ProjectReport
          project={project}
          tasks={projectTasks}
          resources={projectResources}
          assignments={projectAssignments}
          isPdfMode={isDownloading}
          // --- CAMBIO: Props nuevas ---
          currentUser={currentUser}
          startDate={date?.from}
          endDate={date?.to}
        />
      </div>
    </div>
  );
}