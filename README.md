# EvaluaDocente - Sistema de Evaluacion Docente con Rubricas

## Resumen Rapido

Aplicacion web **PWA offline-first** para que docentes gestionen aulas, estudiantes y evaluaciones basadas en criterios (rubricas). Construida con **React 19 + TypeScript + Vite + TailwindCSS 4 + Zustand**. Toda la data se almacena localmente en **IndexedDB** (sin backend). Desplegada en **Vercel** (`evalua.zonadocente.com`).

**Flujo principal:** GradeSections (grados) -> Students -> Classrooms (aulas por area) -> EvaluationMatrices (rubricas) -> Evaluaciones por estudiante (criterios + participacion) -> Exportar a Excel.

---

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Framework | React 19 + TypeScript 5.8 |
| Build | Vite 6 |
| Estilos | TailwindCSS 4 (via `@tailwindcss/vite`) con tema custom en `src/index.css` |
| Estado global | Zustand 5 |
| Persistencia | IndexedDB (wrapper custom en `src/utils/indexDB.ts`) |
| Rutas | react-router-dom 7 (BrowserRouter) |
| Excel | xlsx + xlsx-js-style (generacion con estilos) |
| Iconos | lucide-react |
| Deploy | Vercel (SPA rewrite en `vercel.json`) |
| PWA | Service Worker custom en `public/sw.js` + `public/manifest.json` |

---

## Comandos

```bash
npm run dev       # Desarrollo (vite --host)
npm run build     # Build (tsc -b && vite build)
npm run lint      # Lint (eslint .)
npm run preview   # Preview del build
```

---

## Estructura de Archivos

```
EvalDocenteRubricas/
├── index.html                    # HTML entry con SEO, Open Graph, PWA meta tags
├── vite.config.ts                # Vite config (React + Tailwind, nombres de assets fijos)
├── vercel.json                   # SPA rewrite para Vercel
├── eslint.config.js              # ESLint config
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service Worker (cache-first)
│   ├── cover.png                 # Imagen para OG/Twitter cards
│   └── icons/                    # Iconos PWA (192x192, 512x512, maskable)
└── src/
    ├── main.tsx                  # Entry point: renderiza App + registra SW
    ├── App.tsx                   # Inicializa IndexedDB, renderiza Router
    ├── index.css                 # Tailwind imports + tema custom (colores, dark mode)
    ├── vite-env.d.ts
    │
    ├── types/
    │   └── types.ts              # TODAS las interfaces TypeScript del dominio
    │
    ├── router/
    │   └── Router.tsx            # Definicion de rutas (createBrowserRouter)
    │
    ├── store/
    │   ├── useAppStore.ts        # Store principal Zustand (CRUD completo de todas las entidades)
    │   └── useHeaderStore.ts     # Store para titulo dinamico del header
    │
    ├── utils/
    │   ├── indexDB.ts            # Capa de persistencia IndexedDB (generic CRUD + funciones especificas)
    │   └── excel.ts              # Generacion de archivos Excel con estilos (reportes)
    │
    ├── layout/
    │   └── MainLayout.tsx        # Layout principal (header + outlet + footer + dark mode)
    │
    ├── pages/
    │   ├── HomePage.tsx          # Pagina principal: lista de aulas (classrooms)
    │   ├── GradePage.tsx         # Detalle de aula: matrices de evaluacion + exportar Excel
    │   ├── EvaluationPage.tsx    # Pagina de evaluacion: grilla de criterios por estudiante
    │   ├── StudentsPage.tsx      # Gestion de estudiantes (CRUD + importar Excel)
    │   ├── ConfigPage.tsx        # Backup/restore/clear de IndexedDB
    │   └── HelpPage.tsx          # Pagina de ayuda
    │
    └── components/
        ├── BarChartCanvas.tsx    # Grafico de barras apiladas (canvas) para estadisticas
        ├── Button.tsx            # Componente Button reutilizable
        ├── Inputs.tsx            # Componente Input reutilizable
        ├── Select.tsx            # Componente Select reutilizable
        ├── ModalAlert.tsx        # Modal de confirmacion reutilizable
        ├── Toast.tsx             # Notificacion toast reutilizable
        └── LoadingSpinner.tsx    # Spinner de carga reutilizable
```

