import { consul } from "../db.js"
import helpers from "../lib/helpers.js"
import { exec } from 'child_process'

export const getClientes = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM persona')
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const Bit = async (req, res) => {
    try {
        const resp = await consul.query("SELECT id,fecha,accion,persona.nombre as culpable FROM bitacora,persona where culpable = ci ORDER BY id DESC ")
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const BitF = async (req, res) => {
    try {
        const Inicio = req.params.Inicio
        const Fin = req.params.Fin
        const resp = await consul.query("SELECT id,fecha,accion,persona.nombre as culpable FROM bitacora,persona where culpable = ci AND fecha BETWEEN $1 AND $2 ORDER BY id DESC", [Inicio, Fin])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const Inicio = async (req, res) => {
    try {
        const { culpable } = req.body
        const fecha = new Date()
        await consul.query('INSERT INTO bitacora (fecha,accion,culpable) VALUES ($1,$2,$3)', [fecha.toLocaleDateString('en-US'), 'Inicio Sesion', culpable])
        res.send('')
    } catch (error) {
        res.send("ERROR")
    }
}

export const ERROR = async (req, res) => {
    try {
        const { UsuI } = req.body
        const resp = await consul.query('SELECT * FROM administrador where usuario = $1', [UsuI])
        if (resp.rowCount > 0) {
            var intento = resp.rows[0].intentos
            intento = intento + 1
            var ci = resp.rows[0].cipersona
            await consul.query('UPDATE administrador SET intentos = $1 WHERE usuario = $2 AND ciPersona = $3', [intento, UsuI, ci])
        }
        res.send('')
    } catch (error) {
        res.send("ERROR")
    }
}

export const cerrar = async (req, res) => {
    try {
        const { culpable } = req.body
        const fecha = new Date()
        await consul.query('INSERT INTO bitacora (fecha,accion,culpable) VALUES ($1,$2,$3)', [fecha.toLocaleDateString('en-US'), 'Cerro Sesion', culpable])
        res.send('')
    } catch (error) {
        res.send("ERROR")
    }
}

export const getEmpleados = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM persona,empleado where ci=ciPersona')
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const getClientebyID = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM persona,cliente where ci = $1 and ci=ciPersona', [req.params.ci])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const getempleados = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM persona,empleado where ci=ciPersona')
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const getusuariobyID = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM persona,administrador where usuario = $1 and ci=ciPersona', [req.params.usuario])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}
export const getusuariobyIDM = async (req, res) => {
    try {
        const { usuario, contra } = req.body
        const resp = await consul.query('SELECT * FROM persona,administrador where usuario = $1 and ci=ciPersona', [usuario])
        if (resp.rowCount > 0) {
            if (await helpers.descriptar(contra, resp.rows[0].contrasena)) {
                res.status(200).json("1")// aceptado
            } else {
                res.status(200).json("0")// rechazado
            }
        } else {
            res.status(200).json("-1") // No existe el usuario
        }
        return
    } catch (error) {
        res.send("ERROR")
    }
}

export const getEmpleadobyID = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM persona,empleado where ci = $1 and ci=ciPersona', [req.params.ci])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}

export const createCliente = async (req, res) => {
    try {
        const { ci, nombre, direccion, ciudad, celular, email, descripcion, empresa } = req.body
        await consul.query('INSERT INTO persona (ci, nombre, direccion, ciudad, celular, email, descripcion) VALUES ($1,$2,$3,$4,$5,$6,$7)', [ci, nombre, direccion, ciudad, celular, email, descripcion])
        await consul.query('INSERT INTO cliente (cipersona,empresa) VALUES ($1,$2)', [ci, empresa])
        res.send('usuario creado')
    } catch (error) {
        res.send("ERROR")
    }
}

export const createE = async (req, res) => {
    try {
        const { ci, nombre, id, celular, email, departamento, direccion, descripcion } = req.body
        await consul.query('INSERT INTO persona (ci, nombre, direccion, celular, email, descripcion) VALUES ($1,$2,$3,$4,$5,$6)', [ci, nombre, direccion, celular, email, descripcion])
        await consul.query('INSERT INTO empleado (id,cipersona) VALUES ($1,$2)', [id, ci])
        await consul.query('INSERT INTO localizaem (cipersona,idubicacion) VALUES ($1,$2)', [ci, departamento])
        res.send('usuario creado')
    } catch (error) {
        res.send("ERROR")
    }
}

export const Asig = async (req, res) => {
    try {
        const { idActivo, cipersona, fecha } = req.body
        console.log(req.body)
        await consul.query('INSERT INTO asignado (idactivofijo,cipersona,fechasalida) VALUES ($1,$2,$3)', [idActivo, cipersona, fecha])
        res.send('activo asignado')
    } catch (error) {
        res.send("ERROR")
    }
}

export const createuserM = async (req, res) => {
    try {
        const { nombre, email, ci, Usuario, contra } = req.body
        const Npass = await helpers.encriptar(contra)
        await consul.query('INSERT INTO persona (ci, nombre, email) VALUES ($1,$2,$3)', [ci, nombre, email])
        await consul.query('INSERT INTO administrador (cipersona,usuario,contrasena) VALUES ($1,$2,$3)', [ci, Usuario, Npass])
        res.send('usuario creado')
    } catch (error) {
        res.send("ERROR")
    }
}

export const createuser = async (req, res) => {
    try {
        const { nombre, email, ci, UsuI, Npass } = req.body
        const rol = 1
        await consul.query('INSERT INTO persona (ci, nombre, email) VALUES ($1,$2,$3)', [ci, nombre, email])
        await consul.query('INSERT INTO administrador (cipersona,usuario,contrasena,rol_id) VALUES ($1,$2,$3,$4)', [ci, UsuI, Npass,rol])
        res.send('usuario creado')
    } catch (error) {
        res.send("ERROR")
    }
}

export const createEmpleado = async (req, res) => {
    try {
        const { ci, nombre, direccion, ciudad, celular, email, descripcion } = req.body
        consul.query('INSERT INTO persona (ci, nombre, direccion, ciudad, celular, email, descripcion) VALUES ($1,$2,$3,$4,$5,$6,$7)', [ci, nombre, direccion, ciudad, celular, email, descripcion])
        consul.query('INSERT INTO empleado (cipersona) VALUES ($1)', [ci])
        res.send('usuario creado')
    } catch (error) {
        res.send("ERROR")
    }
}

export const Musuario = async (req, res) => {
    try {
        const { ci, nombre, direccion, ciudad, celular, email, descripcion, empresa } = req.body
        consul.query('INSERT INTO persona (ci, nombre, direccion, ciudad, celular, email, descripcion) VALUES ($1,$2,$3,$4,$5,$6,$7)', [ci, nombre, direccion, ciudad, celular, email, descripcion])
        consul.query('INSERT INTO empleado (cipersona) VALUES ($1)', [ci])
        res.send('usuario creado')
    } catch (error) {
        res.send("ERROR")
    }
}

export const deleteUser = async (req, res) => {
    try {
        const resp = await consul.query('DELETE FROM persona WHERE ci = $1', [req.params.ci])
        res.send(`Usuario ${req.params.ci} Eliminado`)
    } catch (error) {
        res.send("ERROR")
    }
}

export const MUser = async (req, res) => {
    try {
        const { nombre, usuario, direccion, ciudad, celular, email } = req.body
        await consul.query("UPDATE persona SET nombre = $1,direccion = $2,ciudad = $3,celular = $4,email = $5 WHERE ci = $6", [nombre, direccion, ciudad, celular, email, req.params.ci])
        console.log(usuario)
        await consul.query('UPDATE administrador SET usuario = $1 WHERE cipersona = $2 )', [usuario, req.params.ci])
        res.send('usuario creado')
    } catch (error) {
        res.send("ERROR")
    }
}
export const Mcontra = async (req, res) => {
    try {
        const ci = req.params.ci
        const usuario = req.params.usuario
        const { Npass } = req.body
        await consul.query("UPDATE administrador SET contrasena = $1 WHERE usuario = $2 AND ciPersona = $3", [Npass, usuario, ci])
        res.send('usuario creado')
    } catch (error) {
        res.send("ERROR")
    }
}

export const Memp = async (req, res) => {
    try {
        const { ci, nombre, direccion, ciudad, celular, email, descripcion, empresa } = req.body
        await consul.query("UPDATE persona SET ci = $1, nombre = $2, direccion = $3, ciudad = $4, celular = $5, email = $6, descripcion = $7 WHERE ci = $8", [ci, nombre, direccion, ciudad, celular, email, descripcion, req.params.ci])
        res.send('usuario creado')
    } catch (error) {
        res.send("ERROR")
    }
}

export const AñadorBit = async (req, res) => {
    try {
        const { mensaje, culpable } = req.body;
        const fecha = new Date().toLocaleDateString('en-US');
        await consul.query('INSERT INTO bitacora (fecha, accion, culpable) VALUES ($1, $2, $3)', [fecha, mensaje, culpable]);
        res.send('Se añadió exitosamente');
    } catch (error) {
        res.send('ERROR');
    }
};

export const backup = async (req, res) => {
    const ci = req.params.ci
    try {
        const fechaActual = new Date().toISOString().replace(/[-T:]/g, '').split('.')[0];
        const fecha = new Date().toISOString();
        const nombreArchivo = `backup_${fechaActual}.tar`;
        // Comando para realizar el backup
        const comando = `pg_dump -U postgres -d ActiGest -F tar -f ${nombreArchivo}`;
        // Establecer la variable de entorno PGPASSWORD con el valor de tu contraseña
        process.env.PGPASSWORD = process.env.DB_PASSWORD;

        await consul.query('INSERT INTO backup (archivo, propietario,fecha) VALUES ($1, $2,$3)', [nombreArchivo, ci,fecha]);

        exec(comando, async (error, stdout, stderr) => {
            if (error) {
                console.log(stderr)
                console.error(`Error al realizar el backup: ${error.message}`);
            } else {
                res.send(`Backup realizado exitosamente. Nombre del archivo: ${nombreArchivo}`);
            }
        });
    } catch (error) {
        res.send('ERROR');
    }
};

export const Restore = async (req, res) => {
    try {
        const id = req.params.id
        const resp = await consul.query('select * from backup where id = $1 ',[id])
        const archivoBackup = resp.rows[0].archivo
        const result = await consul.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
        const tableNames = result.rows.map((row) => row.table_name);
        for (const tableName of tableNames) {
            const deleteTableQuery = `DROP TABLE IF EXISTS ${tableName} CASCADE;`;
            await consul.query(deleteTableQuery);
           console.log(`Tabla ${tableName} eliminada.`);
        }
        realizarRestauracion(archivoBackup);
        res.send(`Restore realizado exitosamente. Nombre del archivo: ${archivoBackup}`);
    }

    catch (error) {
        res.send(error);
    }
}

function realizarRestauracion(archivoBackup) {
    // Comando para realizar el backup
    const comando = `pg_restore -U postgres -d ActiGest ${archivoBackup}`;

    // Establecer la variable de entorno PGPASSWORD con el valor de tu contraseña
    process.env.PGPASSWORD = process.env.DB_PASSWORD;

    exec(comando, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al realizar la restauración: ${error.message}`);
        } else {
            console.log('Restauración completada exitosamente.');
        }
    });
}

export const getbackup = async (req, res) => {
    try {
        const resp = await consul.query('SELECT * FROM backup where propietario = $1', [req.params.ci])
        res.status(200).json(resp.rows)
    } catch (error) {
        res.send("ERROR")
    }
}


