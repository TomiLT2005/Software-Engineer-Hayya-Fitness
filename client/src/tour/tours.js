/**
 * Definición de todos los guided tours del panel.
 *
 * Cada paso:
 *  - element:  selector CSS del elemento a resaltar (sin element = popover centrado)
 *  - title / description: texto que se muestra
 *  - side / align: posición preferida del popover
 *  - ui:       estado de UI que necesita el paso ('base' por defecto). El tour lo emite como evento
 *              y la página/modal correspondiente se abre solo (ver tourBus.js)
 *  - sidebar:  true si el paso resalta algo del sidebar (en mobile se abre automáticamente)
 *
 * Valores posibles de `ui`:
 *   base · ajustes · socio-nuevo · socio-ficha · pago-nuevo · pago-historial · plan-nuevo
 *
 * Si un elemento no existe (ej: no hay socios cargados para mostrar la ficha) el paso se saltea solo.
 */

const t = (name) => `[data-tour="${name}"]`;

/** Aplica un estado de UI a un grupo de pasos. */
const withUi = (steps, ui) => steps.map((s) => ({ ...s, ui }));

/* ------------------------------------------------------------------ */
/* Pasos de modales (se reutilizan en el tour de página y en el "?")   */
/* ------------------------------------------------------------------ */

const SOCIO_FORM_STEPS = [
  {
    element: t('socio-form-dni'),
    title: 'DNI del socio',
    description:
      'Es el dato más importante: con este número el socio ingresa por el tótem. Solo números, entre 6 y 10 dígitos, y no puede repetirse.',
    side: 'bottom',
  },
  {
    element: t('socio-form-nombre'),
    title: 'Nombre y apellido',
    description: 'Datos obligatorios. Así aparece el socio en las tablas, en los pagos y en el historial de ingresos.',
    side: 'bottom',
  },
  {
    element: t('socio-form-contacto'),
    title: 'Correo y teléfono',
    description: 'Son opcionales, pero conviene cargarlos para poder contactar al socio (por ejemplo ante un vencimiento).',
    side: 'top',
  },
  {
    element: t('socio-form-plan'),
    title: 'Plan de membresía',
    description:
      'Elegí el plan del socio. Solo aparecen los planes activos; si falta alguno, activalo o creálo desde la sección Planes.',
    side: 'top',
  },
  {
    element: t('socio-form-ficha'),
    title: 'Ficha médica',
    description:
      'Marcá esta opción cuando el socio entregue su ficha médica. Sin ficha entregada, el tótem le deniega el acceso.',
    side: 'top',
  },
  {
    element: t('socio-form-guardar'),
    title: 'Guardar',
    description: 'Cuando termines, tocá acá para crear (o actualizar) el socio. Se valida todo antes de guardar.',
    side: 'top',
    align: 'end',
  },
];

const SOCIO_FICHA_STEPS = [
  {
    element: t('ficha-header'),
    title: 'Ficha del socio',
    description: 'Resumen rápido: nombre, estado de la membresía, plan contratado y si entregó la ficha médica.',
    side: 'bottom',
  },
  {
    element: t('ficha-datos'),
    title: 'Datos personales',
    description: 'DNI, fecha de alta, correo y teléfono del socio.',
    side: 'bottom',
  },
  {
    element: t('ficha-puntos'),
    title: 'Puntos Hayya',
    description:
      'Cada ingreso permitido en el tótem suma puntos. Acá ves el total, el nivel (Bronce, Plata u Oro) y cuánto falta para el siguiente.',
    side: 'left',
  },
  {
    element: t('ficha-historial'),
    title: 'Últimos ingresos',
    description: 'Los intentos de acceso recientes del socio, con el motivo si fue denegado.',
    side: 'top',
  },
  {
    element: t('ficha-editar'),
    title: 'Editar',
    description: 'Abre el formulario con los datos del socio para modificarlos.',
    side: 'top',
  },
  {
    element: t('ficha-estado'),
    title: 'Activar / Desactivar',
    description: 'Un socio inactivo no puede ingresar por el tótem. Podés reactivarlo cuando quieras.',
    side: 'top',
  },
  {
    element: t('ficha-eliminar'),
    title: 'Eliminar',
    description: 'Borra al socio definitivamente. Te va a pedir una confirmación antes de hacerlo.',
    side: 'top',
    align: 'start',
  },
];

