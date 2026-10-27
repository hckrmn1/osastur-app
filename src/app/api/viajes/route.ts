import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/datos/db";

export async function GET(req: NextRequest) {
  try {
    const rows = await sql`
      SELECT 
        v.id, v."fechaHoraSalida", v."fechaHoraLlegadaEst", v."precioBasePiso1", v."precioBasePiso2", v.estado,
        b.id as "busId", b.placa, b."marcaModelo", b."tipoFlota", b.pisos, b."totalAsientos", b."choferNombre",
        o.nombre as "origenNombre", o.departamento as "origenDepto", o.id as "origenId",
        d.nombre as "destinoNombre", d.departamento as "destinoDepto", d.id as "destinoId"
      FROM "Viaje" v
      JOIN "Bus" b ON v."busId" = b.id
      JOIN "Sucursal" o ON v."origenId" = o.id
      JOIN "Sucursal" d ON v."destinoId" = d.id
      ORDER BY v."fechaHoraSalida" ASC
      LIMIT 100;
    `;
    return NextResponse.json({ success: true, total: rows.length, viajes: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { busId, origenId, destinoId, fechaHoraSalida, fechaHoraLlegadaEst, precioBasePiso1, precioBasePiso2 } = await req.json();
    if (!busId || !origenId || !destinoId || !fechaHoraSalida || !precioBasePiso1) {
      return NextResponse.json({ error: "Datos incompletos para crear el viaje" }, { status: 400 });
    }
    const viajeId = `viaje-${Date.now()}`;
    const salidaDate = new Date(fechaHoraSalida);
    const llegadaDate = fechaHoraLlegadaEst ? new Date(fechaHoraLlegadaEst) : new Date(salidaDate.getTime() + 10 * 3600 * 1000);
    const p1 = parseFloat(precioBasePiso1) || 180;
    const p2 = precioBasePiso2 ? parseFloat(precioBasePiso2) : p1 * 1.2;
    const rows = await sql`
      INSERT INTO "Viaje" (
        id, "busId", "origenId", "destinoId",
        "fechaHoraSalida", "fechaHoraLlegadaEst",
        "precioBasePiso1", "precioBasePiso2", estado, "createdAt"
      ) VALUES (
        ${viajeId}, ${busId}, ${origenId}, ${destinoId},
        ${salidaDate}, ${llegadaDate},
        ${p1}, ${p2},
        'PROGRAMADO', NOW()
      )
      RETURNING *;
    `;
    return NextResponse.json({
      success: true,
      mensaje: `Viaje ${viajeId} programado exitosamente en Neon PostgreSQL.`,
      viaje: rows[0]
    });
  } catch (error: any) {
    console.error("Error al crear viaje:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { viajeId, id, estado } = await req.json();
    const targetId = viajeId || id;
    if (!targetId) {
      return NextResponse.json({ error: "ID de viaje requerido" }, { status: 400 });
    }
    const nuevoEstado = estado || "CANCELADO";
    await sql`
      UPDATE "Viaje"
      SET estado = ${nuevoEstado}
      WHERE id = ${targetId};
    `;
    return NextResponse.json({
      success: true,
      mensaje: `Viaje ${targetId} actualizado a estado '${nuevoEstado}' (borrado logico / cancelacion).`,
      estado: nuevoEstado
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const estadoParam = searchParams.get("estado") || "CANCELADO";

    if (!id) {
      return NextResponse.json({ error: "ID de viaje requerido" }, { status: 400 });
    }

    await sql`
      UPDATE "Viaje"
      SET estado = ${estadoParam}
      WHERE id = ${id};
    `;

    return NextResponse.json({
      success: true,
      mensaje: `Viaje ${id} cancelado con exito (borrado logico conservando pasajes vendidos).`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
