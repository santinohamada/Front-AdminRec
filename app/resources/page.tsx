"use client"

import { useState, useMemo } from "react"
import { useProjectStore } from "@/store/projectStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialogCustom } from "@/components/ui/alert-dialog-custom"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { ResourceForm } from "@/components/resource/resource-form"
import { PlusIcon, SearchIcon, PackageIcon, TrendingUpIcon, ClockIcon, DollarSignIcon } from "lucide-react"
import { motion } from "framer-motion"
import type { Resource } from "@/lib/project-types"

export default function ResourcesPage() {
  const { resources, createResource, updateResource, deleteResource } = useProjectStore()
  console.log(resources)
  const { dialogState, confirm, closeDialog } = useConfirmDialog()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "human" | "software" | "infrastructure">("all")
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | undefined>()

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === "all" || resource.type === filterType
      return matchesSearch && matchesType
    })
  }, [resources, searchQuery, filterType])

  const stats = useMemo(() => {
    const totalResources = resources.length
    const totalHours = resources.reduce((sum, r) => sum + (r.available_hours ?? 0), 0)
    const avgUtilization =
      resources.length > 0
        ? resources.reduce((sum, r) => sum + (r.assigned_hours ?? 0) / (r.total_hours ?? 0) * 100 , 0) / resources.length
        : 0
    const totalValue = resources.reduce((sum, r) => sum + (r.hourly_rate ?? 0) * (r.available_hours ?? 0), 0)
    
    return { totalResources, totalHours, avgUtilization, totalValue }
  }, [resources])

  const handleSaveResource = async (resourceData: Omit<Resource, "id"> | Resource) => {
    // detectar si es update o create
    const isUpdate = (resourceData as Resource).id !== undefined && (resourceData as Resource).id !== null
    const saved = isUpdate ? await updateResource(resourceData as Resource) : await createResource(resourceData as Omit<Resource, "id">)

    if (saved) {
      setIsResourceModalOpen(false)
      setEditingResource(undefined)
    }
  }

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource)
    setIsResourceModalOpen(true)
  }

  const handleDeleteResource = async (resource: Resource) => {
    const confirmed = await confirm({
      title: "Eliminar Recurso",
      description: `¿Estás seguro de que quieres eliminar "${resource.name}"?`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "destructive",
    })

    if (confirmed) {
      await deleteResource(resource.id)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      human: "Humano",
      software: "Software",
      infrastructure: "Infraestructura",
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      human: "bg-blue-100 text-blue-800",
      software: "bg-green-100 text-green-800",
      infrastructure: "bg-purple-100 text-purple-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recursos</h1>
            <p className="text-muted-foreground mt-1">Gestiona todos los recursos de la organización</p>
          </div>
          <Button onClick={() => setIsResourceModalOpen(true)} className="w-full md:w-auto">
            <PlusIcon className="w-4 h-4 mr-2" />
            Nuevo Recurso
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PackageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Recursos</p>
                <p className="text-2xl font-bold">{stats.totalResources}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ClockIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horas Disponibles</p>
                <p className="text-2xl font-bold">{stats.totalHours.toLocaleString()}h</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUpIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Utilización Promedio</p>
                <p className="text-2xl font-bold">{stats.avgUtilization.toFixed(1)}%</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSignIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
        <div className="flex flex-col md:flex-row md:flex-nowrap flex-wrap gap-4">
  <div className="flex-1 relative">
    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input
      placeholder="Buscar recursos..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-10"
    />
  </div>
  <div className="flex flex-wrap gap-2">
    <Button
      variant={filterType === "all" ? "default" : "outline"}
      onClick={() => setFilterType("all")}
      size="sm"
    >
      Todos
    </Button>
    <Button
      variant={filterType === "human" ? "default" : "outline"}
      onClick={() => setFilterType("human")}
      size="sm"
    >
      Humanos
    </Button>
    <Button
      variant={filterType === "software" ? "default" : "outline"}
      onClick={() => setFilterType("software")}
      size="sm"
    >
      Software
    </Button>
    <Button
      variant={filterType === "infrastructure" ? "default" : "outline"}
      onClick={() => setFilterType("infrastructure")}
      size="sm"
    >
      Infraestructura
    </Button>
  </div>
</div>

        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => {
            const utilization =  (resource.assigned_hours ?? 0) / (resource.total_hours ?? 0) * 100 ?? 0
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{resource.name}</h3>
                        <Badge className={`mt-1 ${getTypeColor(resource.type)}`}>
                          {getTypeLabel(resource.type)}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tarifa por hora:</span>
                        <span className="font-medium">${resource.hourly_rate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Horas disponibles:</span>
                        <span className="font-medium">{resource.available_hours}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Utilización:</span>
                        <span className="font-medium">{utilization.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            utilization > 80 ? "bg-red-500" : utilization > 50 ? "bg-yellow-500" : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditResource(resource)}
                        className="flex-1"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteResource(resource)}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {filteredResources.length === 0 && (
          <Card className="p-12 text-center">
            <PackageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron recursos</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterType !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza agregando tu primer recurso"}
            </p>
            {!searchQuery && filterType === "all" && (
              <Button onClick={() => setIsResourceModalOpen(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Crear Recurso
              </Button>
            )}
          </Card>
        )}
      </div>

      <Dialog
        open={isResourceModalOpen}
        onOpenChange={(isOpen) => {
          setIsResourceModalOpen(isOpen)
          if (!isOpen) {
            setEditingResource(undefined)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingResource ? "Editar Recurso" : "Nuevo Recurso"}</DialogTitle>
          </DialogHeader>
          <ResourceForm
            resource={editingResource}
            onSave={handleSaveResource}
            onCancel={() => {
              setIsResourceModalOpen(false)
              setEditingResource(undefined)
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialogCustom
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        description={dialogState.description}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
      />
    </div>
  )
}
