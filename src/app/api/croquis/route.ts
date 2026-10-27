import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/datos/db";

// GET /api/croquis?viajeId=xxx: Obtiene el croquis real de asientos y pasajeros desde Neon
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const viajeId = searchParams.get("viajeId");

    if (!viajeId) {
      return NextResponse.json({ error: "viajeId requerido" }, { status: 400 });
    }

    const asientos = await sql`
      SELECT 
        a.id, a."viajeId", a."numeroAsiento", a.piso, a.ubicacion, a.estado,
        b."codigoBoleto", b."nombrePasajero", b."ciPasajero", b.telefono, b."precioPagado",
        b.abordado, b."fechaEmision"
      FROM "AsientoViaje" a
      LEFT JOIN "Boleto" b ON b."asientoViajeId" = a.id
      WHERE a."viajeId" = ${viajeId}
      ORDER BY a.piso ASC, a."numeroAsiento" ASC;
    `;

    return NextResponse.json({
      success: true,
      total: asientos.length,
      asientos,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
