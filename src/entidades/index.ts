// definicion de interfaces y tipos de la capa de entidades del dominio

export type RolUsuario = 'GERENTE' | 'ADMIN' | 'BOLETERO' | 'BODEGUERO' | 'AUXILIAR_ABORDAJE' | 'CONDUCTOR';

export type EstadoAsiento = "DISPONIBLE" | "BLOQUEADO" | "VENDIDO" | "RESERVADO";

export type EstadoViaje = "PROGRAMADO" | "EN_EMBARQUE" | "EN_RUTA" | "FINALIZADO" | "CANCELADO";

export type EstadoEncomienda =
  | "RECEPCIONADO"
  | "EN_ESPERA"
  | "EN_TRANSITO"
  | "ARRIBADO_DESTINO"
  | "ENTREGADO"
  | "DEVUELTO";

export interface SucursalEntidad {
  id: string;
  nombre: string;
  departamento: string;
  direccion: string;
  telefono?: string | null;
}

export interface BusEntidad {
  id: string;
  placa: string;
  marcaModelo: string;
  pisos: number;
  totalAsientos: number;
  choferNombre?: string | null;
  activo: boolean;
}

export interface AsientoCroquis {
  id: string;
  numeroAsiento: number;
  piso: number;
  ubicacion: string;
  estado: EstadoAsiento;
  bloqueadoHasta?: Date | null;
  precio: number;
}
