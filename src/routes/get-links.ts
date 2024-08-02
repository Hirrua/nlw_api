import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import "dayjs/locale/pt-br";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/error-client";

export async function getLink(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get("/viagens/:viagemId/links", {
        schema: {
            params: z.object({
                viagemId: z.string().uuid()
            })
        }
    }, async(request) => {
        const { viagemId } = request.params

        const trip = await prisma.viagem.findUnique({
            where: { id: viagemId },
            include: { links: true }
        })

        if(!trip) {
            throw new ClientError("Viagem não encontrada")
        }

        return { links: trip.links }
    })
}