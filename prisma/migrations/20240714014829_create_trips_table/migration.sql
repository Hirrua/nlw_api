-- CreateTable
CREATE TABLE "viagens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "destino" TEXT NOT NULL,
    "comeca_em" DATETIME NOT NULL,
    "termina_em" DATETIME NOT NULL,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
