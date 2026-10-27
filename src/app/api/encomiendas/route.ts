import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/datos/db";

// GET /api/encomiendas: Obtiene encomiendas desde Neon PostgreSQL
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const codigo = searchParams.get("codigo");

    if (codigo) {
      const rows = await sql`
        SELECT e.*, 
               o.nombre as "origenNombre", d.nombre as "destinoNombre",
               u."nombreCompleto" as "operadorNombre"
        FROM "Encomienda" e
        JOIN "Sucursal" o ON e."origenId" = o.id
        JOIN "Sucursal" d ON e."destinoId" = d.id
        JOIN "Usuario" u ON e."usuarioId" = u.id
        WHERE e."codigoGuia" = ${codigo}
        LIMIT 1;
      `;
      return NextResponse.json({ success: true, encomienda: rows[0] || null });
    }

    const rows = await sql`
      SELECT e.*, 
             o.nombre as "origenNombre", d.nombre as "destinoNombre",
             u."nombreCompleto" as "operadorNombre"
      FROM "Encomienda" e
      JOIN "Sucursal" o ON e."origenId" = o.id
      JOIN "Sucursal" d ON e."destinoId" = d.id
      JOIN "Usuario" u ON e."usuarioId" = u.id
      ORDER BY e."fechaRegistro" DESC
      LIMIT 100;
    `;

    return NextResponse.json({
      success: true,
      total: rows.length,
      encomiendas: rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/encomiendas: Registra una nueva encomienda en Neon PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      descripcion,
      pesoKg,
      origenId,
      destinoId,
      nombreRemitente,
      ciRemitente,
      telRemitente,
      nombreDestinatario,
      ciDestinatario,
      telDestinatario,
      tarifaCalculada,
      usuarioId,
      viajeId
    } = body;

    if (!descripcion || !pesoKg || !nombreRemitente || !nombreDestinatario) {
      return NextResponse.json({ error: "Faltan datos obligatorios para registrar la encomienda" }, { status: 400 });
    }

    const id = `enc-${Date.now()}`;
    const randomNum = Math.floor(100 + Math.random() * 900);
    const codigoGuia = `ENC-2026-${randomNum}`;
    const qrHash = `OSASTUR-GUIA-${codigoGuia}-${id}`;
    
    // Obtener sucursal por defecto si no vienen
    const sOrigen = origenId || "suc-001";
    const sDestino = destinoId || "suc-002";
    const uId = usuarioId || "usr-005";

    const rows = await sql`
      INSERT INTO "Encomienda" (
        id, "codigoGuia", "origenId", "destinoId", "viajeId", "usuarioId",
        "nombreRemitente", "ciRemitente", "telRemitente",
        "nombreDestinatario", "ciDestinatario", "telDestinatario",
        descripcion, "pesoKg", "tarifaCalculada", estado, "qrHash", "fechaRegistro"
      ) VALUES (
        ${id}, ${codigoGuia}, ${sOrigen}, ${sDestino}, ${viajeId || null}, ${uId},
        ${nombreRemitente}, ${ciRemitente || "S/CI"}, ${telRemitente || "S/TEL"},
        ${nombreDestinatario}, ${ciDestinatario || "S/CI"}, ${telDestinatario || "S/TEL"},
        ${descripcion}, ${parseFloat(pesoKg) || 1.0}, ${parseFloat(tarifaCalculada) || 25.0},
        'RECEPCIONADO', ${qrHash}, NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({
      success: true,
      mensaje: `Encomienda ${codigoGuia} registrada con éxito en Neon DB.`,
      encomienda: rows[0]
    });
  } catch (error: any) {
    console.error("Error al registrar encomienda:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/encomiendas: Actualiza el estado (RECEPCIONADO, EN_TRANSITO, ARRIBADO_DESTINO, ENTREGADO)
export async function PUT(req: NextRequest) {
  try {
    const { id, estado } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID de encomienda requerido" }, { status: 400 });
    }

    const nuevoEstado = estado || "EN_TRANSITO";

    await sql`
      UPDATE "Encomienda"
      SET estado = ${nuevoEstado}::"EstadoEncomienda",
          "fechaEntrega" = ${nuevoEstado === 'ENTREGADO' ? sql`NOW()` : sql`"fechaEntrega"`}
      WHERE id = ${id};
    `;

    return NextResponse.json({
      success: true,
      mensaje: `Encomienda actualizada en Neon DB con estado '${nuevoEstado}'.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
