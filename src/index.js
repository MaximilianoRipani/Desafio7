import express from 'express'
import mongoose from 'mongoose'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import passport from 'passport'
import cookieParser from 'cookie-parser'
import messageModel from './models/messages.js'
import indexRouter from './routes/indexRouter.js'
import initializePassport from './config/passport/passport.js'
import { Server } from 'socket.io'
import { engine } from 'express-handlebars'
import { __dirname } from './path.js'

const app = express()
const PORT = process.env.PORT || 8000

// Middleware
app.use(express.json())
app.use(cookieParser("claveSecreta"))
app.use(session({
    secret: "coderSecret",
    resave: true,
    store: MongoStore.create({
        mongoUrl: "mongodb+srv://ripanipk1:***coderhouse@cluster0.tusar1v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        ttl: 60 * 60
    }),
    saveUninitialized: true
}))
app.use(cookieParser("claveSecreta"))
app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', __dirname + '/views')

initializePassport()
app.use(passport.initialize())
app.use(passport.session())


// Routes
app.use('/', indexRouter)
app.get('/setCookie', (req, res) => {
    res.cookie('CookieCookie', 'Esto es una cookie :)', { maxAge: 3000000, signed: true }).send("Cookie creada")
})

app.get('/getCookie', (req, res) => {
    res.send(req.signedCookies)
})

app.get('/deleteCookie', (req, res) => {
    res.clearCookie('CookieCookie').send("Cookie eliminada")
    
})


// Server
const server = app.listen(PORT, () => {
    console.log(`Estoy corriendo en el puerto: ${PORT}`)
})

//Session Routes

app.get('/session', (req, res) => {
    console.log(req.session)
    if (req.session.counter) {
        req.session.counter++
        res.send(`Sos el usuario N° ${req.session.counter} en ingresar a la pagina`)
    } else {
        req.session.counter = 1
        res.send("Sos el primer usuario que ingresa a la pagina")
    }
})

app.post('/login', (req, res) => {
    const { email, password } = req.body

    if (email == "admin@admin.com" && password == "1234") {
        req.session.email = email
        req.session.password = password


    }
    console.log(req.session)
    res.send("Login")
})

// Socket.io setup
const io = new Server(server)
io.on('connection', (socket) => {
    console.log("Conexion con Socket.io")

    socket.on('mensaje', async (mensaje) => {
        try {
            await messageModel.create(mensaje)
            const mensajes = await messageModel.find()
            io.emit('mensajeLogs', mensajes)
        } catch (e) {
            io.emit('mensajeLogs', e)
        }

    })
})


//Connection DB
mongoose.connect("mongodb+srv://ripanipk1:***coderhouse@cluster0.tusar1v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => console.log("SI!!!, me conecte al Atlas"))
    .catch(e => console.log(e))

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('OOPS, Algo Fallo!')
})

export default app
