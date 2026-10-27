## UNIVERSIDAD PRIVADA DOMINGO SAVIO

## FACULTAD DE INGENIERIA CARRERA DE INGENIERIA EN SISTEMAS

## SISTEMA WEB PARA LA GESTIÓN DE UN CINEMA “CINE LA PAZ”

## Ing. Ericka Constantina Arequipa Oropeza Jose Miguel Acosta Morales Jonathan Zubieta Mendoza Sistemas de Información I ESTUDIANTES: DOCENTE: MATERIA:

## La Paz, 30 de Julio de 2026


## TABLA DE CONTENIDO


## TABLA DE FIGURAS


## 1. Introducción

El presente documento detalla el análisis y diseño de un Sistema Web para la Gestión Integral del Cine La Paz. Su propósito es centralizar y automatizar los procesos operativos y administrativos del negocio, específicamente la gestión de perfiles de usuario, la programación de la cartelera, el control de disponibilidad de asientos en tiempo real, el procesamiento de ventas presenciales y en línea, y la validación electrónica de accesos. El diseño se fundamenta en un levantamiento formal de requerimientos técnicos orientados a optimizar la eficiencia y minimizar la intervención manual redundante.

## 2. Antecedentes

El Cine La Paz ejecuta la programación de funciones, el control de aforo de las salas y la validación de entradas mediante procesos manuales y herramientas no integradas. Esta estructura operativa genera demoras transaccionales, riesgo de sobreventa y limita el control centralizado de la información. Se requiere el desarrollo de un sistema web que automatice estos flujos de trabajo, garantice la concurrencia en la venta de entradas físicas y digitales, y proporcione trazabilidad exacta de las operaciones para el control administrativo.

## 3. Planteamiento del Problema

## 3.1 Problema Central

La falta de un sistema informático que automatice la programación de la cartelera afecta la gestión concurrente de asientos y vulnera el control de ingreso a las salas, lo que dificulta la operatividad y administración integral del negocio.

## 3.2 Causas

- 1. Programación manual de la cartelera y asignación de salas.

- 2. Ausencia de un sistema centralizado para administrar usuarios y roles operativos.

- 3. Falta de control informático sobre los accesos y acciones del personal.

- 4. Venta de entradas restringida a procesos físicos y tradicionales.

- 5. Carencia de sincronización automática en la disponibilidad de asientos.

- 6. Inexistencia de un mecanismo de validación electrónica en las puertas de ingreso.

## 3.3 Efectos

- 1. Conflictos de superposición de horarios y retrasos operativos.


- 2. Vulnerabilidad en el manejo de la información y falta de segmentación de tareas.

- 3. Dificultad para auditar irregularidades en los procesos del personal.

- 4. Congestión en boleterías y pérdida de ventas por ausencia de canales digitales.

- 5. Riesgo elevado de sobreventa y asignación duplicada de ubicaciones.

- 6. Facilidad para el fraude mediante entradas falsificadas o utilizadas previamente.

## 3.4 Solución Propuesta

Desarrollo de un sistema que automatice la programación de la cartelera en el cine, centralizando la venta de entradas, gestionando la disponibilidad de asientos en tiempo real y asegurando el control de ingreso a las salas.

## 3.5 Árbol de Problemas

*Figura 1 Arbol de problemas*

Nota. Diagrama que representa la problemática central, detallando las seis causas principales y los efectos directos que impactan en la administración y el servicio al cliente.


4. Objetivos

4.1 Objetivo General

Desarrollar un sistema que automatice la programación de la cartelera, el control de ventas e

ingresos y la generación de reportes, optimizando la gestión operativa del negocio.

4.2 Objetivos Específicos

● Automatizar la programación de la cartelera, gestionando películas, salas y horarios.

- Centralizar y controlar la venta de entradas presenciales y en línea con gestión de asientos en tiempo real.

- Realizar la validación de ingresos a las salas.

- Gestionar el perfil de usuarios.

- Automatizar la asignación de usuarios al sistema.

- Desarrollar un módulo de reportes.

5. Justificación

5.1 Justificación Social

El sistema mejora la experiencia del usuario al evitar filas prolongadas y sobreventas,

garantizando un servicio eficiente, accesible y transparente en la adquisición de entradas y

elección de asientos.

5.2 Justificación Técnica

Se implementarán tecnologías web modernas y una base de datos relacional que centralizará la

información. Esto asegurará la integridad de los datos, evitará redundancias y permitirá manejar

la concurrencia en tiempo real durante las ventas.

5.3 Justificación Operativa

La automatización de la cartelera, la validación electrónica de ingresos y la consolidación

