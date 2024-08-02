import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/pt-br";
import { z } from "zod";
import dayjs from "dayjs";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/error-client";

dayjs.locale("pt-br")
dayjs.extend(localizedFormat)

export async function createActivity(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post("/viagens/:viagemId/atividades", {
        schema: {
            params: z.object({
                viagemId: z.string().uuid()
            }),
            body: z.object({
                titulo: z.string().min(4),
                quando: z.coerce.date()
            })
        }
    }, async(request) => {
        const { viagemId } = request.params
        const { titulo, quando } = request.body

        const trip = await prisma.viagem.findUnique({
            where: { id: viagemId }
        })

        if(!trip) {
            throw new ClientError("Viagem não encontrada")
        }

        if(dayjs(quando).isBefore(trip.comeca_em)) {
            throw new ClientError("Data invalida para atividade")
        }

        if(dayjs(quando).isAfter(trip.termina_em)) {
            throw new ClientError("Data invalida para atividade")
        }

        const activity = await prisma.atividade.create({
            data: { titulo, quando, viagem_id: viagemId }
        })

        return { activityId: activity.id }
    })
}