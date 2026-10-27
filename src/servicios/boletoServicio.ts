import { sql } from "../datos/db";

// servicios de logica de negocio para venta y bloqueo de boletos
export class BoletoServicio {
  // consulta viajes disponibles segun origen destino y fecha
  static async buscarViajes(origenId: string, destinoId: string, fecha: Date) {
    return await sql`
      SELECT v.*, b.placa, b."marcaModelo", b."tipoFlota", o.nombre as "origenNombre", d.nombre as "destinoNombre"
      FROM "Viaje" v
      JOIN "Bus" b ON v."busId" = b.id
      JOIN "Sucursal" o ON v."origenId" = o.id
      JOIN "Sucursal" d ON v."destinoId" = d.id
      WHERE v."origenId" = ${origenId} AND v."destinoId" = ${destinoId}
      ORDER BY v."fechaHoraSalida" ASC;
    `;
  }

  // bloquea temporalmente un asiento durante el proceso de compra
  static async bloquearAsiento(viajeId: string, numeroAsiento: number, usuarioId: string) {
    const minutosBloqueo = 10;
    const expira = new Date(Date.now() + minutosBloqueo * 60 * 1000);

    const res = await sql`
      UPDATE "AsientoViaje"
      SET estado = 'BLOQUEADO', "bloqueadoHasta" = ${expira}, "bloqueadoPor" = ${usuarioId}
      WHERE "viajeId" = ${viajeId} AND "numeroAsiento" = ${numeroAsiento} AND estado = 'DISPONIBLE'
      RETURNING *;
    `;

    if (res.length === 0) {
      throw new Error("El asiento seleccionado ya no se encuentra disponible.");
    }
    return res[0];
  }

  // confirma la venta de un boleto y genera su identificador QR
  static async confirmarVenta(datos: {
    asientoViajeId: string;
    usuarioId: string;
    nombrePasajero: string;
    ciPasajero: string;
    telefono?: string;
    precioPagado: number;
  }) {
    const codBoleto = `BOL-${Math.floor(100000 + Math.random() * 900000)}`;
    const qrHash = `OSASTUR-${codBoleto}-${datos.asientoViajeId}`;

    await sql`
      UPDATE "AsientoViaje"
      SET estado = 'VENDIDO', "bloqueadoHasta" = NULL, "bloqueadoPor" = NULL
      WHERE id = ${datos.asientoViajeId};
    `;

    const res = await sql`
      INSERT INTO "Boleto" (
        id, "codigoBoleto", "asientoViajeId", "usuarioId",
        "nombrePasajero", "ciPasajero", telefono, "precioPagado",
        "qrHash", abordado
      ) VALUES (
        gen_random_uuid(), ${codBoleto}, ${datos.asientoViajeId}, ${datos.usuarioId},
        ${datos.nombrePasajero}, ${datos.ciPasajero}, ${datos.telefono || null}, ${datos.precioPagado},
        ${qrHash}, false
      )
      RETURNING *;
    `;

    return res[0];
  }
}
