import {consul} from "../db.js"

import pkg from 'onesignal-node';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const oneSignalClient = new pkg.Client({
    app: { appAuthKey: process.env.ONESIGNAL_API_KEY, appId: process.env.ONESIGNAL_APP_ID }
});
export const getMantenimientos = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM mantenimiento ORDER BY id ASC')
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR GET MANTENIMIENTOS")
    }
}

export const createMantenimiento = async (req, res) => {
    try {
        const { idaf,titulo, descripcion, fechaInicio, responsable,costo, idestado, culpable } = req.body
        consul.query('INSERT INTO mantenimiento (idaf,titulo, descripcion, fechaInicio, responsable,costo, idestado) VALUES ($1,$2,$3,$4,$5,$6,$7)', [idaf,titulo, descripcion, fechaInicio, responsable,costo, idestado])
        const message = { 
            app_id: process.env.ONESIGNAL_APP_ID,
            contents: { en: `Se ha creado un mantenimiento para el activo fijo: ${req.body.idaf} ${req.body.descripcion}` },
            included_segments: ['All'] // Enviar a todos los segmentos (todos los usuarios suscritos)
          };
        sendNotification(message);
        
        const fecha = new Date()
        await consul.query('INSERT INTO bitacora (fecha,accion,culpable) VALUES ($1,$2,$3)', [fecha.toLocaleDateString('en-US'), 'Se creó un nuevo mantenimiento', culpable ])
        

        res.send('mantenimiento creado')
    } catch (error) {
        res.send("ERROR CREATE MANTENIMIENTO")
    }
}

export const updateMantenimiento = async (req, res) => {
    try {
      const { idaf,titulo, descripcion, fechaInicio, responsable,costo, idestado, culpable } = req.body;
      await consul.query('UPDATE mantenimiento SET idaf=$1, titulo=$2, descripcion=$3, fechaInicio=$4, responsable=$5, costo=$6, idestado=$7 WHERE id = $8', [idaf,titulo, descripcion, fechaInicio, responsable,costo, idestado, req.params.id]);
      const message = { 
        app_id: process.env.ONESIGNAL_APP_ID,
        contents: { en: `Se actualizó un mantenimiento para el activo fijo: ${req.body.idaf} ${req.body.descripcion}` },
        included_segments: ['All'] // Enviar a todos los segmentos (todos los usuarios suscritos)
      };
      sendNotification(message);
      const fecha = new Date()
      await consul.query('INSERT INTO bitacora (fecha,accion,culpable) VALUES ($1,$2,$3)', [fecha.toLocaleDateString('en-US'), 'Se actualizó un mantenimiento', culpable ])
      
      res.send(`mantenimiento ${req.params.id} actualizado`);
    } catch (error) {
      res.send("ERROR UPDATE MANTENIMIENTO");
    }
  };

export const deleteMantenimiento = async (req,res) =>{
    try {
        const { culpable } = req.body
        const resp = await consul.query('DELETE FROM mantenimiento WHERE id = $1',[req.params.id])
        const message = { 
            app_id: process.env.ONESIGNAL_APP_ID,
            contents: { en: `Se eliminó un mantenimiento ID: ${req.params.id}` },
            included_segments: ['All'] // Enviar a todos los segmentos (todos los usuarios suscritos)
          };
          sendNotification(message);
        const fecha = new Date()
        await consul.query('INSERT INTO bitacora (fecha,accion,culpable) VALUES ($1,$2,$3)', [fecha.toLocaleDateString('en-US'), 'Se eliminó un mantenimiento', culpable ])
        
        res.send(`mantenimiento ${req.params.id} Eliminado`)
    } catch (error) {
        res.send("ERROR DELETE MANTENIMIENTO")
    }
}

export const getMantF = async (req, res) => {
    try {
        const Inicio = req.params.Inicio
        const Fin = req.params.Fin
        const resp = await consul.query('SELECT * FROM mantenimiento where fechaInicio BETWEEN $1 AND $2',[Inicio,Fin])
        res.status(200).json(resp.rows)
    } catch (error) {
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