const PAGO_FORM_STEPS = [
  {
    element: t('pago-socio'),
    title: 'Buscar el socio',
    description: 'Escribí el DNI o el nombre y elegí al socio de la lista. Se muestra su vencimiento actual.',
    side: 'bottom',
  },
  {
    element: t('pago-plan'),
    title: 'Plan a abonar',
    description: 'Se completa con el plan del socio, pero podés cambiarlo si va a renovar con otro. Cada opción muestra su precio.',
    side: 'bottom',
  },
  {
    element: t('pago-desglose'),
    title: 'Desglose del cobro',
    description:
      'Muestra el monto base del plan y, si el pago se hace después del día 10 del mes, un recargo por mora del 10%. El total a cobrar se calcula solo.',
    side: 'top',
  },
  {
    element: t('pago-metodo'),
    title: 'Método de pago',
    description: 'Efectivo o transferencia.',
    side: 'top',
  },
  {
    element: t('pago-comprobante'),
    title: 'N° de comprobante',
    description: 'Opcional en efectivo, pero obligatorio si el pago es por transferencia.',
    side: 'top',
  },
  {
    element: t('pago-confirmar'),
    title: 'Confirmar pago',
    description: 'Registra el cobro y renueva el vencimiento de la membresía. Se habilita al elegir un socio.',
    side: 'top',
    align: 'end',
  },
];

const PAGO_HISTORIAL_STEPS = [
  {
    element: t('historial-resumen'),
    title: 'Resumen de la cuenta',
    description: 'Membresía actual, vencimiento, si está al día o vencido y el total abonado por el socio.',
    side: 'bottom',
  },
  {
    element: t('historial-tabla'),
    title: 'Comprobantes',
    description:
      'Todos los pagos registrados: fecha, plan, monto base, mora (si hubo), total cobrado, método y número de referencia.',
    side: 'top',
  },
  {
    element: t('historial-nuevo'),
    title: 'Registrar nuevo cobro',
    description: 'Atajo para cobrar de nuevo a este socio sin tener que buscarlo otra vez.',
    side: 'top',
    align: 'end',
  },
];

const PLAN_FORM_STEPS = [
  {
    element: t('plan-form-basico'),
    title: 'Nombre y precio',
    description: 'El nombre identifica al plan en todo el sistema (Mensual, Quincenal, 1 Día…). El precio se usa para calcular los cobros.',
    side: 'bottom',
  },
  {
    element: t('plan-form-desc'),
    title: 'Descripción',
    description: 'Un detalle opcional que se muestra en la tarjeta del plan.',
    side: 'bottom',
  },
  {
    element: t('plan-form-imagen'),
    title: 'Imagen de portada',
    description:
      'Podés subir una foto, pegar un enlace directo o elegir una de las recomendadas. Abajo ves una vista previa de cómo queda.',
    side: 'top',
  },
  {
    element: t('plan-form-beneficios'),
    title: 'Beneficios incluidos',
    description: 'Agregá lo que incluye el plan (musculación, clases, etc.) o usá las sugerencias rápidas. Aparecen en la sección "INCLUYE" de la tarjeta.',
    side: 'top',
  },
  {
    element: t('plan-form-estado'),
    title: 'Estado del plan',
    description: 'Un plan desactivado deja de ofrecerse al dar de alta socios o registrar pagos, pero no se pierde.',
    side: 'top',
  },
  {
    element: t('plan-form-guardar'),
    title: 'Guardar',
    description: 'Crea el plan (o guarda los cambios si lo estás editando).',
    side: 'top',
    align: 'end',
  },
];

/* ------------------------------------------------------------------ */
/* Tours de página                                                     */
/* ------------------------------------------------------------------ */