automática de reportes reducirán el margen de error humano, optimizando los tiempos del

personal y facilitando el control administrativo.


6. Alcances y Límites

6.1 Alcances

El proyecto abarca el análisis, diseño y modelado de los módulos de: gestión de usuarios,

administración de cartelera, control de asientos, ventas, validación QR y reportes. Se incluyen

diagramas de Casos de Uso, Clases y Secuencia.

6.2 Límites

El proyecto se limita al diseño y maquetado funcional. No abarca el despliegue en un entorno de

producción final, ni la integración con pasarelas de pago bancarias o facturación electrónica

gubernamental real.

7. Marco Teórico

7.1 Conceptos Fundamentales

Sistemas Web

Conjunto de aplicaciones y servicios alojados en servidores conectados a internet o a una red

local, accesibles a través de un navegador web. Permiten la centralización de datos y el acceso

concurrente por múltiples usuarios desde diferentes dispositivos sin requerir instalaciones

locales, facilitando la escalabilidad operativa.

Gestión de Usuarios

Proceso de administración de identidades digitales dentro de un sistema informático. Implica la

autenticación (verificación de identidad mediante credenciales) y la autorización (asignación de

roles y permisos), garantizando que cada actor operativo acceda única y estrictamente a los

módulos e información correspondientes a sus funciones.

Entradas Digitales

Equivalente virtual de un boleto de papel, generado, emitido y almacenado en formato digital. Su

implementación elimina los costos de impresión, agiliza la distribución al cliente y permite la

validación de acceso en tiempo real, minimizando los riesgos de falsificación y pérdida.

7.2 Tecnologías y Herramientas

Bases de Datos Relacionales

Sistemas de gestión que almacenan y organizan información en tablas interconectadas mediante

claves primarias y foráneas. Su estructura garantiza la integridad referencial y soporta


transacciones bajo el modelo ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad), característica indispensable para manejar la concurrencia y evitar errores críticos como la sobreventa o asignación duplicada de asientos.

Códigos QR

Módulo para almacenar información en una matriz de puntos o un código de barras bidimensional. En sistemas de acceso, permite codificar identificadores únicos e irrepetibles vinculados a un boleto. Su alta velocidad de lectura mediante cámaras de dispositivos móviles agiliza el flujo de validación en los puntos de entrada físicos.

Pasarelas de Pago Electrónico

Servicios intermediarios que autorizan y procesan transacciones financieras en aplicaciones web. Integran protocolos de encriptación para proteger los datos bancarios del usuario durante el cobro, comunicando de manera segura el sistema de ventas del cine con las entidades procesadoras locales o internacionales.

7.3 Lenguaje de Modelado Unificado (UML)

Estándar técnico y visual empleado en ingeniería de software para especificar, construir y documentar los artefactos de un sistema. Utiliza representaciones gráficas, como los Diagramas de Casos de Uso, para modelar los requerimientos funcionales estableciendo los límites del sistema, identificando a los actores interactuantes y definiendo con precisión los flujos lógicos de las operaciones de negocio.

8. Técnicas de Levantamiento de Información

El proceso de recolección de datos mediante cuestionarios aplicados al personal operativo y clientes, la entrevista a la administración y la observación directa en campo permitió diagnosticar las deficiencias críticas que fundamentan el desarrollo de la nueva plataforma web.

8.1. Diagnóstico del Área de Boletería

El análisis cuantitativo revela que el 100% de los operadores reporta tiempos de atención excesivos, superando los 5 minutos por transacción. Las causas principales identificadas en la encuesta aplicada al personal de boletería y ratificadas en la observación de campo son la ausencia de una interfaz gráfica con mapa de sala interactivo y la falta de control de concurrencia en la base de datos (ver Anexo 3: Encuesta Encargado de Boletería). Esto genera colisiones operativas cuando dos cajeros intentan vender el mismo asiento en paralelo. Asimismo, la


aplicación manual de promociones y el cálculo de descuentos sin automatización derivan en demoras adicionales y errores al momento del cuadre de caja diario.

8.2. Diagnóstico del Área de Ingreso

Las evaluaciones realizadas al Encargado de Ingreso evidencian una alta vulnerabilidad en la validación de boletos (ver Anexo 2: Cuestionario de Evaluación Operativa - Encargado de Ingreso). El método actual de inspección visual y rasgado manual de papel toma un promedio de 8 segundos por cliente en condiciones de baja iluminación, generando cuellos de botella en pasillos durante horarios pico. La falta de un mecanismo electrónico permite el uso de boletos falsificados, fotocopiados o fuera de fecha sin un registro de auditoría. Además, la imposibilidad de validar boletos ilegibles mediante un código numérico ingresado por teclado detiene la fila ante cualquier falla de lectura.

