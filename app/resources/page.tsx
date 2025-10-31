"use client"

import { useState, useMemo } from "react"
import { useProjectStore } from "@/store/projectStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/modal"
import { ResourceForm } from "@/components/resource/resource-form"
import { PlusIcon, SearchIcon, PackageIcon, TrendingUpIcon, ClockIcon, DollarSignIcon } from "lucide-react"
import { motion } from "framer-motion"
import type { Resource } from "@/lib/project-types"

export default function ResourcesPage() {
  const { resources, createResource, updateResource, deleteResource, getResourceUtilization } = useProjectStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "human" | "material" | "equipment">("all")
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
    const totalHours = resources.reduce((sum, r) => sum + r.available_hours, 0)
    const avgUtilization =
      resources.length > 0 ? resources.reduce((sum, r) => sum + getResourceUtilization(r.id), 0) / resources.length : 0
    const totalValue = resources.reduce((sum, r) => sum + r.hourly_rate * r.available_hours, 0)

    return { totalResources, totalHours, avgUtilization, totalValue }
  }, [resources, getResourceUtilization])

  const handleSaveResource = async (resourceData: Omit<Resource, "id"> | Resource) => {
    const saved = await ("id" in resourceData ? updateResource(resourceData as Resource) : createResource(resourceData))

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
    if (confirm(`¿Estás seguro de que quieres eliminar "${resource.name}"?`)) {
      await deleteResource(resource.id)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      human: "Humano",
      material: "Material",
      equipment: "Equipo",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeColor = (type: string) => {
    const colors = {
      human: "bg-blue-100 text-blue-800",
      material: "bg-green-100 text-green-800",
      equipment: "bg-purple-100 text-purple-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
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

        {/* Stats Cards */}
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
                <p className="text-2xl font-bold">{stats.totalHours.toLocaleString()}</p>
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

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar recursos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
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
                variant={filterType === "material" ? "default" : "outline"}
                onClick={() => setFilterType("material")}
                size="sm"
              >
                Materiales
              </Button>
              <Button
                variant={filterType === "equipment" ? "default" : "outline"}
                onClick={() => setFilterType("equipment")}
                size="sm"
              >
                Equipos
              </Button>
            </div>
          </div>
        </Card>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => {
            const utilization = getResourceUtilization(resource.id)
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
                        <Badge className={`mt-1 ${getTypeColor(resource.type)}`}>{getTypeLabel(resource.type)}</Badge>
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

                    {/* Utilization Bar */}
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

      {/* Resource Form Modal */}
      <Modal
        isOpen={isResourceModalOpen}
        onClose={() => {
          setIsResourceModalOpen(false)
          setEditingResource(undefined)
        }}
        title={editingResource ? "Editar Recurso" : "Nuevo Recurso"}
      >
        <ResourceForm
          resource={editingResource}
          onSave={handleSaveResource}
          onCancel={() => {
            setIsResourceModalOpen(false)
            setEditingResource(undefined)
          }}
        />
      </Modal>
    </div>
  )
}
