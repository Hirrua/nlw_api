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

export async function updateTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().put("/viagens/:viagemId", {
        schema: {
            params: z.object({
                viagemId: z.string().uuid()
            }),
            body: z.object({
                destino: z.string().min(4),
                comeca_em: z.coerce.date(),
                termina_em: z.coerce.date()
            })
        }
    }, async(request) => {
        const { viagemId } = request.params 
        const { destino, comeca_em, termina_em } = request.body

        const trip = await prisma.viagem.findUnique({
            where: { id: viagemId }
        })

        if (!trip) {
            throw new ClientError("Viagem não encontrada")
        }

        if(dayjs(comeca_em).isBefore(new Date())) {
            throw new ClientError("Data de inicio da viagem inválida.")
        }

        if(dayjs(termina_em).isBefore(comeca_em)) {
            throw new ClientError("Data de termino da viagem inválida.")
        }

        await prisma.viagem.update({
            where: { id: viagemId },
            data: {
                destino,
                comeca_em,
                termina_em
            }
        })

        return { tripId: trip.id }
    })
}