8.3. Diagnóstico de la Experiencia del Usuario

Los datos recolectados en la muestra de clientes muestran un rechazo generalizado hacia las filas presenciales y la incertidumbre en la disponibilidad de butacas (ver Anexo 1: Cuestionario de Evaluación Operativa - Cliente). Existe una disposición total a adoptar la compra de boletos a través de la web, priorizando el uso de dispositivos móviles y métodos de pago ágiles mediante códigos QR bancarios. Los usuarios exigen transparencia visual en la selección de asientos, la recepción inmediata de un comprobante digital con código QR y la posibilidad de consultar su historial de compras en la plataforma.

8.4. Diagnóstico de la Gestión Administrativa

La entrevista aplicada a la Gerencia General confirmó que el problema estructural reside en la falta de un control centralizado y la dependencia de herramientas manuales como hojas de cálculo e informes impresos (ver Anexo 5: Entrevista de Evaluación Operativa y Estratégica - Gerente General / Administrador). La administración carece de visibilidad en tiempo real sobre la recaudación diaria y enfrenta descuadres frecuentes por el uso de cuentas de usuario compartidas en taquilla. Se determinó la necesidad prioritaria de implementar un control de acceso por roles (Administrador, Boletería, Ingreso), la automatización de la cartelera y la generación de reportes financieros consolidados exportables a PDF y Excel.

8.5. Hallazgos de la Observación Directa en Campo

La bitácora de observación en campo ratificó que la latencia operativa actual se debe a la falta de integración entre las áreas de ventas e ingreso (ver Anexo 4: Ficha de Observación Directa


\- Evaluación Operativa de Procesos). Se evidenciaron cuellos de botella severos derivados de

la falta de liquidez en efectivo, la lentitud del proceso de anulación de boletos que requiere la

presencia física del supervisor y la incomunicación ante cambios de sala de último momento.

9. Tipos de Requerimientos

Con base en el análisis de la infraestructura y necesidades, se determinan los siguientes

aspectos clave:

9.1 Ambiente Físico y Factores Ambientales

El sistema web estará desplegado en una arquitectura híbrida que combina un servidor local en red de área local (LAN) para la atención en taquillas y puertas de ingreso, junto a un servidor web para la atención de clientes externos. El análisis de las variables físicas y ambientales en los puntos de operación establece las siguientes especificaciones:

## Iluminación:

- Puntos de Boletería (Taquilla): Operan bajo iluminación artificial uniforme de nivel comercial (300 a 500 lux). Las pantallas de las estaciones de trabajo requieren filtros antirreflejo para evitar fatiga visual en los operadores durante turnos continuos.

- Puntos de Ingreso (Puertas de Sala): Operan en pasillos con iluminación reducida o tenue (10 a 50 lux). Esta condición ambiental exige que los dispositivos móviles de control de acceso cuenten con sensores de cámara de alta sensibilidad y soporte de luz LED (Flash) para garantizar la lectura instantánea de códigos QR.

Temperatura y Ventilación:

- Servidor Local y Equipos de Cómputo: El entorno del servidor requiere temperatura controlada entre 18°C y 22°C y humedad relativa entre 40% y 60% para prevenir fallas por sobrecalentamiento.

- Estaciones de Atención: Las ventanillas de taquilla y pasillos operan a temperatura ambiente estándar (15°C a 20°C). Los equipos de cómputo y lectores móviles seleccionados operan de manera óptima dentro de rangos comerciales convencionales.

## Acústica y Ruido Ambiental:


- El vestíbulo y las áreas de ingreso presentan niveles de ruido moderados a elevados (60 a 75 dB) en horarios de alta afluencia. Por tanto, el sistema prioriza señales visuales claras en pantalla (indicadores explícitos en color verde para acceso permitido y rojo para denegado) por encima de alertas auditivas para la confirmación de transacciones.

## Suministro Eléctrico y Respaldo:

- Las estaciones de boletería y el servidor local deben estar integrados a un Sistema de Alimentación Ininterrumpida (UPS) con capacidad mínima de 1500 VA. Esto protege los equipos frente a cortes de energía o variaciones de voltaje, garantizando la persistencia de los datos transaccionales y la integridad en la disponibilidad de butacas.

## Aislamiento Electromagnético y Red:

- No se registran interferencias electromagnéticas significativas en las instalaciones. La red inalámbrica (Wi-Fi) dedicada a los lectores móviles de ingreso se configura en una VLAN privada con prioridad de tráfico (QoS) para asegurar tiempos de respuesta menores a 2 segundos en la validación de boletos.