---

## Modelo de Datos (Tipos)

Definidos en `src/types/types.ts`:

| Tipo | Descripcion | Campos clave |
|------|------------|-------------|
| `GradeSection` | Grado y seccion (ej: "1A", "2B") | `id`, `name`, `createdAt` |
| `Classroom` | Aula por area curricular (ej: "Matematica - 1A") | `id`, `name`, `gradeSectionId`, `createdAt` |
| `Student` | Estudiante | `id`, `fullName`, `gradeSectionId` |
| `EvaluationMatrix` | Rubrica/plantilla de evaluacion | `id`, `classroomId`, `name`, `date`, `competencia` (1-4), `criteria[]` |
| `EvaluationCriterion` | Criterio dentro de una matriz | `id`, `name` |
| `StudentEvaluation` | Evaluacion de criterios de un estudiante | `id`, `studentId`, `matrixId`, `criteriaEvaluations[]` |
| `CriterionEvaluation` | Nivel de logro por criterio | `criterionId`, `level` (C/B/A/AD) |
| `ParticipationEvaluation` | Nivel de participacion del estudiante | `id`, `studentId`, `matrixId`, `level` (F/C/B/B+/A/A+) |

**Niveles de logro:** C (En inicio), B (En proceso), A (Logro esperado), AD (Logro destacado)
**Niveles de participacion:** F (Falto), C, B, B+, A, A+

---

## Rutas

| Ruta | Pagina | Descripcion |
|------|--------|-------------|
| `/` | HomePage | Lista de aulas (classrooms) |
| `/grade/:gradeId` | GradePage | Matrices de evaluacion de un aula |
| `/grade/:classroomId/matrix/:matrixId/evaluate` | EvaluationPage | Grilla de evaluacion de estudiantes |
| `/students` | StudentsPage | CRUD de estudiantes + importar Excel |
| `/config` | ConfigPage | Backup/restore/limpiar base de datos |
| `/help` | HelpPage | Guia de uso |

---

## Capas Clave para Modificaciones

### Agregar/modificar entidades del dominio
1. **Tipos** -> `src/types/types.ts`
2. **Persistencia** -> `src/utils/indexDB.ts` (agregar store en `STORES`, bump `DB_VERSION`, crear funciones CRUD)
3. **Estado global** -> `src/store/useAppStore.ts` (agregar estado + acciones)
4. **UI** -> Pagina correspondiente en `src/pages/`

### Modificar estilos/tema
- Colores y tema: `src/index.css` (bloque `@theme`)
- Dark mode: variante `dark:` de Tailwind + clase `.dark` en `<html>`
- Layout/header/footer: `src/layout/MainLayout.tsx`

### Modificar exportacion Excel
- `src/utils/excel.ts` - funciones: `generateEvaluationExcel`, `generateParticipationExcel`, `generateCriteriaExcel`, `generateCompetenciaCriteriaExcel`, `generateCompetenciaParticipacionExcel`, `parseExcelStudents`, `generateExcelTemplate`

### Modificar graficos
- `src/components/BarChartCanvas.tsx` - grafico de barras apiladas por criterio

---

## Base de Datos (IndexedDB)

- **Nombre:** `teacher-evaluation-app`
- **Version:** 5
- **Stores:** `gradeSections`, `classrooms`, `students`, `evaluationMatrices`, `studentEvaluations`, `participationEvaluations`
- **IDs:** UUID v4 generados con libreria `uuid`
- **Backup:** Exporta todo como JSON; Restaurar solo permitido si no hay datos existentes

---

## Convenciones del Proyecto

- **Idioma del codigo:** Ingles para tipos/nombres tecnicos, Espanol para strings visibles al usuario
- **Componentes:** Funcionales con hooks, cada uno en su propio archivo
- **Estado:** Zustand stores centralizados (sin slices separados, todo en `useAppStore`)
- **Estilos:** Tailwind utility classes directamente en JSX (sin CSS modules)
- **Comunicacion usuario:** Componentes `Toast`, `ModalAlert` para feedback
- **Sin comentarios en codigo** (salvo excepciones minimas)
- **Importaciones relativas** con alias `../`
