"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Project, TeamMember } from "@/lib/project-types"
import { motion } from "framer-motion"

interface ProjectFormProps {
  project?: Project
  teamMembers: TeamMember[] // Added teamMembers prop to populate manager dropdown
  onSave: (projectData: Omit<Project, "id"> | Project) => void
  onCancel: () => void
}

export function ProjectForm({ project, teamMembers, onSave, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    start_date: project?.start_date || "",
    end_date: project?.end_date || "",
    total_budget: project?.total_budget || 0,
    manager_id: project?.manager_id || 0, // Added manager_id to form state
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre del proyecto es requerido"
    }

    if (!formData.description.trim()) {
      newErrors.description = "La descripción es requerida"
    }

    if (!formData.start_date) {
      newErrors.start_date = "La fecha de inicio es requerida"
    }

    if (!formData.end_date) {
      newErrors.end_date = "La fecha de fin es requerida"
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = "La fecha de fin debe ser posterior a la fecha de inicio"
    }

    if (formData.total_budget <= 0) {
      newErrors.total_budget = "El presupuesto debe ser mayor a 0"
    }

    if (!formData.manager_id || formData.manager_id === 0) {
      newErrors.manager_id = "El responsable del proyecto es requerido"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (project) {
      onSave({ ...formData, id: project.id })
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
        <Label htmlFor="name">Nombre del Proyecto</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ingrese el nombre del proyecto"
          className="mt-1.5"
        />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ingrese la descripción del proyecto"
          rows={3}
          className="mt-1.5"
        />
        {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
        <Label htmlFor="manager">Responsable del Proyecto</Label>
        <Select
          value={formData.manager_id.toString()}
          onValueChange={(value) => setFormData({ ...formData, manager_id: Number.parseInt(value) })}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Seleccione el responsable del proyecto" />
          </SelectTrigger>
          <SelectContent>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id.toString()}>
                {member.name} - {member.role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.manager_id && <p className="text-sm text-destructive mt-1">{errors.manager_id}</p>}
      </motion.div>

      <motion.div
        className="grid grid-cols-2 gap-4"
        variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
      >
        <div>
          <Label htmlFor="start_date">Fecha de Inicio</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="mt-1.5"
          />
          {errors.start_date && <p className="text-sm text-destructive mt-1">{errors.start_date}</p>}
        </div>

        <div>
          <Label htmlFor="end_date">Fecha de Fin</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="mt-1.5"
          />
          {errors.end_date && <p className="text-sm text-destructive mt-1">{errors.end_date}</p>}
        </div>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
        <Label htmlFor="total_budget">Presupuesto Total ($)</Label>
        <Input
          id="total_budget"
          type="number"
          min="0"
          step="0.01"
          value={formData.total_budget}
          onChange={(e) => setFormData({ ...formData, total_budget: Number.parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
          className="mt-1.5"
        />
        {errors.total_budget && <p className="text-sm text-destructive mt-1">{errors.total_budget}</p>}
      </motion.div>

      <motion.div
        className="flex justify-end gap-3 pt-4"
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      >
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{project ? "Actualizar Proyecto" : "Crear Proyecto"}</Button>
      </motion.div>
    </motion.form>
  )
}
