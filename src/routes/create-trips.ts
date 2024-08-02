import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import nodemailer from "nodemailer";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/pt-br";
import { z } from "zod";
import dayjs from "dayjs";
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";
import { ClientError } from "../errors/error-client";
import { env } from "../env";

dayjs.locale("pt-br")
dayjs.extend(localizedFormat)

export async function createTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post("/viagens", {
        schema: {
            body: z.object({
                destino: z.string().min(4),
                comeca_em: z.coerce.date(),
                termina_em: z.coerce.date(),
                criador_nome: z.string(),
                criador_email: z.string().email(),
                emails_convidados: z.array(z.string().email())
            })
        }
    }, async(request) => {
        const { destino, comeca_em, termina_em, criador_nome, criador_email, emails_convidados } = request.body

        if(dayjs(comeca_em).isBefore(new Date())) {
            throw new ClientError("Data de inicio da viagem inválida.")
        }

        if(dayjs(termina_em).isBefore(comeca_em)) {
            throw new ClientError("Data de termino da viagem inválida.")
        }

        const trip = await prisma.viagem.create({
            data: {
                destino,
                comeca_em,
                termina_em,
                participantes: {
                    createMany: {
                        data: [
                            {
                                nome: criador_nome,
                                email: criador_email,
                                criador: true,
                                confirmado: true
                            },
                            ...emails_convidados.map(email => {
                                return { email }
                            })
                        ]
                    }
                }
            }
        })

        const start_format = dayjs(comeca_em).format("LL LT");
        const end_format = dayjs(termina_em).format("LL LT")

        const confirmationLink = `${env.API_BASE_URL}/viagens/${trip.id}/confirmar`

        const mail = await getMailClient()

        const message = await mail.sendMail({
            from: {
                name: "Rumo viagens",
                address: "viajar@rumo.com.br"
            },
            to: {
                name: criador_nome,
                address: criador_email
            },
            subject: "Confirme sua viagem!",
            html: `
                <div style="font-family: sans-serif; fonst-size: 16px; line-height: 1.6;">
                    <p>Olá!</p>
                    <p>Estamos felizes em confirmar sua viagem! Aqui estão os detalhes:</p>
                        <p><strong>Destino:</strong> ${destino}</p>
                        <p><strong>Data de Partida:</strong> ${start_format}</p>
                        <p><strong>Data de Retorno:</strong> ${end_format}</p>
                    <p>Se você tiver alguma dúvida ou precisar de mais informações, não hesite em nos contatar.</p>
                    <p><a href="${confirmationLink}">Confirmar Detalhes</a></p>                
                </div>
            `.trim()
        })

        console.log(nodemailer.getTestMessageUrl(message))

        return { tripId: trip.id }
    })
}