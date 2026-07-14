# Documentación del Sistema de Gestión de Tareas de Calidad

Este sistema es una plataforma robusta para la asignación, seguimiento, entrega y revisión de tareas de control de calidad dentro de una organización. El diseño está segmentado en una arquitectura de tres capas: Base de Datos (Relacional mediante Prisma/MySQL), Backend (API REST en Node.js + Express con TypeScript) y Frontend (Single Page Application en React con TypeScript + Vite).

---

## 1. Arquitectura de Base de Datos (`schema.prisma`)

La persistencia de datos está implementada sobre **MySQL** utilizando **Prisma ORM**. El diseño de la base de datos está normalizado y cuenta con índices estratégicos para optimizar el rendimiento del panel de métricas y consultas frecuentes.

### Enums
*   `Estatus`: Define el estado del ciclo de vida de una tarea: `PENDIENTE`, `EN_REVISION`, `CONCLUIDA`, `CANCELADA`.
*   `Urgencia`: Prioridad de la tarea: `BAJA`, `MEDIA`, `ALTA`.
*   `Rol`: Roles de autorización del sistema: `SUPER_ADMIN` (control total multidepartamento), `ADMIN` (gestión del departamento propio), `ENCARGADO` (colaborador con permisos de asignación limitados), `USUARIO` (responsable ejecutor), `INVITADO` (solo lectura).
*   `Tipo`: Clasificación de departamentos: `ADMINISTRATIVO`, `OPERATIVO`.
*   `EstatusUsuario`: Estatus de login del personal: `ACTIVO`, `INACTIVO` (permite soft-deletes).

### Modelos y Tablas
```mermaid
erDiagram
    DEPARTAMENTO ||--o{ USUARIO : "contiene"
    DEPARTAMENTO ||--o{ TAREA : "tiene asignada"
    USUARIO ||--o{ PUSH_SUBSCRIPTION : "registra"
    USUARIO ||--o{ TAREA : "asigna (Asignador)"
    USUARIO ||--o{ RESPONSABLES_EN_TAREA : "ejecuta"
    TAREA ||--o{ RESPONSABLES_EN_TAREA : "es asignada"
    TAREA ||--o{ IMAGEN_TAREA : "tiene fotos"
    TAREA ||--o{ HISTORIAL_FECHA : "registra cambios de limite"
    USUARIO ||--o{ HISTORIAL_FECHA : "modifica"
    BITACORA }o--|| USUARIO : "registrado por"
```

1.  **`Departamento`**: Almacena el nombre e identificación del departamento, su clasificación (`Tipo`), y la bandera `tareasExternasHabilitadas` (que indica si sus administradores/encargados pueden asignar tareas externas).
2.  **`Usuario`**: Perfil de cada colaborador del sistema, enlazado a un departamento. Tiene índices en `departamentoId` y `estatus` para acelerar el inicio de sesión y filtrados.
3.  **`Tarea`**: Entidad central que define el trabajo a realizar. Contiene fechas clave (límite, registro, conclusión, entrega, revisión), campos para auto-validación y llaves foráneas a departamento y asignador.
    *   *Tareas Externas*: Se consideran externas cuando el `departamentoId` de la tarea es diferente al de la cuenta del `asignador` (creador).
    *   *Índices de Rendimiento*: Indexación por `departamentoId`, `asignadorId`, `estatus`, `fechaLimite`, `fechaRegistro` y `urgencia`.
4.  **`ResponsablesEnTarea`**: Tabla pivote muchos-a-muchos entre `Usuario` y `Tarea`. Tiene un índice compuesto en `[usuarioId, tareaId]` y uno dedicado a `usuarioId` para optimizar la vista de "Mis Tareas".
5.  **`ImagenTarea`**: Historial de fotos asociadas a una tarea (descripciones visuales iniciales).
6.  **`HistorialFecha`**: Registro histórico de cambios en la fecha límite de una tarea, capturando la fecha anterior, nueva fecha, motivo y el usuario que efectuó el cambio.
7.  **`PushSubscription`**: Datos de subscripción de navegadores/dispositivos para notificaciones web-push asociadas a cada usuario.
8.  **`Bitacora`**: Auditoría general del sistema (logs persistidos) con estructura JSON para detalles adicionales.

