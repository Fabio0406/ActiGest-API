-- =====================================================================
-- ActiGest API — esquema de la base de datos (PostgreSQL)
--
-- Uso (la API hace backups con pg_dump sobre la base "ActiGest", respeta el nombre):
--   createdb -U postgres ActiGest
--   psql -U postgres -d ActiGest -f database/schema.sql
--
-- El script se puede volver a ejecutar: borra las tablas y las crea de nuevo.
-- Basado en el backup original del 04/07/2023 y actualizado con las columnas y tablas
-- que el código usa hoy (bitacora, depreciacion, rol, intentos, valor_ra, idaf, idestado...).
-- =====================================================================

SET client_encoding = 'UTF8';   -- para que la ñ y los acentos se lean bien en Windows

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- solo para generar la contraseña del usuario inicial

DROP TABLE IF EXISTS bitacora, backup, depreciacion, garantia, reserva, alquiler, asignado,
    mantenimiento, estado, localiza, localizaem, activofijo, ubicacion, empleado, cliente,
    administrador, rol, persona CASCADE;

-- ---------------------------------------------------------------------
-- Personas y usuarios
-- ---------------------------------------------------------------------

CREATE TABLE persona (
    ci          INTEGER PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    direccion   VARCHAR(100),
    ciudad      VARCHAR(50),
    celular     INTEGER,
    email       VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500)
);

CREATE TABLE rol (
    id     INTEGER PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL
);

-- Usuarios que inician sesión en el sistema
CREATE TABLE administrador (
    usuario    VARCHAR(30)  NOT NULL,
    cipersona  INTEGER      NOT NULL REFERENCES persona(ci) ON UPDATE CASCADE ON DELETE CASCADE,
    contrasena VARCHAR(100) NOT NULL,          -- hash bcrypt
    rol_id     INTEGER REFERENCES rol(id),
    intentos   INTEGER NOT NULL DEFAULT 0,     -- intentos de inicio de sesión fallidos
    PRIMARY KEY (usuario, cipersona),
    UNIQUE (usuario)
);

CREATE TABLE cliente (
    id        SERIAL,
    cipersona INTEGER NOT NULL REFERENCES persona(ci) ON UPDATE CASCADE ON DELETE CASCADE,
    empresa   VARCHAR(100),
    PRIMARY KEY (id, cipersona)
);

CREATE TABLE empleado (
    id        SERIAL,
    cipersona INTEGER NOT NULL REFERENCES persona(ci) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (id, cipersona)
);

-- ---------------------------------------------------------------------
-- Ubicaciones
-- ---------------------------------------------------------------------

CREATE TABLE ubicacion (
    id           SERIAL PRIMARY KEY,
    sitio        VARCHAR(50) NOT NULL,
    localizacion VARCHAR(50) NOT NULL,
    departamento VARCHAR(50) NOT NULL
);

