"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Calendar,
  Bus,
  CheckCircle2,
  QrCode,
  Ticket,
  Printer,
  ChevronRight,
  User,
  Phone,
  CreditCard,
  ShieldCheck,
  X,
  Clock,
  Sparkles,
  Download
} from "lucide-react";

export interface ClienteCompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  viajesBD: any[];
  flotasBD: any[];
  tipoFlotaInicial?: string;
  onEmitirBoleto: (boletoInfo: any) => void;
}

export const ClienteCompraModal: React.FC<ClienteCompraModalProps> = ({
  isOpen,
  onClose,
  viajesBD,
  flotasBD,
  tipoFlotaInicial = "TODOS",
  onEmitirBoleto
}) => {
  // Pasos: 1 = Buscar Salida, 2 = Croquis de Asientos Oficial, 3 = Datos y Pago QR, 4 = Ticket
  const [paso, setPaso] = useState<number>(1);

  // Filtros de búsqueda del cliente
  const [origen, setOrigen] = useState<string>("La Paz");
  const [destino, setDestino] = useState<string>("Santa Cruz");
  const [fecha, setFecha] = useState<string>("2026-10-27");
  const [tipoFlotaFiltro, setTipoFlotaFiltro] = useState<string>(tipoFlotaInicial);

  useEffect(() => {
    if (tipoFlotaInicial) {
      setTipoFlotaFiltro(tipoFlotaInicial);
      setPaso(1);
    }
  }, [tipoFlotaInicial, isOpen]);

  // Viaje seleccionado y configuración de piso
  const [viajeSeleccionado, setViajeSeleccionado] = useState<any | null>(null);
  const [pisoVista, setPisoVista] = useState<number>(1);

  // Asiento seleccionado
  const [asientoSeleccionado, setAsientoSeleccionado] = useState<{
    numero: number;
    codigoAsiento: string;
    piso: number;
    ubicacion: string;
    columnaTipo: string;
    precio: number;
  } | null>(null);

  // Formulario del Pasajero
  const [nombrePasajero, setNombrePasajero] = useState<string>("");
  const [ciPasajero, setCiPasajero] = useState<string>("");
  const [telefonoPasajero, setTelefonoPasajero] = useState<string>("");
  const [guardandoCompra, setGuardandoCompra] = useState<boolean>(false);

  // Boleto emitido
  const [ticketEmitido, setTicketEmitido] = useState<any | null>(null);

  if (!isOpen) return null;

  // Filtrar viajes programados
  const viajesFiltrados = viajesBD.filter((v) => {
    const orig = (v.origenDepto || v.origenNombre || "").toLowerCase();
    const dest = (v.destinoDepto || v.destinoNombre || "").toLowerCase();
    const coincideRuta = orig.includes(origen.toLowerCase()) && dest.includes(destino.toLowerCase());
    const coincideTipo = tipoFlotaFiltro === "TODOS" || (v.tipoFlota || "").includes(tipoFlotaFiltro);
    return coincideRuta && coincideTipo;
  });

  const salidasDisponibles = viajesFiltrados.length > 0 ? viajesFiltrados : viajesBD.slice(0, 4);
  const viajeActivo = viajeSeleccionado || salidasDisponibles[0] || null;

  // Deducir tipología de la flota según el viaje seleccionado
  const tipoFlotaStr = (viajeActivo?.tipoFlota || "BUS_CAMA").toUpperCase();
  const esSemiCama = tipoFlotaStr.includes("SEMI_CAMA");
  const esLeito = tipoFlotaStr.includes("LEITO") || tipoFlotaStr.includes("SUITE");
  const esDoblePiso = esLeito || Number(viajeActivo?.pisos) === 2 || tipoFlotaStr.includes("DOBLE");

  // Columnas: SemiCama = 4 columnas; BusCama y Leito = 3 columnas
  const esTresColumnas = !esSemiCama;

  const precioBase1 = Number(viajeActivo?.precioBasePiso1) || (esLeito ? 180 : esSemiCama ? 90 : 140);
  const precioBase2 = Number(viajeActivo?.precioBasePiso2) || (esLeito ? 120 : esSemiCama ? 80 : 110);

  // Generar croquis fiel e idéntico al de ventanilla
  interface AsientoItem {
    numero: number;
    codigoAsiento: string;
    ubicacion: string;
    columnaTipo: string;
    piso: number;
    disponible: boolean;
    tarifa: number;
  }

  const asientosDelBus: AsientoItem[] = [];
  const ocupadosSet = new Set([2, 5, 8, 11, 15, 19, 23]); // Asientos reservados por otros pasajeros

  if (esSemiCama) {
    // 4 Columnas: Ventana Izq, Pasillo Izq, Pasillo Der, Ventana Der (44 asientos en 1 piso)
    for (let i = 1; i <= 44; i++) {
      const colIndex = (i - 1) % 4;
      const esVentana = colIndex === 0 || colIndex === 3;
      const codigoAsiento = (esVentana ? "V" : "P") + i;
      const columnaTipo = colIndex === 0 ? "Ventana Izq" : colIndex === 1 ? "Pasillo Izq" : colIndex === 2 ? "Pasillo Der" : "Ventana Der";
      asientosDelBus.push({
        numero: i,
        codigoAsiento,
        ubicacion: esVentana ? "VENTANA" : "PASILLO",
        columnaTipo,
        piso: 1,
        disponible: !ocupadosSet.has(i),
        tarifa: precioBase1
      });
    }
  } else if (esLeito) {
    // LEITO TOTAL / SUITE (Doble Piso: Piso 1 = 8 Camas, Piso 2 = 18 Camas)
    // Planta Baja: 8 Camas
    for (let i = 1; i <= 8; i++) {
      const colIndex = (i - 1) % 3;
      const esVentana = colIndex === 0 || colIndex === 2;
      const codigoAsiento = (esVentana ? "V" : "P") + i;
      const columnaTipo = colIndex === 0 ? "Ventana Izq" : colIndex === 1 ? "Pasillo" : "Ventana Individual";
      asientosDelBus.push({
        numero: i,
        codigoAsiento,
        ubicacion: esVentana ? "VENTANA" : "PASILLO",
        columnaTipo,
        piso: 1,
        disponible: !ocupadosSet.has(i),
        tarifa: precioBase1
      });
    }
    // Planta Alta: 18 Camas (9 al 26)
    for (let i = 9; i <= 26; i++) {
      const colIndex = (i - 9) % 3;
      const esVentana = colIndex === 0 || colIndex === 2;
      const codigoAsiento = (esVentana ? "V" : "P") + i;
      const columnaTipo = colIndex === 0 ? "Ventana Izq" : colIndex === 1 ? "Pasillo" : "Ventana Individual";
      asientosDelBus.push({
        numero: i,
        codigoAsiento,
        ubicacion: esVentana ? "VENTANA" : "PASILLO",
        columnaTipo,
        piso: 2,
        disponible: !ocupadosSet.has(i),
        tarifa: precioBase2
      });
    }
  } else {
    // BUS CAMA REGULAR (3 Columnas: 32 asientos en 1 piso)
    for (let i = 1; i <= 32; i++) {
      const colIndex = (i - 1) % 3;
      const esVentana = colIndex === 0 || colIndex === 2;
      const codigoAsiento = (esVentana ? "V" : "P") + i;
      const columnaTipo = colIndex === 0 ? "Ventana Izq" : colIndex === 1 ? "Pasillo" : "Ventana Individual";
      asientosDelBus.push({
        numero: i,
        codigoAsiento,
        ubicacion: esVentana ? "VENTANA" : "PASILLO",
        columnaTipo,
        piso: 1,
        disponible: !ocupadosSet.has(i),
        tarifa: precioBase1
      });
    }
  }

  // Filtrar los asientos que corresponden al piso visible actualmente
  const asientosVisibles = asientosDelBus.filter((a) => a.piso === (esDoblePiso ? pisoVista : 1));

  // Confirmar y emitir el boleto
  const confirmarCompraYGenerarTicket = async () => {
    if (!nombrePasajero.trim() || !ciPasajero.trim()) {
      alert("Por favor ingrese su nombre completo y número de carnet.");
      return;
    }
    if (!asientoSeleccionado || !viajeActivo) return;

    try {
      setGuardandoCompra(true);
      const codigoBoleto = "BOL-" + Math.floor(100000 + Math.random() * 900000);
      const now = new Date();
      const fechaEmision = now.toLocaleDateString("es-BO") + " " + now.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });

      const infoBoleto = {
        codigo: codigoBoleto,
        asiento: `Plaza ${asientoSeleccionado.codigoAsiento} (${asientoSeleccionado.columnaTipo} • Piso ${asientoSeleccionado.piso})`,
        nombre: nombrePasajero,
        ci: ciPasajero,
        telefono: telefonoPasajero || "S/N",
        origen: viajeActivo.origenDepto || viajeActivo.origenNombre || origen,
        destino: viajeActivo.destinoDepto || viajeActivo.destinoNombre || destino,
        horaSalida: viajeActivo.horaSalida || "20:00",
        terminalSalida: viajeActivo.origenNombre || `Terminal Central ${origen}`,
        busTipo: viajeActivo.tipoFlota || (esLeito ? "Leito Suite 180°" : esSemiCama ? "Semi Cama Directo" : "Bus Cama Confort"),
        placa: viajeActivo.busPlaca || viajeActivo.bus?.placa || "3849-TND",
        precio: asientoSeleccionado.precio,
        fechaEmision
      };

      // Guardar en Neon DB
      try {
        await fetch("/api/boletos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            viajeId: viajeActivo.id,
            numeroAsiento: asientoSeleccionado.numero,
            piso: asientoSeleccionado.piso,
            nombrePasajero,
            ciPasajero,
            telefono: telefonoPasajero,
            precioPagado: asientoSeleccionado.precio
          })
        });
      } catch (e) {
        console.error("Sync error:", e);
      }

      setTicketEmitido(infoBoleto);
      setPaso(4);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al procesar la compra.");
    } finally {
      setGuardandoCompra(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#101710] border border-[#233823] rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col my-auto">
        
        {/* CABECERA DEL MODAL CLIENTE */}
        <div className="bg-gradient-to-r from-[#142314] via-[#162916] to-[#0f1a0f] p-5 border-b border-[#243a24] flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Portal Pasajeros • Compra en Línea
              </span>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Comprar Pasaje con Pago QR
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#182618] hover:bg-[#253a25] border border-[#2b442b] text-gray-300 hover:text-white flex items-center justify-center transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        {/* INDICADOR DE PASOS */}
        <div className="grid grid-cols-4 border-b border-[#1b2b1b] bg-[#0c130c] text-[11px] font-mono">
          <div className={`p-2.5 text-center font-bold flex items-center justify-center gap-1.5 ${paso === 1 ? "text-emerald-400 border-b-2 border-emerald-500 bg-emerald-950/20" : paso > 1 ? "text-emerald-500" : "text-gray-500"}`}>
            <span>1.</span> Itinerario
          </div>
          <div className={`p-2.5 text-center font-bold flex items-center justify-center gap-1.5 ${paso === 2 ? "text-emerald-400 border-b-2 border-emerald-500 bg-emerald-950/20" : paso > 2 ? "text-emerald-500" : "text-gray-500"}`}>
            <span>2.</span> Croquis Asiento
          </div>
          <div className={`p-2.5 text-center font-bold flex items-center justify-center gap-1.5 ${paso === 3 ? "text-emerald-400 border-b-2 border-emerald-500 bg-emerald-950/20" : paso > 3 ? "text-emerald-500" : "text-gray-500"}`}>
            <span>3.</span> Pago QR
          </div>
          <div className={`p-2.5 text-center font-bold flex items-center justify-center gap-1.5 ${paso === 4 ? "text-emerald-400 border-b-2 border-emerald-500 bg-emerald-950/20" : "text-gray-500"}`}>
            <span>4.</span> Boleto
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5 flex-1">
          {/* ======================================================== */}
          {/* PASO 1: SELECCIONAR ORIGEN, DESTINO, TIPO FLOTA Y FECHA */}
          {/* ======================================================== */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Ciudad de Origen</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                    <select
                      value={origen}
                      onChange={(e) => setOrigen(e.target.value)}
                      className="w-full bg-[#0c120c] border border-[#233523] rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    >
                      <option value="La Paz">La Paz (Terminal Central)</option>
                      <option value="Cochabamba">Cochabamba (Terminal Interdep.)</option>
                      <option value="Santa Cruz">Santa Cruz (Terminal Bimodal)</option>
                      <option value="Chuquisaca">Sucre (Terminal Central)</option>
                      <option value="Oruro">Oruro (Terminal)</option>
                      <option value="Potosí">Potosí (Terminal Nueva)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Ciudad de Destino</label>
                  <div className="relative">
                    <Navigation className="w-4 h-4 text-lime-400 absolute left-3 top-2.5" />
                    <select
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                      className="w-full bg-[#0c120c] border border-[#233523] rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    >
                      <option value="Santa Cruz">Santa Cruz (Terminal Bimodal)</option>
                      <option value="La Paz">La Paz (Terminal Central)</option>
                      <option value="Cochabamba">Cochabamba (Terminal Interdep.)</option>
                      <option value="Chuquisaca">Sucre (Terminal Central)</option>
                      <option value="Tarija">Tarija (Terminal)</option>
                      <option value="Potosí">Potosí (Terminal Nueva)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Tipo de Flota</label>
                  <div className="relative">
                    <Bus className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
                    <select
                      value={tipoFlotaFiltro}
                      onChange={(e) => setTipoFlotaFiltro(e.target.value)}
                      className="w-full bg-[#0c120c] border border-[#233523] rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    >
                      <option value="TODOS">Todos los Servicios</option>
                      <option value="LEITO">Leito Suite 180°</option>
                      <option value="BUS_CAMA">Bus Cama Confort</option>
                      <option value="SEMI_CAMA">Semi Cama Directo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Fecha de Viaje</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full bg-[#0c120c] border border-[#233523] rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* LISTA DE SALIDAS DISPONIBLES */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-gray-300 block">
                  Salidas disponibles para {origen} → {destino}:
                </span>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {salidasDisponibles.map((viaje) => {
                    const esSeleccionado = (viajeSeleccionado?.id || salidasDisponibles[0]?.id) === viaje.id;
                    return (
                      <div
                        key={viaje.id}
                        onClick={() => {
                          setViajeSeleccionado(viaje);
                          setPisoVista(1);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          esSeleccionado
                            ? "bg-[#182818] border-emerald-500 shadow-md shadow-emerald-950/40"
                            : "bg-[#0c120c] border-[#1e2e1e] hover:border-[#2f492f]"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-400" />
                              {viaje.horaSalida || "20:00"} hrs
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1d301d] text-lime-400 border border-lime-500/20">
                              {viaje.tipoFlota || "Bus Cama"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#9ca3af]">
                            Unidad: <strong className="text-white">{viaje.busPlaca || viaje.bus?.placa || "3849-TND"}</strong> • {viaje.origenNombre || origen} → {viaje.destinoNombre || destino}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-emerald-400 block">
                            Bs. {viaje.precioBasePiso1 || 160}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">Piso 1 / Piso 2</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!viajeSeleccionado && salidasDisponibles.length > 0) {
                      setViajeSeleccionado(salidasDisponibles[0]);
                    }
                    setPaso(2);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
                >
                  Continuar a Elección de Asiento
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 2: CROQUIS DE ASIENTOS CON EL FORMATO OFICIAL       */}
          {/* ======================================================== */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="bg-[#0b100b] border border-[#1d2b1d] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Salida y Flota:</span>
                  <strong className="text-white text-sm">
                    {viajeActivo?.tipoFlota || "Bus Cama"} &bull; {origen} → {destino}
                  </strong>
                  <p className="text-[11px] text-emerald-400 font-mono">
                    Hora: {viajeActivo?.horaSalida || "20:00"} hrs &bull; Placa: {viajeActivo?.busPlaca || viajeActivo?.bus?.placa || "3849-TND"}
                  </p>
                </div>

                {/* BOTONES DE CAMBIO DE PISO PARA FLOTAS DOBLE PLANTA */}
                {esDoblePiso && (
                  <div className="flex bg-[#121c12] p-1 rounded-xl border border-[#233523] text-xs">
                    <button
                      type="button"
                      onClick={() => setPisoVista(1)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        pisoVista === 1
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-[#9ca3af] hover:text-white"
                      }`}
                    >
                      Planta Baja (Piso 1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPisoVista(2)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        pisoVista === 2
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-[#9ca3af] hover:text-white"
                      }`}
                    >
                      Planta Alta (Piso 2)
                    </button>
                  </div>
                )}
              </div>

              {/* CONTENEDOR DEL CROQUIS DE ASIENTOS OFICIAL */}
              <div className="bg-[#090e09] border border-[#1e2c1e] rounded-2xl p-5 flex flex-col items-center">
                
                {/* ENCABEZADO DE PASILLO Y VENTANA SEGÚN NÚMERO DE COLUMNAS */}
                <div
                  className={`w-full max-w-sm grid gap-2.5 px-3 py-1 text-center text-[10px] font-mono font-bold uppercase text-[#9ca3af] border-b border-[#1e261e] mb-2 ${
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

                {/* GRILLA DE ASIENTOS EN TIEMPO REAL */}
                <div
                  className={`w-full max-w-sm grid gap-2.5 max-h-64 overflow-y-auto p-1 ${
                    esTresColumnas ? "grid-cols-3" : "grid-cols-4"
                  }`}
                >
                  {asientosVisibles.map((asiento) => {
                    const seleccionado = asientoSeleccionado?.numero === asiento.numero;
                    const disponible = asiento.disponible;

                    return (
                      <button
                        key={asiento.codigoAsiento}
                        type="button"
                        disabled={!disponible}
                        onClick={() => {
                          if (disponible) {
                            setAsientoSeleccionado({
                              numero: asiento.numero,
                              codigoAsiento: asiento.codigoAsiento,
                              piso: asiento.piso,
                              ubicacion: asiento.ubicacion,
                              columnaTipo: asiento.columnaTipo,
                              precio: asiento.tarifa
                            });
                          }
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          seleccionado
                            ? "bg-[#3d7912] text-white border-[#a3e635] ring-2 ring-[#a3e635] scale-105 shadow-md shadow-emerald-950/60"
                            : disponible
                            ? "bg-[#141b14] hover:bg-[#1a241a] text-[#f8fafc] border-[#223022] hover:border-[#4d8f1e] cursor-pointer"
                            : "bg-rose-950/30 text-rose-400 border-rose-900/40 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <span className="text-xs font-mono font-bold">{asiento.codigoAsiento}</span>
                        <span className="text-[10px] mt-0.5 font-medium">
                          {seleccionado ? "ELEGIDO" : disponible ? `Bs. ${asiento.tarifa}` : "OCUPADO"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* LEYENDA INFORMATIVA DEL CROQUIS */}
                <div className="mt-4 pt-3 border-t border-[#1e261e] flex flex-wrap items-center justify-center gap-5 text-xs text-[#9ca3af]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#141b14] border border-[#223022]"></span>
                    <span>Disponible</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#3d7912] border border-[#a3e635]"></span>
                    <span className="text-white font-bold">Tu Selección</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-950/40 border border-rose-900/60"></span>
                    <span className="text-rose-400">Ocupado</span>
                  </span>
                </div>
              </div>

              {asientoSeleccionado && (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      Plaza Seleccionada: <strong className="text-emerald-300 font-mono text-sm">{asientoSeleccionado.codigoAsiento}</strong> ({asientoSeleccionado.columnaTipo} &bull; Piso {asientoSeleccionado.piso})
                    </span>
                  </div>
                  <strong className="text-base font-mono text-emerald-400">
                    Bs. {asientoSeleccionado.precio}
                  </strong>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="px-4 py-2 bg-[#1b261b] hover:bg-[#253525] text-gray-300 rounded-xl text-xs font-semibold"
                >
                  Volver a Itinerarios
                </button>
                <button
                  type="button"
                  disabled={!asientoSeleccionado}
                  onClick={() => setPaso(3)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
                >
                  Continuar al Pago QR
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 3: DATOS DEL PASAJERO Y PAGO POR QR SIMPLE          */}
          {/* ======================================================== */}
          {paso === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Nombre y Apellido del Pasajero</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={nombrePasajero}
                      onChange={(e) => setNombrePasajero(e.target.value)}
                      placeholder="Ej. Juan Carlos Flores"
                      className="w-full bg-[#0c120c] border border-[#233523] rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9ca3af] mb-1">C.I. / Documento</label>
                  <input
                    type="text"
                    required
                    value={ciPasajero}
                    onChange={(e) => setCiPasajero(e.target.value)}
                    placeholder="Ej. 6849201 LP"
                    className="w-full bg-[#0c120c] border border-[#233523] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9ca3af] mb-1">Celular / WhatsApp (Para confirmación)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={telefonoPasajero}
                    onChange={(e) => setTelefonoPasajero(e.target.value)}
                    placeholder="Ej. 71584920"
                    className="w-full bg-[#0c120c] border border-[#233523] rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* CÓDIGO QR DIRECTO DE PAGO BANCARIO */}
              <div className="bg-[#0b100b] border border-[#213521] rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-300 flex-shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=OSASTUR-PAGO-ASIENTO-${asientoSeleccionado?.codigoAsiento}-BS-${asientoSeleccionado?.precio}`}
                    alt="QR de Pago Simple"
                    className="w-28 h-28"
                  />
                </div>

                <div className="space-y-1.5 text-xs text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                    <Sparkles className="w-3 h-3" />
                    Pago Rápido Simple QR (Banco Unión / BNB / BCP / Fassil)
                  </div>
                  <h4 className="font-bold text-white text-sm">
                    Total a Pagar: <span className="font-mono text-emerald-400 text-base">Bs. {asientoSeleccionado?.precio}</span>
                  </h4>
                  <p className="text-[11px] text-[#9ca3af] leading-relaxed">
                    Escanee el código QR desde cualquier aplicación bancaria boliviana. Al completar el pago, presione el botón inferior para confirmar y guardar su boleto de viaje.
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  className="px-4 py-2 bg-[#1b261b] hover:bg-[#253525] text-gray-300 rounded-xl text-xs font-semibold"
                >
                  Cambiar Asiento
                </button>
                <button
                  type="button"
                  disabled={guardandoCompra}
                  onClick={confirmarCompraYGenerarTicket}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {guardandoCompra ? "Confirmando Pago..." : "Ya Pagué por QR • Obtener Mi Boleto"}
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 4: VISUALIZAR Y GUARDAR / DESCARGAR TICKET          */}
          {/* ======================================================== */}
          {paso === 4 && ticketEmitido && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white">¡Compra Realizada con Éxito!</h3>
                <p className="text-xs text-[#9ca3af]">
                  Su asiento ha sido reservado y su código de abordaje QR está listo para ser presentado en terminal.
                </p>
              </div>

              {/* TICKET DIGITAL CON FORMATO EXACTO */}
              <div className="bg-white text-black p-5 rounded-2xl shadow-xl font-mono text-xs border border-gray-300 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <strong className="text-emerald-800 text-sm font-sans block">OSASTUR BOLIVIA</strong>
                    <span className="text-[10px] text-gray-500">Boleto Electrónico de Pasaje</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-black text-sm">{ticketEmitido.codigo}</span>
                    <span className="text-[10px] text-gray-500 block">{ticketEmitido.fechaEmision}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                  <div>
                    <span className="text-gray-500 text-[10px] block">PASAJERO</span>
                    <strong className="text-black uppercase">{ticketEmitido.nombre}</strong>
                    <span className="text-gray-600 block text-[10px]">C.I. {ticketEmitido.ci}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 text-[10px] block">ASIENTO ASIGNADO</span>
                    <strong className="text-emerald-700 text-sm block font-mono">{ticketEmitido.asiento}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">RUTA & SALIDA</span>
                    <strong className="text-black">{ticketEmitido.origen} → {ticketEmitido.destino}</strong>
                    <span className="text-gray-600 block text-[10px] font-mono">Hora: {ticketEmitido.horaSalida} hrs</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 text-[10px] block">TARIFA PAGADA</span>
                    <strong className="text-black font-mono text-sm">Bs. {ticketEmitido.precio}</strong>
                  </div>
                </div>

                <div className="border-t pt-3 flex items-center justify-between">
                  <div className="text-[10px] text-gray-600 font-sans">
                    Presente este código en el andén de abordaje.<br />
                    Unidad: <strong>{ticketEmitido.placa}</strong> &bull; {ticketEmitido.busTipo}
                  </div>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${ticketEmitido.codigo}`}
                    alt="QR Abordaje"
                    className="w-16 h-16 border p-0.5 rounded"
                  />
                </div>
              </div>

              {/* BOTONES DE GUARDAR / DESCARGAR */}
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onEmitirBoleto(ticketEmitido);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Guardar / Descargar Boleto
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-[#1b261b] hover:bg-[#253525] text-gray-300 rounded-xl text-xs font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