*Figura 2*

*Entorno operativo en taquilla y control de ingreso a salas*

Nota. Evidencia del ambiente físico de operación del sistema. Se observa la estación de trabajo en boletería uniforme con el monitor del sistema y así también el control a ingreso de salas.


9.2 Usuarios y Factores Humanos

Los usuarios interactuantes serán: Administrador, Encargado de Boletería, Encargado de Ingreso

y Cliente. El sistema requiere una interfaz altamente intuitiva que exija únicamente una

capacitación técnica mínima (un día) para los operadores internos.

9.3 Datos

El sistema manejará datos estandarizados (alfanuméricos, fechas, transacciones). El formato de

salida principal será PDF para comprobantes y reportes. La información operativa deberá

retenerse en la base de datos por un periodo de respaldo de gestión (mínimo 5 años).

9.4 Seguridad

El acceso estará controlado mediante credenciales encriptadas y privilegios basados

estrictamente en roles. Se programarán rutinas automáticas de copias de respaldo (backups)

diarias para evitar la pérdida de información crítica.

10. Requerimientos Funcionales y No Funcionales

10.1 Requerimientos Funcionales

- Inicio de sesión y autenticación por roles.

- Gestión (CRUD) de usuarios, películas y salas.

- Programación automatizada de cartelera.

- Control de asientos en tiempo real (disponible, vendido, reservado).

- Procesamiento de ventas de entradas.

- Validación de ingresos mediante escaneo de código QR.

- Generación de reportes de ocupación y financieros.

10.2 Requerimientos No Funcionales

- Interfaz responsiva (adaptable a escritorio y móvil).

- Alta disponibilidad de servicio en la red local e internet.

- Tiempos de respuesta de validación QR menores a 2 segundos.

- Integridad transaccional para evitar venta de asientos duplicados.


## 11. Modelado del Sistema (UML)

## 11.1 Diagrama General de Casos de Uso

El diagrama define los límites del Sistema Web Cine La Paz y establece la interacción principal entre los actores identificados (Cliente, Boletería, Administrador, Acceso) y los procesos modulares de negocio.

*Figura 3 Diagrama General de Casos de Uso*

Nota. Muestra los límites del sistema y la interacción de los cuatro actores principales con los macroprocesos de negocio.


## 11.1 Diagramas Específicos de Casos de Uso

## 11.1.1 Caso Específico: Iniciar Sesión

Modela el proceso de autenticación general. Incluye validaciones obligatorias de formato y campos, verificación de credenciales, redirección según el rol asignado, y gestión de excepciones como errores de validación o autenticación, además de la opción de registrar un cliente nuevo.

*Figura 4 Caso Específico: Iniciar Sesión*

Nota. Diagrama que detalla el flujo de validación de credenciales, manejo de errores y asignación de permisos según el rol del usuario.

11.1.2 Caso Específico: Comprar Boletos Online

Estructura la secuencia de operaciones del Cliente en la plataforma. Abarca la selección de funciones y asientos, procesamiento de pago en línea, guardado de venta y generación de boletos QR y comprobantes digitales. Gestiona excepciones mediante extensiones para funciones no disponibles, asientos ocupados o errores de pago.


*Figura 5 Caso Específico: Comprar Boletos Online*

Nota. Representa las acciones del cliente en la plataforma web, desde la selección de funciones hasta la generación del comprobante y boleto QR.

## 11.1.3 Caso Específico: Vender Boletos Presencial

Define la interacción del encargado de Boletería. Incluye el registro del cliente presencial, selección de funciones y asientos, cobro en caja con cálculo total, y la emisión física o digital del comprobante y boleto QR.

## Figura 6

Caso Específico: Vender Boletos Presencial

Nota. Ilustra el proceso operativo en taquilla física, abarcando la selección de asientos, el cobro y la emisión de comprobantes.

11.1.4 Caso Específico: Gestionar Películas

Detalla las funciones del Administrador para la administración de la cartelera. Comprende el registro y validación de películas, gestión de promociones y programación de tandas, integrando


la asignación de salas y la validación de conflictos de horario.

## Figura 7

Caso Específico: Gestionar Películas

Nota. Diagrama que describe los procesos de administración de cartelera, control de horarios y asignación de salas.

## 11.1.5 Caso Específico: Asignar Roles

Describe el flujo del Administrador para el control de personal. Permite introducir datos para registrar usuarios, asignar cargos, y buscar usuarios existentes para la modificación de su información.

Figura 8 Caso Específico: Asignar Roles

Nota. Muestra las operaciones de gestión de cuentas del personal, incluyendo el registro, la búsqueda y la asignación de permisos.

