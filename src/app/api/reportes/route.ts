import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/datos/db";

// GET /api/reportes: Métricas reales consolidadas a nivel nacional para Gerencia (ESS/MIS)
export async function GET() {
  try {
    // 1. Total ingresos por venta de boletos
    const ingBoletos = await sql`SELECT COALESCE(SUM("precioPagado"), 0) as total FROM "Boleto";`;
    // 2. Total ingresos por encomiendas
    const ingEncomiendas = await sql`SELECT COALESCE(SUM("tarifaCalculada"), 0) as total FROM "Encomienda";`;
    // 3. Conteo boletos
    const cantBoletos = await sql`SELECT COUNT(*) as total FROM "Boleto";`;
    // 4. Conteo pasajeros abordados
    const cantAbordados = await sql`SELECT COUNT(*) as total FROM "Boleto" WHERE abordado = true;`;
    // 5. Total viajes activos
    const cantViajes = await sql`SELECT COUNT(*) as total FROM "Viaje";`;
    // 6. Ingresos agrupados por departamento de origen
    const porDepto = await sql`
      SELECT s.departamento, COUNT(b.id) as "boletosVendidos", COALESCE(SUM(b."precioPagado"), 0) as "recaudacion"
      FROM "Sucursal" s
      JOIN "Viaje" v ON v."origenId" = s.id
      JOIN "AsientoViaje" a ON a."viajeId" = v.id
      JOIN "Boleto" b ON b."asientoViajeId" = a.id
      GROUP BY s.departamento
      ORDER BY "recaudacion" DESC;
    `;

    return NextResponse.json({
      success: true,
      kpis: {
        totalIngresosBoletos: Number(ingBoletos[0].total),
        totalIngresosEncomiendas: Number(ingEncomiendas[0].total),
        totalIngresosGeneral: Number(ingBoletos[0].total) + Number(ingEncomiendas[0].total),
        totalBoletosEmitidos: Number(cantBoletos[0].total),
        totalPasajerosAbordados: Number(cantAbordados[0].total),
        totalViajesProgramados: Number(cantViajes[0].total)
      },
      departamentos: porDepto
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
