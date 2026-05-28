import {
  Home,
  Users,
  FolderKanban,
  BarChart3,
  Building2,
  Wallet,
  History,
  UserCog,
} from "lucide-react";
import type { DocModule, DocRole } from "./types";

export const docsModules: DocModule[] = [
  {
    slug: "inicio",
    title: "Inicio",
    summary:
      "Qué es CADERH, cómo iniciar sesión y orientación general sobre la plataforma.",
    icon: Home,
    visibleTo: ["ADMIN", "MANAGER", "USER"],
    actions: [
      {
        slug: "bienvenida",
        title: "Bienvenida y orientación",
        summary:
          "Qué es CADERH, cómo iniciar sesión por primera vez y cómo orientarte en la plataforma.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "full" },
        },
        steps: [
          {
            id: "que-es-caderh",
            title: "Qué es CADERH",
            body:
              "CADERH (Sistema Estadístico) es la plataforma que centraliza la información de los centros de formación profesional, sus instructores, estudiantes, cursos y procesos educativos en Honduras. Su propósito es darle visibilidad al impacto de los proyectos financiados con cooperación internacional y servir como herramienta de gestión para coordinadores y agentes de campo.",
            callout: {
              variant: "info",
              title: "¿Quién usa CADERH?",
              text:
                "Administradores de CADERH, supervisores de proyectos, agentes de campo que visitan centros, y aliados (donantes, ONGs) que consultan reportes. Cada rol ve y puede hacer cosas distintas — esta documentación lo aclara módulo por módulo.",
            },
          },
          {
            id: "iniciar-sesion",
            title: "Cómo iniciar sesión por primera vez",
            body:
              "Cuando un administrador crea tu cuenta, recibes un correo automático con tu correo electrónico (tu usuario) y una contraseña temporal. Para entrar:",
            bullets: [
              "Abre el navegador y entra a la URL que te indicó el administrador (algo como https://caderh.org).",
              "Verás la pantalla de login con dos campos: Correo Electrónico y Contraseña.",
              "Ingresa tu correo (el que te dieron, NO uno personal cualquiera) y la contraseña temporal del correo de bienvenida.",
              'Pulsa "Conectarse". El sistema te pedirá cambiar la contraseña temporal por una propia.',
              "Define tu nueva contraseña y ya entras al dashboard.",
            ],
            screenshot: {
              src: "/docs/inicio/orientacion/login.png",
              alt: "Pantalla de login de CADERH con campos Correo Electrónico, Contraseña, botón Conectarse y enlace de recuperación",
              caption:
                'La pantalla de inicio de sesión. El enlace "¿Olvidó su contraseña?" es útil si pierdes acceso después.',
            },
            callout: {
              variant: "warning",
              title: "Si no recibiste el correo",
              text:
                "Revisa la carpeta de spam o correo no deseado. Si después de 10 minutos no llega, contacta al administrador que creó tu cuenta para que verifique que el correo se envió correctamente.",
            },
          },
          {
            id: "dashboard",
            title: "El dashboard: lo primero que ves al entrar",
            body:
              "Después de iniciar sesión llegas al dashboard. Es un resumen visual del estado del sistema con métricas y gráficos:",
            bullets: [
              "KPIs arriba — número total de proyectos, financiamiento, gastos y donaciones acumuladas.",
              "Gráfico de financiamiento por fuente — qué donantes están aportando.",
              "Gráfico de financiamiento vs gastos mensual — ritmo de ejecución.",
              "Donaciones por tipo — proporción efectivo vs especie.",
              "Ejecución de fondos por proyecto — qué proyectos avanzan más o menos.",
            ],
            screenshot: {
              src: "/docs/inicio/orientacion/inicio-01-dashboard.png",
              alt: "Dashboard de CADERH con KPIs (Total Proyectos, Financiamiento, Gastos, Donaciones) y 4 gráficos",
              caption:
                "Vista del dashboard. Los números son datos reales del sistema, actualizados al momento.",
            },
          },
          {
            id: "navegacion",
            title: "Cómo navegar el sistema",
            body:
              "El menú lateral izquierdo es tu punto de entrada principal. Agrupa los módulos en secciones:",
            bullets: [
              "ESTADÍSTICAS — el dashboard que acabas de ver.",
              "ADMINISTRACIÓN — Usuarios y Bitácoras (solo visible para Administradores).",
              "PROYECTOS — Fuentes y Proyectos.",
              "REPORTES — los reportes oficiales R1-R11.",
              "CENTROS — todo lo del SGC: áreas, gestionar centros, instructores, estudiantes, cursos, procesos educativos.",
              "AYUDA — el Centro de Ayuda donde estás ahora, con guías paso a paso.",
            ],
            callout: {
              variant: "tip",
              title: "Lo que ves depende de tu rol",
              text:
                "Si eres Agente (rol USER), no verás las secciones ADMINISTRACIÓN ni el módulo de Fuentes. Verás solo los módulos donde puedes trabajar. Esto es normal — el menú se adapta a tus permisos.",
            },
          },
          {
            id: "centro-de-ayuda",
            title: "Cómo usar el Centro de Ayuda",
            body:
              'Estás aquí ahora. El Centro de Ayuda contiene guías paso a paso de cómo hacer cada tarea importante en el sistema. Tres maneras de moverte:',
            bullets: [
              "Sidebar izquierdo — lista de módulos. Haz clic en uno para ver sus guías.",
              "Buscador (arriba, con ⌘K o Ctrl+K) — busca rápido por palabra clave (\"crear usuario\", \"reportar gasto\", \"bitácoras\").",
              "Tarjetas en la página principal del Centro de Ayuda — vista de tarjetas de cada módulo.",
            ],
            callout: {
              variant: "tip",
              title: "Imprimir una guía",
              text:
                'Cada guía tiene un botón "Imprimir / PDF" arriba a la derecha. Útil si necesitas dar capacitación presencial o tener una copia física a la mano.',
            },
          },
          {
            id: "siguientes-pasos",
            title: "Siguientes pasos según tu rol",
            body:
              "Después de leer esta orientación, te recomendamos comenzar por la guía adecuada para tu rol:",
            bullets: [
              'Administrador — entra al módulo Usuarios y revisa quién tiene acceso al sistema. Después familiarízate con Proyectos y Reportes.',
              "Supervisor — revisa la guía \"Conceptos básicos del módulo Centros\" para entender la jerarquía del SGC, después aprende a crear procesos educativos.",
              'Agente — revisa los proyectos en los que estás asignado y aprende a registrar gastos. La guía "Registrar un gasto en un proyecto" es tu pan de cada día.',
            ],
            callout: {
              variant: "success",
              title: "Bienvenido a CADERH",
              text:
                "Si te atoras con algo, vuelve al Centro de Ayuda y busca la guía relevante. Si no encuentras lo que buscas, pídele al administrador que añada esa guía a la documentación.",
            },
          },
        ],
        related: [
          { moduleSlug: "mi-cuenta", actionSlug: "perfil-y-sesion" },
          { moduleSlug: "usuarios", actionSlug: "cambiar-contrasena" },
        ],
      },
    ],
  },
  {
    slug: "usuarios",
    title: "Usuarios",
    summary:
      "Gestión de cuentas: alta de usuarios, edición, cambio de contraseña y bitácoras.",
    icon: Users,
    visibleTo: ["ADMIN"],
    actions: [
      {
        slug: "crear-usuario",
        title: "Crear un usuario",
        summary:
          "Da de alta una persona en CADERH y asígnale un rol.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "none", note: "Solicítalo a un administrador" },
          USER: { level: "none" },
        },
        steps: [
          {
            id: "abrir-modulo-usuarios",
            title: "Abre el módulo de Usuarios",
            body:
              "En el menú lateral izquierdo, ubica la sección \"Administración\" y haz clic en \"Usuarios\". Verás la lista de todas las personas que tienen acceso al sistema.",
            screenshot: {
              src: "/docs/usuarios/crear-usuario/01-lista-usuarios.png",
              alt: "Listado de usuarios con botón 'Crear Usuario' arriba a la derecha",
              caption:
                "Lista de usuarios. El botón verde \"Crear Usuario\" está en la esquina superior derecha.",
            },
          },
          {
            id: "pulsar-crear-usuario",
            title: 'Pulsa el botón "Crear Usuario"',
            body:
              'Está en la esquina superior derecha de la pantalla, junto al campo de búsqueda. Al pulsarlo se abrirá una ventana emergente con el formulario.',
            callout: {
              variant: "tip",
              title: "Truco",
              text:
                "Si no ves el botón es porque tu rol no permite crear usuarios. Solo los Administradores pueden hacerlo.",
            },
          },
          {
            id: "llenar-formulario",
            title: "Llena los datos del nuevo usuario",
            body:
              "El sistema te pedirá tres datos. Llénalos con cuidado: el correo es a donde se enviarán las credenciales de acceso.",
            bullets: [
              "Correo Electrónico: dirección personal o institucional de la persona. Debe ser un correo activo y accesible.",
              "Nombre Completo: nombres y apellidos como aparecerán en bitácoras y reportes.",
              "Rol: el nivel de acceso (lo eliges en el siguiente paso).",
            ],
            screenshot: {
              src: "/docs/usuarios/crear-usuario/02-modal-vacio.png",
              alt: "Modal 'Crear nuevo usuario' con campos vacíos: Correo, Nombre y Rol",
              caption:
                "Formulario en blanco. El rol por defecto es Agente.",
            },
          },
          {
            id: "elegir-rol",
            title: "Elige el rol adecuado",
            body:
              "Haz clic en el menú \"Rol\" y selecciona una de las tres opciones. El rol define qué puede ver y hacer la persona en el sistema.",
            bullets: [
              "Administrador — acceso total, incluyendo crear y editar usuarios.",
              "Supervisor — gestiona proyectos y centros, pero no crea usuarios.",
              "Agente — trabaja sobre los proyectos en los que está asignado.",
            ],
            screenshot: {
              src: "/docs/usuarios/crear-usuario/04-rol-dropdown.png",
              alt: "Menú desplegable mostrando las tres opciones de rol: Administrador, Supervisor, Agente",
              caption:
                "Las tres opciones de rol disponibles.",
            },
            callout: {
              variant: "warning",
              title: "Importante",
              text:
                "Asigna el rol mínimo necesario. Es preferible empezar con Agente y subir el nivel después que dar permisos de más desde el inicio.",
            },
          },
          {
            id: "confirmar-creacion",
            title: 'Pulsa "Crear Usuario" para confirmar',
            body:
              "Cuando los tres datos estén llenos, pulsa el botón \"Crear Usuario\" en la parte inferior del formulario. El sistema generará una contraseña temporal y enviará un correo automático con las credenciales.",
            screenshot: {
              src: "/docs/usuarios/crear-usuario/03-modal-lleno.png",
              alt: "Formulario con todos los campos llenos y el botón 'Crear Usuario' listo para pulsar",
              caption:
                "Formulario listo para enviar.",
            },
            callout: {
              variant: "danger",
              title: "No hagas esto",
              text:
                "No crees usuarios con correos a los que la persona no tenga acceso real. El correo es el único canal por el que reciben su contraseña inicial — si no llega, no podrán entrar.",
            },
          },
          {
            id: "verificar-creacion",
            title: "Verifica que el usuario se haya creado",
            body:
              "Tras confirmar, verás una notificación de éxito en la esquina superior derecha y el nuevo usuario aparecerá en la lista. La persona recibirá el correo en pocos segundos.",
            callout: {
              variant: "success",
              title: "Resultado esperado",
              text:
                'El nuevo usuario aparece en la lista con estado "Activo". La primera vez que inicie sesión, el sistema le pedirá cambiar la contraseña temporal por una propia.',
            },
          },
        ],
        related: [
          { moduleSlug: "usuarios", actionSlug: "editar-usuario" },
          { moduleSlug: "usuarios", actionSlug: "cambiar-contrasena" },
        ],
      },
      {
        slug: "editar-usuario",
        title: "Editar un usuario",
        summary: "Actualiza nombre, rol o estado de una cuenta existente.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "none" },
          USER: { level: "none" },
        },
        steps: [
          {
            id: "abrir-menu-acciones",
            title: "Abre el menú de acciones del usuario",
            body:
              'Entra al módulo "Administración → Usuarios". Localiza la persona que quieres editar y haz clic en los tres puntos al final de su fila. Se abrirá un pequeño menú con las opciones disponibles.',
            screenshot: {
              src: "/docs/usuarios/editar-usuario/editar-01-menu-acciones.png",
              alt: "Menú de acciones desplegado con dos opciones: Detalle de Usuario y Ver Bitácoras",
              caption:
                'Las dos opciones disponibles desde la fila del usuario.',
            },
          },
          {
            id: "abrir-detalle",
            title: 'Selecciona "Detalle de Usuario"',
            body:
              "Se abrirá una ventana con la información del usuario en modo de solo lectura: correo, nombre, rol, estado y fecha de creación. Para empezar a modificar, busca el botón \"Editar Usuario\" arriba a la derecha.",
            screenshot: {
              src: "/docs/usuarios/editar-usuario/editar-02-detalle-perfil.png",
              alt: 'Modal "Detalle de Usuario" mostrando los datos en modo lectura con el botón Editar Usuario',
              caption:
                "Vista de detalle. Aún no puedes modificar nada — pulsa \"Editar Usuario\" para habilitar los campos.",
            },
          },
          {
            id: "pulsar-editar",
            title: 'Pulsa "Editar Usuario"',
            body:
              "Los campos pasan a modo edición. Ahora puedes cambiar nombre, rol y estado. El correo electrónico es de solo lectura y no se puede modificar — si necesitas cambiarlo, deberás crear un usuario nuevo.",
            bullets: [
              "Nombre — puedes corregir errores o actualizar apellidos.",
              "Rol — cambia el nivel de permisos (Administrador / Supervisor / Agente).",
              "Estado — Activo o Deshabilitado. Un usuario deshabilitado no puede iniciar sesión.",
            ],
            screenshot: {
              src: "/docs/usuarios/editar-usuario/editar-03-form-edicion.png",
              alt: "Formulario de edición con campos editables y botón Generar Nueva Contraseña",
              caption:
                'Modo edición. Aparece el botón "Generar Nueva Contraseña" abajo a la izquierda.',
            },
          },
          {
            id: "cambiar-estado",
            title: "Cambia el estado si necesitas bloquear el acceso",
            body:
              'Si una persona deja de trabajar contigo, no la elimines: cámbiale el estado a "Deshabilitado". Eso bloquea su acceso pero conserva todo su historial en bitácoras, lo cual es importante para auditoría.',
            screenshot: {
              src: "/docs/usuarios/editar-usuario/editar-04-estado-dropdown.png",
              alt: 'Menú desplegable de Estado mostrando las opciones Activo y Deshabilitado',
              caption:
                "Las dos opciones de estado posibles.",
            },
            callout: {
              variant: "warning",
              title: "Importante",
              text:
                "Cuando deshabilitas un usuario, todas sus sesiones activas siguen funcionando hasta que cierren el navegador o expiren. Pídele que cierre sesión si quieres bloqueo inmediato.",
            },
          },
          {
            id: "aplicar-cambios",
            title: 'Pulsa "Aplicar Cambios" para guardar',
            body:
              'Cuando termines, pulsa el botón "Aplicar Cambios" en la parte inferior. Si quieres descartar todo, usa "Cancelar". Los cambios se guardan al instante y se registran en bitácoras con tu nombre.',
            callout: {
              variant: "success",
              title: "Resultado esperado",
              text:
                "Verás una notificación de éxito y la ventana se cerrará. La lista de usuarios se actualiza automáticamente con los nuevos datos.",
            },
          },
        ],
        related: [
          { moduleSlug: "usuarios", actionSlug: "cambiar-contrasena" },
          { moduleSlug: "usuarios", actionSlug: "ver-bitacoras-usuario" },
        ],
      },
      {
        slug: "cambiar-contrasena",
        title: "Cambiar contraseña",
        summary:
          "Cambia tu propia contraseña o resetea la de otro usuario (solo admin).",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "partial", note: "Solo la propia" },
          USER: { level: "partial", note: "Solo la propia" },
        },
        steps: [
          {
            id: "elegir-escenario",
            title: "Identifica cuál es tu caso",
            body:
              "Cambiar una contraseña en CADERH se hace de dos maneras distintas, según quién la quiere cambiar y de quién.",
            bullets: [
              "Olvidaste tu propia contraseña → sigue el flujo de \"¿Olvidó su contraseña?\" desde la pantalla de login (cualquier rol).",
              "Eres administrador y necesitas resetear la contraseña de otra persona → desde el módulo de Usuarios, en el detalle de esa cuenta (solo Administrador).",
            ],
            callout: {
              variant: "info",
              title: "¿Por qué dos caminos?",
              text:
                "Por seguridad, nunca puedes ver la contraseña actual de otra persona. Si un usuario olvida la suya, el administrador no se la recuerda — genera una nueva temporal o el usuario la recupera por correo.",
            },
          },
          {
            id: "olvido-paso-1",
            title: 'Si olvidaste tu contraseña: ve a "¿Olvidó su contraseña?"',
            body:
              'En la pantalla de inicio de sesión, justo debajo del botón "Conectarse", hay un enlace que dice "¿Olvidó su contraseña?". Pulsa ese enlace para iniciar la recuperación.',
            screenshot: {
              src: "/docs/usuarios/cambiar-contrasena/pass-02-login-olvido.png",
              alt: 'Pantalla de login con el enlace "¿Olvidó su contraseña?" visible debajo del botón Conectarse',
              caption:
                "El enlace de recuperación está siempre disponible desde el login.",
            },
          },
          {
            id: "olvido-paso-2",
            title: "Ingresa tu correo y solicita el código",
            body:
              'Escribe el correo electrónico con el que te dieron acceso a CADERH y pulsa "Enviar Código de Recuperación". En pocos segundos recibirás un correo con un código para verificar tu identidad.',
            screenshot: {
              src: "/docs/usuarios/cambiar-contrasena/pass-03-recover-form.png",
              alt: 'Formulario "Recuperar Contraseña" con campo de correo y botón Enviar Código de Recuperación',
              caption:
                "Formulario de recuperación. Te pedirá el código después.",
            },
            callout: {
              variant: "warning",
              title: "Atención",
              text:
                "El código tiene tiempo de vida limitado. Si no llega en 2-3 minutos, revisa tu carpeta de spam o solicítalo de nuevo.",
            },
          },
          {
            id: "olvido-paso-3",
            title: "Verifica el código y define una nueva contraseña",
            body:
              "El sistema te llevará a una pantalla para ingresar el código que recibiste. Después te pedirá escribir tu nueva contraseña dos veces para evitar errores de tecleo. Una vez confirmada, vuelves al login y entras con la nueva.",
            callout: {
              variant: "tip",
              title: "Sugerencia",
              text:
                "Usa una contraseña de al menos 12 caracteres, mezclando letras, números y símbolos. No la reutilices de otros sistemas.",
            },
          },
          {
            id: "admin-paso-1",
            title: "Si eres administrador: abre el detalle del usuario",
            body:
              'Si necesitas resetear la contraseña de otra persona, ve a "Administración → Usuarios", localiza la fila, pulsa los tres puntos y selecciona "Detalle de Usuario". Después pulsa "Editar Usuario" para entrar en modo edición.',
            callout: {
              variant: "info",
              title: "Solo Administradores",
              text:
                "Esta opción solo está disponible para usuarios con rol Administrador. Supervisores y Agentes deben pedir el reset a un administrador.",
            },
          },
          {
            id: "admin-paso-2",
            title: 'Pulsa "Generar Nueva Contraseña"',
            body:
              'En el modo edición verás un botón "Generar Nueva Contraseña" en la parte inferior izquierda. Al pulsarlo, el sistema crea una contraseña temporal aleatoria y la envía por correo a la persona. Tú no la verás — esa es la idea, para que solo el usuario la conozca.',
            screenshot: {
              src: "/docs/usuarios/cambiar-contrasena/editar-03-form-edicion.png",
              alt: 'Formulario de edición de usuario con el botón "Generar Nueva Contraseña" abajo a la izquierda',
              caption:
                'El botón "Generar Nueva Contraseña" está abajo a la izquierda, separado de Cancelar y Aplicar Cambios.',
            },
            callout: {
              variant: "success",
              title: "Resultado esperado",
              text:
                "Verás una notificación de éxito. La persona recibirá un correo con la nueva contraseña temporal. La primera vez que entre, el sistema le pedirá cambiarla por una propia.",
            },
          },
        ],
        related: [
          { moduleSlug: "usuarios", actionSlug: "editar-usuario" },
        ],
      },
      {
        slug: "ver-bitacoras-usuario",
        title: "Ver bitácoras de un usuario",
        summary:
          "Revisa el historial de acciones de un usuario en el sistema.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "none" },
          USER: { level: "none" },
        },
        steps: [
          {
            id: "que-son-bitacoras",
            title: "Qué es la bitácora",
            body:
              "La bitácora es el historial de cada acción importante hecha en CADERH: quién creó un usuario, quién modificó un proyecto, quién importó una matrícula. Sirve para auditoría y para resolver dudas tipo \"¿quién cambió esto?\".",
            callout: {
              variant: "info",
              title: "Solo lectura",
              text:
                "Las bitácoras no se pueden borrar ni editar — son un registro fiel del sistema. Solo los Administradores pueden consultarlas.",
            },
          },
          {
            id: "via-listado",
            title: "Opción A: desde la lista de Usuarios",
            body:
              'Si ya estás viendo el listado de usuarios y solo te interesa una persona específica, esta es la forma más rápida. Ve a "Administración → Usuarios", localiza la fila del usuario y pulsa los tres puntos al final.',
            bullets: [
              "Esta opción te lleva directamente a la pantalla de Bitácoras con el filtro ya aplicado al usuario seleccionado.",
              "Si la persona no tiene acciones registradas, verás la tabla vacía con el mensaje \"No hay bitácoras registradas\".",
            ],
            screenshot: {
              src: "/docs/usuarios/ver-bitacoras-usuario/bitacoras-02-filtrado.png",
              alt: 'Bitácoras pre-filtradas por el usuario Test Richardson, sin registros',
              caption:
                "Vista pre-filtrada al usuario seleccionado. Si está vacía, es porque esa persona aún no ha hecho acciones registradas.",
            },
          },
          {
            id: "via-modulo",
            title: 'Opción B: desde el módulo "Bitácoras"',
            body:
              'Si necesitas ver el historial completo del sistema o filtrar por rol además de por usuario, entra al módulo "Administración → Bitácoras". Verás todas las acciones registradas, las más recientes primero.',
            screenshot: {
              src: "/docs/usuarios/ver-bitacoras-usuario/bitacoras-01-listado.png",
              alt: "Listado de bitácoras con filtros de Usuario y Rol arriba, y tabla de eventos",
              caption:
                "Vista completa con filtros en la parte superior. El total se muestra abajo a la derecha.",
            },
          },
          {
            id: "usar-filtros",
            title: "Filtra para encontrar lo que buscas",
            body:
              "Arriba del listado hay dos filtros que puedes combinar:",
            bullets: [
              "Usuario — selecciona a una persona específica para ver solo sus acciones.",
              "Rol — útil cuando quieres ver, por ejemplo, todo lo que han hecho los Supervisores.",
            ],
            callout: {
              variant: "tip",
              title: "Truco",
              text:
                'Si dejas "Todos los usuarios" y "Todos los roles", verás el historial completo del sistema ordenado por fecha y hora.',
            },
          },
          {
            id: "ver-detalle",
            title: 'Pulsa "Ver" para inspeccionar una bitácora',
            body:
              'Cada fila tiene un botón "Ver" al final. Al pulsarlo se abre una ventana con los datos completos del evento: fecha, hora, usuario que lo hizo, rol que tenía y descripción detallada de la acción.',
            screenshot: {
              src: "/docs/usuarios/ver-bitacoras-usuario/bitacoras-03-detalle.png",
              alt: 'Modal "Detalle de Bitácora" con los campos Fecha, Hora, Usuario, Rol y Bitácora',
              caption:
                "Vista de detalle de un evento. Toda la información sin truncar.",
            },
            callout: {
              variant: "tip",
              title: "Para reportes de auditoría",
              text:
                "Anota la fecha, hora, usuario y descripción del evento. Esos datos son suficientes para reportes externos o investigaciones.",
            },
          },
        ],
        related: [
          { moduleSlug: "usuarios", actionSlug: "editar-usuario" },
        ],
      },
    ],
  },
  {
    slug: "proyectos",
    title: "Proyectos",
    summary:
      "Crea proyectos con el wizard de 5 pasos, asigna equipos y mide ejecución.",
    icon: FolderKanban,
    visibleTo: ["ADMIN", "MANAGER", "USER"],
    actions: [
      {
        slug: "crear-proyecto",
        title: "Crear un proyecto",
        summary:
          "Da de alta un proyecto nuevo con el wizard de 5 pasos: información, fuentes, donaciones, gastos y archivos.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "none", note: "Solicítalo a un supervisor o admin" },
        },
        steps: [
          {
            id: "abrir-modulo",
            title: "Abre el módulo de Proyectos",
            body:
              'En el menú lateral entra a "Proyectos → Proyectos". Verás la lista con tarjetas de cada proyecto activo, mostrando su presupuesto, ejecución y logros. Arriba a la derecha está el botón "Crear nuevo proyecto".',
            screenshot: {
              src: "/docs/proyectos/crear-proyecto/proy-01-listado.png",
              alt: "Listado de proyectos con tarjetas mostrando presupuesto y porcentaje ejecutado",
              caption:
                "Cada tarjeta resume el proyecto: presupuesto, ejecutado, disponible, donaciones y % de avance.",
            },
          },
          {
            id: "paso-1-informacion",
            title: 'Paso 1 de 5 — "Información"',
            body:
              "Llena los datos básicos del proyecto. Todos los campos marcados con asterisco son obligatorios.",
            bullets: [
              "Nombre — cómo se llamará el proyecto en listados y reportes.",
              "Categoría — Proyecto o el tipo que aplique.",
              "Fecha inicio / Fecha fin — define la duración total.",
              "Descripción y Objetivos — qué busca lograr el proyecto.",
              'Logros — metas medibles. Puedes agregar varias con "Agregar logro".',
            ],
            screenshot: {
              src: "/docs/proyectos/crear-proyecto/proy-03-wizard-paso1-lleno.png",
              alt: "Paso 1 del wizard con campos de Nombre, Categoría, Fechas, Descripción y Objetivos llenos",
              caption:
                "Paso 1 con todos los campos básicos llenos.",
            },
            callout: {
              variant: "tip",
              title: "Sugerencia",
              text:
                "Escribe objetivos concretos y medibles. Aparecerán en los reportes de avance, así que claridad acá ahorra confusiones después.",
            },
          },
          {
            id: "paso-2-fuentes",
            title: 'Paso 2 de 5 — "Fuentes"',
            body:
              'Registra de dónde viene el dinero del proyecto. Cada fuente tiene un monto y una fecha de desembolso. Puedes agregar varias con "Agrega más" o importarlas desde un Excel usando el botón "Descargar Formato" como plantilla.',
            screenshot: {
              src: "/docs/proyectos/crear-proyecto/proy-05-wizard-paso2-fuente-dropdown.png",
              alt: "Paso 2 del wizard mostrando el dropdown de Fuente con opciones USAID, BANHCAFE, GIZ y UTH",
              caption:
                "Selecciona la fuente de financiamiento del catálogo. Si falta una fuente, créala primero en el módulo Fuentes.",
            },
            callout: {
              variant: "info",
              title: "Importar desde Excel",
              text:
                'Si tienes muchas fuentes, descarga el formato Excel con "Descargar Formato", llénalo y súbelo arrastrándolo al área de carga. Es más rápido que agregarlas una por una.',
            },
          },
          {
            id: "paso-3-donaciones",
            title: 'Paso 3 de 5 — "Donaciones"',
            body:
              'Las donaciones son aportes adicionales al presupuesto. Cada una tiene monto, tipo (Efectivo o Especie) y donante. Si tu proyecto no tiene donaciones, puedes pasar al siguiente paso sin llenar nada.',
            screenshot: {
              src: "/docs/proyectos/crear-proyecto/proy-06-wizard-paso3-donaciones.png",
              alt: "Paso 3 del wizard con campos de Monto, Tipo (Efectivo/Especie), Donante y Fecha Desembolso",
              caption:
                'El tipo "Especie" se usa para donaciones no monetarias: equipo, insumos, capacitaciones.',
            },
          },
          {
            id: "paso-4-gastos",
            title: 'Paso 4 de 5 — "Gastos"',
            body:
              "Registra los gastos planeados o iniciales del proyecto. Cada gasto se asocia a una categoría. Puedes elegir una categoría existente o crear una nueva escribiéndola en el campo \"Nueva categoría de gasto\".",
            screenshot: {
              src: "/docs/proyectos/crear-proyecto/proy-08-wizard-paso4-categoria-dropdown.png",
              alt: "Dropdown de Categoría con opciones como Estipendios, Kit de Emprendimiento, Overhead Trimestral",
              caption:
                "Las categorías te permiten agrupar gastos similares para análisis posterior.",
            },
            callout: {
              variant: "tip",
              title: "Truco",
              text:
                "Puedes saltar este paso y registrar los gastos uno por uno más adelante desde la pestaña Gastos del proyecto. Acá solo registra los que ya tienes claros desde el inicio.",
            },
          },
          {
            id: "paso-5-archivos",
            title: 'Paso 5 de 5 — "Archivos"',
            body:
              "Adjunta documentos relevantes: convenio firmado, propuesta del proyecto, presupuesto detallado, etc. Acepta PDF, Word, Excel, JPG y PNG hasta 10 MB.",
            screenshot: {
              src: "/docs/proyectos/crear-proyecto/proy-09-wizard-paso5-archivos.png",
              alt: 'Paso 5 del wizard con área para subir archivos y mensaje "pdf, docx, xlsx, jpg, png · Máx. 10MB"',
              caption:
                "Si dejas vacío el nombre, se usa el original del archivo.",
            },
            callout: {
              variant: "warning",
              title: "Importante",
              text:
                "Los archivos quedan visibles a todos los usuarios con acceso al proyecto. No subas información confidencial que no quieras compartir con el equipo.",
            },
          },
          {
            id: "finalizar",
            title: 'Pulsa "Finalizar" para crear el proyecto',
            body:
              'Cuando termines el paso 5, pulsa "Finalizar". El sistema valida toda la información, crea el proyecto y te regresa al listado. Verás el nuevo proyecto en la parte superior de la lista.',
            callout: {
              variant: "success",
              title: "Resultado esperado",
              text:
                "El proyecto aparece en la lista con presupuesto general, ejecutado y disponible calculados automáticamente a partir de fuentes, donaciones y gastos iniciales.",
            },
          },
        ],
        related: [
          { moduleSlug: "proyectos", actionSlug: "ver-detalle" },
          { moduleSlug: "proyectos", actionSlug: "editar-proyecto" },
        ],
      },
      {
        slug: "ver-detalle",
        title: "Ver el detalle de un proyecto",
        summary:
          "Navega por las 7 pestañas del proyecto: general, fuentes, donaciones, gastos, archivos, beneficiarios y bitácora.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "partial", note: "Solo los proyectos donde está asignado" },
        },
        steps: [
          {
            id: "abrir-proyecto",
            title: "Abre el proyecto desde el listado",
            body:
              "En el módulo de Proyectos, haz clic en cualquier tarjeta para entrar al detalle. Si tu rol es Agente, solo verás los proyectos en los que estás asignado.",
            callout: {
              variant: "info",
              title: "Filtro por estado",
              text:
                'Arriba a la derecha del listado hay un filtro "Activo / Archivado / Todos". Por defecto muestra solo los Activos.',
            },
          },
          {
            id: "panel-resumen",
            title: "Panel de resumen en la parte superior",
            body:
              "Lo primero que ves es el panel azul con los datos clave del proyecto:",
            bullets: [
              "Nombre, categoría y descripción.",
              "Fechas de inicio y fin.",
              "Presupuesto general, ejecutado y disponible.",
              "Donaciones en especie y efectivo.",
              "Logros completados y porcentaje total de fondo ejecutado.",
            ],
            screenshot: {
              src: "/docs/proyectos/ver-detalle/proy-10-detalle-general.png",
              alt: "Panel superior del detalle del proyecto con presupuesto, donaciones y logros",
              caption:
                "Vista de resumen. Si el ejecutado supera al presupuesto general, aparece la métrica \"SOBRE EJECUCIÓN\" en rojo.",
            },
          },
          {
            id: "pestanas",
            title: "Navega por las 7 pestañas",
            body:
              "Debajo del panel hay una tira de pestañas. Cada una muestra una dimensión del proyecto:",
            bullets: [
              'General — información, objetivos, fechas y logros del proyecto.',
              "Fuentes — financiamientos asociados (USAID, BANHCAFE, etc.).",
              "Donaciones — aportes adicionales (efectivo o especie).",
              "Gastos — ejecución del presupuesto, gasto por gasto.",
              "Archivos — documentos adjuntos al proyecto.",
              "Beneficiarios — procesos educativos vinculados (los estudiantes que reciben el beneficio).",
              "Bitácora — historial de acciones específicas de este proyecto.",
            ],
          },
          {
            id: "pestana-gastos",
            title: 'Pestaña "Gastos" — la más usada para ejecución',
            body:
              'En la pestaña "Gastos" verás el total ejecutado y la lista de gastos individuales. Desde acá puedes agregar gastos uno a uno con "Agregar Gasto" o importar muchos a la vez con "Importar Excel".',
            screenshot: {
              src: "/docs/proyectos/ver-detalle/proy-11-detalle-gastos.png",
              alt: 'Pestaña Gastos con total L 0.00 y botones Descargar Formato, Importar Excel, Agregar Gasto',
              caption:
                "Si aún no hay gastos verás un mensaje invitándote a agregar el primero.",
            },
          },
          {
            id: "pestana-beneficiarios",
            title: 'Pestaña "Beneficiarios" — vincula procesos educativos',
            body:
              'Esta pestaña conecta el proyecto con los procesos educativos del SGC. Cada proceso vinculado agrega sus estudiantes como beneficiarios del proyecto, sumando para los reportes.',
            screenshot: {
              src: "/docs/proyectos/ver-detalle/proy-13-detalle-beneficiarios.png",
              alt: 'Pestaña Beneficiarios con botón "Vincular Proceso" y mensaje "No hay procesos educativos vinculados"',
              caption:
                "Un proyecto puede vincular varios procesos. Los estudiantes de cada proceso se cuentan como beneficiarios.",
            },
          },
        ],
        related: [
          { moduleSlug: "proyectos", actionSlug: "editar-proyecto" },
          { moduleSlug: "proyectos", actionSlug: "registrar-gasto" },
          { moduleSlug: "proyectos", actionSlug: "vincular-beneficiarios" },
        ],
      },
      {
        slug: "editar-proyecto",
        title: "Editar un proyecto y asignar agentes",
        summary:
          "Actualiza información, fechas, logros y asigna los agentes que tendrán acceso al proyecto.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "partial", note: "Solo los proyectos asignados, sin reasignar equipo" },
        },
        steps: [
          {
            id: "entrar-modo-edicion",
            title: "Entra al modo de edición",
            body:
              'Abre el detalle del proyecto y, en la pestaña "General", pulsa el botón "Editar" arriba a la derecha de la sección "Información General del Proyecto". Los campos pasan a modo edición.',
            screenshot: {
              src: "/docs/proyectos/editar-proyecto/proy-14-editar-general.png",
              alt: "Formulario de edición con campos editables: Nombre, Categoría, Agentes asignados, Descripción, Objetivos, Fechas",
              caption:
                "Modo edición. Todos los campos con asterisco son obligatorios.",
            },
          },
          {
            id: "modificar-campos",
            title: "Modifica los campos que necesites",
            body:
              "Puedes cambiar cualquiera de los siguientes datos. Solo se aplican los que toques:",
            bullets: [
              "Nombre — útil si hubo un error o cambio de nombre oficial.",
              "Categoría — Proyecto u otro tipo.",
              "Descripción y Objetivos — refresca el alcance si cambió.",
              "Fechas de inicio y fin — si el proyecto se extendió o se acortó.",
              "Logros — agrega nuevas metas o marca las ya cumplidas con el check.",
            ],
            callout: {
              variant: "warning",
              title: "Atención con las fechas",
              text:
                "Cambiar la fecha de inicio o fin no afecta los gastos ya registrados, pero sí cambia el cálculo del trimestre en reportes. Avisa al equipo antes de moverlas.",
            },
          },
          {
            id: "asignar-agentes",
            title: 'Asigna los agentes responsables',
            body:
              'En el campo "Agentes asignados" haz clic en el botón (dice "Sin asignar" si aún no hay nadie). Aparece un panel con todos los usuarios con rol Agente. Selecciona los que tendrán acceso a este proyecto.',
            screenshot: {
              src: "/docs/proyectos/editar-proyecto/proy-15-asignar-agentes.png",
              alt: 'Panel con lista de agentes disponibles: Makoto Agente y Test Richardson',
              caption:
                "Solo aparecen usuarios con rol Agente. Administradores y Supervisores tienen acceso a todos los proyectos automáticamente.",
            },
            callout: {
              variant: "info",
              title: "Por qué importa",
              text:
                "Un Agente solo puede ver y modificar los proyectos en los que está asignado. Si no asignas a nadie, ningún Agente podrá trabajar en este proyecto.",
            },
          },
          {
            id: "guardar",
            title: 'Pulsa "Guardar" para aplicar los cambios',
            body:
              'Al terminar, pulsa "Guardar" en la parte superior derecha del formulario. Si te arrepentiste, usa "Cancelar" y nada se guarda. Los cambios quedan registrados en la pestaña "Bitácora" del proyecto.',
            callout: {
              variant: "success",
              title: "Resultado esperado",
              text:
                "Verás una notificación de éxito y la vista regresa al modo lectura. Los nuevos agentes asignados ya pueden ver el proyecto en sus listados.",
            },
          },
        ],
        related: [
          { moduleSlug: "proyectos", actionSlug: "ver-detalle" },
          { moduleSlug: "proyectos", actionSlug: "registrar-gasto" },
        ],
      },
      {
        slug: "registrar-gasto",
        title: "Registrar un gasto en un proyecto",
        summary:
          "Añade gastos individuales para registrar la ejecución del presupuesto.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "partial", note: "Solo en proyectos asignados" },
        },
        steps: [
          {
            id: "ir-pestana-gastos",
            title: 'Entra al proyecto y abre la pestaña "Gastos"',
            body:
              'Desde el listado de Proyectos, haz clic en la tarjeta del proyecto. En el detalle, selecciona la pestaña "Gastos". Verás el total ejecutado y la lista actual de gastos.',
            screenshot: {
              src: "/docs/proyectos/registrar-gasto/proy-11-detalle-gastos.png",
              alt: "Pestaña Gastos con total y botones Descargar Formato, Importar Excel, Agregar Gasto",
              caption:
                "Si es un proyecto nuevo, la lista estará vacía con el mensaje \"No hay gastos. Agrega uno para comenzar\".",
            },
          },
          {
            id: "abrir-modal-gasto",
            title: 'Pulsa "Agregar Gasto"',
            body:
              'Botón verde arriba a la derecha de la lista. Se abre una ventana modal con el formulario para registrar un solo gasto.',
            screenshot: {
              src: "/docs/proyectos/registrar-gasto/proy-12-agregar-gasto-modal.png",
              alt: "Modal Agregar Gasto con campos Monto, Categoría (opcional), Descripción (opcional)",
              caption:
                "Solo el monto es obligatorio. Categoría y descripción son opcionales pero recomendadas para análisis.",
            },
          },
          {
            id: "llenar-gasto",
            title: "Llena el gasto",
            body:
              "Tres campos a considerar:",
            bullets: [
              "Monto — el valor del gasto en lempiras. No lleva el símbolo \"L\", solo el número.",
              "Categoría — elige una existente o crea una nueva con \"Nueva categoría...\".",
              "Descripción — anota qué se compró o pagó. Aparecerá en los reportes de ejecución.",
            ],
            callout: {
              variant: "tip",
              title: "Sugerencia",
              text:
                "Usa siempre una categoría. Aunque sea opcional, sin categoría los reportes de \"Gastos por categoría\" no incluirán este gasto.",
            },
          },
          {
            id: "agregar",
            title: 'Pulsa "Agregar" para registrar el gasto',
            body:
              'El gasto se suma al total ejecutado del proyecto. Si el total ejecutado supera al presupuesto general, aparecerá la métrica "SOBRE EJECUCIÓN" en el panel superior — eso es señal de revisar el plan.',
            callout: {
              variant: "warning",
              title: "Los gastos no se pueden borrar",
              text:
                "Una vez agregado, el gasto queda registrado permanentemente para auditoría. Si te equivocaste, agrega un gasto compensatorio con monto negativo (consulta con tu administrador).",
            },
          },
          {
            id: "importar-excel",
            title: "Alternativa: importar muchos gastos con Excel",
            body:
              'Si tienes muchos gastos que registrar (por ejemplo, los del mes pasado), descarga la plantilla con "Descargar Formato", llena todas las filas en Excel y arrástrala al área de "Importar Excel". Te ahorra horas comparado con agregarlos uno por uno.',
            callout: {
              variant: "danger",
              title: "Verifica antes de importar",
              text:
                "La importación de Excel registra TODAS las filas válidas inmediatamente. Revisa que las categorías existen y que los montos están bien. Una vez importado, no hay deshacer masivo.",
            },
          },
        ],
        related: [
          { moduleSlug: "proyectos", actionSlug: "ver-detalle" },
        ],
      },
      {
        slug: "vincular-beneficiarios",
        title: "Vincular procesos educativos (beneficiarios)",
        summary:
          "Conecta procesos educativos del SGC al proyecto para sumar sus estudiantes como beneficiarios.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "partial", note: "Solo en proyectos asignados" },
        },
        steps: [
          {
            id: "ir-beneficiarios",
            title: 'Abre la pestaña "Beneficiarios" del proyecto',
            body:
              'Dentro del detalle del proyecto, selecciona la pestaña "Beneficiarios". Verás la lista de procesos educativos ya vinculados (o un mensaje vacío si aún no hay).',
            screenshot: {
              src: "/docs/proyectos/vincular-beneficiarios/proy-13-detalle-beneficiarios.png",
              alt: 'Pestaña Beneficiarios con botón "Vincular Proceso" y mensaje de lista vacía',
              caption:
                "Cada proceso vinculado aporta sus estudiantes al conteo total de beneficiarios del proyecto.",
            },
          },
          {
            id: "que-es-proceso",
            title: "Qué es un proceso educativo",
            body:
              "Un proceso educativo es una corrida de un curso en un centro. Por ejemplo: \"Panadería Básica 2026-Q2 en Centro San José\". Vive en el módulo Centros → Procesos Educativos. Cada proceso tiene su grupo de estudiantes matriculados.",
            callout: {
              variant: "info",
              title: "Antes de vincular",
              text:
                "Si el proceso aún no existe, créalo primero desde el módulo Centros → Procesos Educativos y matricula a sus estudiantes. Después vuelve acá a vincularlo.",
            },
          },
          {
            id: "pulsar-vincular",
            title: 'Pulsa "Vincular Proceso" y elige uno',
            body:
              'Aparece una lista de los procesos educativos disponibles. Selecciona el que corresponda y confirma. Puedes vincular varios procesos al mismo proyecto si el proyecto cubre varios cursos o centros.',
          },
          {
            id: "verificar",
            title: "Verifica el conteo de beneficiarios",
            body:
              "Una vez vinculado, el proceso aparece en la lista de la pestaña. El total de beneficiarios del proyecto suma los estudiantes matriculados en todos los procesos vinculados. Si matriculas más estudiantes en uno de los procesos, el conteo del proyecto se actualiza automáticamente.",
            callout: {
              variant: "success",
              title: "Resultado esperado",
              text:
                "Los reportes de cobertura del proyecto ya muestran el número correcto de beneficiarios. Si necesitas desvincular un proceso, en la lista aparece un botón para hacerlo.",
            },
          },
        ],
        related: [
          { moduleSlug: "proyectos", actionSlug: "ver-detalle" },
        ],
      },
      {
        slug: "archivar-eliminar",
        title: "Archivar o eliminar un proyecto",
        summary:
          "Cierra un proyecto que ya terminó (archivar) o bórralo si fue un error (eliminar).",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "partial", note: "Solo archivar; eliminar es solo admin" },
          USER: { level: "none" },
        },
        steps: [
          {
            id: "elegir-accion",
            title: "Decide: ¿archivar o eliminar?",
            body:
              "Son dos acciones muy distintas:",
            bullets: [
              "Archivar — el proyecto se marca como cerrado. Sigue existiendo y sus datos quedan disponibles para reportes históricos. Se oculta del listado por defecto pero puedes verlo con el filtro \"Archivado\". Es reversible.",
              "Eliminar — borra el proyecto y TODOS sus datos (fuentes, donaciones, gastos, archivos, vínculos a beneficiarios). No es reversible. Úsalo solo si el proyecto fue creado por error y nunca tuvo datos reales.",
            ],
            callout: {
              variant: "warning",
              title: "Regla práctica",
              text:
                "Si el proyecto tiene gastos, archívalo. Si está totalmente vacío y nunca debió crearse, elimínalo.",
            },
          },
          {
            id: "abrir-detalle",
            title: "Entra al detalle del proyecto",
            body:
              'Desde el listado de Proyectos, haz clic en la tarjeta. Arriba a la derecha del panel de resumen verás dos botones: "Archivar Proyecto" y "Eliminar Proyecto".',
            screenshot: {
              src: "/docs/proyectos/archivar-eliminar/proy-10-detalle-general.png",
              alt: "Detalle del proyecto con botones Archivar Proyecto y Eliminar Proyecto arriba a la derecha",
              caption:
                'Ambos botones están en la cabecera del proyecto, separados del resto de las acciones.',
            },
          },
          {
            id: "archivar",
            title: "Para archivar: pulsa \"Archivar Proyecto\"",
            body:
              'El proyecto pasa a estado "Archivado". Desaparece del listado por defecto pero sigue contando en los reportes históricos. Para verlo de nuevo, cambia el filtro de estado a "Archivado" o "Todos" en el listado.',
            callout: {
              variant: "tip",
              title: "Cómo desarchivar",
              text:
                "Entra a un proyecto archivado y verás un botón \"Reactivar Proyecto\" en lugar de \"Archivar\". Lo regresa al listado de activos.",
            },
          },
          {
            id: "eliminar",
            title: "Para eliminar: pulsa \"Eliminar Proyecto\"",
            body:
              'Aparece una confirmación con un mensaje claro: "Esta acción no se puede deshacer. Se eliminarán todos los datos del proyecto." Si estás seguro, pulsa "Eliminar". Si dudas, pulsa "Cancelar".',
            screenshot: {
              src: "/docs/proyectos/archivar-eliminar/proy-16-eliminar-confirm.png",
              alt: 'Diálogo de confirmación "Eliminar proyecto" con advertencia y botones Cancelar / Eliminar',
              caption:
                "Confirmación obligatoria antes de borrar. Una vez confirmado, los datos se pierden para siempre.",
            },
            callout: {
              variant: "danger",
              title: "Nunca elimines un proyecto con datos reales",
              text:
                "Aunque sea \"de prueba\", si el proyecto tuvo aunque sea un gasto o un beneficiario vinculado, archívalo. Los reportes históricos los necesitan.",
            },
          },
        ],
        related: [
          { moduleSlug: "proyectos", actionSlug: "ver-detalle" },
        ],
      },
    ],
  },
  {
    slug: "reportes",
    title: "Reportes",
    summary:
      "Corre los reportes R1–R11, filtra por trimestre y exporta a Excel/PDF.",
    icon: BarChart3,
    visibleTo: ["ADMIN", "MANAGER", "USER"],
    actions: [],
  },
  {
    slug: "centros",
    title: "Centros",
    summary:
      "Gestión de centros, áreas, instructores, estudiantes y cursos del SGC.",
    icon: Building2,
    visibleTo: ["ADMIN", "MANAGER"],
    actions: [
      {
        slug: "conceptos",
        title: "Conceptos básicos del módulo Centros",
        summary:
          "Entiende la jerarquía de centros, áreas, cursos, instructores, estudiantes y procesos educativos antes de empezar.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "none" },
        },
        steps: [
          {
            id: "vision-general",
            title: "Visión general del módulo",
            body:
              'El módulo "Centros" es el corazón académico del sistema. Aquí vives el SGC (Sistema de Gestión de Centros) heredado: registras los centros educativos, sus instructores, sus estudiantes, su catálogo de cursos y cada vez que se imparte un curso (eso se llama "proceso educativo"). Antes de crear nada, te conviene entender cómo se conectan los conceptos.',
            screenshot: {
              src: "/docs/centros/conceptos/cen-01-centros-listado.png",
              alt: "Listado de centros de formación profesional con tarjetas que muestran siglas, código, ubicación y contacto",
              caption:
                "Vista del listado de centros — el punto de entrada principal del módulo.",
            },
          },
          {
            id: "jerarquia",
            title: "La jerarquía: 6 conceptos conectados",
            body:
              "Cada concepto tiene un rol específico. Léelos en orden — uno depende del anterior:",
            bullets: [
              "Centro — la institución física. Ejemplo: \"Instituto Técnico Loyola\" en El Progreso, Yoro. Tiene un código único, dirección, director y persona de contacto.",
              "Área técnica — la disciplina general que se enseña. Ejemplo: \"Mecánica Automotriz\", \"Panadería\", \"Soldadura\". Las áreas son compartidas entre centros (catálogo nacional).",
              "Curso — un programa de formación específico dentro de un área, con código y horas. Ejemplo: \"AFINADOR DE MOTORES (MA, 298 horas)\". Cada centro tiene su catálogo de cursos.",
              "Instructor — la persona que enseña, vinculada a un centro. Tiene título obtenido y hoja de vida.",
              "Estudiante — la persona que aprende, vinculada a un centro como su sede principal.",
              "Proceso educativo — una corrida específica de un curso en un centro, con su instructor, fechas y matrícula. Ejemplo: \"AFINADOR DE MOTORES en Stephen Youngberg, 2021-03-22 al 2021-08-16, con instructor Adonis Calix\". Aquí es donde realmente se cuentan los beneficiarios para reportes.",
            ],
            callout: {
              variant: "info",
              title: "El proceso educativo es la clave",
              text:
                "Un curso por sí solo no cuenta estudiantes. Solo cuando creas un proceso educativo (curso + centro + fechas + instructor) y matriculas estudiantes, esos estudiantes pasan a contar como beneficiarios en reportes y en los proyectos vinculados.",
            },
          },
          {
            id: "orden-creacion",
            title: "Orden recomendado para dar de alta cosas nuevas",
            body:
              "Si vas a registrar un centro nuevo desde cero, sigue este orden — es el que minimiza errores:",
            bullets: [
              "1. Verifica que el Área técnica existe (módulo Áreas). Si no, créala primero.",
              "2. Da de alta el Centro (módulo Gestionar Centros).",
              "3. Registra los Instructores del centro.",
              "4. Da de alta los Cursos que ofrece el centro.",
              "5. Cuando inicia una nueva corrida, crea el Proceso Educativo y matricula a los estudiantes.",
              "6. Los Estudiantes pueden crearse uno por uno o importarse en masa desde el módulo Estudiantes.",
            ],
            callout: {
              variant: "tip",
              title: "Atajo: usa el wizard de Crear Centro",
              text:
                'Si creas un centro nuevo con el botón "Crear Centro", el wizard te permite agregar cursos, instructores y estudiantes en la misma sesión. Más eficiente que ir submódulo por submódulo.',
            },
          },
          {
            id: "vista-detalle",
            title: "Cómo se ve todo junto: el detalle de un centro",
            body:
              "Cuando entras a cualquier centro, ves arriba sus KPIs (cuántos instructores, estudiantes y cursos tiene) y abajo cuatro pestañas: General, Cursos, Instructores y Estudiantes. Desde acá puedes administrar todo lo que pertenece al centro sin salir de la pantalla.",
            screenshot: {
              src: "/docs/centros/conceptos/cen-03-centro-detalle.png",
              alt: "Detalle de centro Stephen Youngberg con KPIs (6 instructores, 120 estudiantes, 12 cursos) y pestañas",
              caption:
                "Vista de detalle. Los números del panel azul resumen el estado del centro de un vistazo.",
            },
          },
        ],
        related: [
          { moduleSlug: "centros", actionSlug: "crear-centro" },
          { moduleSlug: "centros", actionSlug: "crear-proceso" },
        ],
      },
      {
        slug: "crear-centro",
        title: "Crear un centro",
        summary:
          "Da de alta una institución educativa con su información general, cursos, instructores y estudiantes iniciales.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "none" },
        },
        steps: [
          {
            id: "abrir-modulo",
            title: 'Abre "Centros → Gestionar Centros"',
            body:
              'Entra al módulo. Verás la lista de centros existentes con sus datos clave: nombre, siglas, código, ubicación y contacto. Arriba a la derecha está el botón "Crear Centro".',
            screenshot: {
              src: "/docs/centros/crear-centro/cen-01-centros-listado.png",
              alt: "Listado de centros con botón Crear Centro arriba a la derecha",
              caption:
                "Cada tarjeta es un centro de formación profesional registrado en el sistema.",
            },
          },
          {
            id: "wizard-paso-1",
            title: 'Paso 1 de 4 — "Información General"',
            body:
              "Llena los datos básicos del centro. Es el paso más largo porque agrupa tres bloques de información:",
            bullets: [
              'Datos del centro — Nombre, Siglas (ej. "CFP SY"), Código (ej. "CFP-022"), Departamento, Municipio, Dirección, Teléfono, Email, web y redes.',
              "Director — Nombre, teléfono y email del director del centro.",
              "Persona de contacto — Quién es la persona del día a día (puede ser distinta al director).",
            ],
            screenshot: {
              src: "/docs/centros/crear-centro/cen-02-crear-centro-wizard.png",
              alt: 'Wizard "Crear Centro" en paso 1 con campos de datos del centro, director y persona de contacto',
              caption:
                "Wizard de 4 pasos. Solo el paso 1 es obligatorio en su mayoría — los demás se pueden saltar.",
            },
            callout: {
              variant: "warning",
              title: "El código del centro es único",
              text:
                'El "Código" (formato CFP-NNN) identifica al centro de forma única en todo el sistema y aparece en reportes oficiales. Si ya está usado, el sistema te avisará. Consulta con CADERH si no sabes qué código asignar.',
            },
          },
          {
            id: "wizard-paso-2",
            title: 'Paso 2 de 4 — "Cursos" (opcional)',
            body:
              'En este paso puedes empezar a registrar el catálogo de cursos que ofrece el centro. No es obligatorio — puedes saltarlo y agregar cursos después desde el módulo "Cursos" o desde la pestaña Cursos del detalle del centro.',
            callout: {
              variant: "tip",
              title: "Sugerencia",
              text:
                "Salta este paso si aún no tienes claro el catálogo. Es más fácil agregar cursos uno por uno con calma después que apurarte aquí.",
            },
          },
          {
            id: "wizard-paso-3",
            title: 'Paso 3 de 4 — "Instructores" (opcional)',
            body:
              'Mismo principio que con cursos: puedes registrar los instructores iniciales o saltarte el paso. Si saltas, podrás agregarlos después desde el módulo "Instructores".',
          },
          {
            id: "wizard-paso-4",
            title: 'Paso 4 de 4 — "Estudiantes" (opcional)',
            body:
              "El último paso te permite registrar estudiantes iniciales del centro. Por la cantidad típica de estudiantes (decenas o cientos), suele ser más práctico saltarse este paso y luego importar el listado completo en bloque desde el módulo Estudiantes usando un Excel.",
            callout: {
              variant: "info",
              title: "Importación en bloque",
              text:
                'En el módulo Estudiantes encontrarás los botones "Descargar Formato" e "Importar Excel" para subir muchos estudiantes a la vez.',
            },
          },
          {
            id: "finalizar",
            title: 'Finaliza y verifica el centro creado',
            body:
              "Cuando termines, el sistema crea el centro y te lleva a su pantalla de detalle. Verás los KPIs en cero (0 instructores, 0 estudiantes, 0 cursos) si saltaste los pasos opcionales. Desde acá ya puedes empezar a poblar el centro.",
            screenshot: {
              src: "/docs/centros/crear-centro/cen-03-centro-detalle.png",
              alt: "Detalle de un centro recién creado con sus KPIs y 4 pestañas (General, Cursos, Instructores, Estudiantes)",
              caption:
                "Vista de detalle. Las 4 pestañas te dejan administrar todo el contenido del centro sin salir.",
            },
            callout: {
              variant: "success",
              title: "Resultado esperado",
              text:
                "El centro aparece en el listado principal con estado \"Activo\". Ya puedes asignarle cursos, instructores y estudiantes.",
            },
          },
        ],
        related: [
          { moduleSlug: "centros", actionSlug: "crear-instructor" },
          { moduleSlug: "centros", actionSlug: "crear-curso" },
        ],
      },
      {
        slug: "gestionar-areas",
        title: "Gestionar áreas técnicas",
        summary:
          "Administra el catálogo nacional de áreas técnicas (Mecánica, Panadería, Soldadura, etc.) que se enseñan en los centros.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "none" },
        },
        steps: [
          {
            id: "que-es-area",
            title: "Qué es un área técnica",
            body:
              "Un área técnica es la disciplina general que se enseña en uno o varios centros. Es un catálogo nacional compartido: \"Soldadura\" es la misma área esté donde esté el centro. Cada curso pertenece a un área, y los reportes agrupan beneficiarios por área para ver tendencias macro.",
            callout: {
              variant: "info",
              title: "Por qué importa mantener este catálogo limpio",
              text:
                'Si dos personas crean "Mecánica Automotriz" y "Mecánica Automotríz" (con tilde) como áreas separadas, los reportes contarán como dos áreas distintas. Antes de crear una nueva, busca si ya existe.',
            },
          },
          {
            id: "abrir-modulo",
            title: 'Abre "Centros → Áreas"',
            body:
              "Verás un listado con todas las áreas registradas en el sistema. El módulo es simple: solo nombre del área y la cantidad total al final.",
            screenshot: {
              src: "/docs/centros/gestionar-areas/cen-04-areas.png",
              alt: "Listado de áreas técnicas con 25 áreas registradas (Agroindustrial, Cocina, Mecánica, etc.)",
              caption:
                "Listado completo del catálogo nacional de áreas.",
            },
          },
          {
            id: "buscar-existente",
            title: "Primero, busca si ya existe",
            body:
              'Antes de crear un área nueva, usa el campo "Buscar área..." arriba. Escribe parte del nombre — el sistema filtra al instante. Si encuentras una variante ligeramente distinta, considéralo: tal vez sea la misma área con otro nombre.',
          },
          {
            id: "crear-area",
            title: 'Crear área nueva',
            body:
              'Si confirmaste que no existe, pulsa "Crear Área" arriba a la derecha. Se abre un modal con un solo campo: Nombre. Escribe el nombre del área y pulsa "Crear".',
            screenshot: {
              src: "/docs/centros/gestionar-areas/cen-05-crear-area-modal.png",
              alt: 'Modal "Crear área" con un campo "Nombre *" y botones Cancelar / Crear',
              caption:
                "Modal minimalista — solo se pide el nombre. La sencillez ayuda a mantener el catálogo limpio.",
            },
            callout: {
              variant: "tip",
              title: "Convención de nombres",
              text:
                'Usa Mayúscula al inicio de cada palabra principal y sin tildes raras: "Mecánica Automotriz", no "MECANICA AUTOMOTRIZ" ni "mecanica automotríz". Revisa cómo están escritas las áreas existentes y mantén el estilo.',
            },
          },
          {
            id: "eliminar",
            title: "Eliminar un área (con precaución)",
            body:
              "Cada tarjeta de área tiene un botón con icono de papelera. Solo puedes eliminar áreas que NO tengan cursos asociados — si el área se usa, el sistema bloquea la eliminación. Si necesitas \"borrar\" un área activa, primero reasigna sus cursos a otra área (o crea una de reemplazo).",
            callout: {
              variant: "warning",
              title: "Renombrar es mejor que recrear",
              text:
                "Si solo necesitas cambiar el nombre, usa el botón de editar (lápiz) en la misma tarjeta. Eso mantiene los cursos vinculados y los reportes históricos íntegros.",
            },
          },
        ],
        related: [
          { moduleSlug: "centros", actionSlug: "crear-curso" },
        ],
      },
      {
        slug: "crear-instructor",
        title: "Crear un instructor",
        summary:
          "Registra docentes vinculados a un centro educativo con su título y hoja de vida.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "none" },
        },
        steps: [
          {
            id: "abrir-modulo",
            title: 'Abre "Centros → Instructores"',
            body:
              "Verás la lista de instructores con su centro, nombre, título obtenido y un botón \"Ver\" para revisar su hoja de vida si la tiene cargada. Usa el filtro \"Centro\" arriba si solo quieres ver los de una institución.",
            screenshot: {
              src: "/docs/centros/crear-instructor/cen-06-instructores.png",
              alt: "Listado de instructores agrupados por centro con título obtenido y enlace a hoja de vida",
              caption:
                'Filtra por centro con el botón "Todos los centros" arriba. Útil cuando hay muchos instructores.',
            },
          },
          {
            id: "pulsar-crear",
            title: 'Pulsa "Crear Instructor"',
            body:
              "Botón verde arriba a la derecha. Se abre un modal con el formulario.",
            screenshot: {
              src: "/docs/centros/crear-instructor/cen-07-crear-instructor-modal.png",
              alt: "Modal Crear Instructor con campos Centro, Nombres, Apellidos, Título obtenido, Otros títulos y subida de hoja de vida",
              caption:
                "El campo Centro es obligatorio porque un instructor siempre pertenece a un centro.",
            },
          },
          {
            id: "llenar-form",
            title: "Llena los datos del instructor",
            body:
              "Cuatro datos clave y un archivo opcional:",
            bullets: [
              "Centro * — el centro donde da clases. Usa el buscador para encontrarlo rápido.",
              "Nombres * — los nombres del instructor.",
              "Apellidos * — los apellidos.",
              "Título obtenido — el título profesional principal (Ing., Lic., Técnico en...).",
              "Otros títulos — certificaciones adicionales, separadas por coma.",
              "Hoja de vida — archivo PDF, Word, Excel, JPG o PNG hasta 10MB. Útil para auditorías y para que coordinadores puedan ver la trayectoria sin pedirlo aparte.",
            ],
            callout: {
              variant: "tip",
              title: "Sube la hoja de vida ahora si la tienes",
              text:
                "Subirla en el momento de la creación es mucho más fácil que volver después a buscar al instructor para adjuntarla. Si la persona no la tiene digital, una foto del título sirve.",
            },
          },
          {
            id: "guardar",
            title: 'Pulsa "Crear" para registrar al instructor',
            body:
              "El instructor se agrega al listado y ya puede ser asignado como responsable de procesos educativos del centro. Su nombre aparecerá en el dropdown \"Instructor\" cuando crees procesos en ese centro.",
            callout: {
              variant: "success",
              title: "Resultado esperado",
              text:
                "El instructor aparece en la lista filtrada por su centro. El conteo de instructores en el detalle del centro sube en 1.",
            },
          },
          {
            id: "instructor-multi-centro",
            title: "¿Qué pasa si un instructor enseña en varios centros?",
            body:
              "Cada registro de instructor está vinculado a UN solo centro. Si la misma persona trabaja en dos centros, debes crearla dos veces (una por centro). No es lo ideal, pero refleja la realidad de los pagos y reportes por centro.",
            callout: {
              variant: "warning",
              title: "Limitación actual",
              text:
                "Si un instructor cambia de centro, no hay manera de \"moverlo\" — debes crearlo en el nuevo centro y eliminarlo del anterior (siempre que no tenga procesos activos).",
            },
          },
        ],
        related: [
          { moduleSlug: "centros", actionSlug: "crear-centro" },
          { moduleSlug: "centros", actionSlug: "crear-proceso" },
        ],
      },
      {
        slug: "crear-estudiante",
        title: "Crear un estudiante",
        summary:
          "Registra un estudiante en un centro con sus datos personales, ubicación, educación, situación laboral e información adicional.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "none" },
        },
        steps: [
          {
            id: "abrir-modulo",
            title: 'Abre "Centros → Estudiantes"',
            body:
              "Verás un listado paginado de todos los estudiantes del sistema (suelen ser miles). Cada fila muestra centro, nombre, identidad y contacto. Usa el filtro de centro y la búsqueda por nombre o identidad para encontrar rápido.",
            screenshot: {
              src: "/docs/centros/crear-estudiante/cen-08-estudiantes.png",
              alt: "Listado de estudiantes con filtros de centro y búsqueda, total 4,482 estudiantes registrados",
              caption:
                "Listado completo. Filtra por centro antes de buscar para resultados más enfocados.",
            },
            callout: {
              variant: "tip",
              title: "¿Vas a registrar muchos estudiantes?",
              text:
                'Si tienes más de 10 estudiantes que registrar, usa "Descargar Formato" para obtener una plantilla Excel, llénala completa y súbela con "Importar Excel". Ahorra horas comparado con crear uno por uno.',
            },
          },
          {
            id: "pulsar-crear",
            title: 'Pulsa "Crear Estudiante"',
            body:
              "Botón verde arriba a la derecha. Abre un wizard de 5 pasos porque el sistema captura mucha información para reportes demográficos y de impacto social.",
            screenshot: {
              src: "/docs/centros/crear-estudiante/cen-09-crear-estudiante-modal.png",
              alt: "Wizard Crear Estudiante en paso 1 con campos Centro, Identidad, Fecha de nacimiento, Nombres, Apellidos, Sexo, Estado civil",
              caption:
                "Wizard de 5 pasos. Comparado con otros módulos, este pide más datos por su uso en reportes.",
            },
          },
          {
            id: "paso-1-personales",
            title: 'Paso 1 — "Datos Personales"',
            body:
              "Centro, identidad (número de DNI/identidad de Honduras o el ID que aplique), fecha de nacimiento, nombres, apellidos, sexo y estado civil. Todos los campos con asterisco son obligatorios.",
            callout: {
              variant: "warning",
              title: "Sobre la identidad",
              text:
                "El número de identidad debe ser único en el sistema. Si la persona ya está registrada en otro centro, el sistema te avisará. En ese caso revisa el listado primero — no se debe duplicar.",
            },
          },
          {
            id: "paso-2-ubicacion",
            title: 'Paso 2 — "Ubicación y Contacto"',
            body:
              "Departamento, municipio, aldea/caserío, dirección detallada, teléfono y email. Sirve para contacto y para reportes geográficos de cobertura.",
          },
          {
            id: "paso-3-educacion",
            title: 'Paso 3 — "Educación y Hogar"',
            body:
              "Último año de educación formal cursado, datos del padre/madre/encargado, tamaño del hogar, etc. Importante para perfilar al beneficiario en reportes de impacto.",
          },
          {
            id: "paso-4-laboral",
            title: 'Paso 4 — "Situación Laboral"',
            body:
              "Estado de empleo actual del estudiante, ingreso aproximado, si tiene trabajo formal o informal. Estos datos comparan situación antes y después del proceso de formación.",
            callout: {
              variant: "tip",
              title: "Si no se sabe, deja en blanco",
              text:
                "Es preferible dejar un campo vacío a llenarlo con datos inventados. Los reportes saben distinguir \"no sabe\" de \"sí responde\".",
            },
          },
          {
            id: "paso-5-adicional",
            title: 'Paso 5 — "Información Adicional"',
            body:
              "Datos extras como pertenencia a grupos étnicos, condición de discapacidad, situación de movilidad, etc. Cierra con \"Crear\" y el estudiante queda registrado en el centro.",
            callout: {
              variant: "success",
              title: "Resultado esperado",
              text:
                "El estudiante aparece en el listado. Ahora puede ser matriculado en procesos educativos del centro (eso lo cuenta como beneficiario activo).",
            },
          },
        ],
        related: [
          { moduleSlug: "centros", actionSlug: "crear-proceso" },
        ],
      },
      {
        slug: "crear-curso",
        title: "Crear un curso",
        summary:
          "Registra un programa formativo (con código, horas y módulos) que ofrece un centro.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "none" },
        },
        steps: [
          {
            id: "que-es-curso",
            title: "Qué es un curso vs. un proceso educativo",
            body:
              'Un "Curso" es el plan de estudios: nombre, código de programa, total de horas, taller sí/no, objetivo. Vive en el catálogo del centro. NO tiene fechas ni estudiantes matriculados. Un "Proceso educativo" es cuando ese curso se imparte en una fecha específica con un instructor y estudiantes — eso vive en otro módulo.',
            callout: {
              variant: "info",
              title: "Crea el curso primero",
              text:
                "Antes de crear un proceso educativo necesitas que el curso exista. Por eso este paso va antes que \"Crear un proceso educativo\".",
            },
          },
          {
            id: "abrir-modulo",
            title: 'Abre "Centros → Cursos"',
            body:
              "Verás el listado de cursos del sistema. Cada fila: centro, nombre del curso, código de programa (ej. \"MA\" para Mecánica Automotriz), total de horas.",
            screenshot: {
              src: "/docs/centros/crear-curso/cen-10-cursos.png",
              alt: "Listado de cursos con 225 cursos registrados, mostrando centro, nombre, código y horas",
              caption:
                "Filtra por centro arriba si solo te interesa el catálogo de una institución.",
            },
          },
          {
            id: "pulsar-crear",
            title: 'Pulsa "Crear Curso"',
            body:
              'Abre un wizard de 2 pasos: "Información General" y "Módulos".',
            screenshot: {
              src: "/docs/centros/crear-curso/cen-11-crear-curso-modal.png",
              alt: "Wizard Crear Curso en paso 1 con campos Centro, Código numérico, Nombre, Código de programa, Taller y Objetivo",
              caption:
                "Paso 1 del wizard. El campo Taller (Sí/No) indica si requiere espacio de taller práctico.",
            },
          },
          {
            id: "paso-1-info",
            title: 'Paso 1 — "Información General"',
            body:
              "Llena los datos del programa:",
            bullets: [
              "Centro * — a qué centro pertenece este curso.",
              "Código — número correlativo del curso dentro del centro.",
              'Nombre * — ej. "AFINADOR DE MOTORES", "Panadería Básica".',
              'Código de programa * — código corto del área (ej. "MA" para Mecánica Automotriz, "RF" para Refrigeración).',
              'Taller — Sí si el curso requiere taller físico/práctico, No si es solo teórico.',
              "Objetivo * — descripción del objetivo del curso. Aparece en reportes y certificados.",
            ],
          },
          {
            id: "paso-2-modulos",
            title: 'Paso 2 — "Módulos"',
            body:
              "Un curso se compone de módulos (unidades). Acá registras los módulos con su nombre y horas. El total de horas del curso será la suma de las horas de sus módulos. Si tu curso es simple, puede tener un solo módulo con el total de horas.",
            callout: {
              variant: "tip",
              title: "Módulos para reportes",
              text:
                "Los reportes pueden cortar avance por módulo. Si te interesa medir \"cuántos estudiantes terminaron el módulo X\", divide el curso en módulos significativos.",
            },
          },
          {
            id: "guardar",
            title: 'Finaliza y verifica',
            body:
              'Al finalizar, el curso aparece en el catálogo del centro. Ya puedes crear procesos educativos que lo usen.',
            callout: {
              variant: "success",
              title: "Resultado esperado",
              text:
                "El curso aparece en el listado con su centro asignado. El conteo de cursos en el detalle del centro sube en 1.",
            },
          },
        ],
        related: [
          { moduleSlug: "centros", actionSlug: "crear-proceso" },
          { moduleSlug: "centros", actionSlug: "gestionar-areas" },
        ],
      },
      {
        slug: "crear-proceso",
        title: "Crear un proceso educativo",
        summary:
          "Programa una corrida específica de un curso en un centro con fechas, instructor y matrícula de estudiantes.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "none" },
        },
        steps: [
          {
            id: "que-es-proceso",
            title: "Qué es un proceso educativo y por qué importa",
            body:
              "Un proceso educativo es \"esta corrida específica de este curso, en este centro, con este instructor, del día X al día Y, con estos estudiantes matriculados\". Es el concepto que conecta a TODOS los demás: curso + instructor + estudiantes + fechas. Es lo que se cuenta en reportes de cobertura, beneficiarios y avance.",
            callout: {
              variant: "info",
              title: "Antes de crear un proceso, asegúrate de tener",
              text:
                "Centro creado, curso creado en ese centro, instructor registrado en ese centro y estudiantes registrados (al menos uno) para matricular. Si te falta algo, créalo primero.",
            },
          },
          {
            id: "abrir-modulo",
            title: 'Abre "Centros → Procesos Educativos"',
            body:
              "Verás el listado de procesos con su centro, nombre, código, curso, instructor y fechas. Es la pantalla más densa porque cruza muchas dimensiones.",
            screenshot: {
              src: "/docs/centros/crear-proceso/cen-12-procesos.png",
              alt: "Listado de procesos educativos con 327 procesos mostrando centro, curso, instructor y fechas",
              caption:
                "Filtra por centro arriba si quieres ver solo los procesos de una institución.",
            },
          },
          {
            id: "pulsar-crear",
            title: 'Pulsa "Crear Proceso"',
            body:
              'Abre un wizard de 2 pasos: "Información General" y "Programación".',
            screenshot: {
              src: "/docs/centros/crear-proceso/cen-13-crear-proceso-modal.png",
              alt: "Wizard Crear Proceso Educativo en paso 1 con campos Centro, Nombre, Código, Curso, Instructor, Metodología",
              caption:
                "Paso 1 — los dropdowns de Curso e Instructor se filtran por el centro que elijas.",
            },
          },
          {
            id: "paso-1-info",
            title: 'Paso 1 — "Información General"',
            body:
              "Los campos están encadenados:",
            bullets: [
              "Centro * — primero eliges el centro. Esto filtra los siguientes dropdowns.",
              'Nombre * — el nombre del proceso (puede ser igual al curso o más descriptivo, ej. "AFINADOR DE MOTORES 2026-Q2").',
              'Código * — código único de la corrida (ej. "MA-2026-Q2-01"). Te ayuda a identificarla en reportes.',
              "Curso * — se filtra a los cursos del centro que elegiste. Si no aparece, créalo primero.",
              "Instructor * — se filtra a los instructores del centro que elegiste. Si no aparece, créalo primero.",
              'Metodología * — Presencial, Virtual, Híbrido, Otro. Si eliges "Otro", debes especificar en el campo siguiente.',
            ],
            callout: {
              variant: "warning",
              title: "El orden importa",
              text:
                "Si cambias el Centro a media-creación, los dropdowns de Curso e Instructor se resetean (porque eran del centro anterior). Llena los campos de arriba abajo.",
            },
          },
          {
            id: "paso-2-programacion",
            title: 'Paso 2 — "Programación"',
            body:
              "Fechas de inicio y fin del proceso, horario (días de la semana y horas), modalidad. Estos datos aparecen en reportes y certificados.",
          },
          {
            id: "guardar-y-matricular",
            title: 'Finaliza y matricula estudiantes',
            body:
              'Después de crear el proceso, entra a su detalle. Verás una pestaña o sección "Matrícula" donde agregar estudiantes uno por uno (buscando por nombre o identidad) o importarlos en bloque desde un Excel. Solo cuando matricules estudiantes, este proceso contará para reportes de beneficiarios.',
            callout: {
              variant: "tip",
              title: "Importación de matrícula",
              text:
                'Usa "Descargar Formato" para obtener una plantilla con los IDs de estudiantes del centro. Llénala con los matriculados y súbela. Más rápido que buscar uno por uno.',
            },
          },
          {
            id: "vincular-proyecto",
            title: "Opcional: vincula el proceso a un proyecto",
            body:
              "Si este proceso se ejecuta como parte de un proyecto financiado, ve al detalle del proyecto → pestaña Beneficiarios → \"Vincular Proceso\" y selecciona este proceso. A partir de ahí, los estudiantes matriculados cuentan como beneficiarios del proyecto.",
            callout: {
              variant: "success",
              title: "Resultado esperado",
              text:
                "El proceso aparece en el listado de procesos. Los estudiantes matriculados aparecen en los reportes del centro y, si lo vinculaste, también en los del proyecto.",
            },
          },
        ],
        related: [
          { moduleSlug: "centros", actionSlug: "crear-curso" },
          { moduleSlug: "centros", actionSlug: "crear-estudiante" },
          { moduleSlug: "proyectos", actionSlug: "vincular-beneficiarios" },
        ],
      },
    ],
  },
  {
    slug: "fuentes",
    title: "Fuentes de Financiamiento",
    summary: "Cataloga y administra fuentes de financiamiento de los proyectos.",
    icon: Wallet,
    visibleTo: ["ADMIN", "MANAGER"],
    actions: [
      {
        slug: "gestionar",
        title: "Gestionar fuentes de financiamiento",
        summary:
          "Crea, edita y elimina fuentes de financiamiento del catálogo que usan los proyectos (USAID, GIZ, BANHCAFE, etc.).",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "none" },
        },
        steps: [
          {
            id: "que-son",
            title: "Qué son las fuentes de financiamiento",
            body:
              'Las fuentes son el catálogo de quiénes financian los proyectos: USAID, GIZ, BANHCAFE, UTH, etc. Cuando registras un proyecto, eliges una o varias fuentes del catálogo en el paso "Fuentes" del wizard. Si la fuente que necesitas no está, debes crearla aquí primero.',
            callout: {
              variant: "info",
              title: "Catálogo compartido",
              text:
                "Las fuentes son compartidas entre TODOS los proyectos. Si renombras o eliminas una fuente, afecta a todos los proyectos que la usan. Cuida este catálogo.",
            },
          },
          {
            id: "abrir-modulo",
            title: 'Abre "Proyectos → Fuentes"',
            body:
              "Verás la lista del catálogo: nombre, descripción y fecha de creación. Cada fila tiene un menú de tres puntos con las acciones de Editar y Eliminar.",
            screenshot: {
              src: "/docs/fuentes/gestionar/fuen-01-listado.png",
              alt: "Listado de 4 fuentes de financiamiento: UTH, USAID, GIZ, BANHCAFE",
              caption:
                "Listado del catálogo. La fecha de creación te ayuda a identificar fuentes antiguas vs. recientes.",
            },
          },
          {
            id: "crear",
            title: 'Crear una nueva fuente',
            body:
              'Pulsa "Crear fuente" arriba a la derecha. Se abre un modal con dos campos:',
            bullets: [
              'Nombre * — el nombre corto que usarás para referirte a la fuente (ej. "USAID", "GIZ"). Sé consistente con cómo aparece en los proyectos.',
              'Descripción * — el nombre completo o aclaración (ej. "U.S. Agency for International Development").',
            ],
            screenshot: {
              src: "/docs/fuentes/gestionar/fuen-02-crear-modal.png",
              alt: 'Modal "Crear fuente de financiamiento" con campos Nombre y Descripción',
              caption:
                'Modal simple con solo dos campos — ambos obligatorios.',
            },
            callout: {
              variant: "tip",
              title: "Antes de crear, busca",
              text:
                "Usa el buscador del listado para confirmar que la fuente no existe ya con otro nombre. Evita duplicados tipo \"USAID\" y \"U.S.A.I.D.\"",
            },
          },
          {
            id: "editar-eliminar",
            title: "Editar o eliminar una fuente",
            body:
              "Cada fila del listado tiene un menú de tres puntos (...) al final con dos opciones:",
            bullets: [
              'Editar — abre un modal con los datos actuales para modificar nombre o descripción. Útil para corregir tildes, capitalización, descripciones desactualizadas.',
              'Eliminar — borra la fuente del catálogo. Solo se permite si NINGÚN proyecto la usa. Si está en uso, el sistema bloquea la eliminación.',
            ],
            screenshot: {
              src: "/docs/fuentes/gestionar/fuen-03-acciones-menu.png",
              alt: "Menú desplegable de acciones con las opciones Editar y Eliminar",
              caption:
                "Las dos acciones disponibles por fuente.",
            },
            callout: {
              variant: "warning",
              title: "Si necesitas \"borrar\" una fuente en uso",
              text:
                "No se puede. Lo que sí puedes hacer es renombrarla (ej. agregar \"(deprecada)\" al nombre) para que el equipo sepa que ya no se debe usar en nuevos proyectos. Los reportes históricos seguirán mostrando los proyectos con su fuente original.",
            },
          },
          {
            id: "modal-editar",
            title: "Cómo se ve el modal de edición",
            body:
              "Si pulsas Editar, el modal muestra los datos actuales en los campos. Cambia lo que necesites y pulsa Guardar. Los cambios se aplican al instante a todos los proyectos que usen esta fuente.",
            screenshot: {
              src: "/docs/fuentes/gestionar/fuen-04-editar-modal.png",
              alt: 'Modal "Editar fuente de financiamiento" con los valores actuales precargados',
              caption:
                "El modal de edición es idéntico al de creación, pero precarga los valores actuales.",
            },
            callout: {
              variant: "success",
              title: "Resultado esperado",
              text:
                "Al guardar, ves una notificación de éxito y el listado se actualiza. Los proyectos que usan esta fuente reflejan el nuevo nombre automáticamente.",
            },
          },
        ],
        related: [
          { moduleSlug: "proyectos", actionSlug: "crear-proyecto" },
        ],
      },
    ],
  },
  {
    slug: "bitacoras",
    title: "Bitácoras",
    summary: "Auditoría global del sistema: quién hizo qué y cuándo.",
    icon: History,
    visibleTo: ["ADMIN"],
    actions: [
      {
        slug: "auditoria",
        title: "Auditoría del sistema con Bitácoras",
        summary:
          "Consulta el historial completo de acciones realizadas en el sistema, filtra por usuario y rol, exporta para reportes.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "none" },
          USER: { level: "none" },
        },
        steps: [
          {
            id: "que-es",
            title: "Qué es el módulo Bitácoras",
            body:
              'Es la pantalla central de auditoría del sistema. Cada acción importante (crear/editar usuario, modificar fuente, matricular estudiantes, archivar proyecto…) queda registrada con fecha, hora, usuario responsable y descripción. Es la "caja negra" de CADERH — útil para resolver dudas, investigar errores y generar reportes para donantes o auditorías externas.',
            callout: {
              variant: "info",
              title: "Diferencia con \"Ver bitácoras de un usuario\"",
              text:
                "El módulo Bitácoras es la vista GLOBAL del sistema (todos los usuarios, todas las acciones). Cuando entras desde el detalle de un usuario, el listado viene pre-filtrado a ese usuario. Es el mismo módulo, distinta forma de llegar.",
            },
          },
          {
            id: "abrir",
            title: 'Abre "Administración → Bitácoras"',
            body:
              "Verás la tabla con todas las acciones registradas, ordenadas de más reciente a más antigua. La cabecera muestra el total acumulado (ej. \"Total: 287\") — eso indica cuánta actividad ha tenido el sistema en su historia.",
            screenshot: {
              src: "/docs/bitacoras/auditoria/bitacoras-01-listado.png",
              alt: "Listado de bitácoras con columnas Fecha, Hora, Usuario, Rol, Bitácora y botón Ver por fila",
              caption:
                "Vista global. Cada fila es una acción registrada con su autor y momento exacto.",
            },
          },
          {
            id: "interpretar-fila",
            title: "Cómo leer una fila de la bitácora",
            body:
              "Cada bitácora tiene 6 datos visibles en el listado:",
            bullets: [
              "Fecha — día calendario en que ocurrió la acción.",
              'Hora — momento exacto (formato 12h con "a.m." / "p.m.").',
              "Usuario — nombre de la persona que realizó la acción (no su correo).",
              "Rol — el rol que tenía esa persona EN EL MOMENTO de la acción (importante: si un usuario cambió de rol, el historial muestra el rol que tenía cuando hizo cada cosa).",
              'Bitácora — descripción legible de la acción (ej. "Creó instructor ID: 120, CENTRO: 25").',
              'Ver — botón para abrir el detalle completo de la bitácora.',
            ],
            callout: {
              variant: "tip",
              title: "Los IDs en la descripción",
              text:
                "La descripción puede mencionar IDs (de proyectos, instructores, etc.). Esos IDs son los identificadores únicos en la base de datos — útiles si necesitas reportar al equipo técnico una bitácora específica.",
            },
          },
          {
            id: "filtros",
            title: "Filtra para encontrar lo que buscas",
            body:
              "Arriba del listado hay dos filtros independientes que puedes combinar:",
            bullets: [
              "Usuario — selecciona a una persona específica para ver solo sus acciones.",
              "Rol — útil cuando quieres ver, por ejemplo, todo lo que han hecho los Supervisores como grupo.",
            ],
            callout: {
              variant: "tip",
              title: "Combinar filtros",
              text:
                "Si filtras por Usuario \"María\" y por Rol \"Administrador\", verás solo las acciones que María hizo cuando era Administrador. Si después la pasaron a Supervisor, esas acciones no aparecerán en el filtro Rol=Administrador.",
            },
          },
          {
            id: "ver-detalle",
            title: 'Pulsa "Ver" para el detalle completo',
            body:
              'Cada fila tiene un botón "Ver" al final. Abre un modal con los mismos campos pero sin truncar — útil cuando la descripción es larga o quieres copiar exactamente lo que dice.',
            screenshot: {
              src: "/docs/bitacoras/auditoria/bitacoras-03-detalle.png",
              alt: 'Modal "Detalle de Bitácora" con todos los datos de un evento sin truncar',
              caption:
                "Vista de detalle. Copia el texto directamente desde aquí cuando necesites incluirlo en un reporte.",
            },
          },
          {
            id: "para-que-usar",
            title: "Casos de uso típicos",
            body:
              "Las bitácoras se usan principalmente para:",
            bullets: [
              'Investigar "¿quién cambió esto?" — cuando alguien reporta un dato extraño, busca en bitácoras la última acción sobre ese ítem.',
              "Reportes para donantes — algunos donantes piden listados de actividades del proyecto firmados/registrados.",
              "Auditoría interna — revisión periódica de qué hicieron los usuarios para detectar errores o malas prácticas.",
              "Capacitación — usar bitácoras reales como ejemplo para entrenar nuevos usuarios.",
            ],
            callout: {
              variant: "warning",
              title: "Las bitácoras no se pueden borrar ni editar",
              text:
                "Por diseño. Son un registro fiel del sistema, así que aunque seas Administrador no puedes alterarlas. Si una bitácora tiene un error, agrégale contexto creando una nueva acción que lo aclare (ej. corrige el dato erróneo y la nueva bitácora servirá de \"corrección\").",
            },
          },
        ],
        related: [
          { moduleSlug: "usuarios", actionSlug: "ver-bitacoras-usuario" },
        ],
      },
    ],
  },
  {
    slug: "mi-cuenta",
    title: "Mi cuenta",
    summary: "Perfil, sesión, contraseña y preferencias personales.",
    icon: UserCog,
    visibleTo: ["ADMIN", "MANAGER", "USER"],
    actions: [
      {
        slug: "perfil-y-sesion",
        title: "Tu perfil y sesión",
        summary:
          "Encuentra el menú del avatar, revisa tus datos, cambia tu contraseña y cierra sesión correctamente.",
        roles: {
          ADMIN: { level: "full" },
          MANAGER: { level: "full" },
          USER: { level: "full" },
        },
        steps: [
          {
            id: "abrir-menu-avatar",
            title: "Abre el menú de tu cuenta",
            body:
              "En la esquina superior derecha de cualquier pantalla verás un círculo con tu inicial o avatar. Haz clic ahí para desplegar el menú de tu cuenta.",
            screenshot: {
              src: "/docs/mi-cuenta/perfil/cuenta-01-avatar-menu.png",
              alt: 'Menú desplegable del avatar con opciones "Perfil" y "Desconectarse"',
              caption:
                "El menú muestra tu correo arriba y dos acciones: Perfil y Desconectarse.",
            },
          },
          {
            id: "opciones-menu",
            title: "Qué hay en el menú",
            body:
              "Tres elementos disponibles:",
            bullets: [
              "Tu correo electrónico en gris arriba — es informativo, te confirma con qué cuenta estás logueado.",
              "Perfil — te lleva al dashboard principal (actualmente este enlace no abre una página de perfil dedicada; la consulta y edición de datos personales se hace desde el módulo Usuarios si eres Administrador).",
              "Desconectarse — cierra tu sesión y te regresa a la pantalla de login.",
            ],
            callout: {
              variant: "info",
              title: "Para cambios en tu perfil",
              text:
                'Si necesitas cambiar tu nombre o correo, contacta a un Administrador. La edición de tu propio perfil desde "Mi cuenta" aún no está disponible — pasa por la pantalla de Usuarios (administración) y un admin lo modifica por ti.',
            },
          },
          {
            id: "cambiar-contrasena",
            title: "Cambiar tu propia contraseña",
            body:
              "No hay un botón directo para cambiar tu contraseña desde el menú de avatar. El flujo recomendado es:",
            bullets: [
              'Cierra sesión con "Desconectarse".',
              'En la pantalla de login, pulsa el enlace "¿Olvidó su contraseña?".',
              "Sigue el flujo de recuperación con tu correo (te envía un código y luego defines la nueva contraseña).",
            ],
            callout: {
              variant: "tip",
              title: "Cuándo cambiar tu contraseña",
              text:
                "Cámbiala al menos cada 6 meses por seguridad, o de inmediato si sospechas que alguien más la conoce. Usa una contraseña de al menos 12 caracteres mezclando letras, números y símbolos.",
            },
          },
          {
            id: "cerrar-sesion",
            title: "Cerrar sesión correctamente",
            body:
              'Para cerrar tu sesión: abre el menú del avatar y pulsa "Desconectarse". El sistema te lleva a la pantalla de login. Tu sesión queda cerrada hasta que vuelvas a entrar.',
            callout: {
              variant: "warning",
              title: "Cierra sesión en computadoras compartidas",
              text:
                "Si usaste CADERH en una computadora pública (cybercafé, computadora de otra persona), cierra sesión SIEMPRE al terminar. Si solo cierras la pestaña o el navegador, en algunos casos tu sesión puede quedar activa.",
            },
          },
          {
            id: "primera-sesion",
            title: "Tu primera sesión: cambio obligatorio de contraseña",
            body:
              "La primera vez que inicies sesión con la contraseña temporal que recibiste por correo, el sistema te pedirá inmediatamente cambiarla por una nueva que solo tú conozcas. Es obligatorio — no puedes acceder al resto del sistema hasta cambiarla.",
            callout: {
              variant: "success",
              title: "Después de la primera vez",
              text:
                "Una vez establecida tu contraseña personal, entras directo al dashboard. No volverás a ver la pantalla de cambio obligatorio (a menos que un administrador resetee tu contraseña otra vez).",
            },
          },
        ],
        related: [
          { moduleSlug: "usuarios", actionSlug: "cambiar-contrasena" },
        ],
      },
    ],
  },
];

export function getModuleBySlug(slug: string): DocModule | undefined {
  return docsModules.find((m) => m.slug === slug);
}

export function getActionBySlug(moduleSlug: string, actionSlug: string) {
  const mod = getModuleBySlug(moduleSlug);
  if (!mod) return undefined;
  return mod.actions.find((a) => a.slug === actionSlug);
}

export function getVisibleModules(role: DocRole | undefined): DocModule[] {
  if (!role) return docsModules.filter((m) => m.visibleTo.includes("USER"));
  return docsModules.filter((m) => m.visibleTo.includes(role));
}

export function canSeeModule(role: DocRole | undefined, moduleSlug: string): boolean {
  const mod = getModuleBySlug(moduleSlug);
  if (!mod) return false;
  if (!role) return mod.visibleTo.includes("USER");
  return mod.visibleTo.includes(role);
}