## 11.1.6 Caso Específico: Generar Reportes

Estructura la funcionalidad compartida entre el Administrador y Boletería para la extracción de métricas. Incluye la selección de parámetros, validación, consulta de ventas o comprobantes,


generación de vista previa y la exportación final a PDF.

Figura 9 Caso Específico: Generar Reportes

Nota. Detalla el flujo de consulta, generación de vistas previas y exportación de documentos con base en parámetros seleccionados.

## 11.2 Diagrama de clase

El diagrama de clases representa la estructura estática del sistema web, definiendo las entidades principales (Usuario, Rol, Pelicula, Funcion, Sala, Asiento, Venta, Boleto y Promocion), sus atributos, métodos operativos y las relaciones de cardinalidad que garantizan la integridad referencial de los datos.


*Figura 10 Diagrama de Clases del Sistema Web Cine La Paz*

Nota. Estructura estática de entidades, atributos, métodos y cardinalidades del sistema.

## 11.3. Diagramas de Secuencia

Los diagramas de secuencia especifican el comportamiento dinámico del sistema y el intercambio de mensajes en línea de tiempo entre los actores, la interfaz, la lógica de negocio y la base de datos para los procesos clave.

## 11.3.1. Diagrama de Secuencia: Gestión Administrativa

Flujo operacional que ejecuta el Administrador para el alta de usuarios con asignación de roles, así como el registro de películas y programación de tandas en la cartelera.


*Figura 11 Diagrama de Secuencia - Gestión Administrativa*

Nota. Pasos para el registro de personal y la programación de funciones en el sistema.

## 11.3.2. Diagrama de Secuencia: Vender Boletos Presencial

Secuencia de operaciones en el punto de venta donde el encargado de boletería selecciona la función, verifica la disponibilidad de butacas en tiempo real, procesa el cobro presencial e imprime los boletos físicos.

*Figura 12 Diagrama de Secuencia - Vender Boletos Presencial*

Nota. Flujo de mensajes para la atención y emisión de entradas en boletería.


## 11.3.3. Diagrama de Secuencia: Validar Ingreso

Proceso dinámico donde el encargado de acceso escanea el código QR del boleto, el sistema consulta el estado en la base de datos y retorna la autorización o denegación de acceso en pantalla.

*Figura 13 Diagrama de Secuencia - Validar Ingreso a Sala*

Nota. Interacción entre el escáner de control de acceso y el backend para verificación de entradas.

## 11.3.4. Diagrama de Secuencia: Comprar Boletos Online

Modelado del flujo de interacción donde el cliente selecciona la función y los asientos, el sistema gestiona el bloqueo temporal y procesa la confirmación del pago por QR, culminando en la emisión del boleto digital.

*Figura 14*

*Diagrama de Secuencia - Comprar Boletos Online*

Nota. Secuencia de interacciones para la reserva, pago y emisión de boletos.


## 11.4. Diagrama Entidad-Relación de la Base de Datos

El diseño relacional de la base de datos define la persistencia del sistema web mediante un conjunto de tablas normalizadas en tercera forma normal (3FN). Este modelo garantiza la integridad referencial, evita la redundancia de datos y soporta transacciones concurrentes mediante el control ACID para la asignación de butacas en tiempo real, el registro de ventas y la validación de accesos en puerta.

*Figura 15 Diagrama Entidad-Relacion*

Nota. Esquema relacional de la base de datos local que ilustra las tablas principales (usuario, venta, boleto, funcion, sala, pelicula, entre otras), sus claves primarias, foráneas y relaciones de cardinalidad.


## 12. Desarrollo y Construcción del Sistema

Esta sección detalla el proceso de construcción del software en un entorno de desarrollo local, describiendo la pila tecnológica seleccionada, el esquema relacional en el gestor de base de datos local y la evidencia del funcionamiento modular mediante la maquetación de interfaces, la ejecución de la lógica de negocio y las pruebas funcionales.

## 12.1. Entorno de Desarrollo Local y Herramientas Tecnológicas

Para la construcción y ejecución controlada de la plataforma web en entorno local (localhost), se implementó una arquitectura basada en desacoplamiento de capas, utilizando herramientas de desarrollo de última generación que garantizan alto rendimiento, seguridad e integridad transaccional:

Frontend (Interfaz de Usuario): Desarrollado en React con TypeScript, haciendo uso de Vite como motor de compilación para maximizar la velocidad de ejecución local. El diseño gráfico responsivo y maquetación de interfaces se construyó mediante TailwindCSS.

