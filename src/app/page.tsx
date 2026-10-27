"use client";

import React, { useState, useEffect, useRef } from "react";
import { AdminPanel } from "../components/AdminPanel";
import { ClienteCompraModal } from "../components/ClienteCompraModal";
import {
  Bus,
  QrCode,
  Ticket,
  Package,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Flag,
  Pause,
  Play,
  Clock,
  User,
  ArrowRight,
  Check,
  Camera,
  Smartphone,
  BarChart3,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Bed,
  Globe,
  ShieldCheck,
  MapPin,
  Calendar,
  Search,
  Navigation,
  Wifi,
  Tv,
  Coffee,
  CreditCard,
  Phone,
  Mail,
  Printer,
  Banknote,
  Calculator,
  Receipt,
  FileText,
  Lock,
  LogOut,
  Layers,
  ChevronRight,
  Shield,
  Truck,
  Users,
  Compass,
  Sun,
  Moon,
  Key,
  Pencil,
  UserPlus
} from "lucide-react";
import {
  TIPOLOGIAS_FLOTAS_BOLIVIA,
  SALIDAS_HOY_EN_ANDEN,
  generarCroquisPorFlota,
  AsientoCroquis,
  BusFlota,
  SalidaProgramada
} from "../datos/flotasData";

// Roles del Sistema según Pirámide de Sistemas de Información (Laudon & Laudon)
export type NivelPiramide = "ESTRATEGICO_ESS" | "TACTICO_MIS_DSS" | "OPERATIVO_TPS" | "PUBLICO";

export type RolSistema = 
  | "PUBLICO"              // Portal Ciudadano / Landing de Consulta y Búsqueda
  | "GERENTE_GENERAL"      // Nivel Estratégico (ESS / Dirección Ejecutiva Nacional)
  | "ADMIN_SISTEMAS"       // Nivel Táctico-Estratégico (Control Maestro, Usuarios, Flotas)
  | "JEFE_OPERACIONES"     // Nivel Táctico (MIS / DSS: Despacho, Itinerarios, Rutas)
  | "BOLETERO"             // Nivel Operativo (TPS: Venta de Pasajes, Cobro, Asientos)
  | "BODEGUERO"            // Nivel Operativo (TPS: Recepción, Pesaje, Despacho Encomiendas)
  | "AUXILIAR_ABORDAJE"    // Nivel Operativo (TPS: Validación QR en Andén, Croquis en Vivo)
  | "CONDUCTOR";           // Nivel Operativo (TPS: Hoja de Ruta, Manifiesto, Check-in Relevo)

export type VistaRol = "LANDING" | "VENTAS" | "GERENCIA_NACIONAL" | "ENCOMIENDAS" | RolSistema;

export default function OsasturApp() {
  // Sesión de Usuario con Control de Acceso Basado en Roles (RBAC)
  const [usuarioAutenticado, setUsuarioAutenticado] = useState<{
    nombre: string;
    email: string;
    rol: RolSistema;
    terminal: string;
    nivel: NivelPiramide;
  } | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const guardado = localStorage.getItem("osastur_usuario_sesion");
        if (guardado) return JSON.parse(guardado);
      } catch (e) {}
    }
    return null;
  });

  // Modal de inicio de sesión institucional
  const [modalLoginAbierto, setModalLoginAbierto] = useState<boolean>(false);
  const [modalClienteCompraOpen, setModalClienteCompraOpen] = useState<boolean>(false);
  const [tipoFlotaSeleccionadaCliente, setTipoFlotaSeleccionadaCliente] = useState<string>("TODOS");
  const [temaOscuro, setTemaOscuro] = useState<boolean>(true);

  // Estados para Impresión de Boletos y Guías de Carga
  const [modalImpresionBoleto, setModalImpresionBoleto] = useState<{
    codigo: string;
    asiento: string;
    nombre: string;
    ci: string;
    telefono: string;
    origen: string;
    destino: string;
    horaSalida: string;
    terminalSalida: string;
    busTipo: string;
    placa: string;
    precio: number;
    fechaEmision: string;
  } | null>(null);

  const [modalImpresionGuia, setModalImpresionGuia] = useState<{
    guia: string;
    descripcion: string;
    peso: string;
    remitente: string;
    ciRemitente: string;
    destinatario: string;
    ciDestinatario: string;
    origen: string;
    destino: string;
    flete: number;
    estado: string;
  } | null>(null);
  const [credencialRolSeleccionado, setCredencialRolSeleccionado] = useState<RolSistema>("BOLETERO");

  const [rolActivo, setRolActivo] = useState<VistaRol>("LANDING");
  const [salidaSeleccionada, setSalidaSeleccionada] = useState<SalidaProgramada>(SALIDAS_HOY_EN_ANDEN[0]);
  
  // Unidad asignada automáticamente por el itinerario sincronizado
  const busAsignado = TIPOLOGIAS_FLOTAS_BOLIVIA.find((b) => b.id === salidaSeleccionada.busId) || TIPOLOGIAS_FLOTAS_BOLIVIA[0];
  
  // Croquis en tiempo real
  const [croquis, setCroquis] = useState<AsientoCroquis[]>(() =>
    generarCroquisPorFlota(busAsignado, salidaSeleccionada)
  );

  // Planta Baja (1) o Planta Alta (2) si es Doble Piso
  const [pisoVista, setPisoVista] = useState<number>(1);
  const [asientoInspeccionado, setAsientoInspeccionado] = useState<AsientoCroquis | null>(null);
    // Estados y stream de la cámara física real (HTML5 MediaDevices)
  const [modalCamaraAbierto, setModalCamaraAbierto] = useState<boolean>(false);
  const [errorCamaraHardware, setErrorCamaraHardware] = useState<string>("");
  const [encomiendasVerificadasAuxiliar, setEncomiendasVerificadasAuxiliar] = useState<Record<string, boolean>>({});
  const [subpestanaAuxiliar, setSubpestanaAuxiliar] = useState<"ABORDAJE_ORIGEN" | "LLEGADA_DESTINO">("ABORDAJE_ORIGEN");
  const [filtroEncomiendasDestino, setFiltroEncomiendasDestino] = useState<string>("TODAS");
  // Subpestañas del Módulo de Encomiendas / Carga:
  // 1. REGISTRO_TARIFADOR: Formulario para registrar remitente, destinatario, peso, cálculo de tarifa y generación de QR.
  // 2. DESPACHO_FLOTA: Despacho hacia el andén y asignación/subida al bus correspondiente.
  // 3. ARRIBO_ENTREGA: Encomiendas que llegaron a destino, listas para entrega al cliente contra presentación de CI.
  const [subpestanaEncomiendas, setSubpestanaEncomiendas] = useState<"REGISTRO_TARIFADOR" | "DESPACHO_FLOTA" | "ARRIBO_ENTREGA">("REGISTRO_TARIFADOR");
  // Filtros de fecha para Reporte Gerencial
  const [fechaInicioReporte, setFechaInicioReporte] = useState<string>("2026-10-01");
  const [fechaFinReporte, setFechaFinReporte] = useState<string>("2026-10-27");
  // Rastreo público de encomiendas en Landing Page
  const [inputGuiaRastreo, setInputGuiaRastreo] = useState<string>("");
  const [resultadoRastreo, setResultadoRastreo] = useState<any | null>(null);
  const [buscandoRastreo, setBuscandoRastreo] = useState<boolean>(false);
  const [errorRastreo, setErrorRastreo] = useState<string>("");
  const [formEncomienda, setFormEncomienda] = useState({
    remitenteNombre: "",
    remitenteCi: "",
    remitenteTel: "",
    destinatarioNombre: "",
    destinatarioCi: "",
    destinatarioTel: "",
    descripcion: "",
    pesoKg: "5.0",
    origenCiudad: "La Paz",
    destinoCiudad: "Santa Cruz"
  });
  const [encomiendaGuardando, setEncomiendaGuardando] = useState<boolean>(false);
  const [guiaGeneradaExito, setGuiaGeneradaExito] = useState<any | null>(null);
  const [busAsignadoEncomienda, setBusAsignadoEncomienda] = useState<string>("");
  const videoCamaraRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Iniciar cámara trasera en teléfonos móviles con HTTPS/Vercel
  const activarCamaraReal = async () => {
    setErrorCamaraHardware("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorCamaraHardware("Navegador sin soporte de cámara HTML5.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      mediaStreamRef.current = stream;
      if (videoCamaraRef.current) {
        videoCamaraRef.current.srcObject = stream;
        videoCamaraRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("Permiso de cámara no concedido o error:", err);
      setErrorCamaraHardware(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Permiso de cámara denegado. Permita el acceso en el navegador de su teléfono."
          : "No se pudo acceder al sensor de la cámara (" + (err.message || "desconocido") + ")."
      );
    }
  };

  const detenerCamaraReal = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };
const [inputCodigoQR, setInputCodigoQR] = useState("");
  const [mensajeScan, setMensajeScan] = useState<{ tipo: "exito" | "error" | "info"; texto: string } | null>(null);

  // Estado Ventas
    // Pestaña activa en el módulo de Ventanilla: 'VENTA' o 'CIERRE_CAJA'
  const [subpestanaVentanilla, setSubpestanaVentanilla] = useState<"VENTA" | "CIERRE_CAJA">("VENTA");

  // Etapa en la línea de tiempo de emisión de boleto (1: Datos/Factura, 2: Pago QR/Efectivo, 3: Previsualización/Impresión, 4: Éxito)
  const [etapaVenta, setEtapaVenta] = useState<1 | 2 | 3 | 4>(1);
  const [metodoPagoVenta, setMetodoPagoVenta] = useState<"EFECTIVO" | "QR">("EFECTIVO");
  const [datosFactura, setDatosFactura] = useState({ razonSocial: "", nit: "" });
  const [requiereFactura, setRequiereFactura] = useState<boolean>(false);

  // Historial de ventas emitidas en la sesión para el Arqueo de Caja
  const [ventasSesion, setVentasSesion] = useState<Array<{
    codigo: string;
    asiento: string;
    nombre: string;
    ci: string;
    monto: number;
    metodoPago: "EFECTIVO" | "QR";
    hora: string;
    destino: string;
    placa: string;
  }>>([
    { codigo: "TKT-P1", asiento: "P1", nombre: "Carlos Mendoza Rocha", ci: "4921049 LP", monto: 180, metodoPago: "EFECTIVO", hora: "08:15", destino: "Santa Cruz", placa: "4021-NBD" },
    { codigo: "TKT-V3", asiento: "V3", nombre: "Elena Torrez Miranda", ci: "6102834 CB", monto: 180, metodoPago: "QR", hora: "08:42", destino: "Santa Cruz", placa: "4021-NBD" },
    { codigo: "TKT-P5", asiento: "P5", nombre: "Jhonny Mamani Quispe", ci: "5591024 LP", monto: 140, metodoPago: "EFECTIVO", hora: "09:10", destino: "Cochabamba", placa: "3128-XTL" }
  ]);
  const [montoInicialCaja, setMontoInicialCaja] = useState<number>(200); // Fondo de cambio en ventanilla
  const [cierreRealizado, setCierreRealizado] = useState<boolean>(false);
  // Estados de Operación del Conductor / Chofer
  const [pasoActivoConductor, setPasoActivoConductor] = useState<1 | 2 | 3 | 4>(1);
  const [controlAbordajeIniciado, setControlAbordajeIniciado] = useState<boolean>(false);
  const [controlAuxiliarTerminado, setControlAuxiliarTerminado] = useState<boolean>(false);
  const [modalBitacoraAbierto, setModalBitacoraAbierto] = useState<boolean>(false);
  const [modalReporteFinViaje, setModalReporteFinViaje] = useState<boolean>(false);
  const [viajeConcluidoExitoso, setViajeConcluidoExitoso] = useState<boolean>(false);
  const [guardandoFinViaje, setGuardandoFinViaje] = useState<boolean>(false);
  const [fechaHoraFinViaje, setFechaHoraFinViaje] = useState<string>("");
  const [inputTipoNovedad, setInputTipoNovedad] = useState<string>("CONTROL_POLICIAL");
  const [inputDescripcionNovedad, setInputDescripcionNovedad] = useState<string>("");
  const [bitacoraNovedades, setBitacoraNovedades] = useState<Array<{
    hora: string;
    tipo: string;
    descripcion: string;
    kmLugar: string;
  }>>([
    { hora: "08:30", tipo: "SALIDA_TERMINAL", descripcion: "Salida puntual con autorización de andén de Tránsito.", kmLugar: "Terminal Origen" }
  ]);
