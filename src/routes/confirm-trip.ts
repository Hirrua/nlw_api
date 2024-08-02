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

export async function confirmTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get("/viagens/:viagemId/confirmar", {
        schema: {
            params: z.object({
                viagemId: z.string().uuid()
            })
        }
    }, async (request, reply) => {
        const { viagemId } = request.params

        const trip = await prisma.viagem.findUnique({
            where: {
                id: viagemId
            },
            include: {
                participantes: {
                    where: {
                        criador: false
                    }
                }
            }
        })

        if(!trip) {
            throw new ClientError("Viagem não encontrada!")
        }

        if(trip.confirmado) {
            return reply.redirect(`${env.WEB_BASE_URL}/viagens/${viagemId}`)
        }

        await prisma.viagem.update({
            where: { id: viagemId },
            data: { confirmado: true }
        })

        const start_format = dayjs(trip.comeca_em).format("LL LT");
        const end_format = dayjs(trip.termina_em).format("LL LT")

        const mail = await getMailClient()

        await Promise.all(
            trip.participantes.map(async(participante) => {
                const confirmationLink = `${env.API_BASE_URL}/participantes/${participante.id}/confirmar`
                const message = await mail.sendMail({
                    from: {
                        name: "Rumo viagens",
                        address: "viajar@rumo.com.br"
                    },
                    to: participante.email,
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
            })
        )

        return reply.redirect(`${env.WEB_BASE_URL}/viagens/${viagemId}`)
    })
}