Backend (Lógica de Negocio y API): Construido sobre la plataforma Node.js utilizando el framework Express.js. Administra el procesamiento de ventas, aplica las reglas de validación de entradas y protege las rutas mediante tokens de autenticación JSON Web Token (JWT).

Base de Datos (Persistencia Local): Implementado en el gestor relacional MySQL en servidor local. Garantiza el control ACID mediante el uso de procedimientos almacenados (Stored Procedures) e índices para evitar la colisión de transacciones y la doble venta de un mismo asiento.

## 12.2. Base de Datos y Población de Registros de Prueba

Con el propósito de validar la persistencia, las relaciones de cardinalidad y el comportamiento del sistema ante operaciones concurrentes en la estación de trabajo local, la base de datos fue poblada con un conjunto de registros de prueba que superan las 40 transacciones operativas.


*Figura 16*

*Registros de la Tabla Usuarios en MySQL*

Nota. Muestra la consulta directa a la tabla de usuarios evidenciando las credenciales almacenadas con encriptación hash y los datos personales registrados en el sistema.

*Figura 17 Registros de la Tabla Película en MySQL*

Nota. Estructura relacional de la base de datos local que almacena el catálogo de películas registradas con sus respectivos detalles de director, sinopsis y enlaces a posters.

*Figura 18 Transacciones de la Tabla Boleto en MySQL*

Nota. Evidencia de los boletos procesados en el motor relacional, asociando cada entrada con su asiento, precio pagado y código de acceso generado.


## 13. Interfaces del Sistema

Las interfaces gráficas representan la maquetación y desarrollo visual de las pantallas para cada perfil de usuario en el sistema. Están diseñadas bajo principios de usabilidad para garantizar flujos de trabajo ágiles dentro de la plataforma web.

## 13.1. Módulo de Autenticación y Registro

Figura 19 Formulario de Inicio de Sesión

Nota. Formulario de acceso general para usuarios registrados con validación de credenciales de correo y contraseña.

Figura 20 Formulario de Registro de Clientes

Nota. Interfaz pública que permite a los nuevos usuarios crear una cuenta de cliente introduciendo sus datos personales y credenciales.


## 13.2. Panel de Administración General

Figura 21 Panel Principal del Administrador

Nota. Dashboard central con accesos directos a los módulos de gestión de películas, funciones, salas, usuarios y reportes.

Figura 22 Módulo de Registro y Gestión de Películas

Nota. Formulario para el alta de nuevas películas en la base de datos y listado de títulos registrados en el sistema.


*Figura 23*

*Módulo de Gestión de Salas y Configuración de Asientos*

Nota. Interfaz para la creación de salas, definición de dimensiones por filas y columnas, y administración del aforo.

*Figura 24 Módulo de Programación de Funciones*

Nota. Pantalla para la asignación de horarios, fechas, salas y precios base a las películas de la cartelera.


*Figura 25*

*Módulo de Administración de Usuarios y Roles*

Nota. Panel para el registro de personal operativo, asignación de roles y control de estado de las cuentas.

Figura 26 Módulo de Asignación Manual de Datos de Usuario

Nota. Formulario detallado para el registro directo de usuarios internos asignando roles específicos de acceso.


*Figura 27 Módulo de Reportes Estadísticos y Financieros*

Nota. Pantalla de consulta de métricas de ocupación y ventas con opción de filtrado por fechas y exportación a PDF.

*Figura 28*

*Módulo de Gestión de Promociones*

Nota. Panel de reglas de negocio para la aplicación automática de promociones 2x1 en películas seleccionadas.


## 13.3. Módulo de Venta Presencial en Boletería

Figura 29 Panel Principal del Encargado de Boletería

Nota. Vista inicial para el personal de taquilla con opciones para registro de clientes y venta presencial.

Figura 30 Selección de Película en Taquilla

Nota. Catálogo visual de películas disponibles para iniciar el proceso de venta presencial de entradas.

**Figura 31**
 Selección de Fecha, Horario y Sala en Boletería

Nota. Vista modal que despliega los horarios y salas programadas para la película
 seleccionada en taquilla.

**Figura 32**
 Mapa de Asientos e Interfaz de Venta Presencial

Nota. Distribución gráfica de la sala en tiempo real para la elección de butacas y procesamiento
 del cobro en efectivo, QR o tarjeta.

**Figura 33**
 Vista Previa del Boleto Generado en Taquilla

Nota. Comprobante de venta presencial que incluye el código QR de acceso y las opciones
 para imprimir o descargar en PDF.

**13.4. Portal del Cliente y Cartelera Web**

**Figura 34**
 Panel Principal del Cliente Registrado

Nota. Dashboard del usuario cliente con accesos directos a la cartelera pública y su historial
 personal de compras.