-- Ubicación de cada empleado
CREATE TABLE localizaem (
    cipersona   INTEGER NOT NULL REFERENCES persona(ci) ON UPDATE CASCADE ON DELETE CASCADE,
    idubicacion INTEGER NOT NULL REFERENCES ubicacion(id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (cipersona, idubicacion)
);

-- ---------------------------------------------------------------------
-- Activos fijos
-- ---------------------------------------------------------------------

CREATE TABLE activofijo (
    id          INTEGER PRIMARY KEY,           -- código del activo (lo envía el formulario)
    descripcion VARCHAR(100) NOT NULL,
    diacompra   DATE NOT NULL,
    costo       NUMERIC(12,2) NOT NULL,
    lugarcompra VARCHAR(50) NOT NULL,
    marca       VARCHAR(30) NOT NULL,
    modelo      VARCHAR(50) NOT NULL,
    serial      VARCHAR(50) NOT NULL,
    foto        VARCHAR(255) DEFAULT 'default.jpg',
    valor_ra    NUMERIC(12,2)                  -- valor revalorizado
);

-- Ubicación de cada activo
CREATE TABLE localiza (
    idactivo    INTEGER NOT NULL REFERENCES activofijo(id) ON UPDATE CASCADE ON DELETE CASCADE,
    idubicacion INTEGER NOT NULL REFERENCES ubicacion(id)  ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY (idactivo, idubicacion)
);

CREATE TABLE depreciacion (
    id        SERIAL PRIMARY KEY,
    id_activo INTEGER NOT NULL REFERENCES activofijo(id) ON UPDATE CASCADE ON DELETE CASCADE,
    costo_dep NUMERIC(12,2),                   -- costo depreciable
    valor_res NUMERIC(12,2),                   -- valor residual
    vida_util INTEGER,                         -- años
    fecha     DATE
);

-- Activos asignados a una persona
CREATE TABLE asignado (
    id           SERIAL,
    idactivofijo INTEGER NOT NULL REFERENCES activofijo(id) ON UPDATE CASCADE ON DELETE CASCADE,
    cipersona    INTEGER NOT NULL REFERENCES persona(ci)    ON UPDATE CASCADE ON DELETE CASCADE,
    fechasalida  DATE NOT NULL,
    PRIMARY KEY (id, idactivofijo, cipersona)
);

-- Alquileres (estaba en la base original; el código actual no la usa)
CREATE TABLE alquiler (
    id           SERIAL,
    idactivofijo INTEGER NOT NULL REFERENCES activofijo(id) ON UPDATE CASCADE ON DELETE CASCADE,
    idpersona    INTEGER NOT NULL,
    diainicio    DATE NOT NULL,
    diafinal     DATE,
    descripcion  VARCHAR(500) NOT NULL,
    PRIMARY KEY (id, idactivofijo, idpersona)
);

CREATE TABLE reserva (
    id           SERIAL PRIMARY KEY,
    idactivofijo INTEGER NOT NULL REFERENCES activofijo(id) ON UPDATE CASCADE ON DELETE CASCADE,
    cipersona    INTEGER REFERENCES persona(ci) ON UPDATE CASCADE ON DELETE CASCADE,
    fecha        DATE,
    descripcion  VARCHAR(500)
);

CREATE TABLE garantia (
    id          SERIAL PRIMARY KEY,
    activo_id   INTEGER NOT NULL REFERENCES activofijo(id) ON UPDATE CASCADE ON DELETE CASCADE,
    descripcion VARCHAR(500) NOT NULL,
    caducidad   DATE NOT NULL,
    adquirido   DATE
);

-- ---------------------------------------------------------------------
-- Mantenimientos
-- ---------------------------------------------------------------------

-- Estado de un mantenimiento. La API cuenta como "en mantenimiento" los que tienen estado 1.
CREATE TABLE estado (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL
);

CREATE TABLE mantenimiento (
    id          SERIAL PRIMARY KEY,
    idaf        INTEGER NOT NULL REFERENCES activofijo(id) ON UPDATE CASCADE ON DELETE CASCADE,
    titulo      VARCHAR(50)  NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    fechainicio DATE NOT NULL,
    responsable VARCHAR(100) NOT NULL,
    costo       NUMERIC(12,2) NOT NULL,
    idestado    INTEGER REFERENCES estado(id)
);

-- ---------------------------------------------------------------------
-- Auditoría
-- ---------------------------------------------------------------------

-- Registro de acciones. "culpable" es el CI de la persona que hizo la acción.
CREATE TABLE bitacora (
    id       SERIAL PRIMARY KEY,
    fecha    DATE NOT NULL DEFAULT CURRENT_DATE,
    accion   VARCHAR(200) NOT NULL,
    culpable INTEGER
);

-- Archivos de backup generados con pg_dump
CREATE TABLE backup (
    id          SERIAL PRIMARY KEY,
    archivo     VARCHAR(255),
    propietario INTEGER REFERENCES persona(ci) ON UPDATE CASCADE ON DELETE CASCADE,
    fecha       DATE
);

CREATE INDEX idx_mantenimiento_idaf ON mantenimiento(idaf);
CREATE INDEX idx_bitacora_fecha     ON bitacora(fecha);

-- ---------------------------------------------------------------------
-- Datos iniciales
-- ---------------------------------------------------------------------

INSERT INTO rol (id, nombre) VALUES
    (1, 'Administrador'),
    (2, 'Empleado');

INSERT INTO estado (nombre) VALUES
    ('En curso'),
    ('Finalizado');

INSERT INTO ubicacion (sitio, localizacion, departamento) VALUES
    ('Oficina central', 'Av. Principal', 'Santa Cruz');

-- Usuario inicial para entrar al sistema: admin / admin123. Cambia la contraseña después.
INSERT INTO persona (ci, nombre, email) VALUES
    (1000000, 'Administrador', 'admin@example.com');
INSERT INTO administrador (usuario, cipersona, contrasena, rol_id) VALUES
    ('admin', 1000000, crypt('admin123', gen_salt('bf', 10)), 1);