const [asientoVenta, setAsientoVenta] = useState<AsientoCroquis | null>(null);
  const [formVenta, setFormVenta] = useState({ nombre: "", ci: "", telefono: "" });
  const [ventaConfirmada, setVentaConfirmada] = useState<any | null>(null);

  // Formulario de autenticación directa por Usuario y Contraseña
  const [inputUsuarioLogin, setInputUsuarioLogin] = useState<string>("");
  const [inputPasswordLogin, setInputPasswordLogin] = useState<string>("");
  const [errorLogin, setErrorLogin] = useState<string>("");
  const [modoCrearEditarUsuario, setModoCrearEditarUsuario] = useState<boolean>(false);
  const [formGestionUsuario, setFormGestionUsuario] = useState({ id: "", username: "", nombreCompleto: "", rol: "BOLETERO", password: "", departamento: "La Paz" });

  // Personal institucional operable por ciudad cargado desde Neon DB
  const [personalOperable, setPersonalOperable] = useState<any[]>([]);
  const [filtroCiudadPersonal, setFiltroCiudadPersonal] = useState<string>("TODAS");
  const [credencialUsuarioSeleccionado, setCredencialUsuarioSeleccionado] = useState<any | null>(null);

  // Filtros de búsqueda en tiempo real
  const [origenFiltro, setOrigenFiltro] = useState<string>("La Paz");
  const [filtroDestinoBoleteria, setFiltroDestinoBoleteria] = useState<string>("TODOS");
  const [filtroTipoBusBoleteria, setFiltroTipoBusBoleteria] = useState<string>("TODOS");
  const [filtroFechaBoleteria, setFiltroFechaBoleteria] = useState<string>("");
  const [filtroHorarioBoleteria, setFiltroHorarioBoleteria] = useState<string>("TODOS");
  const [destinoFiltro, setDestinoFiltro] = useState<string>("Santa Cruz");
  const [cargandoCroquis, setCargandoCroquis] = useState<boolean>(false);

  // Estados cargados en vivo desde Neon PostgreSQL
  const [viajesBD, setViajesBD] = useState<any[]>([]);
  const [encomiendasBD, setEncomiendasBD] = useState<any[]>([]);
  const [reportesKpisBD, setReportesKpisBD] = useState<any | null>(null);
  const [cargandoBD, setCargandoBD] = useState<boolean>(true);
  const [subpestanaAdmin, setSubpestanaAdmin] = useState<string>("USUARIOS");
  const [flotasBD, setFlotasBD] = useState<any[]>([]);
  const [modoCrearFlota, setModoCrearFlota] = useState<boolean>(false);
  const [formNuevaFlota, setFormNuevaFlota] = useState({
    placa: "",
    marcaModelo: "Mercedes-Benz Marcopolo G8",
    tipoFlota: "BUS_CAMA",
    pisos: 2,
    totalAsientos: 44,
    choferNombre: "Don Mario Condori",
    auxiliarNombre: "Raul Choque"
  });
  const [modoCrearViaje, setModoCrearViaje] = useState<boolean>(false);
  const [formNuevoViaje, setFormNuevoViaje] = useState({
    busId: "",
    origenId: "LPZ",
    destinoId: "SCZ",
    fechaHoraSalida: "",
    fechaHoraLlegadaEst: "",
    precioBasePiso1: 180,
    precioBasePiso2: 120
  });

  // Cargar datos reales al iniciar la aplicación
  useEffect(() => {
    async function cargarDatosReales() {
      try {
        setCargandoBD(true);
        // 1. Cargar Viajes reales desde Neon DB
        const resViajes = await fetch('/api/viajes');
        const dataViajes = await resViajes.json();
        if (dataViajes.viajes && dataViajes.viajes.length > 0) {
          setViajesBD(dataViajes.viajes);
          const primerViaje = dataViajes.viajes[0];
          const salidaInicial = mapearViajeASalida(primerViaje);
          setSalidaSeleccionada(salidaInicial);
          cargarCroquisPorViajeId(salidaInicial.id, primerViaje.tipoFlota, salidaInicial);
        }

        // Cargar Personal Operable por Ciudad desde Neon DB
        const resUsuarios = await fetch('/api/auth/login');
        const dataUsuarios = await resUsuarios.json();
        if (dataUsuarios.usuarios) {
          setPersonalOperable(dataUsuarios.usuarios);
          if (dataUsuarios.usuarios.length > 0) {
            setCredencialUsuarioSeleccionado(dataUsuarios.usuarios[0]);
          }
        }

        // Cargar Flotas desde Neon DB
        const resFlotas = await fetch("/api/flotas");
        const dataFlotas = await resFlotas.json();
        if (dataFlotas.flotas) setFlotasBD(dataFlotas.flotas);

        // 2. Cargar Encomiendas reales
        const resEnc = await fetch('/api/encomiendas');
        const dataEnc = await resEnc.json();
        if (dataEnc.encomiendas && dataEnc.encomiendas.length > 0) {
          setEncomiendasBD(dataEnc.encomiendas);
        }

        // 3. Cargar KPIs reales de Gerencia
        const resRep = await fetch('/api/reportes');
        const dataRep = await resRep.json();
        if (dataRep.kpis) {
          setReportesKpisBD({
            ingresosBoletos: Number(dataRep.kpis.totalIngresosBoletos) || 184500,
            ingresosEncomiendas: Number(dataRep.kpis.totalIngresosEncomiendas) || 63200,
            ocupacionPromedio: 88,
            puntualidadSalidas: 96,
            totalPasajeros: Number(dataRep.kpis.totalBoletosEmitidos) || 427,
            totalViajes: Number(dataRep.kpis.totalViajesProgramados) || 24,
            rawKpis: dataRep.kpis
          });
        }
      } catch (err) {
        console.error("Error al cargar datos reales de Neon:", err);
      } finally {
        setCargandoBD(false);
      }
    }
    cargarDatosReales();
  }, []);

  // Función para registrar encomienda en Neon DB
  const registrarNuevaEncomienda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEncomienda.remitenteNombre || !formEncomienda.destinatarioNombre || !formEncomienda.descripcion) {
      alert("Por favor complete los campos obligatorios");
      return;
    }
    setEncomiendaGuardando(true);
    try {
      const peso = parseFloat(formEncomienda.pesoKg) || 5;
      const tarifa = Math.max(25, peso * 4.5); // Tarifa mínima Bs 25 o Bs 4.5 por kg

      const res = await fetch("/api/encomiendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion: formEncomienda.descripcion,
          pesoKg: peso,
          nombreRemitente: formEncomienda.remitenteNombre,
          ciRemitente: formEncomienda.remitenteCi,
          telRemitente: formEncomienda.remitenteTel,
          nombreDestinatario: formEncomienda.destinatarioNombre,
          ciDestinatario: formEncomienda.destinatarioCi,
          telDestinatario: formEncomienda.destinatarioTel,
          tarifaCalculada: tarifa,
          origenId: formEncomienda.origenCiudad.includes("Santa") ? "suc-002" : "suc-001",
          destinoId: formEncomienda.destinoCiudad.includes("Santa") ? "suc-002" : "suc-001",
          viajeId: salidaSeleccionada.id
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGuiaGeneradaExito(data.encomienda);
        // Recargar encomiendas
        const resEnc = await fetch("/api/encomiendas");
        const dataEnc = await resEnc.json();
        if (dataEnc.encomiendas) setEncomiendasBD(dataEnc.encomiendas);

        // Limpiar formulario
        setFormEncomienda({
          remitenteNombre: "",
          remitenteCi: "",
          remitenteTel: "",
          destinatarioNombre: "",
          destinatarioCi: "",
          destinatarioTel: "",
          descripcion: "",
          pesoKg: "5.0",
          origenCiudad: "La Paz",
          destinoCiudad: "Santa Cruz"
        });
      } else {
        alert("Error al registrar: " + (data.error || "No se pudo conectar a Neon DB"));
      }
    } catch (err) {
      console.error(err);
      alert("Error al conectar con el servidor.");
    } finally {
      setEncomiendaGuardando(false);
    }
  };

  // Función para concluir viaje en Neon DB y abrir reporte
  const concluirViajeEnBD = async () => {
    if (!confirm(`¿Confirmar conclusión y llegada a destino del viaje ${salidaSeleccionada.origen} → ${salidaSeleccionada.destino}? Se registrará en la base de datos oficial.`)) {
      return;
    }
    setGuardandoFinViaje(true);
    try {
      const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const fechaActual = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
      setFechaHoraFinViaje(`${fechaActual} - ${horaActual} hrs`);

      const res = await fetch("/api/viajes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viajeId: salidaSeleccionada.id,
          estado: "FINALIZADO",
          observaciones: "Viaje concluido satisfactoriamente con reporte digital generado por el conductor titular."
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setViajeConcluidoExitoso(true);
        // Actualizar estado en salida local
        setSalidaSeleccionada((prev) => ({ ...prev, estado: "FINALIZADO" }));
        // Abrir reporte de fin de viaje para previsualización e impresión
        setModalReporteFinViaje(true);
      } else {
        alert("Atención: " + (data.error || "No se pudo actualizar el estado en base de datos"));
      }
    } catch (err) {
      console.error("Error al finalizar viaje:", err);
      // Abrir reporte de todas formas para no trabar al chofer
      setViajeConcluidoExitoso(true);
      setModalReporteFinViaje(true);
    } finally {
      setGuardandoFinViaje(false);
    }
  };

  // Función para rastreo público de encomienda desde la Landing Page
  const consultarRastreoEncomienda = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRastreo("");
    setResultadoRastreo(null);
    const cod = inputGuiaRastreo.trim().toUpperCase();
    if (!cod) {
      setErrorRastreo("Ingresa el código de guía (Ej. ENC-2026-089 o el número).");
      return;
    }
    setBuscandoRastreo(true);
    try {
      const res = await fetch(`/api/encomiendas?codigo=${encodeURIComponent(cod)}`);
      const data = await res.json();
      if (res.ok && data.encomienda) {
        setResultadoRastreo(data.encomienda);
      } else {
        // Buscar coincidencia en lista local
        const encLocal = encomiendasBD.find(
          (item) => item.codigoGuia?.toUpperCase() === cod || item.codigoGuia?.toUpperCase().includes(cod)
        );
        if (encLocal) {
          setResultadoRastreo(encLocal);
        } else {
          setErrorRastreo(`No se encontró ninguna encomienda con la guía "${cod}". Verifique el número impreso en su comprobante.`);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorRastreo("Error de conexión al consultar el rastreo.");
    } finally {
      setBuscandoRastreo(false);
    }
  };

  // Función para autenticar con usuario y contraseña contra Neon DB
  const ejecutarLoginCredenciales = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin("");
    if (!inputUsuarioLogin.trim() || !inputPasswordLogin.trim()) {
      setErrorLogin("Ingresa tu usuario y contraseña");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: inputUsuarioLogin.trim(), password: inputPasswordLogin.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorLogin(data.error || "Credenciales incorrectas");
        return;
      }

      const u = data.usuario;
      let nivel: NivelPiramide = "OPERATIVO_TPS";
      let rolMapeado: RolSistema = "BOLETERO";
      let vistaDestino: VistaRol = "VENTAS";

      if (u.rol === "GERENTE") {
        nivel = "ESTRATEGICO_ESS";
        rolMapeado = "GERENTE_GENERAL";
        vistaDestino = "GERENCIA_NACIONAL";
      } else if (u.rol === "ADMIN") {
        nivel = "ESTRATEGICO_ESS";
        rolMapeado = "ADMIN_SISTEMAS";
        vistaDestino = "ADMIN_SISTEMAS";
      } else if (u.rol === "JEFE_OPERACIONES") {
        nivel = "TACTICO_MIS_DSS";
        rolMapeado = "JEFE_OPERACIONES";
        vistaDestino = "GERENCIA_NACIONAL";
      } else if (u.rol === "BOLETERO") {
        nivel = "OPERATIVO_TPS";
        rolMapeado = "BOLETERO";
        vistaDestino = "VENTAS";
      } else if (u.rol === "BODEGUERO") {
        nivel = "OPERATIVO_TPS";
        rolMapeado = "BODEGUERO";
        vistaDestino = "ENCOMIENDAS";
      } else if (u.rol === "AUXILIAR_ABORDAJE") {
        nivel = "OPERATIVO_TPS";
        rolMapeado = "AUXILIAR_ABORDAJE";
        vistaDestino = "AUXILIAR_ABORDAJE";
      } else if (u.rol === "CONDUCTOR") {
        nivel = "OPERATIVO_TPS";
        rolMapeado = "CONDUCTOR";
        vistaDestino = "CONDUCTOR";
      }

      const sesion = {
        nombre: u.nombre,
        email: u.email || `${u.username}@osastur.bo`,
        rol: rolMapeado,
        terminal: u.sucursal,
        nivel
      };

      setUsuarioAutenticado(sesion);
      try {
        localStorage.setItem("osastur_usuario_sesion", JSON.stringify(sesion));
      } catch (e) {}

      setRolActivo(vistaDestino);
      setModalLoginAbierto(false);
      setInputUsuarioLogin("");
      setInputPasswordLogin("");
    } catch (err) {
      setErrorLogin("Error al conectar con el servidor de autenticación");
    }
  };

  // Función para guardar usuario creado/editado por el Administrador
  const guardarGestionUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formGestionUsuario)
      });
      const data = await res.json();
      if (data.success) {
        // Recargar lista de usuarios
        const resU = await fetch("/api/auth/login");
        const dataU = await resU.json();
        if (dataU.usuarios) setPersonalOperable(dataU.usuarios);
        setModoCrearEditarUsuario(false);
        setFormGestionUsuario({ id: "", username: "", nombreCompleto: "", rol: "BOLETERO", password: "", departamento: "La Paz" });
      }
    } catch (e) {
      console.error(e);
    }
  };

    // Funciones de Administracion Maestra (Neon DB)
  const guardarNuevaFlota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNuevaFlota.placa || !formNuevaFlota.marcaModelo) {
      alert("Por favor complete la placa y modelo de la flota");
      return;
    }
    try {
      const res = await fetch("/api/flotas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formNuevaFlota)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.mensaje || "Unidad agregada al parque automotor exitosamente");
        setModoCrearFlota(false);
        setFormNuevaFlota({ placa: "", marcaModelo: "Mercedes-Benz Marcopolo G8", tipoFlota: "LEITO_SUITE_DOBLE_PISO", pisos: 2, totalAsientos: 26, choferNombre: "Don Mario Condori", auxiliarNombre: "Raul Choque" });
        const resF = await fetch("/api/flotas");
        const dataF = await resF.json();
        if (dataF.flotas) setFlotasBD(dataF.flotas);
      } else {
        alert(data.error || "Error al registrar la flota");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // =========================================================================
  // BORRADO LOGICO (SOFT DELETE) PARA PRESERVAR INTEGRIDAD REFERENCIAL
  // =========================================================================
  const handleToggleActivoUsuario = async (u: any) => {
    const accion = u.activo ? "dar de baja" : "reactivar";
    const nuevoEstado = !u.activo;
    const confirmacion = window.confirm(
      u.activo
        ? `¿Esta seguro de dar de baja al usuario @${u.username} (${u.nombreCompleto})?\n\nNOTA TECNICA: Se aplicara Borrado Logico (activo = false) en la base de datos para preservar la integridad referencial de todos los boletos, encomiendas y transacciones historicas emitidas por este usuario.`
        : `¿Desea reactivar al usuario @${u.username} (${u.nombreCompleto}) en el sistema?`
    );
    if (!confirmacion) return;

    try {
      const res = await fetch("/api/auth/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, activo: nuevoEstado })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.mensaje || `Usuario ${accion} exitosamente.`);
        const resU = await fetch("/api/auth/login");
        const dataU = await resU.json();
        if (dataU.usuarios) setPersonalOperable(dataU.usuarios);
      } else {
        alert(data.error || `Error al ${accion} usuario`);
      }
    } catch (err) {
      console.error("Error al actualizar estado de usuario:", err);
      alert(`Error al ${accion} usuario en la base de datos.`);
    }
  };

  const handleToggleActivoFlota = async (flota: any) => {
    const accion = flota.activo ? "dar de baja" : "reactivar";
    const nuevoEstado = !flota.activo;
    const confirmacion = window.confirm(
      flota.activo
        ? `¿Esta seguro de dar de baja la unidad [${flota.placa}] - ${flota.marcaModelo}?\n\nNOTA TECNICA: Se aplicara Borrado Logico (activo = false). La unidad quedara inactiva para nuevas salidas, preservando el historial de itinerarios y pasajes ya vendidos en la base de datos.`
        : `¿Desea reactivar la unidad [${flota.placa}] para asignacion operativa de salidas?`
    );
    if (!confirmacion) return;

    try {
      const res = await fetch("/api/flotas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: flota.id, activo: nuevoEstado })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.mensaje || `Unidad de flota ${accion} exitosamente.`);
        const resF = await fetch("/api/flotas");
        const dataF = await resF.json();
        if (dataF.flotas) setFlotasBD(dataF.flotas);
      } else {
        alert(data.error || `Error al ${accion} unidad`);
      }
    } catch (err) {
      console.error("Error al actualizar estado de flota:", err);
      alert(`Error al ${accion} unidad en la base de datos.`);
    }
  };

  const handleToggleEstadoViaje = async (viaje: any) => {
    const esCancelado = viaje.estado === "CANCELADO";
    const nuevoEstado = esCancelado ? "PROGRAMADO" : "CANCELADO";
    const confirmacion = window.confirm(
      !esCancelado
        ? `¿Esta seguro de cancelar la salida programada [${viaje.id}] (${viaje.origen?.nombre || "Origen"} -> ${viaje.destino?.nombre || "Destino"})?\n\nNOTA TECNICA: Se aplicara cancelacion logica (estado = 'CANCELADO') en la base de datos sin romper la integridad de los asientos y boletos emitidos.`
        : `¿Desea reactivar y reabrir a ventanilla la salida [${viaje.id}]?`
    );
    if (!confirmacion) return;

    try {
      const res = await fetch("/api/viajes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viajeId: viaje.id, estado: nuevoEstado })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.mensaje || `Salida actualizada a estado '${nuevoEstado}'.`);
        const resV = await fetch("/api/viajes");
        const dataV = await resV.json();
        if (dataV.viajes) setViajesBD(dataV.viajes);
      } else {
        alert(data.error || "Error al actualizar salida");
      }
    } catch (err) {
      console.error("Error al actualizar salida:", err);
      alert("Error al actualizar estado de salida.");
    }
  };

  const guardarNuevoViajeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNuevoViaje.busId || !formNuevoViaje.origenId || !formNuevoViaje.destinoId || !formNuevoViaje.fechaHoraSalida) {
      alert("Por favor complete todos los datos del itinerario");
      return;
    }
    try {
      const res = await fetch("/api/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formNuevoViaje)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.mensaje || "Salida programada exitosamente");
        setModoCrearViaje(false);
        const resV = await fetch("/api/viajes");
        const dataV = await resV.json();
        if (dataV.viajes) {
          setViajesBD(dataV.viajes);
        }
      } else {
        alert(data.error || "Error al crear salida");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const restablecerPasswordUsuario = async (userId: string, username: string) => {
    const atSign = String.fromCharCode(64);
    const passTemp = prompt("Asignar contrasena provisional para " + atSign + username + ":", "osastur2026");
    if (!passTemp) return;
    try {
      const res = await fetch("/api/auth/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          username: username,
          nombreCompleto: personalOperable.find(u => u.id === userId)?.nombreCompleto || username,
          rol: personalOperable.find(u => u.id === userId)?.rol || "BOLETERO",
          password: passTemp
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Contrasena temporal asignada con exito para " + atSign + username + ". Clave: '" + passTemp + "'. El usuario podra ingresar y cambiarla luego desde su cuenta.");
        const resU = await fetch("/api/auth/login");
        const dataU = await resU.json();
        if (dataU.usuarios) setPersonalOperable(dataU.usuarios);
      } else {
        alert(data.error || "Error al restablecer contrasena");
      }
    } catch (err) {
      console.error(err);
    }
  };

// Mapear viaje real de Neon a SalidaProgramada
  const mapearViajeASalida = (v: any): SalidaProgramada => {
    let busId = "BUS-LEITO-TOTAL";
    if (v.tipoFlota === "SEMI_CAMA_UN_PISO" || v.tipoFlota === "SEMI_CAMA") busId = "BUS-SEMICAMA";
    else if (v.tipoFlota === "BUS_CAMA_CLIMATIZADO" || v.tipoFlota === "BUS_CAMA") busId = "BUS-CAMA1";

    const fechaSalida = new Date(v.fechaHoraSalida);
    const horaSalida = fechaSalida.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return {
      id: v.id,
      busId,
      origen: v.origenDepto || v.origenNombre,
      destino: v.destinoDepto || v.destinoNombre,
      terminalSalida: v.origenNombre,
      terminalLlegada: v.destinoNombre,
      horaSalida: horaSalida || "20:00",
      andenSalida: `Andén #${(parseInt(v.id.replace(/\D/g, "") || "1") % 12) + 1}`,
      estado: v.estado === "FINALIZADO" ? "PROGRAMADO" : v.estado,
      tarifa: parseFloat(v.precioBasePiso1) || 150
    };
  };

  // Cargar croquis real desde Neon DB para cualquier viaje seleccionado
  const cargarCroquisPorViajeId = async (viajeId: string, tipoFlotaStr: string, salidaInfo: SalidaProgramada) => {
    try {
      setCargandoCroquis(true);
      const res = await fetch(`/api/croquis?viajeId=${viajeId}`);
      const data = await res.json();
      if (data.asientos && data.asientos.length > 0) {
        const esSemiCama = tipoFlotaStr.includes("SEMI_CAMA");
        const esLeito = tipoFlotaStr.includes("LEITO");
        const cols = esSemiCama ? 4 : 3;

        const asientosMapeados: AsientoCroquis[] = data.asientos.map((a: any) => {
          const num = a.numeroAsiento;
          let colIndex = 0;
          let columnaTipo = "Ventana Izq";
          if (cols === 4) {
            colIndex = (num - 1) % 4;
            columnaTipo = colIndex === 0 ? "Ventana Izq" : colIndex === 1 ? "Pasillo Izq" : colIndex === 2 ? "Pasillo Der" : "Ventana Der";
          } else {
            colIndex = (num - 1) % 3;
            columnaTipo = colIndex === 0 ? "Ventana Izq" : colIndex === 1 ? "Pasillo" : "Ventana Individual";
          }
          const codigoAsiento = (a.ubicacion === "VENTANA" ? "V" : "P") + num;

          return {
            numero: num,
            codigoAsiento,
            ubicacion: a.ubicacion,
            columnaTipo,
            piso: a.piso || 1,
            estado: (a.estado === "VENDIDO" || a.estado === "OCUPADO") ? "VENDIDO" : (a.estado === "RESERVADO" ? "BLOQUEADO" : "DISPONIBLE"),
            tarifa: parseFloat(a.precioPagado) || salidaInfo.tarifa,
            abordado: Boolean(a.abordado),
            horaAbordaje: a.abordado ? "20:45" : undefined,
            pasajeroNombre: a.nombrePasajero || undefined,
            pasajeroCI: a.ciPasajero || undefined,
            boletoCodigo: a.codigoBoleto || undefined
          };
        });
        setCroquis(asientosMapeados);
      }
    } catch (err) {
      console.error("Error al cargar croquis real:", err);
    } finally {
      setCargandoCroquis(false);
    }
  };

  const cambiarSalida = (salida: SalidaProgramada) => {
    setSalidaSeleccionada(salida);
    const bus = TIPOLOGIAS_FLOTAS_BOLIVIA.find((b) => b.id === salida.busId) || TIPOLOGIAS_FLOTAS_BOLIVIA[0];
    cargarCroquisPorViajeId(salida.id, bus.tipoFlota, salida);
    setAsientoInspeccionado(null);
    setAsientoVenta(null);
    setPisoVista(1);
    setMensajeScan(null);
  };

  const procesarAbordaje = (codigo: string) => {
    const cod = codigo.trim().toUpperCase();
    if (!cod) return;

    // Si el auxiliar escanea o ingresa un código de encomienda (Ej. ENC-2026-089 o GUIA)
    const encIndex = encomiendasBD.findIndex(
      (e) => e.codigoGuia?.toUpperCase() === cod || e.id?.toUpperCase() === cod
    );

    if (encIndex !== -1) {
      const encEncontrada = encomiendasBD[encIndex];
      const nuevoEstado = subpestanaAuxiliar === "ABORDAJE_ORIGEN" ? "EN_TRANSITO" : "ENTREGADO";
      
      setEncomiendasVerificadasAuxiliar((prev) => ({ ...prev, [encEncontrada.id]: nuevoEstado === "EN_TRANSITO" }));
      setEncomiendasBD((prev) =>
        prev.map((item) => (item.id === encEncontrada.id ? { ...item, estado: nuevoEstado } : item))
      );

      fetch('/api/encomiendas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: encEncontrada.id, estado: nuevoEstado })
      });

      setMensajeScan({
        tipo: "exito",
        texto: `✓ Encomienda ${encEncontrada.codigoGuia} (${encEncontrada.descripcion}) actualizada automáticamente a ${nuevoEstado} en base de datos.`
      });
      setInputCodigoQR("");
      return;
    }

    const index = croquis.findIndex(
      (a) =>
        a.boletoCodigo?.toUpperCase() === cod ||
        a.codigoAsiento.toUpperCase() === cod ||
        String(a.numero) === cod
    );

    if (index === -1) {
      setMensajeScan({
        tipo: "error",
        texto: `Boleto o Asiento "${cod}" no existe en esta unidad (${busAsignado.placa}).`
      });
      return;
    }

    const asiento = croquis[index];
    if (asiento.estado !== "VENDIDO") {
      setMensajeScan({
        tipo: "error",
        texto: `El asiento ${asiento.codigoAsiento} figura como ${asiento.estado}, no tiene pasaje vendido.`
      });
      return;
    }

    if (asiento.abordado) {
      setMensajeScan({
        tipo: "info",
        texto: `¡ALERTA! El pasajero ${asiento.pasajeroNombre} (Asiento ${asiento.codigoAsiento}) YA HABÍA ABORDADO a las ${asiento.horaAbordaje} hrs.`
      });
      setAsientoInspeccionado(asiento);
      setPisoVista(asiento.piso);
      return;
    }

    const ahora = new Date();
    const horaStr = ahora.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Actualización asíncrona real en tabla Boleto de Neon PostgreSQL
    try {
      fetch('/api/abordaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: cod })
      });
    } catch (e) {
      console.error("Error al registrar abordaje en Neon:", e);
    }

    const nuevo = [...croquis];
    nuevo[index] = {
      ...asiento,
      abordado: true,
      horaAbordaje: horaStr
    };

    setCroquis(nuevo);
    setAsientoInspeccionado(nuevo[index]);
    setPisoVista(asiento.piso);
    setMensajeScan({
      tipo: "exito",
      texto: `✅ ¡Abordaje confirmado! Pasajero ${asiento.pasajeroNombre} verificado en Asiento ${asiento.codigoAsiento} (${asiento.columnaTipo} • ${busAsignado.pisos === 2 ? (asiento.piso === 1 ? "Planta Baja" : "Planta Alta") : "Piso Único"}).`
    });
    setInputCodigoQR("");
  };

  const totalVendidos = croquis.filter((a) => a.estado === "VENDIDO").length;
  const totalAbordados = croquis.filter((a) => a.abordado).length;
  const pendientes = totalVendidos - totalAbordados;
  const avance = totalVendidos > 0 ? Math.round((totalAbordados / totalVendidos) * 100) : 0;

  const esTresColumnas = busAsignado.columnas === 3;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${temaOscuro ? "bg-[#090c09] text-gray-100" : "bg-[#f8faf9] text-gray-900"}`}>

      {/* HEADER INSTITUCIONAL */}
      <header className={`border-b px-4 md:px-8 py-3.5 sticky top-0 z-50 backdrop-blur-md transition-colors duration-200 ${temaOscuro ? "bg-[#0c0f0c]/95 border-[#1e261e] shadow-md" : "bg-white/95 border-gray-200 shadow-sm"}`}>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* LOGO CORPORATIVO & TITULO */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => {
              setRolActivo("LANDING");
            }}
          >
            <div className="bg-black p-1 rounded-xl shadow-lg flex items-center justify-center border border-[#488810]/50 group-hover:scale-105 transition-transform">
              <img
                src="/logo-oficial-osastur.jpg"
                alt="Logo Oficial OSASTUR"
                className="h-9 w-auto max-w-[120px] object-contain rounded"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  OSASTUR
                </span>
                <span className="text-[10px] bg-[#488810] text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                  BOLIVIA
                </span>
              </div>
              <p className="text-[11px] text-[#9ca3af] font-medium">Sistema Web Integrado de Pasajes & Encomiendas</p>
            </div>
          </div>

          {/* INDICADOR DE PIRÁMIDE DE INFORMACIÓN Y NAVEGACIÓN PERMITIDA */}
          <div className="flex items-center gap-2">
            {usuarioAutenticado ? (
              <div className="flex items-center gap-3 bg-[#111611] border border-[#1e261e] rounded-xl px-3 py-1.5">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-bold text-white">{usuarioAutenticado.nombre}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-[#1d3d14] text-[#a3e635] border border-[#3d7912]/50">
                      {usuarioAutenticado.rol === "BOLETERO" ? "Ventanilla / Boletería" :
                       usuarioAutenticado.rol === "BODEGUERO" ? "Carga y Encomiendas" :
                       usuarioAutenticado.rol === "AUXILIAR_ABORDAJE" ? "Andén / Abordaje" :
                       usuarioAutenticado.rol === "CONDUCTOR" ? "Conductor de Flota" :
                       usuarioAutenticado.rol === "ADMIN_SISTEMAS" ? "Administrador de Sistemas" :
                       usuarioAutenticado.rol === "GERENTE_GENERAL" ? "Gerencia General" :
                       usuarioAutenticado.rol}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#9ca3af] font-mono">
                    Sucursal: <strong className="text-[#a3e635]">{usuarioAutenticado.terminal}</strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setUsuarioAutenticado(null);
                    try { localStorage.removeItem("osastur_usuario_sesion"); } catch (e) {}
                    setRolActivo("LANDING");
                  }}
                  title="Cerrar Sesión Institucional"
                  className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setModalLoginAbierto(true)}
                title="Acceso exclusivo para funcionarios y personal operativo de OSASTUR"
                className={`px-3.5 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 transition-colors ${temaOscuro ? "bg-[#141b14] hover:bg-[#1a231a] border-[#223022] text-emerald-400 hover:text-emerald-300" : "bg-gray-100 hover:bg-gray-200 border-gray-300 text-emerald-700"}`}
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Personal Autorizado
              </button>
            )}

            {/* BOTÓN TOGGLE MODO OSCURO / MODO CLARO */}
            <button
              onClick={() => setTemaOscuro(!temaOscuro)}
              title={temaOscuro ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
              className={`p-2 rounded-lg border transition-colors flex items-center justify-center ${
                temaOscuro 
                  ? "bg-[#141b14] border-[#223022] text-amber-400 hover:bg-[#1a231a]" 
                  : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {temaOscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-emerald-700" />}
            </button>
          </div>
        </div>

                </header>

      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
        {/* BANNER DE FLOTA: Solo visible para roles operativos y gerenciales cuando no está en landing */}
        {rolActivo !== "LANDING" && rolActivo !== "ADMIN_SISTEMAS" && rolActivo !== "GERENCIA_NACIONAL" && (
        <div className="banner-flota-sincronizada no-print bg-[#101910] border border-[#223620] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#1d3319] border border-[#355c2d] text-[#a3e635] rounded-xl shadow-inner">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Salida Sincronizada en Andén
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {salidaSeleccionada.estado}
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                {salidaSeleccionada.origen} <ArrowRight className="w-4 h-4 text-[#9ca3af]" /> {salidaSeleccionada.destino}
                <span className="text-sm font-normal text-[#9ca3af] font-mono">({salidaSeleccionada.horaSalida} hrs)</span>
              </h1>
              <p className="text-xs text-[#9ca3af] mt-0.5">
                {salidaSeleccionada.terminalSalida} — <strong className="text-[#f8fafc]">{salidaSeleccionada.andenSalida}</strong>
              </p>
            </div>
          </div>

          {/* FICHA TÉCNICA */}
          <div className="flex items-center gap-6 bg-[#090c09]/60 border border-[#1e261e]/80 px-4 py-2.5 rounded-xl text-xs">
            <div>
              <p className="text-[10px] text-[#9ca3af] uppercase font-mono">Tipo de Flota Boliviana</p>
              <p className="font-bold text-amber-400">{busAsignado.nombreComercial}</p>
              <p className="text-[11px] text-[#e2e8f0] font-mono">
                Placa: <strong className="text-white">{busAsignado.placa}</strong> • {busAsignado.totalAsientos} plazas ({busAsignado.pisos === 1 ? "1 Solo Piso" : "Doble Piso"})
              </p>
            </div>

            <div className="border-l border-[#1e261e] pl-4 hidden md:block">
              <p className="text-[10px] text-[#9ca3af] uppercase font-mono">Distribución Pasillo / Ventana</p>
              <p className="text-[#e2e8f0] font-mono font-semibold text-emerald-400">{busAsignado.distribucionPiso1}</p>
              <p className="text-[#9ca3af] text-[10px]">Reclinación: {busAsignado.reclinacion}</p>
            </div>

            {/* ESTADO DE CONEXIÓN CON FLOTA */}
            <div className="border-l border-[#1e261e] pl-4 hidden sm:block">
              <span className="text-[10px] text-[#9ca3af] uppercase font-mono block">Terminal Origen</span>
              <span className="text-xs font-bold text-[#a3e635] flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#65a30d] animate-pulse"></span>
                {salidaSeleccionada.terminalSalida || salidaSeleccionada.origen}
              </span>
            </div>
          </div>
        </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VISTA 1: AUXILIAR DE ABORDAJE (VALIDACION QR Y CROQUIS MOVIL) */}
        {/* ------------------------------------------------------------- */}
        
        {/* ========================================================================= */}
        {/* VISTA 0: LANDING PAGE OFICIAL OSASTUR (DISEÑO UX/UI PROFESIONAL Y LIMPIO) */}
        {/* ========================================================================= */}
        {rolActivo === "LANDING" && (
          <div className="space-y-10">
            {/* HERO SECTION MINIMALISTA: FONDO NEGRO PROFUNDO, TIPOGRAFÍA HUMANA, SIN BURBUJAS DECORATIVAS */}
            <section className="bg-[#111611] border border-[#1e261e] rounded-2xl p-6 md:p-10 text-white shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-6">
                  {/* Badge Institucional sobrio */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#151c15] border border-[#283728] text-xs text-[#cbd5e1]">
                    <span className="w-2 h-2 rounded-full bg-[#3d7912]"></span>
                    <span>Empresa de Transporte Interdepartamental &bull; Bolivia</span>
                  </div>

                  {/* Título y Descripción con excelente jerarquía tipográfica */}
                  <div className="space-y-4">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                      Transporte confiable y puntual por toda <span className="text-[#65a30d]">Bolivia</span>
                    </h1>
                    <p className="text-[#d1d5db] text-sm md:text-base max-w-xl leading-relaxed">
                      Conectamos La Paz, Cochabamba, Santa Cruz, Tarija, Oruro, Sucre y Potosí con unidades modernas <strong>Leito Total Suite</strong>, <strong>Bus Cama</strong> y <strong>Semi Cama</strong>. Compra tu boleto en ventanilla o en línea con control de abordaje por código QR.
                    </p>
                  </div>

                  {/* Botones de Acción con colores limpios y funcionales */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => {
                        setTipoFlotaSeleccionadaCliente("TODOS");
                        setModalClienteCompraOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-lg bg-[#3d7912] hover:bg-[#31620e] text-white font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Ticket className="w-4 h-4" />
                      Comprar Boletos
                    </button>
                    <button
                      onClick={() => {
                        const el = document.getElementById("seccion-rastreo-encomiendas");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-5 py-2.5 rounded-lg bg-[#141b14] hover:bg-[#1c261c] border border-[#2c3b2c] text-[#f1f5f9] font-medium text-sm flex items-center gap-2 transition-colors"
                    >
                      <Package className="w-4 h-4 text-[#e59819]" />
                      Rastrear Carga / Encomienda
                    </button>
                  </div>
                </div>

                {/* Fotografía de Flota Oficial enmarcada de forma sobria */}
                <div className="lg:col-span-5">
                  <div className="rounded-xl overflow-hidden border border-[#243024] bg-[#0c0f0c] shadow-sm">
                    <img
                      src="/flota-osastur-oficial.jpg"
                      alt="Flota Oficial OSASTUR"
                      className="w-full h-64 md:h-76 object-cover object-center"
                    />
                    <div className="p-3.5 bg-[#141b14] border-t border-[#1e261e] flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">Flota Oficial OSASTUR</p>
                        <p className="text-[11px] text-[#9ca3af]">Monitoreo satelital y conductores certificados</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#192319] text-[#65a30d] border border-[#2f3f2f] text-[10px] font-mono font-medium">
                        ACTIVO
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓN CONFORT INTERIOR Y BUSCADOR DE PASAJES */}
            <div className="space-y-6">
              {/* TARJETA DE CONFORT CON LA FOTO OFICIAL DE LOS ASIENTOS */}
              <div className="bg-[#111611] border border-[#1e261e] rounded-2xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                  <div className="lg:col-span-5 p-6 md:p-8 space-y-3.5">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#172017] text-[#65a30d] border border-[#2c3b2c]">
                      Comodidad &bull; Flota Oficial
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                      Butacas ergonómicas y descanso a bordo
                    </h3>
                    <p className="text-xs md:text-sm text-[#9ca3af] leading-relaxed">
                      Todas nuestras unidades cuentan con reclinación de 140° a 180°, climatización, cabeceras acolchadas y amplio espacio entre filas para viajes nocturnos descansados.
                    </p>
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#e2e8f0]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Check className="w-3.5 h-3.5 text-[#65a30d]" /> Reclinación regulable
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Check className="w-3.5 h-3.5 text-[#65a30d]" /> SOAT y seguro obligatorio
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-7 h-56 md:h-72 overflow-hidden bg-[#090c09]">
                    <img
                      src="/asientos_promo.jpg"
                      alt="Interior de buses OSASTUR"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </div>
              </div>

              {/* BUSCADOR DE SALIDAS EN LÍNEA: DIRECTO A NEON DB */}
              <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-5 md:p-6 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-4 text-white">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#65a30d]" />
                    <h3 className="text-base font-bold text-white tracking-tight">Buscar Salidas y Disponibilidad de Asientos</h3>
                  </div>
                  <span className="text-[11px] font-mono text-[#9ca3af]">
                    {viajesBD.length} Salidas Registradas en Línea
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Origen</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-[#6b7280] absolute left-3 top-3" />
                      <select 
                        value={origenFiltro}
                        onChange={(e) => setOrigenFiltro(e.target.value)}
                        className="w-full bg-[#0c0f0c] border border-[#1e261e] text-white rounded-lg pl-9 pr-3 py-2 text-xs font-medium focus:border-[#3d7912] outline-none"
                      >
                        <option value="La Paz">La Paz (Terminal Central)</option>
                        <option value="Cochabamba">Cochabamba (Terminal Interdep.)</option>
                        <option value="Santa Cruz">Santa Cruz (Terminal Bimodal)</option>
                        <option value="Chuquisaca">Sucre (Terminal Central)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Destino</label>
                    <div className="relative">
                      <Navigation className="w-4 h-4 text-[#6b7280] absolute left-3 top-3" />
                      <select 
                        value={destinoFiltro}
                        onChange={(e) => setDestinoFiltro(e.target.value)}
                        className="w-full bg-[#0c0f0c] border border-[#1e261e] text-white rounded-lg pl-9 pr-3 py-2 text-xs font-medium focus:border-[#3d7912] outline-none"
                      >
                        <option value="Santa Cruz">Santa Cruz (Terminal Bimodal)</option>
                        <option value="La Paz">La Paz (Terminal Central)</option>
                        <option value="Cochabamba">Cochabamba (Terminal Interdep.)</option>
                        <option value="Potosí">Potosí (Terminal Nueva)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#9ca3af] mb-1.5">Fecha de Salida</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[#6b7280] absolute left-3 top-3" />
                      <input
                        type="date"
                        defaultValue="2026-10-26"
                        className="w-full bg-[#0c0f0c] border border-[#1e261e] text-white rounded-lg pl-9 pr-3 py-2 text-xs font-medium focus:border-[#3d7912] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setTipoFlotaSeleccionadaCliente("TODOS");
                        setModalClienteCompraOpen(true);
                      }}
                      className="w-full bg-[#3d7912] hover:bg-[#31620e] text-white py-2 px-4 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Search className="w-3.5 h-3.5 text-white" />
                      Consultar y Comprar Asiento
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECCIÓN DE RASTREO PÚBLICO DE ENCOMIENDAS EN TIEMPO REAL (EN LA NUBE)     */}
            {/* ========================================================================= */}
            <section id="seccion-rastreo-encomiendas" className="bg-[#111611] border border-[#1e261e] rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e261e] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#1d3319] border border-[#355c2d] text-[#a3e635] rounded-xl">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400 bg-amber-950/40 border border-amber-900/60 px-2 py-0.5 rounded">
                        Servicio al Cliente 24/7
                      </span>
                      <span className="text-xs text-emerald-400 font-mono font-bold">
                        Sincronización en Vivo
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white mt-0.5">
                      Rastreo de Encomiendas & Carga en Línea
                    </h2>
                    <p className="text-xs text-[#9ca3af]">
                      Consulte si su paquete ya arribó a destino para recogerlo en terminal o si continúa en tránsito sobre la flota.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono text-[#9ca3af] hidden sm:inline">
                  Búsqueda por Código de Guía o C.I.
                </span>
              </div>

              {/* FORMULARIO DE CONSULTA RÁPIDA */}
              <form onSubmit={consultarRastreoEncomienda} className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={inputGuiaRastreo}
                    onChange={(e) => setInputGuiaRastreo(e.target.value)}
                    placeholder="Ingrese su Código de Guía (Ej. ENC-2026-089 o ENC-2026-090)"
                    className="w-full bg-[#090c09] border border-[#273427] text-white rounded-xl pl-10 pr-4 py-3 text-xs font-mono outline-none focus:border-[#3d7912]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={buscandoRastreo}
                  className="px-6 py-3 bg-[#3d7912] hover:bg-[#31620e] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  {buscandoRastreo ? "Consultando..." : "Rastrear Paquete"}
                </button>
              </form>

              {/* MENSAJE DE ERROR */}
              {errorRastreo && (
                <div className="max-w-2xl mx-auto p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorRastreo}</span>
                </div>
              )}

              {/* RESULTADO DETALLADO DEL RASTREO CON LÍNEA DE TIEMPO DEL ESTADO */}
              {resultadoRastreo && (() => {
                const est = resultadoRastreo.estado;
                const esEntregado = est === "ENTREGADO";
                const esArribado = est === "ARRIBADO_DESTINO" || esEntregado;
                const esEnTransito = est === "EN_TRANSITO" || esArribado;
                const esRecepcionado = est === "RECEPCIONADO" || esEnTransito;

                return (
                  <div className="max-w-3xl mx-auto bg-[#090c09] border border-[#2d4722] rounded-2xl p-6 shadow-2xl space-y-6 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e261e] pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-[#9ca3af] block">Guía Oficial Encontrada:</span>
                        <h3 className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                          {resultadoRastreo.codigoGuia}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                          esEntregado
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : est === "ARRIBADO_DESTINO"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : est === "EN_TRANSITO"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                            : "bg-[#142014] text-[#a3e635] border border-[#2d4722]"
                        }`}>
                          {esEntregado
                            ? "✓ ENTREGADO AL DESTINATARIO"
                            : est === "ARRIBADO_DESTINO"
                            ? "📦 LISTO PARA RECOGER EN DESTINO"
                            : est === "EN_TRANSITO"
                            ? "🚚 EN TRÁNSITO EN CARRETERA"
                            : "📋 RECEPCIONADO EN BODEGA ORIGEN"}
                        </span>
                      </div>
                    </div>

                    {/* LÍNEA DE TIEMPO VISUAL DEL ENVÍO */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
                      <div className={`p-3 rounded-xl border text-center transition-all ${
                        esRecepcionado ? "bg-[#142014] border-[#2d4722] text-[#a3e635]" : "bg-[#090c09] border-[#1e261e] text-[#6b7280]"
                      }`}>
                        <div className="w-3 h-3 mx-auto rounded-full bg-[#a3e635] mb-1"></div>
                        <span className="text-[10px] font-mono uppercase font-bold block">1. Recepcionado</span>
                        <span className="text-[11px] block mt-0.5 text-white">En Ventanilla</span>
                      </div>

                      <div className={`p-3 rounded-xl border text-center transition-all ${
                        esEnTransito ? "bg-sky-950/40 border-sky-700/60 text-sky-300" : "bg-[#090c09] border-[#1e261e] text-[#6b7280]"
                      }`}>
                        <div className={`w-3 h-3 mx-auto rounded-full mb-1 ${esEnTransito ? "bg-sky-400 animate-pulse" : "bg-[#334155]"}`}></div>
                        <span className="text-[10px] font-mono uppercase font-bold block">2. En Tránsito</span>
                        <span className="text-[11px] block mt-0.5 text-white">En Maletero Flota</span>
                      </div>

                      <div className={`p-3 rounded-xl border text-center transition-all ${
                        esArribado ? "bg-amber-950/40 border-amber-700/60 text-amber-300" : "bg-[#090c09] border-[#1e261e] text-[#6b7280]"
                      }`}>
                        <div className={`w-3 h-3 mx-auto rounded-full mb-1 ${esArribado ? "bg-amber-400" : "bg-[#334155]"}`}></div>
                        <span className="text-[10px] font-mono uppercase font-bold block">3. Arribado</span>
                        <span className="text-[11px] block mt-0.5 text-white">Listo en Almacén</span>
                      </div>

                      <div className={`p-3 rounded-xl border text-center transition-all ${
                        esEntregado ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500" : "bg-[#090c09] border-[#1e261e] text-[#6b7280]"
                      }`}>
                        <div className={`w-3 h-3 mx-auto rounded-full mb-1 ${esEntregado ? "bg-emerald-400" : "bg-[#334155]"}`}></div>
                        <span className="text-[10px] font-mono uppercase font-bold block">4. Entregado</span>
                        <span className="text-[11px] block mt-0.5 text-white">Retirado con C.I.</span>
                      </div>
                    </div>

                    {/* DETALLES DE LA ENCOMIENDA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#111611] p-4 rounded-xl border border-[#1e261e]">
                      <div className="space-y-1.5">
                        <p className="text-[#9ca3af]">Detalle de Mercadería:</p>
                        <p className="font-bold text-white text-sm">{resultadoRastreo.descripcion}</p>
                        <p className="text-[#cbd5e1] font-mono">Peso: <strong className="text-amber-400">{resultadoRastreo.pesoKg} Kg</strong> &bull; Flete: Bs. {resultadoRastreo.tarifaCalculada}</p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[#9ca3af]">Ruta y Destinatario Autorizado:</p>
                        <p className="text-white font-bold">{resultadoRastreo.origenNombre || "La Paz"} &rarr; {resultadoRastreo.destinoNombre || "Santa Cruz"}</p>
                        <p className="text-emerald-400 font-mono">
                          Destinatario: <strong>{resultadoRastreo.nombreDestinatario}</strong> (C.I. {resultadoRastreo.ciDestinatario || "Verificado"})
                        </p>
                      </div>
                    </div>

                    {/* INSTRUCCIÓN DE RECOJO */}
                    <div className="p-3 bg-[#142014] border border-[#2d4722] rounded-xl text-xs text-[#cbd5e1] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#a3e635] shrink-0" />
                        <span>
                          {esEntregado
                            ? "Esta encomienda ya fue entregada y firmada con registro en la base de datos oficial."
                            : est === "ARRIBADO_DESTINO"
                            ? "¡El paquete ya llegó! Puede pasar a recogerlo por la terminal de destino presentando su Cédula de Identidad original."
                            : "El paquete está en camino. Se actualizará en cuanto la unidad arribe a la terminal de destino."}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </section>

            {/* NUESTRAS 3 TIPOLOGÍAS OFICIALES DE FLOTA BOLIVIANA */}
            <section className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold text-[#65a30d] uppercase tracking-wider bg-[#488810]/10 border border-[#488810]/30 px-3 py-1 rounded-full">
                  Flota Estandarizada a Nivel Nacional
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white">Nuestros 3 Tipos de Flotas</h2>
                <p className="text-xs md:text-sm text-[#9ca3af]">
                  Unidades diseñadas conforme a normativa de transporte boliviano con codificación exacta en pasillo y ventana.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. SEMI CAMA */}
                <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-blue-600/50 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#172017]/30 text-emerald-400 border border-[#1e261e] px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                        1 Piso &bull; 44 Plazas
                      </span>
                      <span className="text-xs font-mono text-[#9ca3af]">140° Reclinación</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Semi Cama</h3>
                      <p className="text-xs text-[#9ca3af] mt-1">
                        Distribución de 4 columnas: <strong>Ventana - Pasillo - Pasillo - Ventana</strong>. Ideal para viajes diurnos y rutas directas.
                      </p>
                    </div>
                    <ul className="text-xs text-[#e2e8f0] space-y-2 pt-2 border-t border-[#1e261e]/80">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Aire acondicionado y calefacción
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Cargadores USB en asientos
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Tarifas accesibles por tramo
                      </li>
                    </ul>
                  </div>
                  <div className="pt-6 mt-4 border-t border-[#1e261e] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#9ca3af]">Tarifa Promedio</p>
                      <p className="text-lg font-black text-amber-400">Bs. 80 - 100</p>
                    </div>
                    <button
                      onClick={() => {
                        setTipoFlotaSeleccionadaCliente("SEMI_CAMA");
                        setModalClienteCompraOpen(true);
                      }}
                      className="px-3.5 py-2 bg-[#172017] hover:bg-[#2e5d0e] text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Elegir Asiento
                    </button>
                  </div>
                </div>

                {/* 2. BUS CAMA */}
                <div className="bg-[#111611] border-2 border-[#1e261e] rounded-2xl p-6 shadow-xl flex flex-col justify-between relative">
                  <div className="absolute -top-3 right-6 bg-[#488810] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow">
                    Más Solicitado
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#488810]/20 text-emerald-300 border border-[#488810]/40 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                        1 Piso &bull; 32 Plazas
                      </span>
                      <span className="text-xs font-mono text-[#9ca3af]">160° Reclinación</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Bus Cama</h3>
                      <p className="text-xs text-[#9ca3af] mt-1">
                        Distribución de 3 columnas: <strong>Ventana - Pasillo - Ventana</strong>. Asientos anchos individuales para máximo confort.
                      </p>
                    </div>
                    <ul className="text-xs text-[#e2e8f0] space-y-2 pt-2 border-t border-[#1e261e]/80">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Asientos de piel extra acolchados
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Pantallas individuales multimedia
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Refrigerio y café a bordo
                      </li>
                    </ul>
                  </div>
                  <div className="pt-6 mt-4 border-t border-[#1e261e] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#9ca3af]">Tarifa Promedio</p>
                      <p className="text-lg font-black text-amber-400">Bs. 130 - 160</p>
                    </div>
                    <button
                      onClick={() => {
                        setTipoFlotaSeleccionadaCliente("BUS_CAMA");
                        setModalClienteCompraOpen(true);
                      }}
                      className="px-3.5 py-2 bg-[#488810] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Elegir Asiento
                    </button>
                  </div>
                </div>

                {/* 3. LEITO TOTAL 180 */}
                <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-red-600/50 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#e40421]/20 text-red-300 border border-[#e40421]/40 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                        2 Pisos &bull; 26 Camas Suite
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">180° Horizontal</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Leito Total Suite</h3>
                      <p className="text-xs text-[#9ca3af] mt-1">
                        Camas suites 180° completas (8 en Planta Baja + 18 en Planta Alta). Descanso de lujo total para viajes nocturnos.
                      </p>
                    </div>
                    <ul className="text-xs text-[#e2e8f0] space-y-2 pt-2 border-t border-[#1e261e]/80">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Cama horizontal con almohada y manta
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Cortinas individuales de privacidad
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Desayuno o cena caliente a bordo
                      </li>
                    </ul>
                  </div>
                  <div className="pt-6 mt-4 border-t border-[#1e261e] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#9ca3af]">Tarifa Promedio</p>
                      <p className="text-lg font-black text-amber-400">Bs. 200 - 240</p>
                    </div>
                    <button
                      onClick={() => {
                        setTipoFlotaSeleccionadaCliente("LEITO");
                        setModalClienteCompraOpen(true);
                      }}
                      className="px-3.5 py-2 bg-[#e40421] hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Elegir Asiento
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓN INSTITUCIONAL Y VALORES */}
            <section className={`border rounded-2xl p-8 shadow-sm transition-colors ${temaOscuro ? "bg-[#111611] border-[#1e261e]" : "bg-white border-gray-200 shadow-sm"}`}>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div className="p-4 rounded-2xl bg-[#090c09]/40 border border-[#1e261e]">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#172017]/30 border border-[#1e261e] text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-white font-bold text-base">SOAT & Seguridad</h4>
                  <p className="text-xs text-[#9ca3af] mt-1">Todas nuestras flotas cuentan con SOAT vigente y doble chofer de relevo.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#090c09]/40 border border-[#1e261e]">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#488810]/30 border border-[#488810] text-emerald-300 flex items-center justify-center">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h4 className="text-white font-bold text-base">Embarque con QR</h4>
                  <p className="text-xs text-[#9ca3af] mt-1">Sin filas ni papeles: sube a la flota mostrando el código QR en tu celular.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#090c09]/40 border border-[#1e261e]">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#e40421]/30 border border-[#e40421] text-red-300 flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <h4 className="text-white font-bold text-base">Carga & Encomiendas</h4>
                  <p className="text-xs text-[#9ca3af] mt-1">Bodegas selladas con seguimiento de guía e ingreso de código en línea.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#090c09]/40 border border-[#1e261e]">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="text-white font-bold text-base">Puntualidad en Andén</h4>
                  <p className="text-xs text-[#9ca3af] mt-1">Salidas programadas y sincronizadas con control de abordaje en tiempo real.</p>
                </div>
              </div>
            </section>

            {/* FOOTER INSTITUCIONAL */}
            <footer className="border-t border-[#1e261e] pt-8 pb-12 text-[#9ca3af] text-xs">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-black p-1 rounded-lg border border-[#488810]/40">
                    <img src="/logo-oficial-osastur.jpg" alt="OSASTUR" className="h-7 w-auto object-contain rounded" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Empresa de Transporte Interdepartamental OSASTUR</p>
                    <p className="text-[#9ca3af] text-[11px]">Sistema Web en la Nube &bull; La Paz, Bolivia</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[#9ca3af]">
                  <span>Terminal Central de Buses La Paz</span>
                  <span>&bull;</span>
                  <span>Terminal Bimodal Santa Cruz</span>
                  <span>&bull;</span>
                  <span>Terminal Cochabamba</span>
                </div>
              </div>
            </footer>
          </div>
        )}

        {rolActivo === "AUXILIAR_ABORDAJE" && (() => {
          // Filtrar encomiendas que van en esta unidad
          const encomiendasAnden = encomiendasBD.slice(0, 4);

          return (
            <div className="space-y-6">
              {/* CABECERA OPERATIVA DEL AUXILIAR DE ANDÉN */}
              {/* CABECERA OPERATIVA DEL AUXILIAR DE ANDÉN (REDISEÑO ERGONÓMICO) */}
              <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl space-y-4">
                {/* FILA SUPERIOR: TÍTULO Y BOTÓN DE CÁMARA QR */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#1e261e]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#1d3319] border border-[#355c2d] text-[#a3e635]">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Control Operativo en Andén: Validación QR y Carga de Bodega
                      </h2>
                      <p className="text-xs text-[#9ca3af]">
                        Auxiliar en Puerta &bull; Unidad Placa: <strong className="text-white">{busAsignado.placa}</strong> &bull; Andén: <strong className="text-[#a3e635]">{salidaSeleccionada.andenSalida || "Andén #2"}</strong> &bull; Salida: <strong className="text-amber-400">{salidaSeleccionada.horaSalida} hrs</strong>
                      </p>
                    </div>
                  </div>

                  {/* BOTÓN CÁMARA QR BIEN UBICADO CON ACCESO RÁPIDO */}
                  <button
                    type="button"
                    onClick={() => {
                      setModalCamaraAbierto(true);
                      activarCamaraReal();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#3d7912] hover:bg-[#31620e] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all active:scale-95 border border-emerald-500/40"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    Escanear con Cámara QR
                  </button>
                </div>

                {/* FILA INFERIOR (DEBAJO DEL TÍTULO): PESTAÑAS DE OPERACIÓN OPERATIVA */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex bg-[#090c09] p-1.5 rounded-xl border border-[#1e261e] text-xs w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setSubpestanaAuxiliar("ABORDAJE_ORIGEN")}
                      className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                        subpestanaAuxiliar === "ABORDAJE_ORIGEN"
                          ? "bg-[#3d7912] text-white shadow-md"
                          : "text-[#9ca3af] hover:text-white hover:bg-[#141c14]"
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      1. Embarque de Pasajeros & Estiba en Origen
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubpestanaAuxiliar("LLEGADA_DESTINO")}
                      className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                        subpestanaAuxiliar === "LLEGADA_DESTINO"
                          ? "bg-[#3d7912] text-white shadow-md"
                          : "text-[#9ca3af] hover:text-white hover:bg-[#141c14]"
                      }`}
                    >
                      <Package className="w-4 h-4 text-amber-400" />
                      2. Llegada & Entrega de Carga en Destino
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-[#a3e635] hidden md:inline">
                    Terminal Activa: <strong className="text-white">{salidaSeleccionada.terminalSalida || salidaSeleccionada.origen}</strong>
                  </span>
                </div>
              </div>

              {/* GRID PRINCIPAL: LADO IZQUIERDO (ESCANER Y BODEGA) / LADO DERECHO (CROQUIS EN VIVO) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 flex flex-col gap-4">
                  {/* TARJETA 1: ESCANEO Y ENTRADA DE BOLETOS */}
                  <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-[#1e261e] pb-3">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-[#a3e635]" />
                        <h3 className="font-bold text-white text-sm">Escaneo de Boletos en Puerta</h3>
                      </div>
                      <span className="text-[10px] bg-[#182418] text-[#a3e635] border border-[#2d4722] px-2 py-0.5 rounded font-mono font-bold">
                        En Línea (Neon DB)
                      </span>
                    </div>

                    <p className="text-xs text-[#9ca3af]">
                      Escanee el código QR del boleto impreso / celular, o ingrese el código/asiento (ej. <strong className="text-white">V1</strong>, <strong className="text-white">P2</strong> o <strong className="text-white">TKT-V1</strong>):
                    </p>

                    {/* FORMULARIO SCANNER / INGRESO RÁPIDO */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        procesarAbordaje(inputCodigoQR);
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={inputCodigoQR}
                        onChange={(e) => setInputCodigoQR(e.target.value)}
                        placeholder="Ej. V1, P2 o TKT-P1"
                        className="flex-1 bg-[#090c09] border border-[#273427] text-sm px-3.5 py-2.5 rounded-xl font-mono text-white focus:outline-none focus:border-[#3d7912]"
                      />
                      <button
                        type="submit"
                        className="bg-[#3d7912] hover:bg-[#31620e] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        Validar
                      </button>
                    </form>

                    

                    {/* MENSAJE DE RESULTADO DEL ESCANEO */}
                    {mensajeScan && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                          mensajeScan.tipo === "exito"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : mensajeScan.tipo === "error"
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        }`}
                      >
                        {mensajeScan.tipo === "exito" ? (
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                        )}
                        <p className="font-semibold">{mensajeScan.texto}</p>
                      </div>
                    )}

                    {/* ACCESO RÁPIDO A BOLETOS VENDIDOS PARA PRUEBA INMEDIATA */}
                    <div className="border-t border-[#1e261e] pt-3">
                      <p className="text-[10px] text-[#9ca3af] uppercase font-mono mb-2">Boletos Emitidos para esta Flota:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {croquis
                          .filter((a) => a.estado === "VENDIDO" || a.estado === "ABORDAJE_CONFIRMADO")
                          .slice(0, 6)
                          .map((a) => (
                            <button
                              key={a.numero}
                              type="button"
                              onClick={() => procesarAbordaje(a.codigoAsiento)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all flex items-center gap-1 ${
                                a.abordado
                                  ? "bg-emerald-950/60 border-emerald-700/50 text-emerald-300 line-through"
                                  : "bg-[#090c09] hover:bg-[#152015] border-[#273427] text-[#f8fafc]"
                              }`}
                            >
                              <Ticket className="w-3 h-3 text-[#a3e635]" />
                              {a.codigoAsiento} ({a.columnaTipo})
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* MÉTRICAS DE ANDÉN */}
                    <div className="grid grid-cols-3 gap-2 border-t border-[#1e261e] pt-3">
                      <div className="bg-[#090c09] p-2.5 rounded-xl border border-[#1e261e] text-center">
                        <p className="text-[10px] text-[#9ca3af] uppercase font-mono">Vendidos</p>
                        <p className="text-lg font-bold text-white">{totalVendidos}</p>
                      </div>
                      <div className="bg-[#090c09] p-2.5 rounded-xl border border-[#1e261e] text-center">
                        <p className="text-[10px] text-emerald-400 uppercase font-mono">Abordaron</p>
                        <p className="text-lg font-bold text-emerald-400">{totalAbordados}</p>
                      </div>
                      <div className="bg-[#090c09] p-2.5 rounded-xl border border-[#1e261e] text-center">
                        <p className="text-[10px] text-rose-400 uppercase font-mono">Faltantes</p>
                        <p className="text-lg font-bold text-rose-400">{pendientes}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-[#9ca3af] mb-1 font-mono">
                        <span>Avance de Abordaje</span>
                        <span className="font-bold text-[#a3e635]">{avance}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#090c09] rounded-full overflow-hidden border border-[#1e261e]">
                        <div
                          className="h-full bg-gradient-to-r from-[#3d7912] to-[#65a30d] transition-all duration-500 rounded-full"
                          style={{ width: `${avance}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* TARJETA 2: GESTIÓN INTEGRAL DE CARGA Y ENCOMIENDAS (ESTIBA Y ENTREGA FINAL EN DESTINO) */}
                  <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1e261e] pb-2">
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-400" />
                        {subpestanaAuxiliar === "ABORDAJE_ORIGEN" 
                          ? "Recepción y Estiba en Bodega (Origen)" 
                          : "Descarga y Entrega de Encomiendas (Destino)"}
                      </h3>
                      <span className="text-[10px] text-[#9ca3af] font-mono">
                        {encomiendasAnden.length} Encomiendas en Unidad
                      </span>
                    </div>

                    {subpestanaAuxiliar === "ABORDAJE_ORIGEN" ? (
                      <p className="text-xs text-[#9ca3af]">
                        Al recibir la carga de ventanilla y subirla al maletero, márquela para registrarla en Neon DB como <strong className="text-[#a3e635]">EN_TRANSITO</strong>:
                      </p>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
                        <Flag className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <strong>Descarga en Terminal de Destino ({salidaSeleccionada.destino}):</strong>
                          <p className="text-[11px] text-[#cbd5e1] mt-0.5">Entregue los paquetes al almacén o destinatario y marque "Confirmar Entrega en Destino". El estado cambiará en base de datos a <strong className="text-emerald-400">ENTREGADO</strong>.</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {encomiendasAnden.map((enc: any) => {
                        const estadoActual = encomiendasVerificadasAuxiliar[enc.id] !== undefined
                          ? (encomiendasVerificadasAuxiliar[enc.id] ? "EN_TRANSITO" : "REGISTRADO")
                          : (enc.estado || "REGISTRADO");

                        const esEntregado = estadoActual === "ENTREGADO";
                        const esEnTransito = estadoActual === "EN_TRANSITO";

                        return (
                          <div
                            key={enc.id}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-all ${
                              esEntregado
                                ? "bg-emerald-950/40 border-emerald-500/50 text-[#e2e8f0]"
                                : esEnTransito
                                ? "bg-[#142014] border-[#2d4722] text-[#e2e8f0]"
                                : "bg-[#090c09] border-[#1e261e] text-[#cbd5e1]"
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white">{enc.codigoGuia}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                                  {enc.pesoKg || 12} Kg
                                </span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                  esEntregado ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" :
                                  esEnTransito ? "bg-sky-500/20 text-sky-400 border border-sky-500/40" :
                                  "bg-gray-800 text-gray-300 border border-gray-700"
                                }`}>
                                  {estadoActual}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#9ca3af] mt-1">
                                {enc.descripcion || "Paquete Comercial"} &bull; Destino: <strong className="text-white">{enc.destinoNombre || salidaSeleccionada.destino}</strong>
                              </p>
                              {enc.destinatarioNombre && (
                                <p className="text-[10px] text-[#6b7280]">
                                  Destinatario: {enc.destinatarioNombre} (CI: {enc.destinatarioCi || "N/A"})
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              {subpestanaAuxiliar === "ABORDAJE_ORIGEN" ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const nuevoEstado = esEnTransito ? 'REGISTRADO' : 'EN_TRANSITO';
                                    setEncomiendasVerificadasAuxiliar((prev) => ({ ...prev, [enc.id]: nuevoEstado === 'EN_TRANSITO' }));

                                    try {
                                      await fetch('/api/encomiendas', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          id: enc.id,
                                          estado: nuevoEstado
                                        })
                                      });
                                    } catch (e) {
                                      console.log("Error sync encomienda bodega:", e);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                    esEnTransito
                                      ? "bg-[#3d7912] text-white shadow-sm"
                                      : "bg-[#090c09] hover:bg-[#1a251a] border border-[#273427] text-[#a3e635]"
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {esEnTransito ? "Cargado en Bodega (En Tránsito)" : "Subir a Bodega"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const nuevoEstado = esEntregado ? 'EN_TRANSITO' : 'ENTREGADO';
                                    setEncomiendasVerificadasAuxiliar((prev) => ({ ...prev, [enc.id]: nuevoEstado === 'EN_TRANSITO' }));
                                    // Update state locally in encomiendasBD
                                    setEncomiendasBD((prev) =>
                                      prev.map((item) => (item.id === enc.id ? { ...item, estado: nuevoEstado } : item))
                                    );

                                    try {
                                      await fetch('/api/encomiendas', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          id: enc.id,
                                          estado: nuevoEstado
                                        })
                                      });
                                    } catch (e) {
                                      console.log("Error entrega destino encomienda:", e);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                    esEntregado
                                      ? "bg-emerald-600 text-white shadow-sm"
                                      : "bg-[#182418] hover:bg-[#203020] border border-[#3d7912] text-[#a3e635]"
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {esEntregado ? "Entregado en Destino" : "Confirmar Entrega en Destino"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* PANEL DERECHO: CROQUIS REALISTA DE LA FLOTA CON DETALLE */}
                <div className="lg:col-span-7 bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e261e] pb-3">
                    <div>
                      <h2 className="font-bold text-white text-base flex items-center gap-2">
                        <Bus className="w-5 h-5 text-[#a3e635]" />
                        Croquis Oficial de la Flota ({busAsignado.totalAsientos} Plazas)
                      </h2>
                      <p className="text-xs text-[#9ca3af]">
                        {busAsignado.nombreComercial} &bull; Placa: <strong className="text-white">{busAsignado.placa}</strong>
                      </p>
                    </div>

                    {busAsignado.pisos === 2 && (
                      <div className="flex bg-[#090c09] p-1 rounded-xl border border-[#1e261e] text-xs">
                        <button
                          type="button"
                          onClick={() => setPisoVista(1)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            pisoVista === 1 ? "bg-[#3d7912] text-white shadow-sm" : "text-[#9ca3af] hover:text-white"
                          }`}
                        >
                          Planta Baja (8 Camas)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPisoVista(2)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            pisoVista === 2 ? "bg-[#3d7912] text-white shadow-sm" : "text-[#9ca3af] hover:text-white"
                          }`}
                        >
                          Planta Alta (18 Camas)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* LEYENDA */}
                  <div className="flex flex-wrap items-center gap-4 text-xs bg-[#090c09] p-2.5 rounded-xl border border-[#1e261e]">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-400"></span>
                      Abordó al Bus
                    </span>
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className="w-3.5 h-3.5 rounded bg-rose-600 border border-rose-400"></span>
                      Vendido (Falta Abordar)
                    </span>
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className="w-3.5 h-3.5 rounded bg-[#141b14] border border-[#223022]"></span>
                      Disponible
                    </span>
                  </div>

                  {/* CROQUIS VISUAL */}
                  <div className="bg-[#090c09] border border-[#1e261e] rounded-2xl p-6 flex flex-col items-center">
                    <div
                      className={`w-full max-w-md grid gap-2.5 px-4 py-1 text-center text-[10px] font-mono font-bold uppercase text-[#9ca3af] border-b border-[#1e261e] mb-2 ${
                        esTresColumnas ? "grid-cols-3" : "grid-cols-4"
                      }`}
                    >
                      {esTresColumnas ? (
                        <>
                          <div className="text-emerald-400">VENTANA</div>
                          <div className="text-amber-400">PASILLO</div>
                          <div className="text-emerald-400">VENTANA</div>
                        </>
                      ) : (
                        <>
                          <div className="text-emerald-400">VENTANA</div>
                          <div className="text-amber-400">PASILLO</div>
                          <div className="text-amber-400">PASILLO</div>
                          <div className="text-emerald-400">VENTANA</div>
                        </>
                      )}
                    </div>

                    <div
                      className={`w-full max-w-md grid gap-2.5 ${
                        esTresColumnas ? "grid-cols-3" : "grid-cols-4"
                      }`}
                    >
                      {croquis
                        .filter((a) => a.piso === (busAsignado.pisos === 1 ? 1 : pisoVista))
                        .map((asiento) => {
                          const estaAbordado = asiento.estado === "ABORDAJE_CONFIRMADO" || asiento.abordado;
                          const estaVendidoFalta = asiento.estado === "VENDIDO" && !estaAbordado;

                          return (
                            <button
                              key={asiento.codigoAsiento}
                              type="button"
                              onClick={() => {
                                setAsientoInspeccionado(asiento);
                                if (estaVendidoFalta) {
                                  procesarAbordaje(asiento.codigoAsiento);
                                }
                              }}
                              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                                estaAbordado
                                  ? "bg-emerald-950/80 border-emerald-500/80 text-emerald-200 ring-1 ring-emerald-500 shadow-md shadow-emerald-950/50"
                                  : estaVendidoFalta
                                  ? "bg-rose-950/70 border-rose-600/70 text-rose-200 hover:scale-105"
                                  : "bg-[#141b14] border-[#223022] text-[#6b7280]"
                              }`}
                            >
                              <span className="text-xs font-mono font-bold">{asiento.codigoAsiento}</span>
                              <span className="text-[9px] mt-0.5 font-bold uppercase truncate max-w-[85px] text-center">
                                {estaAbordado ? "ABORDÓ" : estaVendidoFalta ? "FALTA" : "LIBRE"}
                              </span>
                              {asiento.pasajeroNombre && (
                                <span className="text-[8px] text-[#9ca3af] truncate max-w-[85px]">
                                  {asiento.pasajeroNombre.split(" ")[0]}
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              {/* MODAL CON EL ESCÁNER DE CÁMARA QR */}
              {modalCamaraAbierto && (
                <div className="fixed inset-0 z-50 bg-[#090c09]/90 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-[#111611] border border-[#1e261e] rounded-3xl p-5 md:p-6 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1e261e] pb-3">
                      <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-[#a3e635]" />
                        <h3 className="font-bold text-white text-base">Cámara en Vivo para Escaneo QR</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          detenerCamaraReal();
                          setModalCamaraAbierto(false);
                        }}
                        className="text-[#9ca3af] hover:text-white text-xl font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    {/* VISOR CON EL ELEMENTO VIDEO CONECTADO DIRECTAMENTE AL SENSOR DE LA CÁMARA */}
                    <div className="relative aspect-square bg-black rounded-2xl overflow-hidden border border-[#273427] flex items-center justify-center">
                      <video
                        ref={videoCamaraRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* ENCUADRE ÓPTICO LÁSER SUPERPUESTO */}
                      <div className="absolute inset-8 border-2 border-[#a3e635] rounded-2xl pointer-events-none flex items-center justify-center shadow-lg">
                        <div className="w-full h-0.5 bg-[#a3e635] animate-pulse shadow-md shadow-emerald-400"></div>
                      </div>

                      {errorCamaraHardware ? (
                        <div className="absolute inset-4 bg-black/85 rounded-xl p-4 flex flex-col items-center justify-center text-center text-xs space-y-2 text-rose-300">
                          <AlertTriangle className="w-8 h-8 text-rose-400" />
                          <p className="font-bold">{errorCamaraHardware}</p>
                          <p className="text-[11px] text-[#9ca3af]">
                            Habilite los permisos de cámara en Chrome o seleccione un boleto de la lista inferior.
                          </p>
                        </div>
                      ) : (
                        <p className="absolute bottom-3 text-[11px] text-white font-mono z-10 bg-black/70 px-3 py-1 rounded-full border border-white/20">
                          Apunte al código QR del pasajero
                        </p>
                      )}
                    </div>

                    {/* DETECCIÓN RÁPIDA DE BOLETOS VENDIDOS PARA VALIDACIÓN INMEDIATA */}
                    <div className="space-y-2">
                      <p className="text-[11px] text-[#9ca3af] font-mono">Boletos emitidos listos para validar:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {croquis
                          .filter((a) => (a.estado === "VENDIDO" || a.estado === "ABORDAJE_CONFIRMADO") && !a.abordado)
                          .slice(0, 4)
                          .map((a) => (
                            <button
                              key={a.codigoAsiento}
                              type="button"
                              onClick={() => {
                                procesarAbordaje(a.codigoAsiento);
                                detenerCamaraReal();
                                setModalCamaraAbierto(false);
                              }}
                              className="p-2.5 rounded-xl bg-[#142014] hover:bg-[#1a2c1a] border border-[#2d4722] text-[#a3e635] text-xs font-bold flex items-center justify-between transition-colors shadow-sm"
                            >
                              <span>Plaza {a.codigoAsiento}</span>
                              <Check className="w-4 h-4" />
                            </button>
                          ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        detenerCamaraReal();
                        setModalCamaraAbierto(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#090c09] hover:bg-[#151c15] text-[#9ca3af] hover:text-white border border-[#1e261e] text-xs font-semibold transition-all"
                    >
                      Cerrar Cámara
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ------------------------------------------------------------- */}
        {/* VISTA 2: VENTAS (BOLETERÍA)                                   */}
        {/* ------------------------------------------------------------- */}
        {(rolActivo === "VENTAS" || rolActivo === "BOLETERO") && (() => {
          // Determinar ciudad base del usuario operador (ej: Cochabamba, La Paz, Santa Cruz, etc.)
          const ciudadBaseUsuario = (usuarioAutenticado?.terminal || "").toLowerCase();
          const viajesUsuario = viajesBD.filter((v) => {
            if (!ciudadBaseUsuario) return true;
            const orig = (v.origenDepto || v.origenNombre || "").toLowerCase();
            return ciudadBaseUsuario.includes(orig) || orig.includes(ciudadBaseUsuario);
          });
          const viajesDisponibles = viajesUsuario.length > 0 ? viajesUsuario : viajesBD;

          // Listas dinámicas únicas según los viajes disponibles en la terminal
          const destinosDisponibles = Array.from(new Set(viajesDisponibles.map((v) => v.destinoDepto || v.destinoNombre))).filter(Boolean);
          const tiposBusesDisponibles = Array.from(new Set(viajesDisponibles.map((v) => v.tipoFlota))).filter(Boolean);

          // Filtrado en cascada automático e inmediato por las 4 condiciones (Destino, Tipo de Flota, Fecha/Día, Horario)
          const viajesFiltrados = viajesDisponibles.filter((v) => {
            const dest = v.destinoDepto || v.destinoNombre;
            const fechaSalidaISO = new Date(v.fechaHoraSalida).toISOString().split('T')[0];
            const horaSalida = new Date(v.fechaHoraSalida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const cumpleDestino = filtroDestinoBoleteria === "TODOS" || dest === filtroDestinoBoleteria;
            const cumpleTipo = filtroTipoBusBoleteria === "TODOS" || v.tipoFlota === filtroTipoBusBoleteria;
            const cumpleFecha = !filtroFechaBoleteria || fechaSalidaISO === filtroFechaBoleteria;
            const cumpleHorario = filtroHorarioBoleteria === "TODOS" || horaSalida === filtroHorarioBoleteria;

            return cumpleDestino && cumpleTipo && cumpleFecha && cumpleHorario;
          });

          // Obtener horarios disponibles filtrados para el select de horarios
          const horariosDisponibles = Array.from(
            new Set(
              viajesDisponibles
                .filter((v) => filtroDestinoBoleteria === "TODOS" || (v.destinoDepto || v.destinoNombre) === filtroDestinoBoleteria)
                .map((v) => new Date(v.fechaHoraSalida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
            )
          ).sort();

          // Cálculos para el Arqueo y Cierre de Caja
          const totalEfectivo = ventasSesion
            .filter((x) => x.metodoPago === "EFECTIVO")
            .reduce((acc, curr) => acc + curr.monto, 0);
          const totalQR = ventasSesion
            .filter((x) => x.metodoPago === "QR")
            .reduce((acc, curr) => acc + curr.monto, 0);
          const totalVentasTurno = totalEfectivo + totalQR;
          const totalEntregarEnCaja = totalEfectivo + montoInicialCaja;

          return (
            <div className="space-y-6">
              {/* NAVEGACIÓN DE SUB-PESTAÑAS EN VENTANILLA: VENTA DE BOLETOS / ARQUEO Y CIERRE DE CAJA */}
              <div className="flex items-center justify-between bg-[#111611] border border-[#1e261e] p-2 rounded-2xl">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSubpestanaVentanilla("VENTA")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      subpestanaVentanilla === "VENTA"
                        ? "bg-[#3d7912] text-white shadow-md shadow-emerald-950/50"
                        : "text-[#9ca3af] hover:text-white hover:bg-[#182218]"
                    }`}
                  >
                    <Ticket className="w-4 h-4 text-[#a3e635]" />
                    Punto de Venta y Croquis
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubpestanaVentanilla("CIERRE_CAJA")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      subpestanaVentanilla === "CIERRE_CAJA"
                        ? "bg-[#3d7912] text-white shadow-md shadow-emerald-950/50"
                        : "text-[#9ca3af] hover:text-white hover:bg-[#182218]"
                    }`}
                  >
                    <Calculator className="w-4 h-4 text-[#a3e635]" />
                    Cierre de Caja y Arqueo Diario
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#182418] text-[#a3e635] border border-[#2d4722]">
                      {ventasSesion.length}
                    </span>
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-3 pr-2 text-xs font-mono">
                  <span className="text-[#9ca3af]">Total Turno:</span>
                  <span className="font-extrabold text-[#a3e635] text-sm">Bs. {totalVentasTurno}.00</span>
                </div>
              </div>

              {/* ========================================================= */}
              {/* PESTAÑA 1: VENTA DE BOLETOS Y CROQUIS                     */}
              {/* ========================================================= */}
              {subpestanaVentanilla === "VENTA" && (
                <div className="space-y-6">
                  {/* PANEL DE BÚSQUEDA Y SELECCIÓN EN CASCADA (DESTINO, FLOTA, FECHA, HORARIO) */}
                  <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-lg space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e261e] pb-3">
                      <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                          <Compass className="w-5 h-5 text-[#a3e635]" />
                          Consulta y Despacho de Pasajes en Ventanilla
                        </h2>
                        <p className="text-xs text-[#9ca3af]">
                          Terminal de Origen: <strong className="text-[#a3e635]">{usuarioAutenticado?.terminal || "Oficina Central"}</strong> &bull; Seleccione los parámetros para ver unidades disponibles
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-white px-2.5 py-1 rounded bg-[#182418] border border-[#2d4722] text-[#a3e635]">
                          {viajesFiltrados.length} {viajesFiltrados.length === 1 ? "Flota Encontrada" : "Flotas Encontradas"}
                        </span>
                      </div>
                    </div>

                    {/* 4 CONTROLES DESPLEGABLES / ENTRADAS PARA FILTRO INSTANTÁNEO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-[#e2e8f0] flex items-center gap-1.5 mb-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#a3e635]" />
                          1. Ciudad Destino:
                        </label>
                        <select
                          value={filtroDestinoBoleteria}
                          onChange={(e) => {
                            const nuevoDestino = e.target.value;
                            setFiltroDestinoBoleteria(nuevoDestino);
                            const match = viajesDisponibles.find((v) => nuevoDestino === "TODOS" || (v.destinoDepto || v.destinoNombre) === nuevoDestino);
                            if (match) cambiarSalida(mapearViajeASalida(match));
                          }}
                          className="w-full bg-[#090c09] border border-[#273427] text-white rounded-xl px-3 py-2 text-xs font-medium focus:border-[#3d7912] outline-none"
                        >
                          <option value="TODOS">-- Todos los Destinos --</option>
                          {destinosDisponibles.map((d: any) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#e2e8f0] flex items-center gap-1.5 mb-1.5">
                          <Bus className="w-3.5 h-3.5 text-[#a3e635]" />
                          2. Tipo de Flota / Servicio:
                        </label>
                        <select
                          value={filtroTipoBusBoleteria}
                          onChange={(e) => {
                            const nuevoTipo = e.target.value;
                            setFiltroTipoBusBoleteria(nuevoTipo);
                            const match = viajesDisponibles.find((v) => 
                              (filtroDestinoBoleteria === "TODOS" || (v.destinoDepto || v.destinoNombre) === filtroDestinoBoleteria) &&
                              (nuevoTipo === "TODOS" || v.tipoFlota === nuevoTipo)
                            );
                            if (match) cambiarSalida(mapearViajeASalida(match));
                          }}
                          className="w-full bg-[#090c09] border border-[#273427] text-white rounded-xl px-3 py-2 text-xs font-medium focus:border-[#3d7912] outline-none"
                        >
                          <option value="TODOS">-- Todos los Servicios --</option>
                          {tiposBusesDisponibles.map((t: any) => (
                            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#e2e8f0] flex items-center gap-1.5 mb-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#a3e635]" />
                          3. Día de Viaje:
                        </label>
                        <input
                          type="date"
                          value={filtroFechaBoleteria}
                          onChange={(e) => setFiltroFechaBoleteria(e.target.value)}
                          className="w-full bg-[#090c09] border border-[#273427] text-white rounded-xl px-3 py-1.5 text-xs font-medium focus:border-[#3d7912] outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#e2e8f0] flex items-center gap-1.5 mb-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#a3e635]" />
                          4. Horario de Salida:
                        </label>
                        <select
                          value={filtroHorarioBoleteria}
                          onChange={(e) => {
                            const nuevoHorario = e.target.value;
                            setFiltroHorarioBoleteria(nuevoHorario);
                            const match = viajesDisponibles.find((v) => {
                              const hora = new Date(v.fechaHoraSalida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              return (filtroDestinoBoleteria === "TODOS" || (v.destinoDepto || v.destinoNombre) === filtroDestinoBoleteria) &&
                                     (nuevoHorario === "TODOS" || hora === nuevoHorario);
                            });
                            if (match) cambiarSalida(mapearViajeASalida(match));
                          }}
                          className="w-full bg-[#090c09] border border-[#273427] text-white rounded-xl px-3 py-2 text-xs font-medium focus:border-[#3d7912] outline-none"
                        >
                          <option value="TODOS">-- Todos los Horarios --</option>
                          {horariosDisponibles.map((h: any) => (
                            <option key={h} value={h}>{h} hrs</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* CRONOGRAMA DE FLOTAS FILTRADAS */}
                    <div>
                      <div className="flex items-center justify-between mb-2 mt-2">
                        <span className="text-xs font-bold text-[#e2e8f0] flex items-center gap-1.5">
                          <Bus className="w-3.5 h-3.5 text-[#a3e635]" />
                          Flotas Disponibles con Salida Inmediata:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFiltroDestinoBoleteria("TODOS");
                            setFiltroTipoBusBoleteria("TODOS");
                            setFiltroFechaBoleteria("");
                            setFiltroHorarioBoleteria("TODOS");
                          }}
                          className="text-[10px] text-[#9ca3af] hover:text-white underline font-mono"
                        >
                          Restablecer todos los filtros
                        </button>
                      </div>

                      {viajesFiltrados.length === 0 ? (
                        <div className="bg-[#090c09] border border-[#1e261e] rounded-xl p-8 text-center text-xs space-y-2">
                          <Bus className="w-8 h-8 mx-auto text-[#273427]" />
                          <p className="text-white font-bold">No se encontraron flotas disponibles para los criterios seleccionados</p>
                          <p className="text-[#9ca3af] text-[11px]">
                            Pruebe cambiando la ciudad de destino, el tipo de servicio o el horario.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {viajesFiltrados.map((v, idx) => {
                            const fSalida = new Date(v.fechaHoraSalida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const fechaSalidaTexto = new Date(v.fechaHoraSalida).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
                            const estaSeleccionado = salidaSeleccionada.id === v.id;
                            const esLeito = v.tipoFlota.includes("LEITO");
                            const esCama = v.tipoFlota.includes("BUS_CAMA");
                            const numAnden = (idx % 6) + 1;

                            return (
                              <div
                                key={v.id}
                                onClick={() => cambiarSalida(mapearViajeASalida(v))}
                                className={`cursor-pointer rounded-xl p-3.5 border transition-all relative ${
                                  estaSeleccionado
                                    ? "bg-[#182418] border-[#65a30d] ring-1 ring-[#65a30d] shadow-md shadow-emerald-950/40"
                                    : "bg-[#090c09] hover:bg-[#121812] border-[#1e261e] hover:border-[#2f422f]"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-black text-white font-mono flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-[#a3e635]" />
                                    {fSalida} hrs
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    esLeito
                                      ? "bg-amber-950/70 text-amber-300 border border-amber-800/60"
                                      : esCama
                                      ? "bg-[#1f3818] text-[#a3e635] border border-[#3d7912]/60"
                                      : "bg-slate-800 text-slate-300 border border-slate-700"
                                  }`}>
                                    {v.tipoFlota.replace(/_/g, ' ')}
                                  </span>
                                </div>

                                <div className="mt-2">
                                  <p className="text-xs font-bold text-white flex items-center gap-1">
                                    {v.origenDepto || v.origenNombre} <ArrowRight className="w-3 h-3 text-[#9ca3af]" /> {v.destinoDepto || v.destinoNombre}
                                  </p>
                                  <div className="flex items-center justify-between text-[11px] text-[#9ca3af] mt-1 font-mono">
                                    <span>Placa: <strong className="text-[#f8fafc]">{v.placa}</strong></span>
                                    <span className="bg-[#152015] text-[#a3e635] border border-[#2d4722] px-1.5 py-0.2 rounded font-bold">
                                      Andén #{numAnden}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-[#9ca3af] mt-0.5 font-mono">
                                    Fecha: {fechaSalidaTexto} &bull; Plazas: {v.totalAsientos}
                                  </p>
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-[#1e261e] flex items-center justify-between text-xs">
                                  <span className="text-[#9ca3af] text-[10px]">Tarifa Pasaje:</span>
                                  <span className="font-extrabold text-amber-400 font-mono">Bs. {v.precioBasePiso1 || 160}</span>
                                </div>

                                {estaSeleccionado && (
                                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#a3e635] animate-pulse"></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CROQUIS DE VENTA Y LÍNEA DE TIEMPO DEL PROCESO DE VENTA */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* CROQUIS DE ASIENTOS CON CLIC EN ASIENTO OCUPADO PARA REIMPRIMIR */}
                    <div className="lg:col-span-7 xl:col-span-8 bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e261e] pb-3">
                        <div>
                          <h2 className="font-bold text-white text-base flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-[#a3e635]" />
                            Venta de Pasajes &bull; {busAsignado.nombreComercial}
                          </h2>
                          <p className="text-xs text-[#9ca3af]">
                            Ruta: <strong className="text-white">{salidaSeleccionada.origen} &rarr; {salidaSeleccionada.destino}</strong> &bull; Salida: <strong className="text-amber-400">{salidaSeleccionada.horaSalida} hrs</strong> &bull; Placa: <strong className="text-white">{busAsignado.placa}</strong>
                          </p>
                        </div>

                        {busAsignado.pisos === 2 && (
                          <div className="flex bg-[#090c09] p-1 rounded-xl border border-[#1e261e] text-xs">
                            <button
                              onClick={() => setPisoVista(1)}
                              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                pisoVista === 1
                                  ? "bg-[#3d7912] text-white shadow-sm"
                                  : "text-[#9ca3af] hover:text-white"
                              }`}
                            >
                              Planta Baja (8 Camas)
                            </button>
                            <button
                              onClick={() => setPisoVista(2)}
                              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                pisoVista === 2
                                  ? "bg-[#3d7912] text-white shadow-sm"
                                  : "text-[#9ca3af] hover:text-white"
                              }`}
                            >
                              Planta Alta (18 Camas)
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="bg-[#090c09] border border-[#1e261e] rounded-2xl p-6 flex flex-col items-center">
                        <div
                          className={`w-full max-w-md grid gap-2.5 px-4 py-1 text-center text-[10px] font-mono font-bold uppercase text-[#9ca3af] border-b border-[#1e261e] mb-2 ${
                            esTresColumnas ? "grid-cols-3" : "grid-cols-4"
                          }`}
                        >
                          {esTresColumnas ? (
                            <>
                              <div className="text-emerald-400">VENTANA</div>
                              <div className="text-amber-400">PASILLO</div>
                              <div className="text-emerald-400">VENTANA</div>
                            </>
                          ) : (
                            <>
                              <div className="text-emerald-400">VENTANA</div>
                              <div className="text-amber-400">PASILLO</div>
                              <div className="text-amber-400">PASILLO</div>
                              <div className="text-emerald-400">VENTANA</div>
                            </>
                          )}
                        </div>

                        <div
                          className={`w-full max-w-md grid gap-2.5 ${
                            esTresColumnas ? "grid-cols-3" : "grid-cols-4"
                          }`}
                        >
                          {croquis
                            .filter((a) => a.piso === (busAsignado.pisos === 1 ? 1 : pisoVista))
                            .map((asiento) => {
                              const disponible = asiento.estado === "DISPONIBLE";
                              const seleccionado = asientoVenta?.codigoAsiento === asiento.codigoAsiento;

                              return (
                                <button
                                  key={asiento.codigoAsiento}
                                  onClick={() => {
                                    if (disponible) {
                                      setAsientoVenta(asiento);
                                      setEtapaVenta(1);
                                    } else {
                                      // ASIENTO OCUPADO (ROJO): ABRIR REIMPRESIÓN INMEDIATA DEL TICKET
                                      const ticketReimpresion = {
                                        codigo: asiento.boletoCodigo || `TKT-${asiento.codigoAsiento}`,
                                        asiento: asiento.codigoAsiento,
                                        nombre: asiento.pasajeroNombre || "PASAJERO REGISTRADO",
                                        ci: asiento.pasajeroCI || "DOC-CONFIRMADO",
                                        telefono: "S/TEL",
                                        origen: salidaSeleccionada.origen,
                                        destino: salidaSeleccionada.destino,
                                        horaSalida: salidaSeleccionada.horaSalida,
                                        terminalSalida: salidaSeleccionada.terminalSalida,
                                        busTipo: busAsignado.nombreComercial,
                                        placa: busAsignado.placa,
                                        precio: asiento.tarifa || salidaSeleccionada.tarifa,
                                        fechaEmision: new Date().toLocaleDateString("es-BO") + " (Reimpresión Oficial)"
                                      };
                                      setModalImpresionBoleto(ticketReimpresion);
                                    }
                                  }}
                                  title={disponible ? `Seleccionar plaza ${asiento.codigoAsiento}` : `Asiento ${asiento.codigoAsiento} VENDIDO - Clic para ver / reimprimir ticket`}
                                  className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                                    seleccionado
                                      ? "bg-[#3d7912] text-white border-[#a3e635] ring-2 ring-[#a3e635] scale-105 shadow-md shadow-emerald-950/60"
                                      : disponible
                                      ? "bg-[#141b14] hover:bg-[#1a241a] text-[#f8fafc] border-[#223022] hover:border-[#4d8f1e]"
                                      : "bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-900/60 cursor-pointer"
                                  }`}
                                >
                                  <span className="text-xs font-mono font-bold">{asiento.codigoAsiento}</span>
                                  <span className="text-[10px] mt-0.5">
                                    {seleccionado ? "ELEGIDO" : disponible ? `Bs. ${asiento.tarifa}` : "VER TICKET"}
                                  </span>
                                </button>
                              );
                            })}
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#1e261e] flex flex-wrap items-center justify-center gap-6 text-xs text-[#9ca3af]">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-[#141b14] border border-[#223022]"></span>
                            Disponible (Venta)
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-rose-950 border border-rose-800"></span>
                            Ocupado (Clic para reimprimir)
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-[#3d7912] border border-[#a3e635]"></span>
                            Seleccionado en curso
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA DERECHA: LÍNEA DE TIEMPO DEL PROCESO DE VENTA (1 -> 2 -> 3 -> 4) */}
                    <div className="lg:col-span-5 xl:col-span-4 bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                      {/* HEADER LÍNEA DE TIEMPO */}
                      <div>
                        <h3 className="font-bold text-white text-base flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-[#a3e635]" />
                          Proceso de Venta y Emisión
                        </h3>
                        <p className="text-xs text-[#9ca3af]">
                          {asientoVenta ? `Plaza ${asientoVenta.codigoAsiento} seleccionada` : "Seleccione un asiento disponible en el croquis"}
                        </p>
                      </div>

                      {/* LÍNEA DE TIEMPO VISUAL CON 4 PASOS */}
                      <div className="grid grid-cols-4 gap-1 border-b border-[#1e261e] pb-3 text-center">
                        <div className={`p-1.5 rounded-lg border text-[10px] font-bold ${etapaVenta >= 1 ? "bg-[#182418] border-[#3d7912] text-[#a3e635]" : "bg-[#090c09] border-[#1e261e] text-[#6b7280]"}`}>
                          1. Datos
                        </div>
                        <div className={`p-1.5 rounded-lg border text-[10px] font-bold ${etapaVenta >= 2 ? "bg-[#182418] border-[#3d7912] text-[#a3e635]" : "bg-[#090c09] border-[#1e261e] text-[#6b7280]"}`}>
                          2. Pago
                        </div>
                        <div className={`p-1.5 rounded-lg border text-[10px] font-bold ${etapaVenta >= 3 ? "bg-[#182418] border-[#3d7912] text-[#a3e635]" : "bg-[#090c09] border-[#1e261e] text-[#6b7280]"}`}>
                          3. Ticket
                        </div>
                        <div className={`p-1.5 rounded-lg border text-[10px] font-bold ${etapaVenta >= 4 ? "bg-[#182418] border-[#3d7912] text-[#a3e635]" : "bg-[#090c09] border-[#1e261e] text-[#6b7280]"}`}>
                          4. Éxito
                        </div>
                      </div>

                      {asientoVenta ? (
                        <div className="space-y-4">
                          {/* RESUMEN DE LA PLAZA */}
                          <div className="p-3 bg-[#152015] border border-[#2d4722] rounded-xl flex justify-between items-center">
                            <div>
                              <p className="text-[10px] text-[#a3e635] font-mono uppercase">
                                Plaza {asientoVenta.codigoAsiento} ({asientoVenta.columnaTipo})
                              </p>
                              <p className="text-xs text-[#9ca3af]">
                                {salidaSeleccionada.origen} &rarr; {salidaSeleccionada.destino} ({salidaSeleccionada.horaSalida} hrs)
                              </p>
                            </div>
                            <span className="text-lg font-black text-amber-400 font-mono">Bs. {asientoVenta.tarifa}</span>
                          </div>

                          {/* ======================================================== */}
                          {/* PASO 1: DATOS PARA EL BOLETO Y FACTURA                   */}
                          {/* ======================================================== */}
                          {etapaVenta === 1 && (
                            <div className="space-y-3 text-xs">
                              <div>
                                <label className="text-[#9ca3af] block mb-1">Nombre Completo del Pasajero:</label>
                                <input
                                  type="text"
                                  required
                                  value={formVenta.nombre}
                                  onChange={(e) => setFormVenta({ ...formVenta, nombre: e.target.value })}
                                  placeholder="Ej. Mario Gutierrez Quispe"
                                  className="w-full bg-[#090c09] border border-[#273427] px-3 py-2 rounded-lg text-white outline-none focus:border-[#3d7912]"
                                />
                              </div>

                              <div>
                                <label className="text-[#9ca3af] block mb-1">Cédula de Identidad (CI):</label>
                                <input
                                  type="text"
                                  required
                                  value={formVenta.ci}
                                  onChange={(e) => setFormVenta({ ...formVenta, ci: e.target.value })}
                                  placeholder="Ej. 7192834 LP"
                                  className="w-full bg-[#090c09] border border-[#273427] px-3 py-2 rounded-lg text-white outline-none focus:border-[#3d7912]"
                                />
                              </div>

                              <div>
                                <label className="text-[#9ca3af] block mb-1">Teléfono Móvil:</label>
                                <input
                                  type="text"
                                  value={formVenta.telefono}
                                  onChange={(e) => setFormVenta({ ...formVenta, telefono: e.target.value })}
                                  placeholder="Ej. 77218391"
                                  className="w-full bg-[#090c09] border border-[#273427] px-3 py-2 rounded-lg text-white outline-none focus:border-[#3d7912]"
                                />
                              </div>

                              {/* DATOS DE FACTURA OPCIONAL */}
                              <div className="pt-2 border-t border-[#1e261e]">
                                <label className="flex items-center gap-2 cursor-pointer text-white font-medium mb-2">
                                  <input
                                    type="checkbox"
                                    checked={requiereFactura}
                                    onChange={(e) => setRequiereFactura(e.target.checked)}
                                    className="rounded border-[#273427] text-[#3d7912] focus:ring-0"
                                  />
                                  <span>¿Requiere Factura con NIT / Razón Social?</span>
                                </label>

                                {requiereFactura && (
                                  <div className="space-y-2 p-2.5 bg-[#090c09] rounded-xl border border-[#1e261e]">
                                    <input
                                      type="text"
                                      placeholder="Razón Social / Nombre Factura"
                                      value={datosFactura.razonSocial}
                                      onChange={(e) => setDatosFactura({ ...datosFactura, razonSocial: e.target.value })}
                                      className="w-full bg-[#111611] border border-[#273427] px-2.5 py-1.5 rounded-lg text-white text-xs outline-none"
                                    />
                                    <input
                                      type="text"
                                      placeholder="NIT / C.I. Factura"
                                      value={datosFactura.nit}
                                      onChange={(e) => setDatosFactura({ ...datosFactura, nit: e.target.value })}
                                      className="w-full bg-[#111611] border border-[#273427] px-2.5 py-1.5 rounded-lg text-white text-xs outline-none"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2 mt-4">
                                <button
                                  type="button"
                                  disabled={!formVenta.nombre || !formVenta.ci}
                                  onClick={() => setEtapaVenta(2)}
                                  className="w-full bg-[#3d7912] hover:bg-[#31620e] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                  Siguiente: Método de Pago <ArrowRight className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAsientoVenta(null);
                                    setFormVenta({ nombre: "", ci: "", telefono: "" });
                                    setEtapaVenta(1);
                                  }}
                                  className="w-full py-1.5 text-[11px] text-[#9ca3af] hover:text-red-400 font-medium transition-colors"
                                >
                                  Cancelar Selección de Plaza
                                </button>
                              </div>
                            </div>
                          )}

                          {/* ======================================================== */}
                          {/* PASO 2: TIPO DE PAGO (EFECTIVO O QR)                     */}
                          {/* ======================================================== */}
                          {etapaVenta === 2 && (
                            <div className="space-y-4 text-xs">
                              <div>
                                <label className="text-[#9ca3af] block mb-2 font-bold">Seleccione Modalidad de Cobro:</label>
                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setMetodoPagoVenta("EFECTIVO")}
                                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                                      metodoPagoVenta === "EFECTIVO"
                                        ? "bg-[#182418] border-[#a3e635] text-white ring-1 ring-[#a3e635]"
                                        : "bg-[#090c09] border-[#1e261e] text-[#9ca3af] hover:text-white"
                                    }`}
                                  >
                                    <Banknote className="w-5 h-5 text-[#a3e635]" />
                                    <span className="font-bold">Pago en Efectivo</span>
                                    <span className="text-[10px] text-[#9ca3af]">Ingreso a Caja Física</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setMetodoPagoVenta("QR")}
                                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                                      metodoPagoVenta === "QR"
                                        ? "bg-[#182418] border-[#a3e635] text-white ring-1 ring-[#a3e635]"
                                        : "bg-[#090c09] border-[#1e261e] text-[#9ca3af] hover:text-white"
                                    }`}
                                  >
                                    <QrCode className="w-5 h-5 text-sky-400" />
                                    <span className="font-bold">Pago por QR Simple</span>
                                    <span className="text-[10px] text-[#9ca3af]">Transferencia Bancaria</span>
                                  </button>
                                </div>
                              </div>

                              {metodoPagoVenta === "EFECTIVO" ? (
                                <div className="p-3 bg-[#090c09] border border-[#1e261e] rounded-xl space-y-1">
                                  <div className="flex justify-between text-white font-mono">
                                    <span>Monto a Cobrar:</span>
                                    <strong className="text-amber-400">Bs. {asientoVenta.tarifa}.00</strong>
                                  </div>
                                  <p className="text-[11px] text-[#9ca3af]">Reciba los billetes en ventanilla y entregue el cambio respectivo.</p>
                                </div>
                              ) : (
                                <div className="p-3 bg-[#090c09] border border-[#1e261e] rounded-xl flex items-center gap-3">
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=COBRO-OSASTUR-BS-${asientoVenta.tarifa}`}
                                    alt="QR Cobro"
                                    className="w-16 h-16 rounded-lg bg-white p-1"
                                  />
                                  <div>
                                    <p className="font-bold text-white text-xs">QR Banco Unión / Fassil</p>
                                    <p className="text-[10px] text-[#a3e635] font-mono">Total: Bs. {asientoVenta.tarifa}.00</p>
                                    <p className="text-[10px] text-[#9ca3af]">El pasajero debe escanear y mostrar la pantalla de confirmación.</p>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2 pt-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEtapaVenta(1)}
                                    className="w-1/3 bg-[#090c09] hover:bg-[#151c15] text-[#9ca3af] hover:text-white py-2.5 rounded-xl border border-[#1e261e] transition-all"
                                  >
                                    Atrás
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEtapaVenta(3)}
                                    className="w-2/3 bg-[#3d7912] hover:bg-[#31620e] text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                                  >
                                    Confirmar y Previsualizar <ArrowRight className="w-4 h-4" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setAsientoVenta(null);
                                    setFormVenta({ nombre: "", ci: "", telefono: "" });
                                    setEtapaVenta(1);
                                  }}
                                  className="w-full py-2 rounded-xl bg-red-950/30 hover:bg-red-950/60 border border-red-900/50 text-red-300 hover:text-red-200 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5"
                                >
                                  Cancelar Compra y Liberar Asiento
                                </button>
                              </div>
                            </div>
                          )}

                          {/* ======================================================== */}
                          {/* PASO 3: PREVISUALIZACIÓN E IMPRESIÓN DEL TICKET         */}
                          {/* ======================================================== */}
                          {etapaVenta === 3 && (
                            <div className="space-y-4 text-xs">
                              <div className="p-3 bg-[#090c09] border border-[#1e261e] rounded-xl space-y-2">
                                <p className="font-bold text-white text-xs flex items-center gap-1.5">
                                  <Receipt className="w-4 h-4 text-[#a3e635]" />
                                  Resumen del Boleto a Emitir:
                                </p>
                                <div className="space-y-1 font-mono text-[11px] text-[#e2e8f0]">
                                  <div className="flex justify-between">
                                    <span className="text-[#9ca3af]">Pasajero:</span>
                                    <strong className="text-white uppercase">{formVenta.nombre}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#9ca3af]">C.I.:</span>
                                    <span>{formVenta.ci}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#9ca3af]">Plaza / Asiento:</span>
                                    <strong className="text-amber-400">{asientoVenta.codigoAsiento}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#9ca3af]">Método de Pago:</span>
                                    <strong className="text-[#a3e635]">{metodoPagoVenta}</strong>
                                  </div>
                                  {requiereFactura && (
                                    <div className="flex justify-between text-[10px] text-amber-300 pt-1 border-t border-[#1e261e]">
                                      <span>Factura NIT: {datosFactura.nit || formVenta.ci}</span>
                                      <span>R.S.: {datosFactura.razonSocial || formVenta.nombre}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEtapaVenta(2)}
                                  className="w-1/3 bg-[#090c09] hover:bg-[#151c15] text-[#9ca3af] hover:text-white py-2.5 rounded-xl border border-[#1e261e] transition-all"
                                >
                                  Atrás
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const codBoleto = `TKT-${asientoVenta.codigoAsiento}`;
                                    const nuevo = croquis.map((a) =>
                                      a.codigoAsiento === asientoVenta.codigoAsiento
                                        ? {
                                            ...a,
                                            estado: "VENDIDO" as const,
                                            pasajeroNombre: formVenta.nombre,
                                            pasajeroCI: formVenta.ci,
                                            boletoCodigo: codBoleto,
                                            abordado: false
                                          }
                                        : a
                                    );
                                    setCroquis(nuevo);

                                    const infoBoleto = {
                                      codigo: codBoleto,
                                      asiento: asientoVenta.codigoAsiento,
                                      nombre: formVenta.nombre,
                                      ci: formVenta.ci || "S/CI",
                                      telefono: formVenta.telefono || "S/TEL",
                                      origen: salidaSeleccionada.origen,
                                      destino: salidaSeleccionada.destino,
                                      horaSalida: salidaSeleccionada.horaSalida,
                                      terminalSalida: salidaSeleccionada.terminalSalida,
                                      busTipo: busAsignado.nombreComercial,
                                      placa: busAsignado.placa,
                                      precio: asientoVenta.tarifa || salidaSeleccionada.tarifa,
                                      fechaEmision: new Date().toLocaleDateString("es-BO") + " " + new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })
                                    };

                                    setVentaConfirmada(infoBoleto);
                                    setModalImpresionBoleto(infoBoleto);

                                    // Registrar en el arqueo de ventas de la sesión
                                    const nuevaVenta = {
                                      codigo: codBoleto,
                                      asiento: asientoVenta.codigoAsiento,
                                      nombre: formVenta.nombre,
                                      ci: formVenta.ci,
                                      monto: asientoVenta.tarifa || salidaSeleccionada.tarifa,
                                      metodoPago: metodoPagoVenta,
                                      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                      destino: salidaSeleccionada.destino,
                                      placa: busAsignado.placa
                                    };
                                    setVentasSesion((prev) => [nuevaVenta, ...prev]);

                                    // Persistencia Neon DB
                                    try {
                                      fetch('/api/boletos', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          viajeId: salidaSeleccionada.id || "viaje-001",
                                          numeroAsiento: asientoVenta.numero,
                                          piso: asientoVenta.piso,
                                          nombrePasajero: formVenta.nombre,
                                          ciPasajero: formVenta.ci,
                                          telefono: formVenta.telefono,
                                          precioPagado: asientoVenta.tarifa || salidaSeleccionada.tarifa
                                        })
                                      });
                                    } catch (e) {
                                      console.log("Sync boleto:", e);
                                    }

                                    setEtapaVenta(4);
                                  }}
                                  className="w-2/3 bg-[#3d7912] hover:bg-[#31620e] text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                                >
                                  <Printer className="w-4 h-4" />
                                  Emitir e Imprimir Ticket
                                </button>
                              </div>
                            </div>
                          )}

                          {/* ======================================================== */}
                          {/* PASO 4: COMPRA EXITOSA                                   */}
                          {/* ======================================================== */}
                          {etapaVenta === 4 && ventaConfirmada && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 space-y-3">
                              <div>
                                <p className="font-bold flex items-center gap-1.5 text-sm">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ¡Compra Exitosa y Boleto Emitido!
                                </p>
                                <p className="mt-1 font-mono text-white font-bold text-sm">Boleto Nº: {ventaConfirmada.codigo}</p>
                                <p className="text-[11px] text-[#e2e8f0]">
                                  Pasajero: <strong>{ventaConfirmada.nombre}</strong> &bull; Asiento: <strong className="text-amber-400">{ventaConfirmada.asiento}</strong>
                                </p>
                                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                                  ✓ Asiento reservado y transmitido en tiempo real a Andén.
                                </p>
                              </div>

                              <div className="flex flex-col gap-2 pt-2 border-t border-emerald-500/20">
                                <button
                                  type="button"
                                  onClick={() => setModalImpresionBoleto(ventaConfirmada)}
                                  className="w-full bg-[#488810] hover:bg-[#3a6f0d] text-white py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all text-xs"
                                >
                                  <Printer className="w-4 h-4" />
                                  Reimprimir Boleto Térmico (80mm)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAsientoVenta(null);
                                    setFormVenta({ nombre: "", ci: "", telefono: "" });
                                    setEtapaVenta(1);
                                  }}
                                  className="w-full bg-[#090c09] hover:bg-[#151c15] text-[#9ca3af] hover:text-white py-2 px-3 rounded-xl font-medium border border-[#1e261e] text-xs transition-all"
                                >
                                  Vender Siguiente Boleto
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-slate-500 text-xs">
                          <Ticket className="w-8 h-8 mx-auto mb-2 text-[#2d4722]" />
                          <p>Haga clic en una plaza disponible en el croquis para iniciar el proceso de emisión.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* PESTAÑA 2: CIERRE DE CAJA Y ARQUEO DE VENTANILLA          */}
              {/* ========================================================= */}
              {/* ========================================================= */}
              {/* PESTAÑA 2: ACTA OFICIAL DE ARQUEO Y CIERRE CONTABLE       */}
              {/* ========================================================= */}
              {subpestanaVentanilla === "CIERRE_CAJA" && (
                <div className="space-y-6">
                  {/* BARRA DE ACCIÓN Y ESTADO (NO SE IMPRIME) */}
                  <div className="no-print bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-emerald-400" />
                        Acta de Arqueo y Rendición de Caja de Ventanilla
                      </h2>
                      <p className="text-xs text-[#9ca3af]">
                        Operador: <strong className="text-white">{usuarioAutenticado?.nombre}</strong> &bull; Sucursal: <strong className="text-emerald-400">{usuarioAutenticado?.terminal}</strong> &bull; Fecha: <strong className="text-white">{new Date().toLocaleDateString('es-BO')}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {!cierreRealizado ? (
                        <button
                          type="button"
                          onClick={() => setCierreRealizado(true)}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Consolidar y Efectuar Cierre de Caja
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Cierre Registrado Exitosamente
                          </span>
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                          >
                            <Printer className="w-4 h-4 text-gray-900" />
                            Imprimir Formato Contable (PDF)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DOCUMENTO CONTABLE FORMAL (HOJA BLANCA OFICIAL CON FORMA LEGAL / AUDITORÍA) */}
                  <div id="acta-arqueo-contable" className="hoja-impresion-contable bg-white text-gray-900 rounded-2xl p-8 md:p-10 shadow-2xl border border-gray-300 font-sans max-w-4xl mx-auto space-y-6">
                    
                    {/* ENCABEZADO INSTITUCIONAL CONTABLE */}
                    <div className="border-b-2 border-gray-900 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h1 className="text-lg font-black uppercase tracking-wider text-black font-serif">
                            EMPRESA DE TRANSPORTE INTERDEPARTAMENTAL OSASTUR S.R.L.
                          </h1>
                          <p className="text-[11px] font-mono text-gray-700">NIT: 1028495023 &bull; MATRÍCULA DE COMERCIO: 0029411</p>
                          <p className="text-[11px] text-gray-600">Servicio de Transporte Terrestre Interdepartamental de Pasajeros y Carga</p>
                          <p className="text-[11px] font-bold text-gray-800 uppercase mt-0.5">
                            SUCURSAL / TERMINAL: {usuarioAutenticado?.terminal || "TERMINAL CENTRAL LA PAZ"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block border border-gray-900 px-3 py-1 text-xs font-mono font-bold uppercase bg-gray-100">
                            ACTA DE ARQUEO N° ARQ-{new Date().toISOString().slice(2,10).replace(/-/g, "")}-001
                          </span>
                          <p className="text-[11px] text-gray-600 mt-1 font-mono">
                            FECHA: {new Date().toLocaleDateString("es-BO", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                          <p className="text-[11px] text-gray-600 font-mono">
                            HORA DE CIERRE: {new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono">EXPRESADO EN: BOLIVIANOS (Bs.)</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap justify-between items-center text-xs text-gray-700 gap-2">
                        <div>
                          <strong>RESPONSABLE DE VENTANILLA:</strong> {usuarioAutenticado?.nombre || "Rodrigo Paz Soliz"}
                        </div>
                        <div>
                          <strong>CARGO:</strong> OPERADOR DE BOLETERÍA &bull; <strong>TURNO:</strong> CONTINUO
                        </div>
                      </div>
                    </div>

                    {/* SECCIÓN 1: CUADRO DE CONCILIACIÓN DE CAJA Y VALORES */}
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-gray-800 bg-gray-100 px-3 py-1.5 border-l-4 border-gray-900 mb-2">
                        1. RESUMEN DE CONCILIACIÓN Y LIQUIDACIÓN DE VALORES DEL TURNO
                      </h2>

                      <table className="w-full text-xs border border-gray-400 border-collapse mb-2 font-mono">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-400 text-gray-900 font-bold">
                            <th className="border-r border-gray-400 p-2 text-left">CONCEPTO / FORMA DE PAGO</th>
                            <th className="border-r border-gray-400 p-2 text-center">TRANSACCIONES</th>
                            <th className="border-r border-gray-400 p-2 text-left">DESTINO DE RECAUDACIÓN</th>
                            <th className="p-2 text-right">TOTAL (BS.)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                          <tr>
                            <td className="border-r border-gray-300 p-2 font-bold text-gray-900 font-sans">
                              Ventas de Boletos en Efectivo
                            </td>
                            <td className="border-r border-gray-300 p-2 text-center font-bold">
                              {ventasSesion.filter(v => v.metodoPago === "EFECTIVO").length}
                            </td>
                            <td className="border-r border-gray-300 p-2 font-sans text-gray-700">
                              Efectivo en bóveda de ventanilla
                            </td>
                            <td className="p-2 text-right font-bold text-gray-900">
                              {totalEfectivo.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr>
                            <td className="border-r border-gray-300 p-2 font-bold text-gray-900 font-sans">
                              Ventas Electrónicas por Código QR
                            </td>
                            <td className="border-r border-gray-300 p-2 text-center font-bold">
                              {ventasSesion.filter(v => v.metodoPago === "QR").length}
                            </td>
                            <td className="border-r border-gray-300 p-2 font-sans text-gray-700">
                              Acreditación Bancaria Directa OSASTUR S.R.L.
                            </td>
                            <td className="p-2 text-right font-bold text-sky-800">
                              {totalQR.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="border-r border-gray-300 p-2 font-sans text-gray-800">
                              (+) Fondo Inicial de Apertura de Caja (Cambio)
                            </td>
                            <td className="border-r border-gray-300 p-2 text-center font-mono">1</td>
                            <td className="border-r border-gray-300 p-2 font-sans text-gray-600">
                              Fondo fijo rotatorio asignado
                            </td>
                            <td className="p-2 text-right font-mono text-gray-800">
                              {montoInicialCaja.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 border-t border-gray-400 font-bold">
                            <td colSpan={3} className="border-r border-gray-400 p-2 text-right uppercase">
                              TOTAL INGRESOS BRUTOS POR BOLETERÍA DEL TURNO:
                            </td>
                            <td className="p-2 text-right font-black text-gray-900">
                              Bs. {totalVentasTurno.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr className="bg-emerald-50/70 border-t-2 border-gray-900 font-bold text-emerald-950">
                            <td colSpan={3} className="border-r border-gray-400 p-2.5 text-right uppercase font-black text-xs">
                              TOTAL EFECTIVO FÍSICO A ENTREGAR A ADMINISTRACIÓN (VENTAS + FONDO):
                            </td>
                            <td className="p-2.5 text-right font-black text-sm text-emerald-900 underline decoration-double">
                              Bs. {totalEntregarEnCaja.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* SECCIÓN 2: DETALLE PORMENORIZADO DE BOLETOS EMITIDOS */}
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-gray-800 bg-gray-100 px-3 py-1.5 border-l-4 border-gray-900 mb-2">
                        2. LIBRO DE AUDITORÍA DE EMISIÓN DE BOLETOS ({ventasSesion.length} OPERACIONES)
                      </h2>

                      <table className="w-full text-xs border border-gray-400 border-collapse font-mono">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-400 text-gray-900 font-bold">
                            <th className="border-r border-gray-400 p-2 text-center">HORA</th>
                            <th className="border-r border-gray-400 p-2 text-left">N° BOLETO</th>
                            <th className="border-r border-gray-400 p-2 text-center">ASIENTO</th>
                            <th className="border-r border-gray-400 p-2 text-left">PASAJERO Y DOCUMENTO</th>
                            <th className="border-r border-gray-400 p-2 text-left">DESTINO</th>
                            <th className="border-r border-gray-400 p-2 text-center">PLACA</th>
                            <th className="border-r border-gray-400 p-2 text-center">MÉTODO</th>
                            <th className="p-2 text-right">TOTAL (BS.)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                          {ventasSesion.map((item, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/70"}>
                              <td className="border-r border-gray-300 p-2 text-center text-gray-600">{item.hora}</td>
                              <td className="border-r border-gray-300 p-2 font-bold text-gray-900">{item.codigo}</td>
                              <td className="border-r border-gray-300 p-2 text-center font-bold text-gray-900">{item.asiento}</td>
                              <td className="border-r border-gray-300 p-2 font-sans text-gray-800">
                                {item.nombre} <span className="text-[10px] text-gray-500 font-mono">({item.ci})</span>
                              </td>
                              <td className="border-r border-gray-300 p-2 font-sans text-gray-800">{item.destino}</td>
                              <td className="border-r border-gray-300 p-2 text-center text-gray-700">{item.placa}</td>
                              <td className="border-r border-gray-300 p-2 text-center">
                                <span className="font-bold text-[10px] px-1.5 py-0.5 rounded border border-gray-300">
                                  {item.metodoPago}
                                </span>
                              </td>
                              <td className="p-2 text-right font-bold text-gray-900">
                                {item.monto.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-200 border-t-2 border-gray-900 font-bold">
                            <td colSpan={7} className="border-r border-gray-400 p-2 text-right uppercase">
                              TOTAL VALOR EMITIDO EN EL TURNO:
                            </td>
                            <td className="p-2 text-right font-black text-gray-900">
                              Bs. {totalVentasTurno.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* SECCIÓN 3: FIRMAS OFICIALES DE ENTREGA Y RECEPCIÓN DE FONDOS */}
                    <div className="pt-8 border-t-2 border-dashed border-gray-400">
                      <p className="text-[10px] text-gray-500 uppercase font-mono text-center mb-6">
                        CONSTANCIA Y CONFORMIDAD LEGAL: El cajero declara bajo juramento la fidelidad de las ventas registradas y hace entrega de los importes arriba detallados.
                      </p>

                      <div className="grid grid-cols-3 gap-8 text-center text-xs">
                        <div>
                          <div className="h-14 border-b border-gray-900 mb-1" />
                          <p className="font-bold text-gray-900">{usuarioAutenticado?.nombre || "Rodrigo Paz Soliz"}</p>
                          <p className="text-[10px] text-gray-600 font-mono">OPERADOR DE VENTANILLA</p>
                          <p className="text-[9px] text-gray-500 font-mono">Cajero Entregante</p>
                        </div>

                        <div>
                          <div className="h-14 border-b border-gray-900 mb-1" />
                          <p className="font-bold text-gray-900">Lic. Marco Mendoza S.</p>
                          <p className="text-[10px] text-gray-600 font-mono">ADMINISTRADOR DE SUCURSAL</p>
                          <p className="text-[9px] text-gray-500 font-mono">Receptor de Fondos</p>
                        </div>

                        <div>
                          <div className="h-14 border-b border-gray-900 mb-1" />
                          <p className="font-bold text-gray-900">Auditoría Interna Contable</p>
                          <p className="text-[10px] text-gray-600 font-mono">CONTROL DE INGRESOS</p>
                          <p className="text-[9px] text-gray-500 font-mono">Sello y Archivo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ------------------------------------------------------------- */}
        {/* VISTA 3: GERENCIA GENERAL (MIS)                               */}
        {/* ------------------------------------------------------------- */}
        {(rolActivo === "GERENCIA_NACIONAL" || rolActivo === "GERENTE_GENERAL" || rolActivo === "JEFE_OPERACIONES") && (() => {
          const ingresosBoletos = Number(reportesKpisBD?.ingresosBoletos ?? 71560);
          const ingresosEncomiendas = Number(reportesKpisBD?.ingresosEncomiendas ?? 4990);
          const ingresosTotalGeneral = ingresosBoletos + ingresosEncomiendas;
          const totalBoletosEmitidos = Number(reportesKpisBD?.totalPasajeros ?? 427);
          const totalViajesDespachados = Number(reportesKpisBD?.totalViajes ?? 24);
          const departamentosData = reportesKpisBD?.departamentos || [
            { departamento: "La Paz", boletosVendidos: 211, recaudacion: 33900.00, encomiendas: 2450.00 },
            { departamento: "Santa Cruz", boletosVendidos: 72, recaudacion: 15840.00, encomiendas: 1320.00 },
            { departamento: "Chuquisaca", boletosVendidos: 83, recaudacion: 13280.00, encomiendas: 780.00 },
            { departamento: "Cochabamba", boletosVendidos: 61, recaudacion: 8540.00, encomiendas: 440.00 },
          ];

          const ejecutarDescargaExcel = () => {
            try {
              const filasCsv = [
                ["EMPRESA DE TRANSPORTE INTERDEPARTAMENTAL OSASTUR S.R.L."],
                ["NIT: 1028495023", "MATRICULA COMERCIO: 0029411", "OFICINA CENTRAL LA PAZ"],
                ["REPORTE GERENCIAL CONSOLIDADO Y RENDICION DE CUENTAS"],
                ["RANGO DE FECHAS EVALUADO:", `Del ${fechaInicioReporte} al ${fechaFinReporte}`],
                ["FECHA DE EMISION:", new Date().toLocaleDateString("es-BO") + " " + new Date().toLocaleTimeString("es-BO")],
                ["RESPONSABLE:", usuarioAutenticado?.nombre || "Ing. Roberto Quiroga Flores", "CARGO:", usuarioAutenticado?.rol || "GERENCIA_GENERAL"],
                [],
                ["SUCURSAL / TERMINAL", "DEPARTAMENTO", "BOLETOS EMITIDOS", "INGRESOS PASAJES (BS.)", "INGRESOS ENCOMIENDAS (BS.)", "TOTAL CAJA (BS.)", "AUDITORIA CAJA"],
                ...departamentosData.map((d: any) => [
                  `Terminal Central ${d.departamento}`,
                  d.departamento,
                  d.boletosVendidos,
                  Number(d.recaudacion).toFixed(2),
                  Number(d.encomiendas || (d.recaudacion * 0.08)).toFixed(2),
                  (Number(d.recaudacion) + Number(d.encomiendas || (d.recaudacion * 0.08))).toFixed(2),
                  "CUADRADA / CONFORME"
                ]),
                [],
                ["TOTALES NACIONALES CONSOLIDADOS", "", totalBoletosEmitidos, ingresosBoletos.toFixed(2), ingresosEncomiendas.toFixed(2), ingresosTotalGeneral.toFixed(2), "CUADRADO 100%"]
              ];

              const contenidoCsv = "\uFEFF" + filasCsv.map(row => row.map((campo: any) => `"${String(campo).replace(/"/g, '""')}"`).join(";")).join("\r\n");
              const blob = new Blob([contenidoCsv], { type: "text/csv;charset=utf-8;" });
              const urlDescarga = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = urlDescarga;
              anchor.download = `Reporte_Gerencia_OSASTUR_${fechaInicioReporte}_a_${fechaFinReporte}.csv`;
              document.body.appendChild(anchor);
              anchor.click();
              document.body.removeChild(anchor);
              URL.revokeObjectURL(urlDescarga);
            } catch (err) {
              console.error("Error al exportar:", err);
              alert("Error al descargar el archivo Excel.");
            }
          };

          return (
            <div className="space-y-6">
              {/* BARRA SUPERIOR DE FILTROS POR FECHA Y ACCIONES GERENCIALES (NO PRINT) */}
              <div className="no-print bg-[#141b14] border border-[#233523] rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    Estado de Resultados y Rendición Contable Gerencial
                  </h3>
                  <p className="text-xs text-[#9ca3af]">
                    Norma Contable Oficial para Auditoría Gerencial y Directorio
                  </p>
                </div>

                {/* SELECTORES DE RANGO DE FECHAS */}
                <div className="flex flex-wrap items-center gap-3 bg-[#0d140d] border border-[#223522] px-4 py-2 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-gray-300 font-semibold">Desde:</span>
                    <input
                      type="date"
                      value={fechaInicioReporte}
                      onChange={(e) => setFechaInicioReporte(e.target.value)}
                      className="bg-[#141c14] border border-[#2b422b] rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-300 font-semibold">Hasta:</span>
                    <input
                      type="date"
                      value={fechaFinReporte}
                      onChange={(e) => setFechaFinReporte(e.target.value)}
                      className="bg-[#141c14] border border-[#2b422b] rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* BOTONES DE DESCARGA EXCEL E IMPRESIÓN */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={ejecutarDescargaExcel}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/60 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-lime-300" />
                    Descargar Reporte Excel (.csv)
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 bg-[#1b2b1b] hover:bg-[#253d25] active:scale-95 border border-[#315031] text-emerald-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir Reporte (Hoja Oficial)
                  </button>
                </div>
              </div>

              {/* DOCUMENTO CONTABLE ESTÁNDAR: HOJA BLANCA CON TABLAS, NÚMEROS Y FIRMAS DE AUDITORÍA */}
              <div id="hoja-reporte-contable-gerencia" className="hoja-impresion-contable bg-white text-gray-900 rounded-2xl p-8 md:p-10 shadow-2xl border border-gray-300 font-sans max-w-5xl mx-auto">
                
                {/* ENCABEZADO INSTITUCIONAL CONTABLE */}
                <div className="border-b-2 border-gray-900 pb-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-xl font-black uppercase tracking-wider text-black font-serif">
                        EMPRESA DE TRANSPORTES OSASTUR S.R.L.
                      </h1>
                      <p className="text-[11px] font-mono text-gray-700">NIT: 1028495023 • MATRÍCULA DE COMERCIO: 0029411</p>
                      <p className="text-[11px] text-gray-600">Dirección General de Operaciones y Finanzas • Bolivia</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block border border-gray-900 px-3 py-1 text-xs font-mono font-bold uppercase bg-gray-100">
                        INFORME GERENCIAL N° RGC-2026-084
                      </span>
                      <p className="text-[11px] text-gray-600 mt-1 font-mono">
                        FECHA DE EMISIÓN: {new Date().toLocaleDateString("es-BO", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono">MONEDA: BOLIVIANOS (Bs.)</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap justify-between items-center text-xs gap-2">
                    <div>
                      <strong className="text-gray-900">PERIODO EVALUADO:</strong> Desde <span className="font-mono font-bold">{fechaInicioReporte}</span> hasta <span className="font-mono font-bold">{fechaFinReporte}</span> (Balance de Sucursales)
                    </div>
                    <div>
                      <strong className="text-gray-900">AUDITORÍA:</strong> Control Operativo Consolidado
                    </div>
                  </div>
                </div>

                {/* 1. CUADRO CONSOLIDADO GENERAL */}
                <div className="mb-6">
                  <h2 className="text-xs font-black uppercase tracking-wider text-gray-800 bg-gray-100 px-3 py-1.5 border-l-4 border-gray-900 mb-3">
                    1. RESUMEN FINANCIERO Y MOVIMIENTO DE CAJA NACIONAL
                  </h2>

                  <table className="w-full text-xs border border-gray-400 border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-400 text-gray-900 font-bold font-mono">
                        <th className="border-r border-gray-400 p-2 text-left">CÓDIGO CUENTA</th>
                        <th className="border-r border-gray-400 p-2 text-left">CONCEPTO CONTABLE / RUBRO OPERATIVO</th>
                        <th className="border-r border-gray-400 p-2 text-center">UNIDADES / CANT.</th>
                        <th className="p-2 text-right">TOTAL RECAUDADO (BS.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300 font-mono">
                      <tr>
                        <td className="border-r border-gray-300 p-2 text-gray-600">4.1.01.01</td>
                        <td className="border-r border-gray-300 p-2 font-sans text-gray-900">
                          Venta de Pasajes y Boletos Interdepartamentales
                        </td>
                        <td className="border-r border-gray-300 p-2 text-center">{totalBoletosEmitidos} boletos</td>
                        <td className="p-2 text-right font-bold text-gray-900">
                          {ingresosBoletos.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td className="border-r border-gray-300 p-2 text-gray-600">4.1.01.02</td>
                        <td className="border-r border-gray-300 p-2 font-sans text-gray-900">
                          Fletes de Encomiendas, Paquetería y Transporte de Carga en Bodega
                        </td>
                        <td className="border-r border-gray-300 p-2 text-center">Despachos diarios</td>
                        <td className="p-2 text-right font-bold text-gray-900">
                          {ingresosEncomiendas.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border-r border-gray-300 p-2 text-gray-600">OPER-FLOTA</td>
                        <td className="border-r border-gray-300 p-2 font-sans text-gray-900">
                          Salidas Programadas y Despachadas en Andenes Oficiales
                        </td>
                        <td className="border-r border-gray-300 p-2 text-center font-bold">{totalViajesDespachados} buses</td>
                        <td className="p-2 text-right text-gray-500 font-sans italic text-[11px]">En tránsito / Llegadas</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-200 border-t-2 border-gray-900 font-black font-mono text-sm">
                        <td colSpan={3} className="border-r border-gray-400 p-2.5 text-right uppercase">
                          INGRESOS TOTALES OPERATIVOS CONSOLIDADOS (BS.):
                        </td>
                        <td className="p-2.5 text-right text-black underline decoration-double">
                          Bs. {ingresosTotalGeneral.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 2. RECAUDACIÓN Y RENDICIÓN DESGLOSADA POR TERMINAL Y DEPARTAMENTO */}
                <div className="mb-6">
                  <h2 className="text-xs font-black uppercase tracking-wider text-gray-800 bg-gray-100 px-3 py-1.5 border-l-4 border-gray-900 mb-3">
                    2. RENDICIÓN DE CAJAS POR TERMINAL Y SUCURSAL DEPARTAMENTAL
                  </h2>

                  <table className="w-full text-xs border border-gray-400 border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-400 text-gray-900 font-bold font-mono">
                        <th className="border-r border-gray-400 p-2 text-left">SUCURSAL / TERMINAL</th>
                        <th className="border-r border-gray-400 p-2 text-left">DEPARTAMENTO</th>
                        <th className="border-r border-gray-400 p-2 text-center">BOLETOS EMITIDOS</th>
                        <th className="border-r border-gray-400 p-2 text-right">PASAJES (BS.)</th>
                        <th className="border-r border-gray-400 p-2 text-right">ENCOMIENDAS (BS.)</th>
                        <th className="p-2 text-right">TOTAL CAJA (BS.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300 font-mono">
                      {departamentosData.map((d: any, idx: number) => {
                        const recPasajes = Number(d.recaudacion) || 0;
                        const recEnc = Number(d.encomiendas || (recPasajes * 0.08).toFixed(2));
                        const totalCajaSucursal = recPasajes + recEnc;

                        return (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/70"}>
                            <td className="border-r border-gray-300 p-2 font-sans font-semibold text-gray-900">
                              Terminal Central {d.departamento}
                            </td>
                            <td className="border-r border-gray-300 p-2 font-sans text-gray-700">{d.departamento}</td>
                            <td className="border-r border-gray-300 p-2 text-center font-bold text-gray-900">
                              {d.boletosVendidos}
                            </td>
                            <td className="border-r border-gray-300 p-2 text-right text-gray-900">
                              {recPasajes.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="border-r border-gray-300 p-2 text-right text-gray-900">
                              {recEnc.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-right font-black text-black">
                              {totalCajaSucursal.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-200 border-t-2 border-gray-900 font-bold font-mono">
                        <td colSpan={2} className="border-r border-gray-400 p-2 text-right uppercase">
                          TOTALES GENERALES DE CAJA SUCURSALES:
                        </td>
                        <td className="border-r border-gray-400 p-2 text-center font-black">
                          {departamentosData.reduce((acc: number, d: any) => acc + (Number(d.boletosVendidos) || 0), 0)}
                        </td>
                        <td className="border-r border-gray-400 p-2 text-right font-black">
                          {departamentosData.reduce((acc: number, d: any) => acc + (Number(d.recaudacion) || 0), 0).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border-r border-gray-400 p-2 text-right font-black">
                          {ingresosEncomiendas.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-right font-black text-black">
                          Bs. {ingresosTotalGeneral.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 3. ÍNDICES DE EFICIENCIA Y DESEMPEÑO FINANCIERO */}
                <div className="mb-6">
                  <h2 className="text-xs font-black uppercase tracking-wider text-gray-800 bg-gray-100 px-3 py-1.5 border-l-4 border-gray-900 mb-3">
                    3. INDICADORES DE EFICIENCIA OPERATIVA & CONTABLE
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3 border border-gray-300 bg-gray-50 rounded">
                      <span className="text-[10px] text-gray-500 block uppercase">Ingreso Promedio x Pasaje</span>
                      <strong className="text-sm text-gray-900">
                        Bs. {totalBoletosEmitidos > 0 ? (ingresosBoletos / totalBoletosEmitidos).toFixed(2) : "0.00"}
                      </strong>
                    </div>
                    <div className="p-3 border border-gray-300 bg-gray-50 rounded">
                      <span className="text-[10px] text-gray-500 block uppercase">Participación Boletos</span>
                      <strong className="text-sm text-gray-900">
                        {ingresosTotalGeneral > 0 ? ((ingresosBoletos / ingresosTotalGeneral) * 100).toFixed(1) : 0}%
                      </strong>
                    </div>
                    <div className="p-3 border border-gray-300 bg-gray-50 rounded">
                      <span className="text-[10px] text-gray-500 block uppercase">Participación Carga</span>
                      <strong className="text-sm text-gray-900">
                        {ingresosTotalGeneral > 0 ? ((ingresosEncomiendas / ingresosTotalGeneral) * 100).toFixed(1) : 0}%
                      </strong>
                    </div>
                    <div className="p-3 border border-gray-300 bg-gray-50 rounded">
                      <span className="text-[10px] text-gray-500 block uppercase">Estado de Arqueo</span>
                      <strong className="text-sm text-emerald-800 font-bold uppercase">CUADRADO 100%</strong>
                    </div>
                  </div>
                </div>

                {/* 4. SECCIÓN DE FIRMAS Y CONFORMIDAD CONTABLE */}
                <div className="mt-12 pt-6 border-t-2 border-dashed border-gray-400">
                  <div className="grid grid-cols-3 gap-8 text-center text-xs">
                    <div>
                      <div className="h-14 border-b border-gray-900 mb-1" />
                      <p className="font-bold text-gray-900">Lic. Marco Mendoza S.</p>
                      <p className="text-[10px] text-gray-600 font-mono">Administrador General del Sistema</p>
                      <p className="text-[9px] text-gray-500 font-mono">C.I. 4829104 LP.</p>
                    </div>

                    <div>
                      <div className="h-14 border-b border-gray-900 mb-1" />
                      <p className="font-bold text-gray-900">Dpto. de Contabilidad Central</p>
                      <p className="text-[10px] text-gray-600 font-mono">Auditor Financiero Regional</p>
                      <p className="text-[9px] text-gray-500 font-mono">C.A.U.B. Matrícula N° 8492</p>
                    </div>

                    <div>
                      <div className="h-14 border-b border-gray-900 mb-1" />
                      <p className="font-bold text-gray-900">Gerencia General / Directorio</p>
                      <p className="text-[10px] text-gray-600 font-mono">Recepción y Aprobación Ejecutiva</p>
                      <p className="text-[9px] text-gray-500 font-mono">Osastur Transportes S.R.L.</p>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-gray-500 font-mono mt-8 pt-3 border-t border-gray-200">
                    Documento emitido y verificado electrónicamente por el Sistema Integrado de Transportes OSASTUR BOLIVIA.
                    Queda prohibida su alteración o adulteración parcial o total.
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* VISTA 4: ENCOMIENDAS                                          */}
        {/* ------------------------------------------------------------- */}
        {(rolActivo === "ENCOMIENDAS" || rolActivo === "BODEGUERO") && (() => {
          const encomiendasOrigen = encomiendasBD.filter(e => e.estado === "RECEPCIONADO" || e.estado === "EN_ESPERA");
          const encomiendasEnTransito = encomiendasBD.filter(e => e.estado === "EN_TRANSITO");
          const encomiendasArribadasODestino = encomiendasBD.filter(e => e.estado === "ARRIBADO_DESTINO" || e.estado === "ENTREGADO" || e.estado === "EN_TRANSITO");

          const pesoNum = parseFloat(formEncomienda.pesoKg) || 1;
          const tarifaEstimada = Math.max(25, pesoNum * 4.5);

          return (
            <div className="space-y-6">
              {/* CABECERA PRINCIPAL CON SELECTOR DE ETAPAS OPERATIVAS BIEN DELIMITADAS */}
              <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#1e261e]">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#1d3319] border border-[#355c2d] text-[#a3e635] rounded-xl">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Panel Integral de Encomiendas, Carga y Despacho
                      </h2>
                      <p className="text-xs text-[#9ca3af]">
                        Encargado de Recepción &bull; Terminal: <strong className="text-white">{usuarioAutenticado?.terminal || "Oficina Central La Paz"}</strong> &bull; Sincronizado en tiempo real con Neon PostgreSQL
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#142014] text-[#a3e635] border border-[#2d4722]">
                      {encomiendasBD.length} Encomiendas Registradas en Base de Datos
                    </span>
                  </div>
                </div>

                {/* NAVEGACIÓN EN 3 PESTAÑAS CLARAMENTE DELIMITADAS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSubpestanaEncomiendas("REGISTRO_TARIFADOR")}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      subpestanaEncomiendas === "REGISTRO_TARIFADOR"
                        ? "bg-[#182418] border-[#3d7912] ring-1 ring-[#3d7912] shadow-lg"
                        : "bg-[#090c09] hover:bg-[#121812] border-[#1e261e] text-[#9ca3af]"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${subpestanaEncomiendas === "REGISTRO_TARIFADOR" ? "bg-[#3d7912] text-white" : "bg-[#151c15] text-[#9ca3af]"}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${subpestanaEncomiendas === "REGISTRO_TARIFADOR" ? "text-white" : "text-[#cbd5e1]"}`}>
                        1. Recepción & Tarifador
                      </p>
                      <p className="text-[10px] text-[#9ca3af]">Registro, pesaje y guía QR oficial</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubpestanaEncomiendas("DESPACHO_FLOTA")}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      subpestanaEncomiendas === "DESPACHO_FLOTA"
                        ? "bg-[#182418] border-[#3d7912] ring-1 ring-[#3d7912] shadow-lg"
                        : "bg-[#090c09] hover:bg-[#121812] border-[#1e261e] text-[#9ca3af]"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${subpestanaEncomiendas === "DESPACHO_FLOTA" ? "bg-[#3d7912] text-white" : "bg-[#151c15] text-[#9ca3af]"}`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${subpestanaEncomiendas === "DESPACHO_FLOTA" ? "text-white" : "text-[#cbd5e1]"}`}>
                        2. Entrega en Flota & Andén
                      </p>
                      <p className="text-[10px] text-[#9ca3af]">Subida a maletero y cambio a Tránsito</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubpestanaEncomiendas("ARRIBO_ENTREGA")}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      subpestanaEncomiendas === "ARRIBO_ENTREGA"
                        ? "bg-[#182418] border-[#3d7912] ring-1 ring-[#3d7912] shadow-lg"
                        : "bg-[#090c09] hover:bg-[#121812] border-[#1e261e] text-[#9ca3af]"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${subpestanaEncomiendas === "ARRIBO_ENTREGA" ? "bg-[#3d7912] text-white" : "bg-[#151c15] text-[#9ca3af]"}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${subpestanaEncomiendas === "ARRIBO_ENTREGA" ? "text-white" : "text-[#cbd5e1]"}`}>
                        3. Arribo y Entrega en Destino
                      </p>
                      <p className="text-[10px] text-[#9ca3af]">Descarga del bus y entrega a clientes</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* PESTAÑA 1: RECEPCIÓN, TARIFAJE Y REGISTRO DE NUEVA ENCOMIENDA */}
              {/* ------------------------------------------------------------- */}
              {subpestanaEncomiendas === "REGISTRO_TARIFADOR" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* FORMULARIO DE REGISTRO */}
                  <div className="lg:col-span-7 bg-[#111611] border border-[#1e261e] rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1e261e] pb-3">
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#a3e635]" />
                        Formulario de Recepción & Registro de Encomienda
                      </h3>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-900/60 px-2 py-0.5 rounded">
                        Emisión Inmediata
                      </span>
                    </div>

                    <form onSubmit={registrarNuevaEncomienda} className="space-y-4 text-xs">
                      {/* DATOS DEL REMITENTE */}
                      <div className="p-3.5 bg-[#090c09] border border-[#1e261e] rounded-xl space-y-2.5">
                        <span className="text-[10px] uppercase font-mono font-bold text-[#a3e635] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> 1. Datos del Remitente (Quien Envía)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="sm:col-span-1">
                            <label className="block text-[#9ca3af] mb-1 font-mono">Nombre Completo *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Juan Pérez Ramos"
                              value={formEncomienda.remitenteNombre}
                              onChange={(e) => setFormEncomienda({ ...formEncomienda, remitenteNombre: e.target.value })}
                              className="w-full bg-[#111611] border border-[#273427] text-white rounded-lg p-2 text-xs outline-none focus:border-[#3d7912]"
                            />
                          </div>
                          <div>
                            <label className="block text-[#9ca3af] mb-1 font-mono">C.I. Remitente</label>
                            <input
                              type="text"
                              placeholder="Ej. 6849201 LP"
                              value={formEncomienda.remitenteCi}
                              onChange={(e) => setFormEncomienda({ ...formEncomienda, remitenteCi: e.target.value })}
                              className="w-full bg-[#111611] border border-[#273427] text-white rounded-lg p-2 text-xs outline-none focus:border-[#3d7912]"
                            />
                          </div>
                          <div>
                            <label className="block text-[#9ca3af] mb-1 font-mono">Teléfono / Celular</label>
                            <input
                              type="text"
                              placeholder="Ej. 76543210"
                              value={formEncomienda.remitenteTel}
                              onChange={(e) => setFormEncomienda({ ...formEncomienda, remitenteTel: e.target.value })}
                              className="w-full bg-[#111611] border border-[#273427] text-white rounded-lg p-2 text-xs outline-none focus:border-[#3d7912]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* DATOS DEL DESTINATARIO */}
                      <div className="p-3.5 bg-[#090c09] border border-[#1e261e] rounded-xl space-y-2.5">
                        <span className="text-[10px] uppercase font-mono font-bold text-amber-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> 2. Datos del Destinatario (Quien Recibe en Destino)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="sm:col-span-1">
                            <label className="block text-[#9ca3af] mb-1 font-mono">Nombre Completo *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Maria Elena Flores"
                              value={formEncomienda.destinatarioNombre}
                              onChange={(e) => setFormEncomienda({ ...formEncomienda, destinatarioNombre: e.target.value })}
                              className="w-full bg-[#111611] border border-[#273427] text-white rounded-lg p-2 text-xs outline-none focus:border-[#3d7912]"
                            />
                          </div>
                          <div>
                            <label className="block text-[#9ca3af] mb-1 font-mono">C.I. Destinatario *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. 4920194 SC"
                              value={formEncomienda.destinatarioCi}
                              onChange={(e) => setFormEncomienda({ ...formEncomienda, destinatarioCi: e.target.value })}
                              className="w-full bg-[#111611] border border-[#273427] text-white rounded-lg p-2 text-xs outline-none focus:border-[#3d7912]"
                            />
                          </div>
                          <div>
                            <label className="block text-[#9ca3af] mb-1 font-mono">Teléfono / Celular</label>
                            <input
                              type="text"
                              placeholder="Ej. 71234567"
                              value={formEncomienda.destinatarioTel}
                              onChange={(e) => setFormEncomienda({ ...formEncomienda, destinatarioTel: e.target.value })}
                              className="w-full bg-[#111611] border border-[#273427] text-white rounded-lg p-2 text-xs outline-none focus:border-[#3d7912]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* DATOS DEL PAQUETE Y TARIFAJE */}
                      <div className="p-3.5 bg-[#090c09] border border-[#1e261e] rounded-xl space-y-2.5">
                        <span className="text-[10px] uppercase font-mono font-bold text-sky-400 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" /> 3. Detalle de Carga y Tarifador Automático
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="sm:col-span-2">
                            <label className="block text-[#9ca3af] mb-1 font-mono">Descripción del Paquete o Mercadería *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Caja de repuestos automotrices, ropa, etc."
                              value={formEncomienda.descripcion}
                              onChange={(e) => setFormEncomienda({ ...formEncomienda, descripcion: e.target.value })}
                              className="w-full bg-[#111611] border border-[#273427] text-white rounded-lg p-2 text-xs outline-none focus:border-[#3d7912]"
                            />
                          </div>
                          <div>
                            <label className="block text-[#9ca3af] mb-1 font-mono">Peso Báscula (Kg) *</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              required
                              value={formEncomienda.pesoKg}
                              onChange={(e) => setFormEncomienda({ ...formEncomienda, pesoKg: e.target.value })}
                              className="w-full bg-[#111611] border border-[#273427] text-amber-400 font-mono font-bold rounded-lg p-2 text-xs outline-none focus:border-[#3d7912]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          <div>
                            <label className="block text-[#9ca3af] mb-1 font-mono">Terminal Origen:</label>
                            <select
                              value={formEncomienda.origenCiudad}
                              onChange={(e) => setFormEncomienda({ ...formEncomienda, origenCiudad: e.target.value })}
                              className="w-full bg-[#111611] border border-[#273427] text-white rounded-lg p-2 text-xs outline-none"
                            >
                              <option value="La Paz">La Paz (Terminal Central)</option>
                              <option value="Santa Cruz">Santa Cruz (Terminal Bimodal)</option>
                              <option value="Cochabamba">Cochabamba (Terminal Central)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[#9ca3af] mb-1 font-mono">Terminal Destino:</label>
                            <select
                              value={formEncomienda.destinoCiudad}
                              onChange={(e) => setFormEncomienda({ ...formEncomienda, destinoCiudad: e.target.value })}
                              className="w-full bg-[#111611] border border-[#273427] text-white rounded-lg p-2 text-xs outline-none"
                            >
                              <option value="Santa Cruz">Santa Cruz (Terminal Bimodal)</option>
                              <option value="La Paz">La Paz (Terminal Central)</option>
                              <option value="Cochabamba">Cochabamba (Terminal Central)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* RESUMEN DE COBRO Y BOTÓN REGISTRAR */}
                      <div className="p-4 bg-[#142014] border border-[#2d4722] rounded-xl flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase font-mono text-[#9ca3af]">Tarifa Total del Flete (Bs. 4.50 / Kg):</p>
                          <p className="text-2xl font-black text-amber-400 font-mono">Bs. {tarifaEstimada.toFixed(2)}</p>
                        </div>
                        <button
                          type="submit"
                          disabled={encomiendaGuardando}
                          className="px-6 py-2.5 bg-[#3d7912] hover:bg-[#31620e] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          {encomiendaGuardando ? "Guardando en Neon DB..." : "Registrar & Emitir Rótulo Adhesivo QR"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* PREVISUALIZACIÓN DE RÓTULO O ÚLTIMA GUÍA GENERADA */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl space-y-3">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2 border-b border-[#1e261e] pb-2">
                        <QrCode className="w-4 h-4 text-[#a3e635]" />
                        Rótulo Adhesivo con Código QR Generado
                      </h4>

                      {guiaGeneradaExito ? (
                        <div className="p-4 bg-[#090c09] border border-emerald-500/50 rounded-xl space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-emerald-400 text-sm">{guiaGeneradaExito.codigoGuia}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                              REGISTRADO EN NEON
                            </span>
                          </div>
                          <div className="text-center py-2 bg-white rounded-lg p-2 max-w-[150px] mx-auto">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                                guiaGeneradaExito.codigoGuia
                              )}`}
                              alt="QR Encomienda"
                              className="w-full h-auto"
                            />
                          </div>
                          <div className="space-y-1 font-mono text-[11px] text-[#cbd5e1] border-t border-[#1e261e] pt-2">
                            <p><strong>Carga:</strong> {guiaGeneradaExito.descripcion} ({guiaGeneradaExito.pesoKg} Kg)</p>
                            <p><strong>Remitente:</strong> {guiaGeneradaExito.nombreRemitente}</p>
                            <p><strong>Destinatario:</strong> {guiaGeneradaExito.nombreDestinatario} (CI: {guiaGeneradaExito.ciDestinatario})</p>
                            <p className="text-amber-400 font-bold">Flete: Bs. {guiaGeneradaExito.tarifaCalculada}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setModalImpresionGuia({
                                guia: guiaGeneradaExito.codigoGuia,
                                descripcion: guiaGeneradaExito.descripcion,
                                peso: `${guiaGeneradaExito.pesoKg} Kg`,
                                remitente: guiaGeneradaExito.nombreRemitente,
                                ciRemitente: guiaGeneradaExito.ciRemitente,
                                destinatario: guiaGeneradaExito.nombreDestinatario,
                                ciDestinatario: guiaGeneradaExito.ciDestinatario,
                                origen: "La Paz (Terminal Central)",
                                destino: "Santa Cruz (Terminal Bimodal)",
                                flete: parseFloat(guiaGeneradaExito.tarifaCalculada),
                                estado: "RECEPCIONADO EN VENTANILLA"
                              });
                            }}
                            className="w-full py-2 bg-[#3d7912] hover:bg-[#31620e] text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Imprimir Rótulo Adhesivo QR
                          </button>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-[#9ca3af] space-y-2 border border-dashed border-[#1e261e] rounded-xl">
                          <Package className="w-8 h-8 mx-auto text-[#6b7280]" />
                          <p className="text-xs">Complete el formulario a la izquierda para tarifar y generar el rótulo con código QR en línea.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PESTAÑA 2: DESPACHO HACIA FLOTA Y ASIGNACIÓN AL MALETERO     */}
              {/* ------------------------------------------------------------- */}
              {subpestanaEncomiendas === "DESPACHO_FLOTA" && (
                <div className="space-y-4">
                  <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e261e] pb-3">
                      <div>
                        <h3 className="font-bold text-white text-base flex items-center gap-2">
                          <Truck className="w-5 h-5 text-amber-400" />
                          Despacho y Entrega a Flota en Andén ({salidaSeleccionada.origen} &rarr; {salidaSeleccionada.destino})
                        </h3>
                        <p className="text-xs text-[#9ca3af]">
                          Unidad Placa: <strong className="text-white">{busAsignado.placa}</strong> &bull; Conductor: <strong className="text-[#a3e635]">{busAsignado.conductorNombre || busAsignado.choferNombre}</strong> &bull; Auxiliar: <strong className="text-amber-400">{busAsignado.auxiliarNombre}</strong>
                        </p>
                      </div>

                      <span className="text-xs font-mono font-bold text-[#a3e635] bg-[#142014] border border-[#2d4722] px-3 py-1 rounded-lg">
                        {encomiendasBD.filter(e => e.estado === "RECEPCIONADO").length} Pendientes de Subir
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      {encomiendasBD.map((enc: any) => {
                        const esRecepcionado = enc.estado === "RECEPCIONADO" || enc.estado === "EN_ESPERA";
                        const esEnTransito = enc.estado === "EN_TRANSITO";

                        return (
                          <div
                            key={enc.id}
                            className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                              esEnTransito
                                ? "bg-[#142014] border-[#2d4722] text-[#e2e8f0]"
                                : "bg-[#090c09] border-[#1e261e] text-[#cbd5e1]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-white text-xs">{enc.codigoGuia}</span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                esEnTransito
                                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              }`}>
                                {enc.estado}
                              </span>
                            </div>

                            <div>
                              <p className="font-bold text-white text-xs">{enc.descripcion}</p>
                              <p className="text-[11px] text-[#9ca3af]">Peso: <strong className="text-amber-400">{enc.pesoKg} Kg</strong> &bull; Flete: Bs. {enc.tarifaCalculada}</p>
                              <p className="text-[11px] text-[#9ca3af]">Destinatario: {enc.nombreDestinatario} (CI: {enc.ciDestinatario || "N/A"})</p>
                            </div>

                            <div className="pt-2 border-t border-[#1e261e] flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setModalImpresionGuia({
                                    guia: enc.codigoGuia,
                                    descripcion: enc.descripcion,
                                    peso: `${enc.pesoKg} Kg`,
                                    remitente: enc.nombreRemitente,
                                    ciRemitente: enc.ciRemitente,
                                    destinatario: enc.nombreDestinatario,
                                    ciDestinatario: enc.ciDestinatario,
                                    origen: enc.origenNombre || salidaSeleccionada.origen,
                                    destino: enc.destinoNombre || salidaSeleccionada.destino,
                                    flete: parseFloat(enc.tarifaCalculada) || 45,
                                    estado: enc.estado
                                  });
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[#141b14] hover:bg-[#1f2b1f] border border-[#273427] text-white text-[11px] flex items-center gap-1"
                              >
                                <Printer className="w-3 h-3 text-[#a3e635]" />
                                Rótulo
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  const nuevoEstado = esEnTransito ? "RECEPCIONADO" : "EN_TRANSITO";
                                  setEncomiendasBD((prev) =>
                                    prev.map((item) => (item.id === enc.id ? { ...item, estado: nuevoEstado } : item))
                                  );

                                  try {
                                    await fetch("/api/encomiendas", {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ id: enc.id, estado: nuevoEstado })
                                    });
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                                  esEnTransito
                                    ? "bg-[#3d7912] text-white"
                                    : "bg-amber-950/70 hover:bg-amber-900 border border-amber-800 text-amber-300"
                                }`}
                              >
                                <Truck className="w-3.5 h-3.5" />
                                {esEnTransito ? "Cargado en Flota OK" : "Cargar a Flota (Tránsito)"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PESTAÑA 3: ARRIBO Y ENTREGA EN TERMINAL DE DESTINO            */}
              {/* ------------------------------------------------------------- */}
              {subpestanaEncomiendas === "ARRIBO_ENTREGA" && (
                <div className="space-y-4">
                  <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e261e] pb-3">
                      <div>
                        <h3 className="font-bold text-white text-base flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          Módulo de Entrega en Terminal de Destino (Recepción por Clientes)
                        </h3>
                        <p className="text-xs text-[#9ca3af]">
                          Al arribar la flota, el auxiliar o encargado de almacén entrega los paquetes a los destinatarios verificando su documento de identidad.
                        </p>
                      </div>

                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-3 py-1 rounded-lg">
                        {encomiendasBD.filter(e => e.estado === "ENTREGADO").length} Entregados con Éxito
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-[#1e261e] rounded-xl">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#090c09] text-[#9ca3af] uppercase text-[10px] border-b border-[#1e261e]">
                          <tr>
                            <th className="p-3">Código Guía</th>
                            <th className="p-3">Descripción & Peso</th>
                            <th className="p-3">Destinatario & C.I.</th>
                            <th className="p-3">Origen / Destino</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3 text-right">Flete</th>
                            <th className="p-3 text-center">Acción de Entrega</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e261e] text-white">
                          {encomiendasBD.map((enc: any) => {
                            const esEntregado = enc.estado === "ENTREGADO";

                            return (
                              <tr key={enc.id} className="hover:bg-[#151c15] transition-colors">
                                <td className="p-3 font-bold text-emerald-400">{enc.codigoGuia}</td>
                                <td className="p-3">
                                  <span className="text-white font-sans font-medium block">{enc.descripcion}</span>
                                  <span className="text-[10px] text-[#9ca3af] font-mono">{enc.pesoKg} Kg</span>
                                </td>
                                <td className="p-3">
                                  <span className="font-sans font-bold text-white block">{enc.nombreDestinatario}</span>
                                  <span className="text-[10px] text-amber-400 font-mono">CI: {enc.ciDestinatario || "Verificado"}</span>
                                </td>
                                <td className="p-3 text-[#9ca3af]">
                                  {enc.origenNombre || "La Paz"} &rarr; {enc.destinoNombre || "Santa Cruz"}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    esEntregado
                                      ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                                      : enc.estado === "EN_TRANSITO"
                                      ? "bg-sky-950 text-sky-400 border border-sky-800"
                                      : "bg-amber-950 text-amber-400 border border-amber-800"
                                  }`}>
                                    {enc.estado}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-black text-amber-400">
                                  Bs. {enc.tarifaCalculada}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const nuevoEstado = esEntregado ? "EN_TRANSITO" : "ENTREGADO";
                                      setEncomiendasBD((prev) =>
                                        prev.map((item) => (item.id === enc.id ? { ...item, estado: nuevoEstado } : item))
                                      );

                                      try {
                                        await fetch("/api/encomiendas", {
                                          method: "PUT",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ id: enc.id, estado: nuevoEstado })
                                        });
                                      } catch (e) {
                                        console.error(e);
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 mx-auto ${
                                      esEntregado
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "bg-[#182418] hover:bg-[#203020] border border-[#3d7912] text-[#a3e635]"
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    {esEntregado ? "Entregado a Cliente OK" : "Marcar Entregado"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* VISTA ADMINISTRADOR: GESTIÓN Y MODIFICACIÓN DE USUARIOS Y CONTRASEÑAS */}
        {/* ========================================================================= */}
        {rolActivo === "ADMIN_SISTEMAS" && (
          <AdminPanel
            subpestanaAdmin={subpestanaAdmin}
            setSubpestanaAdmin={setSubpestanaAdmin}
            personalOperable={personalOperable}
            flotasBD={flotasBD}
            viajesBD={viajesBD}
            reportesKpisBD={reportesKpisBD || {
              ingresosBoletos: 184500,
              ingresosEncomiendas: 63200,
              ocupacionPromedio: 88,
              puntualidadSalidas: 96
            }}
            modoCrearEditarUsuario={modoCrearEditarUsuario}
            setModoCrearEditarUsuario={setModoCrearEditarUsuario}
            formGestionUsuario={formGestionUsuario}
            setFormGestionUsuario={setFormGestionUsuario}
            guardarGestionUsuario={guardarGestionUsuario}
            restablecerPasswordUsuario={(u: any) => restablecerPasswordUsuario(u.id, u.username)}
            toggleActivoUsuario={handleToggleActivoUsuario}
            modoCrearFlota={modoCrearFlota}
            setModoCrearFlota={setModoCrearFlota}
            formNuevaFlota={formNuevaFlota}
            setFormNuevaFlota={setFormNuevaFlota}
            guardarNuevaFlota={guardarNuevaFlota}
            toggleActivoFlota={handleToggleActivoFlota}
            modoCrearViaje={modoCrearViaje}
            setModoCrearViaje={setModoCrearViaje}
            formNuevoViaje={formNuevoViaje}
            setFormNuevoViaje={setFormNuevoViaje}
            guardarNuevoViajeAdmin={guardarNuevoViajeAdmin}
            toggleEstadoViaje={handleToggleEstadoViaje}
          />
        )}

                {/* ========================================================================= */}
        {/* VISTA CONDUCTOR: HOJA DE RUTA, CROQUIS VISUAL EN TIEMPO REAL, CONTROL Y BODEGA */}
        {/* ========================================================================= */}
        {rolActivo === "CONDUCTOR" && (() => {
          const pasajerosAbordados = croquis.filter((a) => a.estado === "ABORDAJE_CONFIRMADO").length;
          const totalPasajesVendidos = croquis.filter((a) => a.estado === "VENDIDO" || a.estado === "ABORDAJE_CONFIRMADO").length;
          const todosSentadosYAbordados = totalPasajesVendidos > 0 && pasajerosAbordados === totalPasajesVendidos;

          // Encomiendas asignadas a esta unidad o ruta para supervisión del chofer
          const encomiendasDeEsteViaje = encomiendasBD.slice(0, 4);
          const totalPesoBodega = encomiendasDeEsteViaje.reduce((acc, curr) => acc + (parseFloat(curr.pesoKg) || 12), 0);

          return (
            <div className="space-y-6">
              {/* CABECERA PRINCIPAL DEL CONDUCTOR: INFORMACIÓN DE LA RUTA Y BOTONES DE CONTROL DE VIAJE */}
              <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1e261e]">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#1d3319] border border-[#355c2d] text-[#a3e635] rounded-xl">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Panel de Conducción y Control de Ruta &bull; {salidaSeleccionada.origen} &rarr; {salidaSeleccionada.destino}
                      </h2>
                      <p className="text-xs text-[#9ca3af]">
                        Conductor Asignado &bull; Unidad Placa: <strong className="text-white">{busAsignado.placa}</strong> &bull; Salida: <strong className="text-[#a3e635]">{salidaSeleccionada.horaSalida} hrs</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalBitacoraAbierto(true)}
                      className="px-3.5 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Reportar Novedad en Ruta
                    </button>

                    {/* BOTÓN TERMINAR / CONCLUIR VIAJE Y REGISTRO EN BASE DE DATOS */}
                    {salidaSeleccionada.estado === "FINALIZADO" || viajeConcluidoExitoso ? (
                      <button
                        type="button"
                        onClick={() => setModalReporteFinViaje(true)}
                        className="px-4 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500 text-emerald-300 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                      >
                        <FileText className="w-4 h-4 text-emerald-400" />
                        Ver Reporte y Acta de Viaje Concluido
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={guardandoFinViaje}
                        onClick={concluirViajeEnBD}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 border border-emerald-400/50 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Flag className="w-4 h-4 text-white" />
                        {guardandoFinViaje ? "Registrando en Neon DB..." : "Terminar / Concluir Viaje (Llegada)"}
                      </button>
                    )}
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-mono font-bold">
                      SOAT Vigente Nº 2026-98124
                    </span>
                  </div>
                </div>

                {/* ESTADO DE ASIGNACIÓN INSTITUCIONAL POR ADMINISTRACIÓN */}
                {(() => {
                  const tieneAsignacion = Boolean(salidaSeleccionada && salidaSeleccionada.id);
                  const nombreConductorActivo = usuarioAutenticado ? usuarioAutenticado.nombre : (busAsignado.conductorNombre || "Don Mario Condori Tito");
                  return (
                    <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                      tieneAsignacion 
                        ? "bg-[#142214] border-[#2e5424] text-white" 
                        : "bg-red-950/40 border-red-800 text-red-200"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${tieneAsignacion ? "bg-[#1d3819] border-[#3f732b] text-[#a3e635]" : "bg-red-900 border-red-700 text-red-300"}`}>
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400">
                              Asignación Oficial por Administración
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              tieneAsignacion ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-red-500/20 text-red-400 border border-red-500/40"
                            }`}>
                              {tieneAsignacion ? "ASIGNADO CON RUTA ACTIVA" : "SIN ASIGNACIÓN / EN RESERVA"}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-white mt-0.5">
                            {tieneAsignacion 
                              ? `Conductor ${nombreConductorActivo}: Asignado a Viaje [${salidaSeleccionada.id}] con destino ${salidaSeleccionada.destino}.`
                              : `Conductor ${nombreConductorActivo}: Sin orden de viaje programada por el Administrador para este turno.`}
                          </p>
                          <p className="text-[11px] text-[#9ca3af]">
                            Unidad Asignada: <strong className="text-white">{busAsignado.nombreComercial}</strong> ({busAsignado.placa}) &bull; Salida programada: <strong className="text-[#a3e635]">{salidaSeleccionada.horaSalida} hrs</strong> &bull; Andén: {salidaSeleccionada.andenSalida || "Andén #2"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {salidaSeleccionada.estado === "FINALIZADO" ? (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold font-mono text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            VIAJE CONCLUIDO Y REGISTRADO
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg bg-[#090c09] border border-[#2d4722] text-[#a3e635] font-bold font-mono text-xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-ping"></span>
                            RUTA EN OPERACIÓN
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* TRIPULACIÓN ASIGNADA A LA UNIDAD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="bg-[#090c09] p-3.5 rounded-xl border border-[#1e261e] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#9ca3af] uppercase font-mono">Conductor Titular del Viaje</p>
                      <p className="text-base font-bold text-white mt-0.5">{(busAsignado.conductorNombre || busAsignado.choferNombre)}</p>
                      <p className="text-[11px] text-emerald-400 font-mono mt-0.5">Licencia Categoría C &bull; Habilitado Tránsito</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#152015] text-[#a3e635] border border-[#2d4722]">
                      EN CABINA
                    </span>
                  </div>

                  <div className="bg-[#090c09] p-3.5 rounded-xl border border-[#1e261e] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#9ca3af] uppercase font-mono">Auxiliar de Abordaje Asignado</p>
                      <p className="text-base font-bold text-amber-400 mt-0.5">{busAsignado.auxiliarNombre}</p>
                      <p className="text-[11px] text-[#9ca3af] font-mono mt-0.5">Control de Pasajeros y Maletero</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1c1810] text-amber-300 border border-amber-900/60">
                      OPERANDO EN ANDÉN
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN INTERMEDIA: CROQUIS VISUAL Y CONTROL DE ABORDAJE / NOVEDADES */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* COLUMNA IZQUIERDA: CROQUIS VISUAL EXACTO */}
                <div className="lg:col-span-7 xl:col-span-8 bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e261e] pb-3">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#a3e635]" />
                        Croquis Visual de Pasajeros a Bordo ({busAsignado.nombreComercial})
                      </h3>
                      <p className="text-xs text-[#9ca3af]">
                        Supervisión en vivo: Verde = Abordado con QR &bull; Amarillo = Vendido pendiente de subir &bull; Gris = Libre
                      </p>
                    </div>

                    {busAsignado.pisos === 2 && (
                      <div className="flex bg-[#090c09] p-1 rounded-xl border border-[#1e261e] text-xs">
                        <button
                          type="button"
                          onClick={() => setPisoVista(1)}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            pisoVista === 1 ? "bg-[#3d7912] text-white shadow-sm" : "text-[#9ca3af] hover:text-white"
                          }`}
                        >
                          Planta Baja (8 Camas)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPisoVista(2)}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            pisoVista === 2 ? "bg-[#3d7912] text-white shadow-sm" : "text-[#9ca3af] hover:text-white"
                          }`}
                        >
                          Planta Alta (18 Camas)
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#090c09] border border-[#1e261e] rounded-2xl p-6 flex flex-col items-center">
                    <div
                      className={`w-full max-w-md grid gap-2.5 px-4 py-1 text-center text-[10px] font-mono font-bold uppercase text-[#9ca3af] border-b border-[#1e261e] mb-2 ${
                        esTresColumnas ? "grid-cols-3" : "grid-cols-4"
                      }`}
                    >
                      {esTresColumnas ? (
                        <>
                          <div className="text-emerald-400">VENTANA</div>
                          <div className="text-amber-400">PASILLO</div>
                          <div className="text-emerald-400">VENTANA</div>
                        </>
                      ) : (
                        <>
                          <div className="text-emerald-400">VENTANA</div>
                          <div className="text-amber-400">PASILLO</div>
                          <div className="text-amber-400">PASILLO</div>
                          <div className="text-emerald-400">VENTANA</div>
                        </>
                      )}
                    </div>

                    <div
                      className={`w-full max-w-md grid gap-2.5 ${
                        esTresColumnas ? "grid-cols-3" : "grid-cols-4"
                      }`}
                    >
                      {croquis
                        .filter((a) => a.piso === (busAsignado.pisos === 1 ? 1 : pisoVista))
                        .map((asiento) => {
                          const estaAbordado = asiento.estado === "ABORDAJE_CONFIRMADO";
                          const estaVendidoPendiente = asiento.estado === "VENDIDO";

                          return (
                            <div
                              key={asiento.codigoAsiento}
                              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                                estaAbordado
                                  ? "bg-emerald-950/80 border-emerald-500/80 text-emerald-200 ring-1 ring-emerald-500 shadow-md shadow-emerald-950/50"
                                  : estaVendidoPendiente
                                  ? "bg-amber-950/60 border-amber-500/60 text-amber-200"
                                  : "bg-[#141b14] border-[#223022] text-[#6b7280]"
                              }`}
                            >
                              <span className="text-xs font-mono font-bold">{asiento.codigoAsiento}</span>
                              <span className="text-[9px] mt-0.5 font-bold uppercase truncate max-w-[85px] text-center">
                                {estaAbordado ? "✓ A BORDO" : estaVendidoPendiente ? "PENDIENTE" : "LIBRE"}
                              </span>
                              {asiento.pasajeroNombre && (
                                <span className="text-[8px] text-[#9ca3af] truncate max-w-[85px]">
                                  {asiento.pasajeroNombre.split(" ")[0]}
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1e261e] flex flex-wrap items-center justify-center gap-6 text-xs text-[#9ca3af]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-500"></span>
                        Pasajero a Bordo (Control QR OK)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-amber-950 border border-amber-500"></span>
                        Vendido en Ventanilla (Falta subir)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-[#141b14] border border-[#223022]"></span>
                        Asiento Libre
                      </span>
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: ACTIVACIÓN DE CONTROL DE ABORDAJE Y BITÁCORA */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                  {/* ACTIVADOR Y SEGUIMIENTO DEL CONTROL DE PASAJEROS */}
                  <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#a3e635]" />
                        Control de Pasajeros por Auxiliar
                      </h4>
                      <span className="text-xs font-mono text-[#a3e635] font-bold">
                        {pasajerosAbordados} / {totalPasajesVendidos || busAsignado.totalAsientos}
                      </span>
                    </div>

                    {/* BOTÓN DEL CONDUCTOR PARA ACTIVAR O SOLICITAR EL CONTROL EN PUERTA */}
                    {!controlAbordajeIniciado ? (
                      <button
                        type="button"
                        onClick={() => {
                          setControlAbordajeIniciado(true);
                          setControlAuxiliarTerminado(false);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#3d7912] hover:bg-[#31620e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                      >
                        <Play className="w-4 h-4" />
                        Activar Inicio de Control de Abordaje
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 bg-[#152015] border border-[#2d4722] rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between text-[#a3e635] font-bold">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-ping"></span>
                              Control de Puerta Activo
                            </span>
                            <span className="font-mono">{Math.round((pasajerosAbordados / (totalPasajesVendidos || 1)) * 100)}%</span>
                          </div>
                          <p className="text-[11px] text-[#cbd5e1]">
                            El auxiliar <strong>{busAsignado.auxiliarNombre}</strong> está escaneando los códigos QR de los boletos.
                          </p>
                        </div>

                        {/* BOTÓN DEL AUXILIAR (VISTO BUENO FINAL PARA EL CHOFER) */}
                        {!controlAuxiliarTerminado ? (
                          <button
                            type="button"
                            onClick={() => {
                              // Confirmar el abordaje de todos los pasajeros vendidos
                              const confirmados = croquis.map((a) =>
                                a.estado === "VENDIDO"
                                  ? { ...a, estado: "ABORDAJE_CONFIRMADO" as const, horaValidacion: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                                  : a
                              );
                              setCroquis(confirmados);
                              setControlAuxiliarTerminado(true);
                            }}
                            className="w-full py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4 text-amber-400" />
                            Auxiliar: Marcar "Control Terminado y Todos Sentados"
                          </button>
                        ) : (
                          <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            <div>
                              <p className="font-bold text-white">¡Control Completado por el Auxiliar!</p>
                              <p className="text-[10px] text-[#cbd5e1]">Todos los pasajeros están sentados. Unidad autorizada para partir.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* SUPERVISIÓN DE BODEGA Y ENCOMIENDAS PARA EL CONDUCTOR */}
                  <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1e261e] pb-2">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-400" />
                        Control de Bodega y Carga (Chofer)
                      </h4>
                      <span className="text-[11px] font-mono text-[#a3e635] font-bold">
                        {encomiendasDeEsteViaje.length} Encomiendas &bull; {totalPesoBodega} Kg
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9ca3af]">
                      El auxiliar se encarga de la estiba física en maletero; el conductor verifica el precinto y peso total del viaje.
                    </p>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {encomiendasDeEsteViaje.map((enc: any, idx: number) => (
                        <div key={idx} className="p-2 rounded-lg bg-[#090c09] border border-[#1e261e] flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono text-white font-bold">{enc.codigoGuia || `GUIA-00${idx+1}`}</span>
                            <span className="text-[10px] text-[#9ca3af] block">{enc.descripcion || "Paquete Comercial"} ({enc.pesoKg || 15} Kg)</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#152015] text-[#a3e635] border border-[#2d4722]">
                            BODEGA OK
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BITÁCORA DE NOVEDADES */}
                  <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1e261e] pb-2">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Bitácora de Eventualidades en Ruta
                      </h4>
                      <button
                        type="button"
                        onClick={() => setModalBitacoraAbierto(true)}
                        className="text-[10px] text-[#a3e635] hover:underline font-mono"
                      >
                        + Agregar
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {bitacoraNovedades.map((b, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-[#090c09] border border-[#1e261e] text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-[#a3e635] font-bold">{b.hora} hrs &bull; {b.kmLugar}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-950/60 text-amber-300 border border-amber-800/40">
                              {b.tipo.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-[#e2e8f0] text-[11px]">{b.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* MODAL / PREVISUALIZACIÓN DE REPORTE Y ACTA DE FIN DE VIAJE (BASE DE DATOS NEON) */}
              {modalReporteFinViaje && (
                <div className="fixed inset-0 z-50 bg-[#090c09]/85 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-[#111611] border border-[#2e5424] rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
                    {/* ENCABEZADO DEL REPORTE */}
                    <div className="flex items-center justify-between pb-4 border-b border-[#1e261e]">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-[#1d3319] border border-[#355c2d] text-[#a3e635] rounded-xl">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold">
                              REGISTRO OFICIAL NEON DB
                            </span>
                            <span className="text-[10px] text-[#9ca3af] font-mono">ID: {salidaSeleccionada.id}</span>
                          </div>
                          <h3 className="text-lg md:text-xl font-black text-white mt-0.5">
                            Acta y Reporte de Conclusión de Viaje
                          </h3>
                          <p className="text-xs text-[#9ca3af]">
                            Empresa de Transportes Interdepartamental OSASTUR S.R.L.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalReporteFinViaje(false)}
                        className="text-[#9ca3af] hover:text-white text-xl font-bold p-1"
                      >
                        ✕
                      </button>
                    </div>

                    {/* ALERTA DE ÉXITO EN DB */}
                    <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-xs flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <strong className="text-white block">Viaje Finalizado y Guardado en Base de Datos</strong>
                        El estado del viaje ha sido actualizado a <span className="font-mono font-bold text-white">FINALIZADO</span> en PostgreSQL Neon. Todos los pasajeros y encomiendas quedan registrados formalmente.
                      </div>
                    </div>

                    {/* CUADRO DE RESUMEN OPERATIVO DEL VIAJE */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-[#090c09] border border-[#1e261e] rounded-xl text-center">
                        <span className="text-[10px] uppercase font-mono text-[#9ca3af] block">Ruta Cumplida</span>
                        <strong className="text-xs text-white block mt-1">{salidaSeleccionada.origen} → {salidaSeleccionada.destino}</strong>
                      </div>
                      <div className="p-3 bg-[#090c09] border border-[#1e261e] rounded-xl text-center">
                        <span className="text-[10px] uppercase font-mono text-[#9ca3af] block">Unidad & Placa</span>
                        <strong className="text-xs text-amber-400 block mt-1">{busAsignado.placa}</strong>
                      </div>
                      <div className="p-3 bg-[#090c09] border border-[#1e261e] rounded-xl text-center">
                        <span className="text-[10px] uppercase font-mono text-[#9ca3af] block">Pasajeros a Bordo</span>
                        <strong className="text-xs text-[#a3e635] block mt-1">{pasajerosAbordados} Pasajeros</strong>
                      </div>
                      <div className="p-3 bg-[#090c09] border border-[#1e261e] rounded-xl text-center">
                        <span className="text-[10px] uppercase font-mono text-[#9ca3af] block">Carga en Bodega</span>
                        <strong className="text-xs text-sky-400 block mt-1">{encomiendasDeEsteViaje.length} Encs ({totalPesoBodega} Kg)</strong>
                      </div>
                    </div>

                    {/* DETALLES DE TRIPULACIÓN Y AUDITORÍA */}
                    <div className="p-4 bg-[#090c09] border border-[#1e261e] rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-[#1e261e] pb-2">
                        <span className="text-[#9ca3af]">Conductor Titular Responsable:</span>
                        <span className="font-bold text-white font-mono">{(busAsignado.conductorNombre || busAsignado.choferNombre)}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#1e261e] pb-2">
                        <span className="text-[#9ca3af]">Auxiliar de Abordaje y Maletero:</span>
                        <span className="font-bold text-amber-400 font-mono">{busAsignado.auxiliarNombre}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#1e261e] pb-2">
                        <span className="text-[#9ca3af]">Hora Salida Programada:</span>
                        <span className="font-mono text-white">{salidaSeleccionada.horaSalida} hrs</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#9ca3af]">Fecha y Hora de Arribo / Cierre:</span>
                        <span className="font-mono font-bold text-[#a3e635]">{fechaHoraFinViaje || new Date().toLocaleString()}</span>
                      </div>
                    </div>

                    {/* RESUMEN DE NOVEDADES REPORTADAS EN RUTA */}
                    <div className="space-y-2 text-xs">
                      <h4 className="font-bold text-white flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Bitácora y Novedades Registradas durante la Ruta ({bitacoraNovedades.length}):
                      </h4>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {bitacoraNovedades.map((b, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-[#090c09] border border-[#1e261e] flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#a3e635] text-[10px]">{b.hora} hrs</span>
                                <span className="text-[10px] text-[#cbd5e1] font-semibold">{b.tipo.replace(/_/g, " ")}</span>
                              </div>
                              <p className="text-[11px] text-[#9ca3af] mt-0.5">{b.descripcion}</p>
                            </div>
                            <span className="text-[9px] font-mono text-[#6b7280]">{b.kmLugar}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FIRMA Y BOTONES DE ACCIÓN */}
                    <div className="pt-3 border-t border-[#1e261e] flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-[#9ca3af] font-mono">
                        Documento Oficial con Firma Digital de Cabina
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-4 py-2 bg-[#182418] hover:bg-[#203020] border border-[#3d7912] text-[#a3e635] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Printer className="w-4 h-4" />
                          Imprimir Acta
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalReporteFinViaje(false)}
                          className="px-4 py-2 bg-[#3d7912] hover:bg-[#31620e] text-white font-bold text-xs rounded-xl transition-colors shadow-md"
                        >
                          Cerrar y Aceptar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL PARA AGREGAR EVENTUALIDAD / REPORTE DE EMERGENCIA O PARADA */}
              {modalBitacoraAbierto && (
                <div className="fixed inset-0 z-50 bg-[#090c09]/80 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-[#111611] border border-[#1e261e] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1e261e] pb-3">
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Registrar Eventualidad / Reporte en Ruta
                      </h3>
                      <button
                        type="button"
                        onClick={() => setModalBitacoraAbierto(false)}
                        className="text-[#9ca3af] hover:text-white text-lg font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-[#9ca3af] block mb-1">Tipo de Eventualidad:</label>
                        <select
                          value={inputTipoNovedad}
                          onChange={(e) => setInputTipoNovedad(e.target.value)}
                          className="w-full bg-[#090c09] border border-[#273427] text-white rounded-xl px-3 py-2 text-xs outline-none"
                        >
                          <option value="CONTROL_POLICIAL">Control Policial / Alcoholemia Tránsito</option>
                          <option value="PARADA_TECNICA">Parada Técnica / Relevo de Conductor</option>
                          <option value="BLOQUEO_DERRUMBE">Bloqueo o Derrumbe en Carretera</option>
                          <option value="DESPERFECTO_MECANICO">Revisión Mecánica / Cambio de Neumático</option>
                          <option value="CONDICION_CLIMATICA">Condición Climática Adversa (Niebla / Lluvia)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[#9ca3af] block mb-1">Descripción de lo ocurrido:</label>
                        <textarea
                          rows={3}
                          value={inputDescripcionNovedad}
                          onChange={(e) => setInputDescripcionNovedad(e.target.value)}
                          placeholder="Ej. Control de alcoholemia superado sin observaciones en Retén Achica Arriba."
                          className="w-full bg-[#090c09] border border-[#273427] text-white rounded-xl p-3 text-xs outline-none focus:border-[#3d7912]"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setModalBitacoraAbierto(false)}
                          className="w-1/3 bg-[#090c09] hover:bg-[#151c15] text-[#9ca3af] hover:text-white py-2 rounded-xl border border-[#1e261e]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={!inputDescripcionNovedad.trim()}
                          onClick={() => {
                            const nuevaNovedad = {
                              hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                              tipo: inputTipoNovedad,
                              descripcion: inputDescripcionNovedad,
                              kmLugar: "Carretera Interdepartamental"
                            };
                            setBitacoraNovedades([nuevaNovedad, ...bitacoraNovedades]);
                            setInputDescripcionNovedad("");
                            setModalBitacoraAbierto(false);
                          }}
                          className="w-2/3 bg-[#3d7912] hover:bg-[#31620e] disabled:opacity-50 text-white font-bold py-2 rounded-xl transition-all shadow-md"
                        >
                          Guardar Novedad
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* MODAL DE INICIO DE SESIÓN INSTITUCIONAL (RBAC - PIRAMIDE DE INFORMACION) */}
        {/* ========================================================================= */}
        {modalLoginAbierto && (
          <div className="fixed inset-0 z-50 bg-[#090c09]/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#111611] border border-[#1e261e] rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#1e261e]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#172017]/40 border border-[#1e261e] rounded-xl text-emerald-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Acceso a Personal Autorizado</h3>
                    <p className="text-xs text-[#9ca3af]">Sistema Interno de Gestión y Operaciones OSASTUR</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setModalLoginAbierto(false);
                    setErrorLogin("");
                  }}
                  className="text-[#9ca3af] hover:text-white text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              {/* FORMULARIO DE ACCESO POR USUARIO Y CONTRASEÑA */}
              {/* AVISO IMPORTANTE PARA CLIENTES Y PASAJEROS */}
              <div className="my-4 p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-amber-200 text-xs flex items-start gap-3 shadow-inner">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-300">
                    Atención: Este módulo es exclusivamente para el personal y operadores de la empresa.
                  </p>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Si usted es cliente o pasajero, no necesita iniciar sesión. Puede comprar boletos directamente con pago QR o rastrear sus encomiendas desde el portal principal.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setModalLoginAbierto(false);
                        setTipoFlotaSeleccionadaCliente("TODOS");
                        setModalClienteCompraOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black font-black text-[11px] rounded-lg shadow-sm transition-all"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Ir al Panel de Compra de Boletos para Clientes
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={ejecutarLoginCredenciales} className="my-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#e2e8f0] mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Nombre de Usuario:
                  </label>
                  <input
                    type="text"
                    required
                    value={inputUsuarioLogin}
                    onChange={(e) => setInputUsuarioLogin(e.target.value)}
                    placeholder="Ej. admin, gerencia, boletero.lapaz, conductor.condori"
                    className="w-full bg-[#0c0f0c] border border-[#1e261e] text-white text-xs rounded-lg px-3.5 py-2.5 outline-none focus:border-[#3d7912] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#e2e8f0] mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Contraseña:
                  </label>
                  <input
                    type="password"
                    required
                    value={inputPasswordLogin}
                    onChange={(e) => setInputPasswordLogin(e.target.value)}
                    placeholder="Contraseña del usuario"
                    className="w-full bg-[#0c0f0c] border border-[#1e261e] text-white text-xs rounded-lg px-3.5 py-2.5 outline-none focus:border-[#3d7912] font-mono"
                  />
                </div>

                {errorLogin && (
                  <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs">
                    {errorLogin}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#3d7912] hover:bg-[#31620e] text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Iniciar Sesión
                </button>
              </form>

              {/* SELECCIÓN RÁPIDA DE USUARIOS OPERABLES EN BASE DE DATOS */}
              <div className="pt-4 border-t border-[#1e261e]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#9ca3af] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#65a30d]" />
                    O selecciona un usuario del personal operable:
                  </span>
                  <div className="flex gap-1">
                    {["TODAS", "La Paz", "Santa Cruz", "Cochabamba"].map((cd) => (
                      <button
                        type="button"
                        key={cd}
                        onClick={() => setFiltroCiudadPersonal(cd)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          filtroCiudadPersonal === cd
                            ? "bg-[#3d7912] text-white"
                            : "bg-[#141b14] text-[#9ca3af] hover:text-white border border-[#1e261e]"
                        }`}
                      >
                        {cd}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1">
                  {personalOperable
                    .filter((u) => filtroCiudadPersonal === "TODAS" || u.departamento === filtroCiudadPersonal)
                    .map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => {
                          setInputUsuarioLogin(u.username);
                          setInputPasswordLogin("osastur2026");
                          setErrorLogin("");
                        }}
                        className="text-left p-2.5 rounded-lg bg-[#0c0f0c] hover:bg-[#161c16] border border-[#1e261e] hover:border-[#273427] transition-all space-y-0.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-white group-hover:text-emerald-400">
                            {u.username}
                          </span>
                          <span className="text-[9px] font-mono bg-[#172017] text-[#cbd5e1] px-1.5 py-0.2 rounded border border-[#1e261e]">
                            {u.rol}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9ca3af] truncate">{u.nombreCompleto}</p>
                        <p className="text-[10px] text-[#6b7280]">{u.sucursalNombre}</p>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* MODAL CLIENTE: COMPRA INTUITIVA CON PAGO QR */}
        <ClienteCompraModal
          isOpen={modalClienteCompraOpen}
          tipoFlotaInicial={tipoFlotaSeleccionadaCliente}
          onClose={() => setModalClienteCompraOpen(false)}
          viajesBD={viajesBD}
          flotasBD={flotasBD}
          onEmitirBoleto={(boleto) => {
            setModalImpresionBoleto(boleto);
          }}
        />

        {/* ========================================================================= */}
        {/* MODAL 1: BOLETO TÉRMICO IMPRIMIBLE (80MM / PASAJES OFICIAL OSASTUR)ÉRMICO IMPRIMIBLE (80MM / PASAJES OFICIAL OSASTUR)      */}
        {/* ========================================================================= */}
        {modalImpresionBoleto && (
          <div className="fixed inset-0 z-50 bg-[#090c09]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#111611] border border-[#1e261e] rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e261e]">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">Vista Previa de Impresión</h3>
                </div>
                <button
                  onClick={() => setModalImpresionBoleto(null)}
                  className="text-[#9ca3af] hover:text-white text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              {/* TICKET FORMATO TÉRMICO 80MM (FONDO BLANCO, ALTO CONTRASTE) */}
              <div 
                id="ticket-termico-impresion" 
                className="bg-white text-black p-5 rounded-2xl shadow-inner font-mono text-xs border border-slate-300 space-y-3"
              >
                {/* CABECERA CORPORATIVA */}
                <div className="text-center pb-2 border-b border-dashed border-gray-400 space-y-1">
                  <div className="flex justify-center items-center gap-2">
                    <img src="/logo-oficial-osastur.jpg" alt="OSASTUR" className="h-9 w-auto max-w-[130px] object-contain rounded" />
                    <span className="font-black text-base tracking-tighter text-[#2e5d0e]">OSASTUR S.R.L.</span>
                  </div>
                  <p className="text-[10px] text-gray-700 leading-tight">
                    TRANSPORTE INTERDEPARTAMENTAL DE PASAJEROS<br />
                    NIT: 1028471029 &bull; AUTORIZACIÓN ATT: 2026/049<br />
                    TERMINAL CENTRAL DE BUSES - LA PAZ
                  </p>
                  <p className="text-[11px] font-bold text-[#e40421] pt-1">
                    BOLETO ELECTRÓNICO CON CONTROL QR
                  </p>
                </div>

                {/* DETALLE DEL VIAJE */}
                <div className="space-y-1.5 py-1 border-b border-dashed border-gray-400 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Boleto N°:</span>
                    <span className="font-black">{modalImpresionBoleto.codigo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha/Hora Emisión:</span>
                    <span>{modalImpresionBoleto.fechaEmision}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pasajero:</span>
                    <span className="font-bold uppercase">{modalImpresionBoleto.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Doc. Identidad (CI):</span>
                    <span className="font-bold">{modalImpresionBoleto.ci}</span>
                  </div>
                </div>

                {/* ASIGNACIÓN DE ASIENTO Y FLOTA */}
                <div className="bg-gray-100 p-3 rounded-xl border border-gray-300 space-y-1 text-center">
                  <p className="text-[10px] text-gray-600 uppercase">Plaza / Asiento Asignado</p>
                  <p className="text-2xl font-black text-[#2e5d0e]">{modalImpresionBoleto.asiento}</p>
                  <p className="text-[10px] font-bold text-gray-700">
                    Tipo: {modalImpresionBoleto.busTipo} &bull; Placa: {modalImpresionBoleto.placa}
                  </p>
                </div>

                {/* RUTA Y EMBARQUE */}
                <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-gray-400">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Origen:</span>
                    <span className="font-bold">{modalImpresionBoleto.origen}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Destino:</span>
                    <span className="font-bold">{modalImpresionBoleto.destino}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hora Salida:</span>
                    <span className="font-black text-red-600 text-sm">{modalImpresionBoleto.horaSalida}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terminal Salida:</span>
                    <span>{modalImpresionBoleto.terminalSalida}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-gray-600">Importe Pagado:</span>
                    <span className="font-black text-base text-[#65a30d]">Bs. {modalImpresionBoleto.precio}.00</span>
                  </div>
                </div>

                {/* CÓDIGO QR REAL DE EMBARQUE PARA EL AUXILIAR DE ABORDAJE */}
                <div className="text-center py-2 space-y-1.5 flex flex-col items-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                      modalImpresionBoleto.codigo
                    )}`}
                    alt="QR de Abordaje"
                    className="w-28 h-28 border-2 border-black p-1 rounded-lg"
                  />
                  <p className="text-[10px] text-gray-600">
                    Muestre este código QR al <strong>Auxiliar de Abordaje</strong> al momento de subir a la flota.
                  </p>
                  <p className="text-[9px] text-gray-500 italic">
                    "SOAT N° 2026-98124 &bull; Pasajero amparado conforme a ley de transporte."
                  </p>
                </div>
              </div>

              {/* BOTONES DE IMPRESIÓN */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-3 bg-[#488810] hover:bg-[#3a6f0d] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Ticket (Ctrl + P)
                </button>
                <button
                  onClick={() => setModalImpresionBoleto(null)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-[#e2e8f0] font-semibold rounded-xl text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: RÓTULO ADHESIVO Y GUÍA DE ENCOMIENDA IMPRIMIBLE CON QR            */}
        {/* ========================================================================= */}
        {modalImpresionGuia && (
          <div className="fixed inset-0 z-50 bg-[#090c09]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#111611] border border-[#e40421] rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e261e]">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-red-400" />
                  <h3 className="font-bold text-white text-base">Rótulo Adhesivo de Carga / Encomienda</h3>
                </div>
                <button
                  onClick={() => setModalImpresionGuia(null)}
                  className="text-[#9ca3af] hover:text-white text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              {/* FORMATO ADHESIVO DE ENCOMIENDA (PEGA EN EL PAQUETE O CAJA) */}
              <div 
                id="guia-encomienda-impresion" 
                className="bg-white text-black p-5 rounded-2xl shadow-inner font-mono text-xs border-2 border-black space-y-3"
              >
                {/* CABECERA */}
                <div className="flex justify-between items-center border-b-2 border-black pb-2">
                  <div>
                    <span className="font-black text-lg tracking-tighter text-[#2e5d0e]">OSASTUR ENCOMIENDAS</span>
                    <p className="text-[10px] text-gray-700">SERVICIO DE CARGA Y LOGÍSTICA NACIONAL</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-[#e40421] text-white px-2 py-0.5 rounded font-black text-xs">
                      BODEGA
                    </span>
                  </div>
                </div>

                {/* NÚMERO DE GUÍA EN GRANDE */}
                <div className="text-center py-2 bg-gray-100 border border-gray-400 rounded-xl">
                  <p className="text-[10px] text-gray-600 uppercase">Guía de Despacho Oficial</p>
                  <p className="text-xl font-black text-[#e40421] tracking-widest">{modalImpresionGuia.guia}</p>
                </div>

                {/* DATOS DE REMITENTE Y DESTINATARIO */}
                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-dashed border-gray-400 text-[11px]">
                  <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                    <span className="text-[9px] font-bold text-blue-800 block">REMITENTE:</span>
                    <strong className="block text-gray-900 leading-tight">{modalImpresionGuia.remitente}</strong>
                    <span className="text-[10px] text-gray-600 font-mono">CI: {modalImpresionGuia.ciRemitente}</span>
                    <span className="text-[10px] text-gray-600 block mt-1">Origen: {modalImpresionGuia.origen}</span>
                  </div>

                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <span className="text-[9px] font-bold text-emerald-800 block">DESTINATARIO:</span>
                    <strong className="block text-gray-900 leading-tight">{modalImpresionGuia.destinatario}</strong>
                    <span className="text-[10px] text-gray-600 font-mono">CI: {modalImpresionGuia.ciDestinatario}</span>
                    <span className="text-[10px] text-gray-600 block mt-1">Destino: {modalImpresionGuia.destino}</span>
                  </div>
                </div>

                {/* DETALLE DEL CONTENIDO */}
                <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-gray-400">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contenido Declarado:</span>
                    <span className="font-bold text-right">{modalImpresionGuia.descripcion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peso Total:</span>
                    <span className="font-black text-base">{modalImpresionGuia.peso}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flete Pagado:</span>
                    <span className="font-black text-emerald-700 text-sm">Bs. {modalImpresionGuia.flete}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado de Tránsito:</span>
                    <span className="font-bold text-blue-700">{modalImpresionGuia.estado}</span>
                  </div>
                </div>

                {/* QR PARA CONTROL EN BODEGA Y ENTREGA */}
                <div className="flex items-center gap-3 pt-1">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                      modalImpresionGuia.guia
                    )}`}
                    alt="QR Guía"
                    className="w-20 h-20 border-2 border-black p-0.5 rounded-lg flex-shrink-0"
                  />
                  <div className="text-[10px] text-gray-700 space-y-1">
                    <p className="font-bold">INSTRUCCIÓN DE ENTREGA:</p>
                    <p>Exigir Cédula de Identidad original del destinatario antes de entregar el paquete en bodega de destino.</p>
                  </div>
                </div>
              </div>

              {/* BOTONES DE IMPRESIÓN */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-3 bg-[#e40421] hover:bg-[#c9031d] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Rótulo Adhesivo
                </button>
                <button
                  onClick={() => setModalImpresionGuia(null)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-[#e2e8f0] font-semibold rounded-xl text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
