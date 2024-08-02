import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/pt-br";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/error-client";
import { env } from "../env";

dayjs.locale("pt-br")
dayjs.extend(localizedFormat)

export async function confirmParticipant(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get("/participantes/:participanteId/confirmar", {
        schema: {
            params: z.object({
                participanteId: z.string().uuid()
            })
        }
    }, async (request, reply) => {
        const { participanteId } = request.params

        const participante = await prisma.participante.findUnique({
            where:{ id: participanteId }
        })

        if(!participante) {
            throw new ClientError("Participante não encontrado")
        }

        if(participante.confirmado) {
            return reply.redirect(`${env.WEB_BASE_URL}/viagens/${participante.viagem_id}`)
        }

        await prisma.participante.update({
            where:{ id: participanteId },
            data: { confirmado: true }
        })

        return reply.redirect(`${env.WEB_BASE_URL}/viagens/${participante.viagem_id}`)
    })
}