const inicio = [
  {
    title: '¡Bienvenido a Hayya Fitness Club! 👋',
    description:
      'Te muestro cómo funciona el panel paso a paso. Podés avanzar con <b>Enter</b> o <b>Siguiente</b>, volver con <b>Atrás</b> y salir en cualquier momento con <b>Esc</b>.',
  },
  {
    element: '#nav-inicio',
    sidebar: true,
    title: 'Inicio',
    description: 'El resumen del día: ingresos, afluencia por hora y los últimos accesos en vivo.',
    side: 'right',
  },
  {
    element: '#nav-socios',
    sidebar: true,
    title: 'Socios',
    description: 'Alta, edición y búsqueda de socios. También ves su ficha médica, puntos e historial de ingresos.',
    side: 'right',
  },
  {
    element: '#nav-pagos',
    sidebar: true,
    title: 'Pagos',
    description: 'Cobro de cuotas, estado de cuenta de cada socio (al día o vencido) e historial de comprobantes.',
    side: 'right',
  },
  {
    element: '#nav-planes',
    sidebar: true,
    title: 'Planes',
    description: 'Creá y administrá las membresías del gimnasio: precios, beneficios y portada.',
    side: 'right',
  },
  {
    element: '#btn-ajustes',
    sidebar: true,
    title: 'Ajustes de la Terminal',
    description: 'Con un solo clic se despliega directamente el panel para encender la terminal y abrir la pantalla.',
    side: 'right',
  },
  {
    element: '#switch-terminal',
    sidebar: true,
    ui: 'ajustes',
    title: 'Encender / apagar el tótem',
    description:
      'Interruptor directo de la terminal de acceso. Si está apagada, nadie puede ingresar con el DNI. El indicador verde o rojo muestra su estado.',
    side: 'right',
  },
  {
    element: '#link-abrir-totem',
    sidebar: true,
    ui: 'ajustes',
    title: 'Abrir el tótem',
    description: 'Abre el tótem de acceso en una pestaña nueva, listo para la pantalla táctil de la entrada.',
    side: 'right',
  },
  {
    element: '#btn-ayuda',
    sidebar: true,
    title: 'Ayuda',
    description:
      'Este botón lanza el tutorial de la sección en la que estés. Entrá a Socios, Pagos o Planes y tocalo para ver su guía.',
    side: 'right',
  },
  {
    element: '#btn-cerrar-sesion',
    sidebar: true,
    title: 'Cerrar sesión',
    description: 'Sale del panel de administración de forma segura.',
    side: 'right',
  },
  {
    element: t('navbar-user'),
    title: 'Tu usuario',
    description: 'Te muestra con qué cuenta estás trabajando y tu rol dentro del sistema.',
    side: 'bottom',
    align: 'end',
  },
  {
    element: t('inicio-kpis'),
    title: 'Indicadores del día',
    description: 'Total de intentos de ingreso de hoy, cuántos fueron permitidos y cuántos denegados (por ficha médica, membresía o DNI).',
    side: 'bottom',
  },
  {
    element: t('inicio-afluencia'),
    title: 'Afluencia por hora',
    description: 'Cada barra es una hora del día. Naranja = ingresos permitidos, rojo = denegados. Pasá el mouse por una barra para ver el detalle.',
    side: 'top',
  },
  {
    element: t('inicio-totem'),
    title: 'Tótem 01',
    description: 'Acá ves los motivos de rechazo de hoy, para detectar rápido por qué se está denegando el acceso.',
    side: 'left',
  },
  {
    element: '#btn-abrir-totem',
    title: 'Abrir tótem',
    description: 'Acceso directo a la terminal de ingreso por DNI.',
    side: 'top',
  },
  {
    element: t('inicio-ingresos'),
    title: 'Últimos ingresos',
    description: 'Los accesos más recientes con hora, DNI, socio, resultado y motivo. Se actualiza solo cada pocos segundos.',
    side: 'top',
  },
  {
    element: '#btn-refrescar-accesos',
    title: 'Actualizar',
    description: 'Fuerza una actualización inmediata de los datos y te dice cuándo fue la última.',
    side: 'left',
  },
  {
    title: '¡Listo! 🎉',
    description:
      'Ya conocés el panel. Cada sección tiene su propio tutorial: entrá a <b>Socios</b>, <b>Pagos</b> o <b>Planes</b> y tocá <b>Ayuda</b>.',
  },
];

