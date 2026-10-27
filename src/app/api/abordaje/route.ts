import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/datos/db";

// POST /api/abordaje: Valida el código QR real y actualiza el abordaje en la base de datos Neon
export async function POST(req: NextRequest) {
  try {
    const { codigo } = await req.json();

    if (!codigo) {
      return NextResponse.json({ error: "Código QR requerido" }, { status: 400 });
    }

    const limpio = codigo.trim();

    // 1. Buscar en la tabla Boleto por código de boleto o por qrHash
    const boletos = await sql`
      SELECT 
        b.id as "boletoId", b."codigoBoleto", b."nombrePasajero", b."ciPasajero", b.abordado,
        a.id as "asientoId", a."numeroAsiento", a.piso, a.ubicacion, a."viajeId",
        v."fechaHoraSalida", o.nombre as "origen", d.nombre as "destino",
        bus."marcaModelo", bus.placa
      FROM "Boleto" b
      JOIN "AsientoViaje" a ON b."asientoViajeId" = a.id
      JOIN "Viaje" v ON a."viajeId" = v.id
      JOIN "Sucursal" o ON v."origenId" = o.id
      JOIN "Sucursal" d ON v."destinoId" = d.id
      JOIN "Bus" bus ON v."busId" = bus.id
      WHERE b."codigoBoleto" = ${limpio} OR b."qrHash" = ${limpio} OR b."codigoBoleto" ILIKE ${'%' + limpio + '%'}
      LIMIT 1;
    `;

    if (boletos.length === 0) {
      return NextResponse.json({
        success: false,
        encontrado: false,
        error: "Código no encontrado en el sistema nacional de boletos."
      }, { status: 404 });
    }

    const b = boletos[0];

    if (b.abordado) {
      return NextResponse.json({
        success: false,
        yaAbordado: true,
        boleto: b,
        mensaje: `¡Alerta! El pasajero ${b.nombrePasajero} (Asiento ${b.numeroAsiento}) ya fue validado previamente.`
      });
    }

    // 2. Actualizar en Neon PostgreSQL como abordado = true
    await sql`
      UPDATE "Boleto"
      SET abordado = true
      WHERE id = ${b.boletoId};
    `;

    return NextResponse.json({
      success: true,
      encontrado: true,
      boleto: {
        ...b,
        abordado: true
      },
      mensaje: `Abordaje Confirmado: Pasajero ${b.nombrePasajero} registrado en Asiento ${b.numeroAsiento}.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
