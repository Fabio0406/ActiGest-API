import { consul } from "../db.js"
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pkg from 'onesignal-node';
const __dirname = dirname(fileURLToPath(import.meta.url));
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const oneSignalClient = new pkg.Client({
    app: { appAuthKey: process.env.ONESIGNAL_API_KEY, appId: process.env.ONESIGNAL_APP_ID }
});

export const createActivo = async (req, res) => {
    try {
        const { id, descripcion, diaCompra, costo, lugarCompra, marca, modelo, serial } = req.body
        if (req.file == undefined) {
            consul.query('INSERT INTO activoFijo (id,descripcion, diaCompra, costo, lugarCompra, marca, modelo, serial, foto) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, descripcion, diaCompra, costo, lugarCompra, marca, modelo, serial, "default.jpg"])
        } else {
            consul.query('INSERT INTO activoFijo (id,descripcion, diaCompra, costo, lugarCompra, marca, modelo, serial, foto) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, descripcion, diaCompra, costo, lugarCompra, marca, modelo, serial, req.file.filename])
        }
        const message = {
            app_id: process.env.ONESIGNAL_APP_ID,
            contents: { en: `Se ha creado un nuevo activo fijo: ${req.body.id} ${req.body.descripcion}` },
            included_segments: ['All'] // Enviar a todos los segmentos (todos los usuarios suscritos)
        };
        sendNotification(message);

        res.send('activo registrado')
    } catch (error) {
        console.error(error);

        res.send("ERROR")
    }
}
const sendNotification = (data) => {
    const headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${process.env.ONESIGNAL_API_KEY}`
    };

    const options = {
        host: "onesignal.com",
        port: 443,
        path: "/api/v1/notifications",
        method: "POST",
        headers: headers
    };

    const https = require('https');
    const req = https.request(options, function (res) {
        res.on('data', function (data) {
            console.log("Response:");
            console.log(JSON.parse(data));
        });
    });

    req.on('error', function (e) {
        console.log("ERROR:");
        console.log(e);
    });

    req.write(JSON.stringify(data));
    req.end();
};
//as
export const createActivom = async (req, res) => {
    try {
        const { id, descripcion, diaCompra, costo, lugarCompra, marca, modelo, serial } = req.body
        consul.query('INSERT INTO activoFijo (id,descripcion, diaCompra, costo, lugarCompra, marca, modelo, serial) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [id, descripcion, diaCompra, costo, lugarCompra, marca, modelo, serial])
        res.send('activo registrado')
    } catch (error) {
        res.send("ERROR CREATE")
    }
}
export const getActivos = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM activoFijo ORDER BY id ASC')
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const AñadirDepre = async (req, res) => {
    try {
        const { id, costo_dep, valor_res, vida_util,fecha } = req.body
        const resp = await consul.query('INSERT INTO depreciacion (id_activo, costo_dep, valor_res, vida_util,fecha)VALUES ($1, $2, $3, $4, $5);', [id, costo_dep, valor_res, vida_util,fecha])
        res.status(200).json(resp.rows[0])
    } catch (error) {
        res.send("ERROR")
    }
}



export const AñadirReva = async (req, res) => {
    try {
        const { id,valor_ras,Cdepreciable } = req.body
        const resp = await consul.query('UPDATE activofijo SET valor_ra = $1 WHERE id = $2', [valor_ras,id]);
        const resp2 = await consul.query('UPDATE depreciacion SET costo_dep = $1 WHERE id_activo = $2', [Cdepreciable,id]);
        res.status(200).json(resp.rows[0])
    } catch (error) {
        res.send("ERROR")
    }
}

export const getcantidadM = async (req, res) => {
    try {
        const resp = await consul.query('SELECT COUNT(*) AS cantidad_resultados FROM activoFijo WHERE id IN ( SELECT idaf  FROM mantenimiento WHERE idestado = ( SELECT id FROM estado WHERE id = 1 ))')
        res.status(200).json(resp.rows[0])
    } catch (error) {
        res.send("ERROR")
    }
}

export const deletegarantia = async (req, res) => {
    try {
        await consul.query('DELETE FROM garantia WHERE id = $1', [req.params.id]);
        const message = {
            app_id: process.env.ONESIGNAL_APP_ID,
            contents: { en: `Se eliminó una garantía para el activo fijo : ${req.params.id}` },
            included_segments: ['All'] // Enviar a todos los segmentos (todos los usuarios suscritos)
        };
        sendNotification(message);
        res.send(`Activo ${req.params.id} Eliminado`)
    } catch (error) {
        res.send("ERROR")
    }
}

export const getImagen = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM activoFijo where id = $1', [req.params.id])
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const imagePath = join(__dirname, `../public/img/${resp.rows[0].foto}`);
        if (await fs.existsSync(imagePath)) {
            res.sendFile(imagePath)
        } else {
            const imagePath = join(__dirname, `../public/img/default.jpg`);
            res.sendFile(imagePath)
        }
    } catch (error) {
        res.send("ERROR")
    }
}

export const getActivosF = async (req, res) => {
    try {
        const Inicio = req.params.Inicio
        const Fin = req.params.Fin
        const resp = await consul.query('SELECT * FROM activoFijo where diacompra BETWEEN $1 AND $2', [Inicio, Fin])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const getUbiActivo = async (req, res) => {
    try {
        const resp = await consul.query('SELECT ubicacion.* FROM activoFijo,ubicacion,localiza WHERE idActivo=activoFijo.id and idUbicacion=ubicacion.id and idActivo =$1', [req.params.id])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const getMantenimiento = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM mantenimiento WHERE idaf = $1', [req.params.id])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const getGarActivo = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM garantia where activo_id = $1', [req.params.id])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const getdeprebyID = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM depreciacion where id_activo = $1', [req.params.id])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const getActivobyID = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM activoFijo where id = $1', [req.params.id])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const getActivobySerial = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM activoFijo where serial = $1', [req.params.serial])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}




export const updateActivo = async (req, res) => {
    try {
        const { descripcion, diaCompra, costo, lugarCompra, marca, modelo, serial, culpable } = req.body;
        console.log(req.body)
        console.log(req.file)
        if (req.file == undefined) {
             await consul.query('UPDATE activofijo SET descripcion=$1, diaCompra=$2, costo=$3, lugarCompra=$4, marca=$5, modelo=$6, serial=$7, foto=$8 WHERE id = $9', [descripcion, diaCompra, costo, lugarCompra, marca, modelo, serial, "default.jpg", req.params.id]);
        } else {
             await consul.query('UPDATE activofijo SET descripcion=$1, diaCompra=$2, costo=$3, lugarCompra=$4, marca=$5, modelo=$6, serial=$7, foto=$8 WHERE id = $9', [descripcion, diaCompra, costo, lugarCompra, marca, modelo, serial, req.file.filename, req.params.id]);
        }
        const message = {
            app_id: process.env.ONESIGNAL_APP_ID,
            contents: { en: `Se ha actualizado el activo fijo: ${req.params.id} ${req.body.descripcion}` },
            included_segments: ['All'] // Enviar a todos los segmentos (todos los usuarios suscritos)
        };
        sendNotification(message);
        const fecha = new Date()

        await consul.query('INSERT INTO bitacora (fecha,accion,culpable) VALUES ($1,$2,$3)', [fecha.toLocaleDateString('en-US'), 'Se actualizó un activo fijo', culpable])

        res.send(`activo ${req.params.id} actualizado`);
    } catch (error) {
        res.send("ERROR");
    }
};


export const deleteActivo = async (req, res) => {
    try {
        await consul.query('DELETE FROM reserva WHERE idActivoFijo = $1', [req.params.id]);

        const resp = await consul.query('DELETE FROM activoFijo WHERE id = $1', [req.params.id])

        const message = {
            app_id: process.env.ONESIGNAL_APP_ID,
            contents: { en: `Se ha eliminado un activo fijo con ID : ${req.params.id}` },
            included_segments: ['All'] // Enviar a todos los segmentos (todos los usuarios suscritos)
        };
        sendNotification(message);
        res.send(`Activo ${req.params.id} Eliminado`)
    } catch (error) {
        res.send("ERROR")
    }
}
export const createReserva = async (req, res) => {
    try {
        const { idActivoFijo, ciPersona, fecha, descripcion } = req.body
        console.log(req.body)
        await consul.query('INSERT INTO reserva (idActivoFijo, ciPersona, fecha, descripcion) VALUES ($1,$2,$3,$4)', [idActivoFijo, ciPersona, fecha, descripcion])
        const message = {
            app_id: process.env.ONESIGNAL_APP_ID,
            contents: { en: `Se ha creado una reserva del activo fijo : ${req.body.idActivoFijo} ${req.body.descripcion}` },
            included_segments: ['All'] // Enviar a todos los segmentos (todos los usuarios suscritos)
        };
        sendNotification(message);
        res.send('activo reservado')
    } catch (error) {
        res.send("ERROR")
    }
}
export const deleteReserva = async (req, res) => {
    try {
        await consul.query('DELETE FROM reserva WHERE idActivoFijo = $1', [req.params.id]);

        const message = {
            app_id: process.env.ONESIGNAL_APP_ID,
            contents: { en: `Se ha eliminado una reserva del activo fijo con ID : ${req.params.id}` },
            included_segments: ['All'] // Enviar a todos los segmentos (todos los usuarios suscritos)
        };
        sendNotification(message);
        res.send(`Reserva ${req.params.id} Eliminado`)
    } catch (error) {
        res.send("ERROR")
    }
}
export const createGarantia = async (req, res) => {
    try {
        const { id, caducidad, descripcion, adquirido } = req.body
        await consul.query('INSERT INTO garantia (activo_id, descripcion, caducidad, adquirido) VALUES ($1,$2,$3,$4)', [id, descripcion, caducidad, adquirido])
        const message = {
            app_id: process.env.ONESIGNAL_APP_ID,
            contents: { en: `Se ha creado una garantia del activo fijo : ${req.body.id} ${req.body.descripcion}` },
            included_segments: ['All'] // Enviar a todos los segmentos (todos los usuarios suscritos)
        };
        sendNotification(message);
        res.send('garantia creada')
    } catch (error) {
        res.send("ERROR")
    }
}

export const getReservas = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM reserva ORDER BY id ASC')
        console.log(resp);
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR GET RESERVAS")
    }
}

export const updateReserva = async (req, res) => {
    try {
        const { idactivofijo, cipersona, fecha, descripcion } = req.body;
        await consul.query('UPDATE reserva SET idactivofijo=$1, cipersona=$2, fecha=$3, descripcion=$4 WHERE id = $5', [idactivofijo, cipersona, fecha, descripcion, req.params.id]);

        const message = {
            app_id: process.env.ONESIGNAL_APP_ID,
            contents: { en: `Se ha actualizado una reserva del activo fijo : ${req.body.idactivofijo} ${req.body.descripcion}` },
            included_segments: ['All'] // Enviar a todos los segmentos (todos los usuarios suscritos)
        };
        sendNotification(message);
        res.send(`Reserva ${req.params.id} actualizado`);
    } catch (error) {
        res.send("ERROR");
    }
};
