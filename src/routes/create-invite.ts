import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/pt-br";
import nodemailer from "nodemailer";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";
import { ClientError } from "../errors/error-client";
import { env } from "../env";

dayjs.locale("pt-br")
dayjs.extend(localizedFormat)

export async function createInvite(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post("/viagens/:viagemId/convites", {
        schema: {
            params: z.object({
                viagemId: z.string().uuid()
            }),
            body: z.object({
                email: z.string().email()
            })
        }
    }, async (request) => {
        const { viagemId } = request.params
        const { email } = request.body

        const trip = await prisma.viagem.findUnique({
            where: { id: viagemId }
        })

        if (!trip) {
            throw new ClientError("Viagem não encontrada")
        }

        const participant = await prisma.participante.create({
            data: {
                email,
                viagem_id: viagemId
            }
        })

        const start_format = dayjs(trip.comeca_em).format("LL LT");
        const end_format = dayjs(trip.termina_em).format("LL LT")

        const mail = await getMailClient()

        const confirmationLink = `${env.API_BASE_URL}/participantes/${participant.id}/confirmar`
        const message = await mail.sendMail({
            from: {
                name: "Rumo viagens",
                address: "viajar@rumo.com.br"
            },
            to: participant.email,
            subject: "Confirme sua presença na viagem!",
            html: `
                    <div style="font-family: sans-serif; fonst-size: 16px; line-height: 1.6;">
                        <p>Olá!</p>
                        <p>Você foi convidado(a) para participar de uma viagem! Aqui estão os detalhes:</p>
                            <p><strong>Destino:</strong> ${trip.destino}</p>
                            <p><strong>Data de Partida:</strong> ${start_format}</p>
                            <p><strong>Data de Retorno:</strong> ${end_format}</p>
                        <p>Para confirmar, clique no link abaixo:</p>
                        <p><a href="${confirmationLink}">Confirmar preseça</a></p>                
                    </div>
                `.trim()
        })
        console.log(nodemailer.getTestMessageUrl(message))

        return { participant: participant.id }
    })
}