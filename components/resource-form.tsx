"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Resource } from "@/lib/project-types"
import { motion } from "framer-motion"

interface ResourceFormProps {
  resource?: Resource
  onSave: (resource: Omit<Resource, "id"> | Resource) => void
  onCancel: () => void
}

export function ResourceForm({ resource, onSave, onCancel }: ResourceFormProps) {
  const [formData, setFormData] = useState<Omit<Resource, "id">>({
    name: resource?.name || "",
    type: resource?.type || "human",
    hourly_rate: resource?.hourly_rate || 0,
    availability_hours: resource?.availability_hours || 160,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert("El nombre del recurso es requerido")
      return
    }

    if (formData.hourly_rate <= 0) {
      alert("La tarifa por hora debe ser mayor a 0")
      return
    }

    if (formData.availability_hours <= 0) {
      alert("Las horas de disponibilidad deben ser mayores a 0")
      return
    }

    if (resource) {
      onSave({ ...formData, id: resource.id })
    } else {
      onSave(formData)
    }
  }

  return (
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
      <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
        <label className="block text-sm font-medium text-foreground mb-2">Nombre *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nombre del recurso"
          required
        />
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
        <label className="block text-sm font-medium text-foreground mb-2">Tipo *</label>
        <select
          className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as "human" | "material" })}
        >
          <option value="Humano">Humano</option>
          <option value="Material">Material</option>
        </select>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 gap-4"
        variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
      >
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Tarifa por Hora ($) *</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.hourly_rate}
            onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Horas Disponibles *</label>
          <Input
            type="number"
            min="0"
            value={formData.availability_hours}
            onChange={(e) => setFormData({ ...formData, availability_hours: Number(e.target.value) })}
            required
          />
        </div>
      </motion.div>

      <motion.div
        className="flex gap-3 pt-4"
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      >
        <Button type="submit" className="flex-1">
          {resource ? "Actualizar Recurso" : "Crear Recurso"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
          Cancelar
        </Button>
      </motion.div>
    </motion.form>
  )
}
