import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/datos/db";

export async function GET() {
  try {
    const rows = await sql`SELECT id, placa, "marcaModelo", "tipoFlota", pisos, "totalAsientos", "choferNombre", activo, "createdAt" FROM "Bus" ORDER BY "createdAt" DESC;`;
    return NextResponse.json({ success: true, total: rows.length, flotas: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { placa, marcaModelo, tipoFlota, pisos, totalAsientos, choferNombre } = body;

    if (!placa || !marcaModelo || !totalAsientos) {
      return NextResponse.json({ error: "Placa, modelo y total asientos son requeridos" }, { status: 400 });
    }

    const cleanPlaca = placa.trim().toUpperCase();
    const id = `bus-${Date.now()}`;
    const tipoValido = tipoFlota || "LEITO_SUIUE_DOBLE_PISO";
    const numPisos = parseInt(pisos) || (tipoValido.includes("DOBLE") ? 2 : 1);
    const numAsientos = parseInt(totalAsientos) || 40;
    const conductor = choferNombre || "Por Asignar";

    const rows = await sql`INSERT INTO "Bus" (id, placa, "marcaModelo", "tipoFlota", pisos, "totalAsientos", "choferNombre", activo, "createdAt") VALUES (${id}, ${cleanPlaca}, ${marcaModelo}, ${tipoValido}::"TipoFlota", ${numPisos}, ${numAsientos}, ${conductor}, true, NOW()) RETURNING *;`;
    return NextResponse.json({ success: true, mensaje: `Unidad ${cleanPlaca} registrada en el parque automotor de Neon DB.`, bus: rows[0] });
  } catch (error: any) {
    console.error("Error al registrar bus:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, choferNombre, activo } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de bus requerido" }, { status: 400 });
    }

    if (activo !== undefined && choferNombre === undefined) {
      await sql`UPDATE "Bus" SET activo = ${Boolean(activo)} WHERE id = ${id};`;
      return NextResponse.json({
        success: true,
        mensaje: activo
          ? `Flota reactivada y habilitada para asignacion de itinerarios.`
          : `Flota dada de baja del parque automotor (borrado logico sin afectar boletos historicos).`
      });
    }

    await sql`UPDATE "Bus" SET "choferNombre" = COALESCE(${choferNombre}, "choferNombre"), activo = COALESCE(${activo}, activo) WHERE id = ${id};`;
    return NextResponse.json({ success: true, mensaje: `Flota ${id} actualizada con exito.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const activoParam = searchParams.get("activo");

    if (!id) {
      return NextResponse.json({ error: "ID de flota requerido" }, { status: 400 });
    }

    const nuevoActivo = activoParam !== null ? activoParam === "true" : false;
    await sql`UPDATE "Bus" SET activo = ${nuevoActivo} WHERE id = ${id};`;
    return NextResponse.json({
      success: true,
      mensaje: nuevoActivo
        ? "Unidad reactivada exitosamente."
        : "Unidad dada de baja exitosamente (borrado logico conservando integridad referencial)."
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
