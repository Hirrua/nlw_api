import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import "dayjs/locale/pt-br";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/error-client";

export async function getParticipants(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get("/viagens/:viagemId/participantes", {
        schema: {
            params: z.object({
                viagemId: z.string().uuid()
            })
        }
    }, async(request) => {
        const { viagemId } = request.params

        const trip = await prisma.viagem.findUnique({
            where: { id: viagemId },
            include: { participantes: {
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    confirmado: true
                }
            } }
        })

        if(!trip) {
            throw new ClientError("Viagem não encontrada")
        }

        return { participants: trip.participantes }
    })
}