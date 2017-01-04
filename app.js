// Module dependencies
const fs = require('fs')

const SocketServer = require('./socket-server')

const express = require('express')

const app = module.exports = express.createServer()
const io = require('socket.io').listen(app)

// Configuration

app.configure(function () {
  app.set('views', __dirname + '/views')
  app.set('view options', {layout: false})

  // html rendering
  app.register('.html', {
    compile: function (str, options) {
      return function (locals) {
        return str
      }
    }
  })

  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.static(__dirname + '/public'))
})

app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
})

app.configure('production', function () {
  app.use(express.errorHandler())
})

// Routes

app.get('/', function (req, res) {
  res.render('index.html', {
    locals: {
      title: 'Streamy Client'
    }
  })
})

// Serve streaming audio - audio src points here
app.get('/stream/:song', function (req, res) {
  const songPath = socketServer.musicLibrary.songs[req.params.song]
  const msg = `File '${songPath || req.params.song}' not found`
  if (!songPath) return res.end(msg)
  fs.exists(songPath, function (exists) {
    if (!exists) {
      console.log(`\nSTREAMY: ${msg}`)
      res.writeHead(404)
      return res.end(msg)
    }

    // stream song to client
    fs.stat(songPath, function (err, stats) {
      if (err) {
        console.log(`\nSTREAMY: stat\'ing error: ${err}`)
        return res.writeHead(500)
      }

      res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': stats.size })
      const readStream = fs.createReadStream(songPath)

      readStream.pipe(res) // pump song to client
    })
  })
})

const PORT = 3000 || process.env.PORT

app.listen(PORT, console.log(`STREAMY: listening on port ${PORT}`))

const socketServer = new SocketServer(io)
