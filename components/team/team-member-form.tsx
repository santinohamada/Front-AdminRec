"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TeamMember, NewTeamMember } from "@/lib/project-types"
import { motion } from "framer-motion"

interface TeamMemberFormProps {
  member?: TeamMember
  onSave: (memberData: NewTeamMember | TeamMember) => void
  onCancel: () => void
}

export function TeamMemberForm({ member, onSave, onCancel }: TeamMemberFormProps) {
  const [formData, setFormData] = useState({
    name: member?.name || "",
    dni: member?.dni || "",
    phone: member?.phone || "",
    email: member?.email || "",
    domicilio: member?.domicilio || "",
    password:member?.password || ""
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    }
    if (!formData.dni.trim()) {
      newErrors.dni = "El DNI es requerido"
    }
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido"
    }
    if (!formData.password.trim()) {
      newErrors.password = "La contraseña es requerida"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (member) {
      onSave({ ...formData, id: member.id })
    } else {
      onSave(formData)
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <Label htmlFor="name">Nombre Completo *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ingrese el nombre completo"
          className="mt-1.5"
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="dni">DNI *</Label>
        <Input
          id="dni"
          value={formData.dni}
          onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
          placeholder="Ingrese el DNI"
          className="mt-1.5"
        />
        {errors.dni && <p className="text-sm text-red-500 mt-1">{errors.dni}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="ejemplo@email.com"
          className="mt-1.5"
        />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Teléfono *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+54 9 11 1234-5678"
          className="mt-1.5"
        />
        {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <div>
        <Label htmlFor="domicilio">Domicilio</Label>
        <Input
          id="domicilio"
          value={formData.domicilio}
          onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
          placeholder="Calle, número, ciudad"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Contraseña0!"
          type="password"
          className="mt-1.5"
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{member ? "Actualizar Miembro" : "Crear Miembro"}</Button>
      </div>
    </motion.form>
  )
}