**Figura 35**
 Cartelera Pública Web

Nota. Catálogo web de películas disponibles para la compra en línea de boletos.

**Figura 36**
 Historial de Compras del Cliente

Nota. Listado de boletos adquiridos previamente por el cliente con acceso al comprobante PDF
 y estado de la transacción.

**13.5. Módulo de Control de Ingreso**

**Figura 37**
 Panel del Encargado de Ingreso

Nota. Vista de bienvenida para el operador de puerta con acceso directo a la herramienta de
 validación de entradas.

**Figura 38**
 Validador de Pases QR mediante Cámara

Nota. Interfaz móvil para el escaneo en tiempo real de códigos QR presentados por los clientes
 en la puerta de la sala.

**14. Pruebas y Validación de Software**

La evaluación de la plataforma se ejecutó mediante Pruebas de Caja Negra (Black Box
 Testing), enfocadas en verificar que la lógica de negocio, las restricciones de seguridad y el
 manejo de transacciones cumplan de forma estricta con los requerimientos funcionales del
 proyecto.

**14.1. Tipos de Pruebas Aplicadas**

Se establecieron cuatro escenarios clave de prueba sobre el entorno local:

**Prueba de Autenticación y Enrutamiento:** Verificación de la seguridad en la sesión,
 restringiendo el acceso a módulos no autorizados según el rol del usuario.

**Prueba de Flujo Completo de Venta:** Confirmación del proceso transaccional en taquilla,
 comprobando la actualización de disponibilidad en la base de datos y la generación del
 comprobante en formato PDF.

**Prueba de Validación de Código QR:** Evaluación de la lectura e inactivación del boleto digital,
 garantizando la detección inmediata de entradas duplicadas o usadas anteriormente.

**Prueba de Control de Concurrencia:** Verificación del bloqueo de asientos en tiempo real para
 evitar que dos usuarios seleccionen o adquieran la misma ubicación simultáneamente.

**14.2. Matriz de Resultados de Pruebas**

```
Módulo Evaluado Descripción de la Prueba Resultado Esperado Resultado Obtenido Estado
Autenticación Ingreso con usuario de rol Boletería e intento de
navegación manual a la URL
del Administrador.
Denegar el acceso al módulo administrativo y
redirigir al panel de venta
presencial.
El sistema bloqueó la ruta protegida y redirigió
al entorno de venta en
taquilla.
Exitoso
Venta Presencial Selección de dos butacas en función activa, procesamiento
de pago y emisión de comprobante.
Descontar los asientos en la base de datos y generar el
archivo PDF con códigos QR únicos.
Se registró la venta como completada y se
generó el documento PDF de entrada.
Exitoso
Validar Ingreso Escaneo de un código QR válido mediante el dispositivo
móvil de control de puerta.
Mostrar mensaje en pantalla verde de acceso permitido y
marcar el boleto como
'USADO'.
La pantalla confirmó la validez e inactivó el
código para lecturas
posteriores.
Exitoso
```

**15. Despliegue**

Esta sección aborda la arquitectura conceptual proyectada para la puesta en marcha del
 sistema en un entorno de producción. La infraestructura se fundamenta en un esquema cliente-
 servidor descentralizado que permite interconectar los procesos operativos locales del cine con
 los servicios web consumidos por los clientes externos.

**15.1. Esquema de Arquitectura de Despliegue**

La plataforma está concebida para ejecutarse sobre un modelo de red centralizado que articula
 la comunicación entre los distintos actores del sistema:

**Servidor de Aplicación y Datos:** Alojamiento de la API y el motor de base de datos relacional
 dentro de un servidor dedicado o entorno en la nube, garantizando alta disponibilidad,
 aislamiento de procesos y ejecución de respaldos automatizados.

**Puntos de Atención Internos:** Estaciones de trabajo de escritorio ubicadas en las ventanillas
 de boletería y oficinas administrativas, las cuales consumen los módulos del sistema a través
 de navegadores web conectados a la red de área local (LAN).

**Puntos de Control de Acceso:** Dispositivos móviles inteligentes enlazados a la red
 inalámbrica privada del cine, dedicados de manera exclusiva a la transmisión inmediata de
 peticiones de validación de entradas hacia la API central.

**Canal Cliente Externo:** Acceso público a través de internet que permite a los usuarios finales
 navegar por la cartelera, seleccionar funciones y realizar compras remotas desde cualquier
 dispositivo conectado.

**16. Mantenimiento del Sistema**

Para asegurar la continuidad operativa, la integridad de la información y la vigencia del software
 tras su desarrollo, se establece una estrategia de mantenimiento estructurada en tres enfoques
 conceptuales:

