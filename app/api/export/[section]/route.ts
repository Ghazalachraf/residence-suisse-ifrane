import { NextRequest } from 'next/server';
import { buildExport } from '@/lib/export';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { section: string } }) {
  try {
    const mois = req.nextUrl.searchParams.get('mois') ?? undefined;
    const { wb, name } = await buildExport(params.section, mois);
    const buf = await wb.xlsx.writeBuffer();
    return new Response(buf as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${name}.xlsx"`,
      },
    });
  } catch (e) {
    return new Response(`Export impossible : ${(e as Error).message}`, { status: 500 });
  }
}
