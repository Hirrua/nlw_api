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

export async function createLink(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post("/viagens/:viagemId/links", {
        schema: {
            params: z.object({
                viagemId: z.string().uuid()
            }),
            body: z.object({
                titulo: z.string().min(4),
                url: z.string().url()
            })
        }
    }, async(request) => {
        const { viagemId } = request.params
        const { titulo, url } = request.body

        const trip = await prisma.viagem.findUnique({
            where: { id: viagemId }
        })

        if(!trip) {
            throw new ClientError("Viagem não encontrada")
        }

        const links = await prisma.link.create({
            data: {
                titulo,
                url,
                viagem_id: viagemId
            }
        })

        return { linksId: links.id }
    })
}