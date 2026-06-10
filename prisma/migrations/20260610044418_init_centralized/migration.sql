-- CreateEnum
CREATE TYPE "public"."EstadoCuenta" AS ENUM ('ACTIVO', 'DESHABILITADO', 'ELIMINACION_PENDIENTE', 'BANEADO');

-- CreateEnum
CREATE TYPE "public"."CategoriaArtista" AS ENUM ('DJ', 'BANDA', 'SOLISTA', 'ORQUESTA');

-- CreateEnum
CREATE TYPE "public"."EstadoPedidoCancion" AS ENUM ('PENDIENTE', 'ACEPTADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "public"."Usuario" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "nombreUsuario" TEXT,
    "nombre" TEXT,
    "imagen" TEXT,
    "rolId" TEXT,
    "codigoTelefono" TEXT,
    "numeroTelefono" TEXT,
    "ciudad" TEXT,
    "pais" TEXT,
    "zonaHoraria" TEXT,
    "generosFavoritos" TEXT[],
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,
    "ultimoCambioNombreUsuario" TIMESTAMP(3),
    "ultimoCambioNombre" TIMESTAMP(3),
    "estadoCuenta" "public"."EstadoCuenta" NOT NULL DEFAULT 'ACTIVO',
    "fechaEliminacionProgramada" TIMESTAMP(3),
    "perfilCompletadoReconocido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bloqueo" (
    "id" TEXT NOT NULL,
    "bloqueadorId" TEXT NOT NULL,
    "bloqueadoId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,

    CONSTRAINT "Bloqueo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PerfilPublico" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,

    CONSTRAINT "PerfilPublico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Rol" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PerfilArtista" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "biografia" TEXT,
    "fechaInicio" DATE,
    "tarifaPorHora" DECIMAL(65,30),
    "moneda" TEXT,
    "lugaresConocidos" JSONB,
    "categoria" "public"."CategoriaArtista" NOT NULL,
    "musicQR" TEXT,
    "pagoQR" TEXT,
    "nombreQR" TEXT,
    "urlPago" TEXT,
    "urlYoutubeFavorito" TEXT,
    "urlSoundCloudFavorito" TEXT,
    "pedidosActivos" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,

    CONSTRAINT "PerfilArtista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GaleriaArtista" (
    "id" TEXT NOT NULL,
    "perfilArtistaId" TEXT NOT NULL,
    "urlImagen" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,

    CONSTRAINT "GaleriaArtista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Evento" (
    "id" TEXT NOT NULL,
    "perfilArtistaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "horaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horaFin" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PedidoCancion" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "itunesId" TEXT,
    "titulo" TEXT,
    "artista" TEXT,
    "genero" TEXT,
    "nombreSolicitante" TEXT,
    "estado" "public"."EstadoPedidoCancion" NOT NULL DEFAULT 'PENDIENTE',
    "perfilArtistaId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,

    CONSTRAINT "PedidoCancion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EstadisticasCancion" (
    "id" TEXT NOT NULL,
    "itunesId" TEXT,
    "titulo" TEXT NOT NULL,
    "artista" TEXT NOT NULL,
    "genero" TEXT,
    "perfilArtistaId" TEXT NOT NULL,
    "totalAceptados" INTEGER NOT NULL DEFAULT 0,
    "totalRechazados" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstadisticasCancion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Seguidor" (
    "id" TEXT NOT NULL,
    "seguidorId" TEXT NOT NULL,
    "artistaSeguidoId" TEXT,
    "perfilDiscotecaId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,

    CONSTRAINT "Seguidor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PerfilDiscoteca" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombreLocal" TEXT,
    "fechaFundacion" DATE,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,

    CONSTRAINT "PerfilDiscoteca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RedSocial" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "urlBase" TEXT NOT NULL,
    "icono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedSocial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArtistaRedSocial" (
    "id" TEXT NOT NULL,
    "perfilArtistaId" TEXT NOT NULL,
    "redSocialId" TEXT NOT NULL,
    "nombreUsuario" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,

    CONSTRAINT "ArtistaRedSocial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MetodoDonacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "icono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetodoDonacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArtistaDonacion" (
    "id" TEXT NOT NULL,
    "perfilArtistaId" TEXT NOT NULL,
    "metodoDonacionId" TEXT NOT NULL,
    "numeroCuenta" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,

    CONSTRAINT "ArtistaDonacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConfiguracionSistema" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "creadoPor" TEXT,
    "actualizadoPor" TEXT,

    CONSTRAINT "ConfiguracionSistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "public"."Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_nombreUsuario_key" ON "public"."Usuario"("nombreUsuario");

-- CreateIndex
CREATE UNIQUE INDEX "Bloqueo_bloqueadorId_bloqueadoId_key" ON "public"."Bloqueo"("bloqueadorId", "bloqueadoId");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilPublico_usuarioId_key" ON "public"."PerfilPublico"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "public"."Rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilArtista_usuarioId_key" ON "public"."PerfilArtista"("usuarioId");

-- CreateIndex
CREATE INDEX "EstadisticasCancion_perfilArtistaId_idx" ON "public"."EstadisticasCancion"("perfilArtistaId");

-- CreateIndex
CREATE UNIQUE INDEX "EstadisticasCancion_itunesId_perfilArtistaId_key" ON "public"."EstadisticasCancion"("itunesId", "perfilArtistaId");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilDiscoteca_usuarioId_key" ON "public"."PerfilDiscoteca"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "RedSocial_nombre_key" ON "public"."RedSocial"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistaRedSocial_perfilArtistaId_redSocialId_key" ON "public"."ArtistaRedSocial"("perfilArtistaId", "redSocialId");

-- CreateIndex
CREATE UNIQUE INDEX "MetodoDonacion_nombre_key" ON "public"."MetodoDonacion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistaDonacion_perfilArtistaId_metodoDonacionId_key" ON "public"."ArtistaDonacion"("perfilArtistaId", "metodoDonacionId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionSistema_clave_key" ON "public"."ConfiguracionSistema"("clave");

-- AddForeignKey
ALTER TABLE "public"."Usuario" ADD CONSTRAINT "Usuario_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "public"."Rol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bloqueo" ADD CONSTRAINT "Bloqueo_bloqueadorId_fkey" FOREIGN KEY ("bloqueadorId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bloqueo" ADD CONSTRAINT "Bloqueo_bloqueadoId_fkey" FOREIGN KEY ("bloqueadoId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerfilPublico" ADD CONSTRAINT "PerfilPublico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerfilArtista" ADD CONSTRAINT "PerfilArtista_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GaleriaArtista" ADD CONSTRAINT "GaleriaArtista_perfilArtistaId_fkey" FOREIGN KEY ("perfilArtistaId") REFERENCES "public"."PerfilArtista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Evento" ADD CONSTRAINT "Evento_perfilArtistaId_fkey" FOREIGN KEY ("perfilArtistaId") REFERENCES "public"."PerfilArtista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PedidoCancion" ADD CONSTRAINT "PedidoCancion_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "public"."Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PedidoCancion" ADD CONSTRAINT "PedidoCancion_perfilArtistaId_fkey" FOREIGN KEY ("perfilArtistaId") REFERENCES "public"."PerfilArtista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstadisticasCancion" ADD CONSTRAINT "EstadisticasCancion_perfilArtistaId_fkey" FOREIGN KEY ("perfilArtistaId") REFERENCES "public"."PerfilArtista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Seguidor" ADD CONSTRAINT "Seguidor_artistaSeguidoId_fkey" FOREIGN KEY ("artistaSeguidoId") REFERENCES "public"."PerfilArtista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Seguidor" ADD CONSTRAINT "Seguidor_perfilDiscotecaId_fkey" FOREIGN KEY ("perfilDiscotecaId") REFERENCES "public"."PerfilDiscoteca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerfilDiscoteca" ADD CONSTRAINT "PerfilDiscoteca_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArtistaRedSocial" ADD CONSTRAINT "ArtistaRedSocial_perfilArtistaId_fkey" FOREIGN KEY ("perfilArtistaId") REFERENCES "public"."PerfilArtista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArtistaRedSocial" ADD CONSTRAINT "ArtistaRedSocial_redSocialId_fkey" FOREIGN KEY ("redSocialId") REFERENCES "public"."RedSocial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArtistaDonacion" ADD CONSTRAINT "ArtistaDonacion_perfilArtistaId_fkey" FOREIGN KEY ("perfilArtistaId") REFERENCES "public"."PerfilArtista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArtistaDonacion" ADD CONSTRAINT "ArtistaDonacion_metodoDonacionId_fkey" FOREIGN KEY ("metodoDonacionId") REFERENCES "public"."MetodoDonacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
