export type TipoFlotaBolivia = 'SEMI_CAMA' | 'BUS_CAMA' | 'LEITO_TOTAL';

export interface AsientoCroquis {
  numero: number;
  codigoAsiento: string; // Ej: 'V1', 'P2', 'P3', 'V4'
  ubicacion: 'VENTANA' | 'PASILLO';
  columnaTipo: string;   // 'Ventana Izq', 'Pasillo Izq', 'Pasillo Der', 'Ventana Der'
  piso: number;
  estado: 'DISPONIBLE' | 'BLOQUEADO' | 'VENDIDO' | 'ABORDAJE_CONFIRMADO';
  tarifa: number;
  abordado: boolean;
  horaAbordaje?: string;
  horaValidacion?: string;
  pasajeroNombre?: string;
  pasajeroCI?: string;
  boletoCodigo?: string;
}

export interface BusFlota {
  id: string;
  placa: string;
  marcaModelo: string;
  tipoFlota: TipoFlotaBolivia;
  nombreComercial: string;
  pisos: number;
  totalAsientos: number;
  choferNombre: string;
  conductorNombre?: string;
  auxiliarNombre: string;
  distribucionPiso1: string;
  distribucionPiso2?: string;
  reclinacion: string;
  columnas: number;
}

export interface SalidaProgramada {
  id: string;
  busId: string;
  origen: string;
  destino: string;
  terminalSalida: string;
  terminalLlegada: string;
  horaSalida: string;
  andenSalida: string;
  estado: string;
  tarifa: number;
}

export const TIPOLOGIAS_FLOTAS_BOLIVIA: BusFlota[] = [
  {
    id: 'BUS-SEMICAMA',
    placa: '2841-NJP',
    marcaModelo: 'Scania K310 / Marcopolo G7 1200',
    tipoFlota: 'SEMI_CAMA',
    nombreComercial: 'Servicio Semi-Cama (1 Piso)',
    pisos: 1,
    columnas: 4, // Ventana - Pasillo | Pasillo - Ventana
    totalAsientos: 44,
    distribucionPiso1: '4 Columnas: [Ventana Izq] [Pasillo Izq] - [Pasillo Der] [Ventana Der]',
    reclinacion: '140°',
    choferNombre: 'Don José Alvarez Quispe',
    auxiliarNombre: 'Marcos Pinto Mamani'
  },
  {
    id: 'BUS-CAMA1',
    placa: '4921-KLR',
    marcaModelo: 'Mercedes-Benz O500 / Irizar i6',
    tipoFlota: 'BUS_CAMA',
    nombreComercial: 'Servicio Bus Cama (1 Piso)',
    pisos: 1,
    columnas: 3, // Ventana - Pasillo | Ventana Individual
    totalAsientos: 32,
    distribucionPiso1: '3 Columnas: [Ventana Izq] [Pasillo Izq] - [Ventana Individual]',
    reclinacion: '160°',
    choferNombre: 'Roberto Vaca Carrasco',
    auxiliarNombre: 'Carlos Mamani Choque'
  },
  {
    id: 'BUS-LEITO-TOTAL',
    placa: '3849-TND',
    marcaModelo: 'Volvo B430R / Marcopolo G8 1800 DD',
    tipoFlota: 'LEITO_TOTAL',
    nombreComercial: 'Servicio Leito Suite 180° (Doble Piso)',
    pisos: 2,
    columnas: 3, // Ventana - Pasillo | Ventana Individual (Camas)
    totalAsientos: 26,
    distribucionPiso1: 'Planta Baja: 8 Camas [Ventana] [Pasillo] - [Ventana]',
    distribucionPiso2: 'Planta Alta: 18 Camas [Ventana] [Pasillo] - [Ventana]',
    reclinacion: '180° (horizontal total abajo y arriba)',
    choferNombre: 'Don Mario Condori Tito',
    auxiliarNombre: 'Juan Carlos Condori'
  }
];

export const SALIDAS_HOY_EN_ANDEN: SalidaProgramada[] = [
  {
    id: 'VIAJE-LP-SCZ-01',
    busId: 'BUS-LEITO-TOTAL',
    origen: 'La Paz',
    destino: 'Santa Cruz',
    terminalSalida: 'Terminal Central La Paz',
    terminalLlegada: 'Terminal Bimodal Santa Cruz',
    horaSalida: '19:30',
    andenSalida: 'Andén #12',
    estado: 'EN_EMBARQUE',
    tarifa: 260
  },
  {
    id: 'VIAJE-CBB-LP-02',
    busId: 'BUS-CAMA1',
    origen: 'Cochabamba',
    destino: 'La Paz',
    terminalSalida: 'Terminal de Buses Cochabamba',
    terminalLlegada: 'Terminal Central La Paz',
    horaSalida: '20:00',
    andenSalida: 'Andén #05',
    estado: 'EN_EMBARQUE',
    tarifa: 140
  },
  {
    id: 'VIAJE-LP-ORU-03',
    busId: 'BUS-SEMICAMA',
    origen: 'La Paz',
    destino: 'Oruro',
    terminalSalida: 'Terminal Central La Paz',
    terminalLlegada: 'Terminal Hernando Siles Oruro',
    horaSalida: '21:30',
    andenSalida: 'Andén #02',
    estado: 'PROGRAMADO',
    tarifa: 60
  }
];

