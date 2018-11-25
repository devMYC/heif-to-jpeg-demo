'use strict' /* eslint-disable no-console */

const { createReadStream } = require('fs')
const { createServer } = require('http')
const { basename, join } = require('path')

const PORT = process.env.PORT
  || console.info('> Using default port')
  || 8e3


createServer( handler )
  .listen(PORT, _ => console.log('> Server listening on port', PORT))


function handler (req, res) {
  let msg
  if ( req.method !== 'GET' ) {
    msg = 'Expecting GET request.'
    res.statusCode = 400
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Length', Buffer.byteLength(msg))
    return res.end(msg)
  }

  switch ( req.url ) {
    case '/demo.html':
    case '/libheif.js':
      return createReadStream( join(__dirname, basename(req.url)) ).pipe(res)

    default:
      msg = 'Page Not Found.'
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/plain')
      res.setHeader('Content-Length', Buffer.byteLength(msg))
      return res.end(msg)
  }
}