**Mantenimiento Preventivo:** Ejecución periódica de tareas orientadas a la conservación del
 sistema, incluyendo la realización de copias de seguridad de la base de datos y la optimización
 de tablas operativas para prevenir la degradación del rendimiento.

**Mantenimiento Correctivo:** Protocolos de monitoreo y revisión de registros de eventos en el
 servidor para la detección, diagnóstico y solución oportuna de posibles anomalías o
 interrupciones en la conectividad.

**Mantenimiento Evolutivo:** Planificación de actualizaciones progresivas enfocadas en la
 incorporación de nuevas funcionalidades, tales como la integración con pasarelas de pago
 bancarias directas y módulos de facturación.

**17. Conclusiones y Recomendaciones**

**17.1. Conclusiones**

El desarrollo del Sistema Web para el Cine La Paz en un entorno de prueba local permitió
 estructurar una solución integral para la automatización de la gestión de cartelera, la venta de
 entradas y la administración de usuarios.

La implementación del mapa interactivo de salas solucionó de forma efectiva la problemática de
 la sobreventa y la asignación duplicada de butacas en las ventanillas de boletería, garantizando
 consistencia en la selección de asientos.

El mecanismo de validación mediante códigos QR demostró alta eficiencia durante las pruebas
 de acceso, agilizando el control de ingreso a las salas y eliminando el riesgo de uso de
 entradas duplicadas o falsificadas.

Las evaluaciones de software bajo la modalidad de caja negra y las pruebas de concurrencia
 confirmaron la solidez de la lógica de negocio desarrollada y el mantenimiento de la integridad
 referencial en la base de datos ante peticiones simultáneas.

**17.2. Recomendaciones**

Se sugiere disponer de un servidor dedicado con dirección IP estática para la fase de
 producción, asegurando la continuidad del servicio tanto en la red interna del cine como hacia
 los usuarios externos.

Es conveniente capacitar al personal operativo de taquilla e ingreso en el uso de las interfaces
 para optimizar los tiempos de atención y respuesta durante periodos de alta afluencia de
 público.

Se aconseja el uso de dispositivos móviles con cámaras de resolución adecuada en los puntos
 de control para mantener una lectura fluida de los códigos QR en zonas de las instalaciones
 con iluminación reducida.

Se recomienda aplicar de manera rigurosa las rutinas de mantenimiento preventivo y respaldo
 de datos para prevenir pérdidas de información frente a eventualidades técnicas o cortes en el
 suministro eléctrico.

**18. Bibliografía**

Booch, G., Rumbaugh, J. y Jacobson, I. (2007). *El lenguaje unificado de modelado: Guía del
 usuario* (2a ed.). Addison-Wesley.

Elmasri, R. y Navathe, S. B. (2015). *Fundamentos de sistemas de bases de datos* (7a ed.).
 Pearson Educación.

Sommerville, I. (2011). *Ingeniería de software* (9a ed.). Pearson Educación.

Stallings, W. (2012). *Fundamentos de seguridad en redes: Aplicaciones y estándares* (4a ed.).
 Pearson Educación.

**19. Anexos**

**Anexo 1: Cuestionario de Evaluación Operativa - Cliente**
 Cuestionario de Evaluación Operativa Cliente - Página 1

**Anexo 2: Cuestionario de Evaluación Operativa - Encargado de Ingreso**

Cuestionario de Evaluación Operativa Encargado de Ingreso - Página 1

**Anexo 3: Encuesta Encargado de Boletería**

Encuesta Encargado de Boletería - Página 1

- Cuestionario de Evaluación Operativa Cliente - Página
- Cuestionario de Evaluación Operativa Cliente - Página
- Cuestionario de Evaluación Operativa Cliente - Página
- Cuestionario de Evaluación Operativa Cliente - Página
- Cuestionario de Evaluación Operativa Encargado de Ingreso - Página
- Cuestionario de Evaluación Operativa Encargado de Ingreso - Página
- Cuestionario de Evaluación Operativa Encargado de Ingreso - Página
- Cuestionario de Evaluación Operativa Encargado de Ingreso - Página
- Encuesta Encargado de Boletería - Página

Encuesta Encargado de Boletería - Página 3

Encuesta Encargado de Boletería - Página 4

Encuesta Encargado de Boletería - Página 5

**Anexo 4: Ficha de Observación Directa - Evaluación Operativa de Procesos**

Ficha de Observación Directa - Página 1

Ficha de Observación Directa - Página 2

Ficha de Observación Directa - Página 3

**Anexo 5: Entrevista de Evaluación Operativa y Estratégica - Gerente General /
 Administrador**
