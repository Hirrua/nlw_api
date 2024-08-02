import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import "dayjs/locale/pt-br";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/error-client";

export async function getParticipant(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get("/participantes/:participanteId", {
        schema: {
            params: z.object({
                participanteId: z.string().uuid()
            })
        }
    }, async(request) => {
        const { participanteId } = request.params

        const participant = await prisma.participante.findUnique({
            select: {
                id: true,
                nome: true,
                email: true,
                confirmado: true
            },
            where: { id: participanteId },
            })

        if(!participant) {
            throw new ClientError("Participante não encontrado")
        }

        return { participant }
    })
}