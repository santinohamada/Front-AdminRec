
# 🚀 Front - Gestion de Proyectos

![Next.js](https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=nextdotjs)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)
![React Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=for-the-badge&logo=react-query)
![Shadcn/UI](https://img.shields.io/badge/Shadcn/UI-000000?style=for-the-badge&logo=shadcnui)

Panel de administración front-end para un sistema avanzado de gestión de proyectos y recursos (Project Management System).

---

## 📖 Descripción General

Este proyecto es el *front-end* de un sistema de gestión de recursos. Permite a los administradores manejar proyectos, tareas, equipos y recursos (humanos, software, etc.), monitorizando costos y disponibilidad.

### ✨ Características Principales

* **Gestión de Proyectos:** Creación, lectura, actualización y eliminación (CRUD) de proyectos.
* **Gestión de Tareas:** Sistema de tareas anidadas por proyecto con asignaciones.
* **Gestión de Recursos:** CRUD para recursos (humanos, software, infraestructura) con seguimiento de utilización.
* **Asignación de Recursos:** Asignación de recursos a tareas específicas.
* **Generación de Reportes PDF:** Creación de reportes dinámicos (general y por proyecto) usando `jsPDF` y `html2canvas`.
* **Estado Asíncrono:** Manejo de datos del servidor con **TanStack Query (React Query)** para caching, re-fetching y mutaciones.
* **Gestión de Estado Global:** Uso de **Zustand** para el estado de autenticación (`authStore`) y UI.
* **Formularios Avanzados:** Creación de formularios robustos y validados con **React Hook Form** y **Zod**.
* **UI Moderna:** Construido con **Shadcn/UI** y estilizado con **Tailwind CSS**.
* **Modo Oscuro/Claro:** Implementado con `next-themes`.
* **Animaciones:** Interfaz de usuario mejorada con **Framer Motion**.
* **Visualización de Datos:** Gráficos y estadísticas con **Recharts**.

---

## ⚙️ Arquitectura y Stack Tecnológico

### 🔗 Backend

Este proyecto es el *front-end* y consume una API REST. El *backend* está construido con **.NET** y se encuentra en un repositorio separado.

* **Repositorio Backend:** **[inakigarcia1/gestion-proyectos](https://github.com/inakigarcia1/gestion-proyectos)**

### 🛠️ Stack Tecnológico Front-end

* **Framework:** [Next.js](https://nextjs.org/) (v15+ con App Router)
* **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
* **UI:** [React](https://react.dev/) (v19)
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
* **Componentes:** [Shadcn/UI](https://ui.shadcn.com/)
* **Iconos:** [Lucide React](https://lucide.dev/)
* **Animaciones:** [Framer Motion](https://www.framer.com/motion/)
* **Temas:** [Next-Themes](https://github.com/pacocoursey/next-themes)
* **Fuentes:** [Geist](https://vercel.com/font)
* **Estado de Servidor:** [TanStack Query (React Query)](https://tanstack.com/query/latest)
* **Estado Global:** [Zustand](https://zustand-demo.pmnd.rs/)
* **Formularios:** [React Hook Form](https://react-hook-form.com/)
* **Validación:** [Zod](https://zod.dev/)
* **Generación de PDF:** [jsPDF](https://github.com/parallax/jsPDF) y [html2canvas-pro](https://github.com/html2canvas/html2canvas)
* **Gráficos:** [Recharts](https://recharts.org/)
* **Analíticas:** [Vercel Analytics](https://vercel.com/analytics)

---

## 📂 Estructura del Proyecto

La estructura de archivos sigue las convenciones de Next.js App Router, separando la lógica de UI (`components`), el estado (`hooks`, `store`), la lógica de negocio (`services`), y las definiciones (`lib`).

```bash
.
├── app/
│   ├── (protected)/    # Rutas protegidas por AuthGuard
│   │   ├── projects/   # Página principal de gestión de proyectos
│   │   ├── report/
│   │   │   ├── [projectId]/ # Reporte por proyecto
│   │   │   └── page.tsx     # Reporte general
│   │   ├── resources/  # Página de gestión de recursos
│   │   ├── team/       # Página de gestión de equipo
│   │   └── page.tsx      # Dashboard (home)
│   ├── login/            # Página de autenticación
│   ├── layout.tsx        # Layout raíz
│   └── providers.tsx     # Proveedores (Tema, React Query)
│
├── components/
│   ├── project/          # Componentes de Proyecto (form, list, header)
│   ├── report/           # Componentes para PDF (GeneralReport, ProjectReport)
│   ├── resource/         # Componentes de Recurso
│   ├── task/             # Componentes de Tarea
│   ├── team/             # Componentes de Equipo
│   └── ui/               # Componentes reutilizables (AuthGuard, navbar, etc.)
│
├── hooks/                # Hooks personalizados
│   ├── use-confirm-dialog.tsx
│   ├── useAssignments.ts # Hooks de React Query
│   ├── useProjects.ts
│   ├── useResources.ts
│   └── ...
│
├── lib/
│   ├── project-types.ts  # Definiciones de tipos (Project, Task, etc.)
│   └── utils.ts          # Funciones de utilidad (ej. cn de Shadcn)
│
├── services/
│   ├── apiService.ts     # Lógica central de fetch a la API .NET
│   └── mocks.ts          # Datos de prueba (si se usan)
│
├── store/
│   └── authStore.tsx     # Estado global de Zustand para autenticación
│
├── .env                  # Variables de entorno
├── next.config.mjs
├── package.json
└── tsconfig.json
````

-----

## 🚀 Instalación y Puesta en Marcha

Para ejecutar este proyecto localmente, sigue estos pasos:

1.  **Clonar el repositorio:**

    ```bash
    git clone [https://github.com/santinohamada/Front-AdminRec.git](https://github.com/santinohamada/Front-AdminRec.git)
    cd Front-AdminRec
    ```

2.  **Instalar dependencias:**
    Este proyecto usa `pnpm` como gestor de paquetes.

    ```bash
    pnpm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env.local` en la raíz del proyecto y añade la URL de tu API backend.

    ```env
    NEXT_PUBLIC_API_URL="http://localhost:PUERTO_DEL_BACKEND/api"
    NEXT_PUBLIC_USE_MOCKS="false" #Colocalo en true si deseas utilizar data mockeada
    ```

4.  **Ejecutar el proyecto en modo desarrollo:**

    ```bash
    pnpm dev
    ```

5.  Abre [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) en tu navegador para ver la aplicación.

-----

## 📜 Scripts Disponibles

  * **`pnpm dev`**: Inicia la aplicación en modo desarrollo.
  * **`pnpm build`**: Compila la aplicación para producción.
  * **`pnpm start`**: Inicia un servidor de producción.
  * **`pnpm lint`**: Ejecuta el linter de Next.js (ESLint).
