import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/error-client";

export async function getTripDetails(app:FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get("/viagens/:viagemId", {
        schema: {
            params: z.object({
                viagemId: z.string().uuid()
            })
        }
    },
    async (request) =>{
        const  { viagemId } = request.params
        
        const trip = await prisma.viagem.findUnique({
            select: {
                id: true,
                destino: true,
                comeca_em: true,
                termina_em: true,
                confirmado: true
            },
            where: { id: viagemId }
        })

        if(!trip) {
            throw new ClientError("Viagem não encontrada")
        }

        return { trip }
    })
}