const socios = [
  {
    element: t('page-title'),
    title: 'Gestión de Socios',
    description: 'Desde acá administrás a todos los socios del gimnasio: sus datos, fichas médicas y membresías.',
    side: 'bottom',
  },
  {
    element: t('socios-kpis'),
    title: 'Indicadores',
    description: 'Total de socios registrados, cuántos están activos y cuántos inactivos.',
    side: 'bottom',
  },
  {
    element: '#buscar-socio',
    title: 'Buscador',
    description: 'Buscá por DNI o por nombre. La tabla se filtra en vivo mientras escribís.',
    side: 'bottom',
  },
  {
    element: '#filtro-plan',
    title: 'Filtro por membresía',
    description: 'Mostrá solo los socios de un plan en particular.',
    side: 'bottom',
  },
  {
    element: '#filtro-estado',
    title: 'Filtro por estado',
    description: 'Filtrá entre socios activos e inactivos. Se puede combinar con la búsqueda y el plan.',
    side: 'bottom',
  },
  {
    element: t('socios-refresh'),
    title: 'Actualizar',
    description: 'Recarga los indicadores y la tabla.',
    side: 'bottom',
  },
  {
    element: t('socios-tabla'),
    title: 'Listado de socios',
    description: 'DNI, nombre, plan, estado de la ficha médica (entregada o pendiente) y si la membresía está activa.',
    side: 'top',
  },
  {
    element: t('socio-ver'),
    title: 'Ver ficha',
    description: 'Abre el detalle completo del socio. Más adelante te muestro cómo es.',
    side: 'left',
  },
  {
    element: t('socio-editar'),
    title: 'Editar',
    description: 'Modifica los datos del socio (usa el mismo formulario que el alta).',
    side: 'left',
  },
  {
    element: t('socio-toggle'),
    title: 'Activar / Desactivar',
    description: 'Cambia el estado de la membresía con un solo clic. Un socio inactivo es rechazado por el tótem.',
    side: 'left',
  },
  {
    element: t('socios-paginacion'),
    title: 'Paginación',
    description: 'Navegá entre páginas cuando hay muchos socios.',
    side: 'top',
  },
  {
    element: '#btn-nuevo-socio',
    title: 'Nuevo socio',
    description: 'Da de alta a un socio nuevo. Al avanzar con <b>Enter</b> o <b>Siguiente</b> te abro el formulario para explicarte cada campo.',
    side: 'left',
  },
  ...withUi(SOCIO_FORM_STEPS, 'socio-nuevo'),
  ...withUi(SOCIO_FICHA_STEPS, 'socio-ficha'),
  {
    title: '¡Eso es todo en Socios! 🎉',
    description: 'Si querés repasar un modal en particular, tocá el botón <b>?</b> que aparece en su encabezado.',
  },
];

const pagos = [
  {
    element: t('page-title'),
    title: 'Control de Pagos',
    description: 'Acá controlás el estado de cuenta de cada socio y registrás los cobros de cuotas.',
    side: 'bottom',
  },
  {
    element: t('pagos-kpis'),
    title: 'Indicadores',
    description: 'Total de socios, cuántos están <b>al día</b> y cuántos tienen la cuota <b>vencida</b>.',
    side: 'bottom',
  },
  {
    element: '#buscar-pagos',
    title: 'Buscador',
    description: 'Buscá un socio por DNI o nombre, en tiempo real.',
    side: 'bottom',
  },
  {
    element: '#filtro-estado-pagos',
    title: 'Filtros',
    description: 'Filtrá por estado de cobro (Pagado / Vencido) o por plan. Ideal para ver rápido quién debe la cuota.',
    side: 'bottom',
  },
  {
    element: t('pagos-refresh'),
    title: 'Actualizar',
    description: 'Recarga los indicadores y la tabla.',
    side: 'bottom',
  },
  {
    element: t('pagos-tabla'),
    title: 'Estado de cuentas',
    description: 'Cada socio con su plan, fecha de vencimiento y estado (Pagado o Vencido).',
    side: 'top',
  },
  {
    element: t('pago-historial-btn'),
    title: 'Ver historial',
    description: 'Abre todos los comprobantes del socio. Más adelante te muestro cómo es.',
    side: 'left',
  },
  {
    element: t('pagos-paginacion'),
    title: 'Paginación',
    description: 'Navegá entre páginas de socios.',
    side: 'top',
  },
  {
    element: '#btn-registrar-pago',
    title: 'Registrar pago',
    description: 'Cobra una cuota y renueva la membresía. Al avanzar con <b>Enter</b> o <b>Siguiente</b> abro el formulario para explicártelo.',
    side: 'left',
  },
  ...withUi(PAGO_FORM_STEPS, 'pago-nuevo'),
  ...withUi(PAGO_HISTORIAL_STEPS, 'pago-historial'),
  {
    title: '¡Eso es todo en Pagos! 🎉',
    description: 'Podés repasar cada modal cuando quieras con el botón <b>?</b> de su encabezado.',
  },
];