---

## 2. Backend (`backend/src`)

El backend está desarrollado sobre Node.js y Express en formato ESM (ES Modules).

```
backend/src/
├── config/             # Configuraciones globales y de entorno
├── middleware/         # Validadores, autenticadores y formateadores de petición
├── modules/            # Módulos del dominio de negocio (Controladores y Rutas)
├── services/           # Lógica en segundo plano (cron, logs persistentes)
├── utils/              # Funciones auxiliares y de integración externa
└── server.ts           # Inicialización de la aplicación
```

### Configuración (`backend/src/config`)
*   **`envs.ts`**: Carga y valida las variables de entorno utilizando `zod`. Si falta una variable crítica en el `.env` (como credenciales de Cloudinary, firma de JWT o claves VAPID), el servidor detiene su proceso inmediatamente para evitar comportamientos erráticos.
*   **`db.ts`**: Instancia global del cliente de Prisma (`PrismaClient`).
*   **`cors.ts`**: Configuración dinámica de seguridad CORS. Permite peticiones de dominios autorizados y redes locales de desarrollo.
*   **`businessRules.ts`**: Centralización de lógica del negocio. Define, por ejemplo, qué departamentos tienen jerarquía libre (como `"Pieles"`), permitiendo flujos de asignación bidireccional entre puestos.

### Middlewares (`backend/src/middleware`)
*   **`verifyToken.ts`**: Autentica peticiones mediante tokens JWT inyectados en la cabecera `Authorization`. Realiza una validación reactiva en base de datos para confirmar que el usuario que porta el token sigue `ACTIVO`. Adicionalmente implementa la autorización basada en roles (`Rol`).
*   **`errorHandler.ts`**: Intercepta excepciones no controladas. Traduce códigos de error nativos de base de datos (Prisma) o esquemas de validación (Zod) a respuestas legibles para el cliente.
*   **`requestLogger.ts`**: Middleware de bitácora en consola. Interpreta las llamadas de API traduciéndolas a acciones legibles humanas (ej. `"🚀 Entregando Tarea #12"`) y calcula los milisegundos de respuesta.
*   **`upload.ts`**: Configura `multer` para procesar archivos de imagen entrantes almacenándolos en la memoria RAM de manera temporal antes de ser optimizados.

### Módulos (`backend/src/modules`)
El backend organiza sus endpoints por módulos funcionales. Cada módulo expone sus rutas en un archivo `*.routes.ts` y delega la ejecución a controladores especializados:

1.  **Auth**: Inicio de sesión (`/login`), verificación de token (`/verify`) y salida (`/logout`).
2.  **Departamentos**: CRUD e inicialización de departamentos. Solo administradores y súper administradores pueden crear o alterar su estructura.
3.  **Logs**: Endpoint para extraer el historial de la bitácora del sistema (Acceso exclusivo a `SUPER_ADMIN`).
4.  **Usuarios**: Administración del personal de la empresa. Soporta creación, edición, desactivación (soft-delete cambiando el estatus a `INACTIVO`) y suscripción a notificaciones push.
5.  **Tareas**: Flujo de trabajo central del sistema.
    *   `GET /`: Ruta unificada que recibe queries (`?viewType=MIS_TAREAS|ASIGNADAS|TODAS`). Si es `TODAS` y el usuario es `ADMIN` o `ENCARGADO` con `tareasExternasHabilitadas`, se le devuelven las tareas de su propio departamento más las tareas externas que él mismo asignó a otros departamentos.
    *   `GET /kpis`: Endpoint dedicado para extraer contadores de eficiencia por departamento o por usuarios, aplicando el rango de fecha límite seleccionado.
    *   `POST /`: Creación de tareas. Valida si la tarea es externa; de ser así, verifica que el departamento del asignador tenga `tareasExternasHabilitadas` (salvo que sea `SUPER_ADMIN`). Permite asignar la tarea a cualquier rol activo del departamento destino.
    *   `POST /:id/entregar`: Permite al usuario subir evidencias a una tarea y cambiar su estatus a `EN_REVISION`.
    *   `POST /:id/revision`: Flujo de aprobación o rechazo. En tareas externas, el permiso de revisión (`puedeRevisarOAutorizarTarea`) se limita al departamento de origen (creador).
    *   `PUT /:id`: Modificación de la tarea. En tareas externas, el permiso de edición (`puedeEditarTarea`) se reserva únicamente para el departamento de origen de la tarea (el departamento de destino no tiene permisos de edición).
    *   `PATCH /:id/cancelar` y `PATCH /:id/completar`: Modificación rápida de estado regida por las mismas reglas de permisos.

