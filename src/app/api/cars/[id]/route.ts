export const runtime = 'nodejs';

import { prisma } from '../../../../lib/prisma';

export async function GET(_req: Request, context: { params: { id: string } }): Promise<Response> {
  try {
    const id = context.params.id;
    const car = await prisma.car.findUnique({ where: { id } });
    if (!car) return new Response('Not found', { status: 404 });
    return Response.json(car);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}


