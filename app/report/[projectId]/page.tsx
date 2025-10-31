"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { WeeklyReport } from "@/components/weekly-report"
import { useProjectStore } from "@/store/projectStore"
import html2canvas from "html2canvas-pro"
import jsPDF from "jspdf"

export default function ReportPage() {
  const { projectId } = useParams()
  const router = useRouter()
  const reportRef = useRef<HTMLDivElement>(null)

  const [isDownloading, setIsDownloading] = useState(false)

  const { projects, tasks, resources, resourceAssignments, init } = useProjectStore()

  useEffect(() => {
    init()
  }, [init])

  const project = projects.find((p) => p.id === projectId)
  const projectTasks = tasks.filter((t) => t.project_id === projectId)
  const projectAssignments = resourceAssignments.filter((a) => projectTasks.some((t) => t.id === a.task_id))
  const projectResources = resources.filter((r) => projectAssignments.some((a) => a.resource_id === r.id))

  useEffect(() => {
    if (isDownloading) {
      const generatePdf = async () => {
        if (!reportRef.current) {
          setIsDownloading(false)
          return
        }

        try {
          console.log("Starting PDF generation...")

          const canvas = await html2canvas(reportRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
          })

          console.log("Canvas created successfully")

          const imgData = canvas.toDataURL("image/png")
          const pdf = new jsPDF("p", "mm", "a4")
          const pageWidth = pdf.internal.pageSize.getWidth()
          const pageHeight = pdf.internal.pageSize.getHeight()
          const imgWidth = pageWidth
          const imgHeight = (canvas.height * pageWidth) / canvas.width
          let heightLeft = imgHeight
          let position = 0

          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
          while (heightLeft > 0) {
            position = position - pageHeight
            pdf.addPage()
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
          }

          const fileName = `Reporte_${project!.name.replace(/\s+/g, "_")}.pdf`
          pdf.save(fileName)

          console.log("PDF generated successfully:", fileName)
        } catch (error) {
          console.error("Error al generar el PDF:", error)
          alert("Hubo un error al generar el PDF. Por favor, intenta de nuevo.")
        } finally {
          setIsDownloading(false)
        }
      }

      setTimeout(generatePdf, 100)
    }
  }, [isDownloading]) // Removed project?.name from the dependency array

  const handleDownloadClick = () => {
    if (!isDownloading) {
      setIsDownloading(true)
    }
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">Proyecto no encontrado</div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()}>
          ← Volver
        </Button>
        <Button onClick={handleDownloadClick} disabled={isDownloading}>
          {isDownloading ? "Generando..." : "Descargar PDF"}
        </Button>
      </div>

      <div
        ref={reportRef}
        className={`rounded-xl shadow-lg p-6 ${isDownloading ? "bg-white text-black" : "bg-card text-foreground"}`}
        style={isDownloading ? { backgroundColor: "#ffffff", color: "#000000" } : undefined}
      >
        <WeeklyReport
          project={project}
          tasks={projectTasks}
          resources={projectResources}
          assignments={projectAssignments}
          isPdfMode={isDownloading}
        />
      </div>
    </div>
  )
}