### Servicios (`backend/src/services`)
*   **`logger.service.ts`**: Modela e inserta registros en la tabla `Bitacora`.
*   **`cron.service.ts`**: Ejecuta tareas automáticas recurrentes mediante `node-cron`:
    1.  *Auto-Validación*: Cada hora, el sistema busca tareas en estatus `EN_REVISION` que lleven más de 5 días naturales sin cambios. El sistema las concluye automáticamente mediante una transacción atómica y notifica a los responsables.
    2.  *Recordatorios Matutinos (9:00 AM)*: Avisa a asignadores sobre aprobaciones pendientes y a encargados sobre vencimientos en el día o tareas retrasadas.
    3.  *Alertas Vespertinas (4:30 PM)*: Recordatorios rápidos para tareas críticas antes de finalizar la jornada laboral.

### Utilidades (`backend/src/utils`)
*   **`safeAsync.ts`**: Función de orden superior que envuelve controladores asíncronos para capturar promesas rechazadas y canalizarlas al manejador de errores global sin saturar el código de bloques `try-catch`.
*   **`cloudinaryUtils.ts`**: Administra la integración con Cloudinary. Procesa las imágenes subidas por el usuario optimizándolas al vuelo (compresión WebP con Sharp a calidad 80% y redimensión a un ancho máximo de 1280px) para mitigar el consumo de red y almacenamiento en la nube.
*   **`holidayUtils.ts`**: Determina si un día dado es inhábil en México (días festivos fijos y periodos dinámicos como Semana Santa o periodos vacacionales de fin de año). Evita el envío invasivo de notificaciones push en días no laborables.

### Reglas de Negocio de Tareas Externas (Cross-Department)

Con el fin de permitir la colaboración interdepartamental, el sistema cuenta con soporte para **Tareas Externas**:

1. **Definición**: Una tarea se considera externa si el departamento asignado (`departamentoId`) es diferente del departamento del usuario que la crea (`asignador.departamentoId`).
2. **Habilitación de Departamento**: 
   * Para que un departamento pueda asignar tareas externas, debe tener activada la bandera `tareasExternasHabilitadas` en la base de datos (con excepción del `SUPER_ADMIN`, que puede asignar tareas externas sin restricciones).
   * El estado de esta bandera se administra a través del panel de Súper Administrador en la gestión de departamentos.
3. **Asignación de Responsables**: 
   * Al crear o editar una tarea externa, el creador (`ADMIN` o `ENCARGADO`) puede elegir como responsable a **cualquier usuario activo** del departamento de destino, independientemente de su rol.
   * Se omiten las restricciones de jerarquía aplicadas en tareas internas (donde no se puede asignar a roles de mayor rango).
4. **Permisos de Revisión y Edición**:
   * **Edición (`puedeEditarTarea`)**: Los permisos se restringen al departamento de origen (creador). El departamento destino no puede alterar el texto, responsables o fechas de la tarea.
   * **Revisión (`puedeRevisarOAutorizarTarea`)**: El flujo de aprobación o rechazo de la evidencia entregada recae exclusivamente en el departamento origen. Puede revisar el creador original, cualquier `ADMIN` o `ENCARGADO` de dicho departamento origen, o el `SUPER_ADMIN`.

### Soporte Offline y Sincronización PWA

El sistema cuenta con capacidades de **Offline-First** y sincronización en segundo plano:

1. **Visualización Sin Conexión (Caché GET)**:
   * Cada petición `GET` exitosa realizada al backend se almacena en IndexedDB (`TareasCacheDB` -> `get_requests`) indexada por URL y parámetros de búsqueda.
   * Si ocurre un error de conexión (`Network Error`), el interceptor de Axios intercepta la llamada, lee el último snapshot almacenado de IndexedDB y resuelve la promesa de forma transparente para mantener la interfaz de usuario activa y visualizable.