export function generarCroquisPorFlota(bus: BusFlota, salida: SalidaProgramada): AsientoCroquis[] {
  const asientos: AsientoCroquis[] = [];

  if (bus.tipoFlota === 'SEMI_CAMA') {
    // 4 COLUMNAS: Ventana Izq, Pasillo Izq, Pasillo Der, Ventana Der
    for (let i = 1; i <= 44; i++) {
      const colIndex = (i - 1) % 4;
      const esVentana = (colIndex === 0 || colIndex === 3);
      const codigoAsiento = (esVentana ? 'V' : 'P') + i;
      const columnaTipo = colIndex === 0 ? 'Ventana Izq' : colIndex === 1 ? 'Pasillo Izq' : colIndex === 2 ? 'Pasillo Der' : 'Ventana Der';

      const esVendido = (i <= 12);
      const yaAbordo = (i <= 5);
      asientos.push({
        numero: i,
        codigoAsiento,
        ubicacion: esVentana ? 'VENTANA' : 'PASILLO',
        columnaTipo,
        piso: 1,
        estado: esVendido ? 'VENDIDO' : 'DISPONIBLE',
        tarifa: salida.tarifa,
        abordado: yaAbordo,
        horaAbordaje: yaAbordo ? '21:15' : undefined,
        pasajeroNombre: esVendido ? ('Pasajero Asiento ' + codigoAsiento) : undefined,
        pasajeroCI: esVendido ? ('68491' + i + ' LP') : undefined,
        boletoCodigo: esVendido ? ('TKT-SC-' + codigoAsiento) : undefined
      });
    }
  } else if (bus.tipoFlota === 'BUS_CAMA') {
    // 3 COLUMNAS: Ventana Izq, Pasillo Izq, Ventana Der Individual
    for (let i = 1; i <= 32; i++) {
      const colIndex = (i - 1) % 3;
      const esVentana = (colIndex === 0 || colIndex === 2);
      const codigoAsiento = (esVentana ? 'V' : 'P') + i;
      const columnaTipo = colIndex === 0 ? 'Ventana Izq' : colIndex === 1 ? 'Pasillo Izq' : 'Ventana Der (Individual)';

      const esVendido = (i <= 10);
      const yaAbordo = (i <= 4);
      asientos.push({
        numero: i,
        codigoAsiento,
        ubicacion: esVentana ? 'VENTANA' : 'PASILLO',
        columnaTipo,
        piso: 1,
        estado: esVendido ? 'VENDIDO' : 'DISPONIBLE',
        tarifa: salida.tarifa,
        abordado: yaAbordo,
        horaAbordaje: yaAbordo ? '20:45' : undefined,
        pasajeroNombre: esVendido ? (i === 1 ? 'Dra. Gabriela Soliz' : i === 2 ? 'Ing. Marcelo Torrez' : 'Pasajero ' + codigoAsiento) : undefined,
        pasajeroCI: esVendido ? (i === 1 ? '6849204 LP' : '72908' + i + ' CB') : undefined,
        boletoCodigo: esVendido ? ('TKT-CM-' + codigoAsiento) : undefined
      });
    }
  } else {
    // LEITO TOTAL 180°: 3 COLUMNAS: Ventana Izq, Pasillo Izq, Ventana Der Individual
    // Planta Baja: 8 Camas
    for (let i = 1; i <= 8; i++) {
      const colIndex = (i - 1) % 3;
      const esVentana = (colIndex === 0 || colIndex === 2);
      const codigoAsiento = (esVentana ? 'V' : 'P') + i;
      const columnaTipo = colIndex === 0 ? 'Ventana Izq' : colIndex === 1 ? 'Pasillo Izq' : 'Ventana Der (Individual)';

      const esVendido = (i === 1 || i === 2 || i === 5);
      const yaAbordo = (i === 1);
      asientos.push({
        numero: i,
        codigoAsiento,
        ubicacion: esVentana ? 'VENTANA' : 'PASILLO',
        columnaTipo,
        piso: 1,
        estado: esVendido ? 'VENDIDO' : i === 4 ? 'BLOQUEADO' : 'DISPONIBLE',
        tarifa: salida.tarifa,
        abordado: yaAbordo,
        horaAbordaje: yaAbordo ? '19:12' : undefined,
        pasajeroNombre: esVendido ? (i === 1 ? 'Dra. Gabriela Soliz Arce' : 'Ing. Fernando Rojas') : undefined,
        pasajeroCI: esVendido ? '6849204 LP' : undefined,
        boletoCodigo: esVendido ? ('TKT-LT-' + codigoAsiento) : undefined
      });
    }
    // Planta Alta: 18 Camas (i = 9 a 26)
    for (let i = 9; i <= 26; i++) {
      const colIndex = (i - 9) % 3;
      const esVentana = (colIndex === 0 || colIndex === 2);
      const codigoAsiento = (esVentana ? 'V' : 'P') + i;
      const columnaTipo = colIndex === 0 ? 'Ventana Izq' : colIndex === 1 ? 'Pasillo Izq' : 'Ventana Der (Individual)';

      const esVendido = (i >= 9 && i <= 16);
      const yaAbordo = (i === 9 || i === 10 || i === 13);
      asientos.push({
        numero: i,
        codigoAsiento,
        ubicacion: esVentana ? 'VENTANA' : 'PASILLO',
        columnaTipo,
        piso: 2,
        estado: esVendido ? 'VENDIDO' : 'DISPONIBLE',
        tarifa: salida.tarifa,
        abordado: yaAbordo,
        horaAbordaje: yaAbordo ? '19:20' : undefined,
        pasajeroNombre: esVendido ? ('Pasajero Cama ' + codigoAsiento) : undefined,
        pasajeroCI: esVendido ? ('71928' + i + ' LP') : undefined,
        boletoCodigo: esVendido ? ('TKT-LT-' + codigoAsiento) : undefined
      });
    }
  }
  return asientos;
}