const planes = [
  {
    element: t('page-title'),
    title: 'Gestión de Planes',
    description: 'Las membresías que ofrece el gimnasio, con su precio y beneficios.',
    side: 'bottom',
  },
  {
    element: t('planes-buscar'),
    title: 'Buscador',
    description: 'Buscá un plan por nombre.',
    side: 'bottom',
  },
  {
    element: t('planes-filtro'),
    title: 'Filtro por estado',
    description: 'Mostrá todos los planes, solo los activos o solo los inactivos.',
    side: 'bottom',
  },
  {
    element: t('planes-refresh'),
    title: 'Recargar',
    description: 'Vuelve a cargar los planes.',
    side: 'bottom',
  },
  {
    element: t('planes-grid'),
    title: 'Tus planes',
    description: 'Cada plan se muestra como una tarjeta.',
    side: 'top',
  },
  {
    element: t('plan-card'),
    title: 'Tarjeta de plan',
    description: 'Portada, nombre y precio. Si el plan está inactivo se ve atenuado con una etiqueta roja.',
    side: 'right',
  },
  {
    element: t('plan-card-beneficios'),
    title: 'Incluye y precio',
    description: 'A la izquierda los beneficios del plan; a la derecha su precio.',
    side: 'right',
  },
  {
    element: t('plan-toggle'),
    title: 'Activar / Desactivar',
    description: 'Un plan desactivado ya no se ofrece para nuevos socios ni pagos, pero se conserva.',
    side: 'top',
  },
  {
    element: t('plan-editar'),
    title: 'Modificar',
    description: 'Edita nombre, precio, beneficios, portada y estado.',
    side: 'top',
  },
  {
    element: t('planes-nuevo'),
    title: 'Nuevo plan',
    description: 'Crea una membresía nueva. Al avanzar con <b>Enter</b> o <b>Siguiente</b> abro el formulario para explicártelo.',
    side: 'left',
  },
  ...withUi(PLAN_FORM_STEPS, 'plan-nuevo'),
  {
    title: '¡Eso es todo en Planes! 🎉',
    description: 'Podés repasar el formulario cuando quieras con el botón <b>?</b> de su encabezado.',
  },
];

/* ------------------------------------------------------------------ */
/* Registro                                                            */
/* ------------------------------------------------------------------ */

/** Tours de página (los lanza el botón Ayuda del sidebar). */
const PAGE_TOURS = {
  inicio: { steps: inicio },
  socios: { steps: socios },
  pagos: { steps: pagos },
  planes: { steps: planes },
};

/**
 * Tours de modal (los lanza el botón "?" del encabezado). `keepUi` = el tour no abre ni cierra nada:
 * trabaja sobre el modal que ya está abierto.
 */
const MODAL_TOURS = {
  'modal-socio': { keepUi: true, steps: SOCIO_FORM_STEPS },
  'modal-ficha': { keepUi: true, steps: SOCIO_FICHA_STEPS },
  'modal-pago': { keepUi: true, steps: PAGO_FORM_STEPS },
  'modal-historial': { keepUi: true, steps: PAGO_HISTORIAL_STEPS },
  'modal-plan': { keepUi: true, steps: PLAN_FORM_STEPS },
};

export const TOURS = { ...PAGE_TOURS, ...MODAL_TOURS };

/** '/admin/socios' -> 'socios' (o null si la ruta no tiene tour). */
export function tourKeyForPath(pathname) {
  const key = pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'inicio';
  return PAGE_TOURS[key] ? key : null;
}