2. **Cola de Peticiones Offline (Mutaciones)**:
   * Si se realiza una acción de modificación (`POST`, `PUT`, `PATCH`, `DELETE`) sin conexión, el interceptor de Axios la captura, serializa el payload (incluyendo campos `FormData` y archivos `File`) y la encola localmente en IndexedDB (`TareasSyncDB` -> `failed_requests`).
   * Al usuario se le notifica mediante un banner y/o toast que su acción fue guardada y se sincronizará automáticamente.
3. **Respeto de Tiempos Operativos (Original Timestamp)**:
   * Al almacenar la mutación offline en IndexedDB, se registra el timestamp original (`Date.now()`).
   * Al recuperar internet, la sincronización adjunta de manera automática este timestamp en las propiedades correspondientes (`fechaEntrega`, `fechaConclusion`, o `fechaRevision` según la URL del endpoint) en el cuerpo de la petición.
   * El backend valida y prioriza la fecha de cliente enviada por sobre la fecha de procesamiento del servidor, impidiendo penalizaciones por retraso en el reporte.
4. **Sincronización y Recarga**:
   * El frontend monitorea el estado de conexión e inicia automáticamente el procesamiento de la cola al volver online.
   * Una vez completada la sincronización de manera exitosa, se despacha el evento de ventana `tareas-sync-complete`, forzando la recarga en caliente de los datos en [Admin.tsx](file:///C:/App/Joel/03_Proyecto_Tareas_Calidad/frontend/src/pages/Admin.tsx) y [Pendientes.tsx](file:///C:/App/Joel/03_Proyecto_Tareas_Calidad/frontend/src/pages/Pendientes.tsx).

---

## 3. Frontend (`frontend/src`)

El frontend está construido con React 18, TypeScript, TailwindCSS y Vite.

### Consumo de API (`frontend/src/api`)
El consumo del backend se centraliza a través de un cliente HTTP estructurado:
*   **`01_axiosInstance.ts`**: Instancia de Axios con interceptores. Inyecta automáticamente el token JWT desde el `localStorage` en cada petición y ajusta el puerto dinámicamente si detecta que la aplicación corre desde un emulador de Android (`10.0.2.2`).
*   **Services**: Abstracciones de llamadas al backend estructuradas por dominio: `auth.service.ts`, `departamentos.service.ts`, `logs.service.ts`, `tareas.service.ts` y `usuarios.service.ts`.

### Páginas Principales (`frontend/src/pages`)
1.  **`LoginPage.tsx`**: Pantalla de acceso. Gestiona el almacenamiento del token y redirige a los usuarios según su rol.
2.  **`Pendientes.tsx`**: Panel principal para el personal operativo. Muestra tareas personales pendientes del día, tareas en curso y un resumen de las concluidas. Si el usuario pertenece a un departamento con tareas externas habilitadas, puede crear tareas externas desde este panel.
3.  **`Admin.tsx`**: Tablero de gestión de tareas del departamento. Permite crear, modificar, reasignar fechas límite y auditar evidencias enviadas por los trabajadores. Si el departamento del usuario tiene tareas externas habilitadas, permite la asignación a otros departamentos y muestra filtros rápidos para ver solo tareas KAIZEN o externas.
4.  **`Super_Admin.tsx`**: Panel global de visualización del estado de la empresa. Contiene métricas generales, acceso a la bitácora del sistema y la consola de gestión de departamentos (`GestionDeptos.tsx`) donde se puede activar/desactivar la asignación de tareas externas para cada área.
5.  **`Usuarios.tsx`**: Consola de administración de personal del departamento (creación, edición y suspensión de usuarios).

### Componentes Clave (`frontend/src/components`)
*   **`PrivateRoute.tsx` / `PublicRoute.tsx`**: Guardias de navegación que aseguran que rutas sensibles requieran sesión iniciada y que usuarios logueados no regresen a la pantalla de login.
*   **`layout/Layout.tsx`**: Estructura visual de la aplicación con barra de navegación adaptativa (móvil/escritorio) y perfiles del usuario actual.
*   **`Pendientes/`**: Carpeta que contiene la tabla de visualización (incluyendo una vista compacta para móviles en `TablaPendientesMobile.tsx`), filtros temporales y el `ModalEntrega.tsx` para subir evidencias de cumplimiento de tareas.
*   **`Admin/`**: Contiene componentes de filtros (`FiltrosAdminDesktop.tsx`, `FiltrosAdminMobile.tsx`) y el modal de creación (`ModalNueva.tsx`), adaptados para soportar asignación cruzada entre departamentos y visualización de badges externos.
*   **`Principal/`**: Componentes reutilizables para el desglose del Dashboard (gráficas de cumplimiento, resúmenes analíticos y visor de imágenes de evidencia).
*   **`SuperAdmin/`**: Contiene la tabla de departamentos (`TablaDeptos.tsx`) donde el SUPER_ADMIN controla las políticas de asignación externa (`tareasExternasHabilitadas`).

### Utilidades y Helpers (`frontend/src/utils`)
*   **`tareasExternas.ts`**: Centraliza la lógica de interfaz para tareas externas:
    *   Determina si una tarea es externa comparando los departamentos.
    *   Asigna los estilos de color y etiquetas: `KAIZEN` (si el origen contiene "CALIDAD") o `EXTERNA · [Depto]` (para otros).
    *   Expone las funciones `puedeRevisarTarea` y `puedeEditarTarea` sincronizadas con las reglas de permisos del backend.

---

## 4. Flujo del Sistema Paso a Paso

El flujo de trabajo operativo de las tareas se rige bajo la siguiente secuencia de estados y validaciones:

```mermaid
sequenceDiagram
    autonumber
    actor A as Asignador (Admin/Encargado)
    actor R as Responsable (Usuario)
    participant B as Backend (API + Cron)
    participant C as Cloudinary & Push

    A->>B: 1. Crear Tarea (Responsables, Límite, Departamento)
    B->>C: Registrar suscripción y enviar notificación Push
    C-->>R: Notificación en dispositivo: "Nueva Tarea Asignada"
    
    Note over R: Tarea está en estatus: PENDIENTE
    
    R->>B: 2. Entregar Tarea (Comentario + Imagen de Evidencia)
    B->>C: Subir a Cloudinary (Sharp WebP HD)
    B->>B: Transición a estatus: EN_REVISION
    B->>C: Enviar notificación al Asignador
    
    Note over A: Tarea está en estatus: EN_REVISION
    
    alt Aprobación Manual
        A->>B: 3a. Aceptar Entrega (Feedback)
        B->>B: Transición a estatus: CONCLUIDA
        B->>C: Notificar al Responsable: "Tarea Aprobada"
    else Rechazo Manual
        A->>B: 3b. Rechazar Entrega (Feedback de corrección)
        B->>B: Regresa a estatus: PENDIENTE
        B->>C: Notificar al Responsable: "Tarea Rechazada - Corregir"
    else Vencimiento Automático (5 Días)
        B->>B: 3c. Cron detecta inactividad en revisión
        B->>B: Transición a estatus: CONCLUIDA (Auto-Validada)
        B->>C: Notificar a Responsable: "Tarea Cerrada Automáticamente"
    end
```

1.  **Asignación de Tarea**: Un usuario con rol `ADMIN`, `SUPER_ADMIN` o `ENCARGADO` genera una nueva tarea asignando responsables, departamento y fecha límite. El backend valida el flujo jerárquico y notifica mediante notificaciones Web Push.
2.  **Ejecución y Entrega**: El responsable (operativo) visualiza la tarea en su panel. Al completarla, abre el `ModalEntrega`, redacta un comentario y adjunta fotos de evidencia. Las fotos se optimizan y comprimen en el servidor antes de subirse a Cloudinary. El estado de la tarea pasa a `EN_REVISION`.
3.  **Proceso de Revisión**: El creador de la tarea revisa el entregable:
    *   Si aprueba, la tarea finaliza y pasa a `CONCLUIDA`.
    *   Si rechaza, ingresa observaciones detalladas y la tarea retorna a `PENDIENTE` para que los responsables hagan los problemas correspondientes.
    *   Si el asignador no emite un veredicto tras 5 días, el cronjob de **Auto-Validación** interviene liberando administrativamente la tarea con el estatus `CONCLUIDA` y la bandera `fueAutoValidada` en `true`.
