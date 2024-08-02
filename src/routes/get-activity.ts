import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import "dayjs/locale/pt-br";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import dayjs from "dayjs";
import { ClientError } from "../errors/error-client";

export async function getActivity(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get("/viagens/:viagemId/atividades", {
        schema: {
            params: z.object({
                viagemId: z.string().uuid()
            })
        }
    }, async(request) => {
        const { viagemId } = request.params

        const trip = await prisma.viagem.findUnique({
            where: { id: viagemId },
            include: { 
                atividades: {
                    orderBy: {
                        quando: "asc"
                    }
            } }
        })

        if(!trip) {
            throw new ClientError("Viagem não encontrada")
        }

        const diferencaDiasViagem = dayjs(trip.termina_em).diff(trip.comeca_em, "days")

        const activies = Array.from({ length: diferencaDiasViagem + 1 }).map((_, index) => {
            const date = dayjs(trip.comeca_em).add(index, "days")

            return {
                data: date.toDate(),
                atividades: trip.atividades.filter(atividades => {
                    return dayjs(atividades.quando).isSame(date, "day")
                })
            }
        })

        return { activies }
    })
}