#!/usr/bin/env node

const { log } = require('console')

http = require('http')
https = require('https')
fs = require('fs')
path = require('path')
url = require('url')
util = require('util')
const execFile = util.promisify(require('child_process').execFile)

host = process.argv[2] || '0.0.0.0'
http_port = process.argv[3] || 8080
https_port = process.argv[3] || 8090
prefix = process.argv[4] || ''

refresh = true

async function getImages() {
  let files = await fs.promises.readdir('images')
  return await Promise.all(
    files.map(async (file) => {
      const { stdout } = await execFile('identify', ['-format', '%w %h', 'images/' + file])
      const [w, h] = stdout.split(' ')
      return [file, parseInt(w), parseInt(h)]
    })
  )
}
// const http_server = http.createServer((req, res, next) => {
//   res.writeHead(301, { Location: 'https://' + req.url })
//   res.end()
// })

const options = {
  key: fs.readFileSync('keys/key.pem'),
  cert: fs.readFileSync('keys/cert.pem'),
  passphrase: '1234',
}

var https_server = https.createServer(options, async (req, res) => {
  var pathname = url.parse(req.url).pathname.substr(prefix.length)
  if (req.url != path.normalize(req.url)) {
    res.writeHead(400)
    res.end('invalid path')
  } else if (pathname == '/refresh') {
    res.writeHead(200)
    res.end('' + refresh)
    refresh = false
  } else if (pathname == '/images') {
    let images = await getImages()
    console.log(images)
    res.writeHead(200)
    res.end(JSON.stringify(images))
  } else {
    if (pathname.endsWith('/')) pathname += 'index.html'
    fs.createReadStream(`.${pathname}`)
      .on('error', () => {
        res.writeHead(404)
        res.end('not found')
      })
      .on('open', () => {
        contenttypes = {
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.styl': 'text/css',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.pdf': 'application/pdf',
          '.jpg': 'image/jpg',
          '.jpeg': 'image/jpg',
          '.html': 'text/html',
        }
        // 'Content-Type': 'text/html; charset=utf-8'
        res.writeHead(200, { 'Content-Type': contenttypes[path.extname(pathname)] || 'text/plain' })
      })
      .pipe(res)
  }
})

fs.watch('.', (eventType, filename) => {
  console.log(`file change: eventType "${eventType}", filename ${filename}`)
  refresh = true
})

// http_server.listen(port, host, () => console.log(`Server running at http://${host}:${port}/`))
https_server.listen(https_port, host, () => console.log(`Server running at https://${host}:${https_port}/`))
