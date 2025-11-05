"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertDialogCustom } from "@/components/ui/alert-dialog-custom"
import type { Resource, ResourceType } from "@/lib/project-types" // Importa ResourceType
import { motion } from "framer-motion"

interface ResourceFormProps {
  resource?: Resource
  onSave: (resource: Omit<Resource, "id"> | Resource) => void
  onCancel: () => void
}

type ResourceFormState = {
  name: string
  type: ResourceType
  hourly_rate: string 
  total_hours: string
  assigned_hours: number
  available_hours: number
}

export function ResourceForm({ resource, onSave, onCancel }: ResourceFormProps) {

  const [formData, setFormData] = useState<ResourceFormState>({
    name: resource?.name || "",
    type: resource?.type || "human",
   
    hourly_rate: resource?.hourly_rate ? String(resource.hourly_rate) : "",
    total_hours: resource?.total_hours ? String(resource.total_hours) : "",
  
    assigned_hours: resource?.assigned_hours || 0,
  
    available_hours: resource?.available_hours ?? (resource?.total_hours || 160),
  })

  const [alertState, setAlertState] = useState<{
    isOpen: boolean
    title: string
    description: string
  }>({
    isOpen: false,
    title: "",
    description: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()


    const hourlyRateValue = parseFloat(formData.hourly_rate) || 0
    const totalHoursValue = parseFloat(formData.total_hours) || 0

    if (!formData.name.trim()) {
      setAlertState({
        isOpen: true,
        title: "Campo requerido",
        description: "El nombre del recurso es requerido",
      })
      return
    }


    if (hourlyRateValue <= 0) {
      setAlertState({
        isOpen: true,
        title: "Valor inválido",
        description: "La tarifa por hora debe ser mayor a 0",
      })
      return
    }


    if (totalHoursValue <= 0) {
      setAlertState({
        isOpen: true,
        title: "Valor inválido",
        description: "Las horas de disponibilidad deben ser mayores a 0",
      })
      return
    }


    const newAvailableHours = totalHoursValue - formData.assigned_hours

    const finalData: Omit<Resource, "id"> = {
      ...formData,
      hourly_rate: hourlyRateValue,
      total_hours: totalHoursValue,
      available_hours: newAvailableHours, 
    }

    if (resource) {
      onSave({ ...finalData, id: resource.id })
    } else {
      onSave(finalData)
    }
  }

  return (
    <>
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
      >
        {/* --- Campo Nombre --- */}
        <motion.div
          variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
        >
          <label className="block text-sm font-medium text-foreground mb-2">
            Nombre *
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nombre del recurso"
            required
          />
        </motion.div>

        {/* --- Campo Tipo --- */}
        <motion.div
          variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
        >
          <label className="block text-sm font-medium text-foreground mb-2">
            Tipo *
          </label>
          <select
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as ResourceType })
            }
          >
            <option value="human">Humano</option>
            <option value="software">Software</option>
            <option value="infrastructure">Infraestructura</option>
          </select>
        </motion.div>

        {/* --- Campos Numéricos --- */}
        <motion.div
          className="grid grid-cols-2 gap-4"
          variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
        >
          {/* --- Campo Tarifa por Hora --- */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tarifa por Hora ($) *
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.hourly_rate} 
              placeholder="15"
              onChange={(e) =>
                setFormData({ ...formData, hourly_rate: e.target.value })
              }
              required
            />
          </div>

          {/* --- Campo Horas Totales --- */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Horas totales
            </label>
            <Input
              type="number"
              min="0"
              value={formData.total_hours} 
              placeholder="120"
              onChange={(e) =>
                setFormData({ ...formData, total_hours: e.target.value })
              }
              required
            />
          </div>
        </motion.div>

        {/* --- Botones --- */}
        <motion.div
          className="flex gap-3 pt-4"
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        >
          <Button type="submit" className="flex-1">
            {resource ? "Actualizar Recurso" : "Crear Recurso"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 bg-transparent"
          >
            Cancelar
          </Button>
        </motion.div>
      </motion.form>

      {/* --- Alert Dialog --- */}
      <AlertDialogCustom
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        title={alertState.title}
        description={alertState.description}
        confirmText="Entendido"
      />
    </>
  )
}