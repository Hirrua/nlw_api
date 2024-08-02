-- CreateTable
CREATE TABLE "atividades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "quando" DATETIME NOT NULL,
    "viagem_id" TEXT NOT NULL,
    CONSTRAINT "atividades_viagem_id_fkey" FOREIGN KEY ("viagem_id") REFERENCES "viagens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "viagem_id" TEXT NOT NULL,
    CONSTRAINT "links_viagem_id_fkey" FOREIGN KEY ("viagem_id") REFERENCES "viagens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
