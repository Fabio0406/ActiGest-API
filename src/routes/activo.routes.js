import { Router } from "express";
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';
import multer from 'multer'
import { exec } from 'child_process'
import {createActivo,createGarantia,deleteReserva,createReserva,deleteActivo,deletegarantia,getActivobyID,getActivobySerial,getActivos,getActivosF,getGarActivo,getImagen,getMantenimiento,getReservas,getUbiActivo, getcantidadM, updateActivo, updateReserva, getdeprebyID, AñadirDepre, AñadirReva}from "../controllers/activo.CO.js"


const activo = Router();



const __dirname = dirname(fileURLToPath(import.meta.url));
export const storage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null, join(__dirname,'../public/img'))
    },
    filename: (req,file,cb) =>{
        const ext = file.originalname.split('.').pop()
        cb(null,`${Date.now()}.${ext}`)
    }
})

const upload = multer({storage})

activo.post('/api/acti',upload.single('img'), createActivo)



activo.get('/api/acti', getActivos)

activo.get('/api/actiI/:id', getImagen)

activo.get('/api/acti/:Inicio/:Fin', getActivosF)

activo.get('/api/acti/:id', getActivobyID)

activo.get('/api/actiDep/:id', getdeprebyID)

// Rutas fijas antes de las que llevan :id, para que Express no las confunda con un ID
activo.post('/api/acti/res', createReserva)
activo.post('/api/acti/gar', createGarantia)
activo.delete('/api/acti/gar/:id', deletegarantia)
activo.get('/api/actiCM',getcantidadM)
activo.post('/api/acti/depre', AñadirDepre)

activo.post('/api/acti/rev', AñadirReva)

activo.get('/api/Gacti/:id',getGarActivo)

activo.get('/api/Gactivo/:id',getUbiActivo)

activo.get('/api/GM/:id',getMantenimiento)

activo.get('/api/acti/:serial', getActivobySerial)
activo.get('/pg_dump_version', (req, res) => {
    exec('pg_dump --version', (error, stdout, stderr) => {
      if (error) {
        res.send(`Error: ${error.message}`);
      } else if (stderr) {
        res.send(`Stderr: ${stderr}`);
      } else {
        res.send(`Stdout: ${stdout}`);
      }
    });
  });



activo.post('/api/acti/:id',upload.single('img'), updateActivo)

activo.delete('/api/acti/:id', deleteActivo)



activo.delete('/api/res/:id', deleteReserva)



activo.get('/api/res', getReservas)


activo.put('/api/res/:id', updateReserva)

 export default activo;
