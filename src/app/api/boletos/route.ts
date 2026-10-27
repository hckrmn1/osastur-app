import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/datos/db";

// POST /api/boletos: Registra una venta real en Neon PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const { viajeId, numeroAsiento, piso, nombrePasajero, ciPasajero, telefono, precioPagado, usuarioId } = await req.json();

    if (!viajeId || !numeroAsiento || !nombrePasajero || !ciPasajero) {
      return NextResponse.json({ error: "Faltan datos obligatorios para emitir el boleto" }, { status: 400 });
    }

    // 1. Buscar el asiento en la base de datos
    const asientos = await sql`
      SELECT id, estado FROM "AsientoViaje"
      WHERE "viajeId" = ${viajeId} AND "numeroAsiento" = ${numeroAsiento} AND piso = ${piso || 1}
      LIMIT 1;
    `;

    let asientoId = "";
    if (asientos.length > 0) {
      asientoId = asientos[0].id;
      // Actualizar estado del asiento a VENDIDO
      await sql`
        UPDATE "AsientoViaje"
        SET estado = 'VENDIDO', "bloqueadoHasta" = NULL, "bloqueadoPor" = NULL
        WHERE id = ${asientoId};
      `;
    } else {
      // Si el asiento no estaba creado en la BD, crearlo
      asientoId = `as-${viajeId}-P${piso || 1}-${numeroAsiento}`;
      await sql`
        INSERT INTO "AsientoViaje" (id, "viajeId", "numeroAsiento", piso, ubicacion, estado)
        VALUES (${asientoId}, ${viajeId}, ${numeroAsiento}, ${piso || 1}, 'VENTANA', 'VENDIDO')
        ON CONFLICT ("viajeId", "numeroAsiento", piso) DO UPDATE SET estado = 'VENDIDO';
      `;
    }

    // 2. Generar código y hash QR
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const codigoBoleto = `BOL-2026-${randomNum}`;
    const qrHash = `OSASTUR-${codigoBoleto}-${asientoId}`;
    const boletoId = `bol-${Date.now()}`;
    const idOperador = usuarioId || "usr-bol1";

    // 3. Insertar el boleto en la tabla Boleto de Neon
    const boletoInsertado = await sql`
      INSERT INTO "Boleto" (
        id, "codigoBoleto", "asientoViajeId", "usuarioId",
        "nombrePasajero", "ciPasajero", telefono, "precioPagado",
        "qrHash", abordado, "fechaEmision"
      ) VALUES (
        ${boletoId}, ${codigoBoleto}, ${asientoId}, ${idOperador},
        ${nombrePasajero}, ${ciPasajero}, ${telefono || null}, ${precioPagado || 80.00},
        ${qrHash}, false, NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({
      success: true,
      boleto: boletoInsertado[0],
      codigoBoleto,
      qrHash
    });
  } catch (error: any) {
    console.error("Error al emitir boleto en Neon:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
