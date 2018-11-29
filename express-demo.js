'use strict' /* eslint-disable no-console */

const { createHash } = require('crypto')
const { createReadStream, unlink, createWriteStream } = require('fs')
const { basename, join } = require('path')
const { PassThrough } = require('stream')
const express = require('express')
const multer = require('multer')
const Canvas = require('canvas')
const libheif = require('./libheif')

const PORT = process.env.PORT
  || console.log('> Using default port')
  || 8e3

class ImageStorage {
  constructor(options) {
    this.getDestination = options && options.destination || ((_, __, cb) => cb(null, '/dev/null'))
  }

  _handleFile(req, file, cb) {
    this.getDestination(req, file, (err, path) => {
      if (err) return cb(err)

      const skipDecode = file.mimetype.startsWith('image/')
      if ( !skipDecode ) {
        const decoder = new libheif.HeifDecoder()
        const buf = []
        let length = 0
        return file.stream
          .on('error', cb)
          .on('end', _ => {
            const [ image ] = decoder.decode( new Uint8Array(Buffer.concat(buf, length)) )
            const w = image.get_width()
            const h = image.get_height()

            const canvas = new Canvas(w, h)
            const ctx = canvas.getContext('2d')
            const imageData = ctx.createImageData(w, h)

            image.display(imageData, displayData => {
              ctx.putImageData(displayData, 0, 0)
              this._saveFile(file, { jpegStream: canvas.jpegStream(), path, skipDecode }, cb)
            })
          })
          .on('data', chunk => {
            length += chunk.length
            buf.push(chunk)
          })
      }

      this._saveFile(file, { path, skipDecode }, cb)
    })
  }

  _removeFile(_, file, cb) {
    unlink(file.path, cb)
  }

  _saveFile(file, { jpegStream, path, skipDecode }, cb) {
    const [ ext='' ] = file.originalname.match(/\.[^.]+?$/) || []
    let fileName = file.originalname.slice(0, ext ? -1 * ext.length : undefined)

    let checkSum
    const hash = createHash('sha1')
      .once('readable', _ => checkSum = hash.read().slice(0, 5).toString('hex'))

    const passHash = new PassThrough()
    const passWriter = new PassThrough()

    ;(jpegStream || file.stream)
      .on('end', _ => {
        passHash.pipe(hash, { end: false })
        passHash
          .on('error', err => {
            hash.end()
            cb(err)
          })
          .on('end', _ => hash.end(_ => {
            fileName = join(path, fileName + '-' + checkSum + (skipDecode ? ext : '.jpeg'))
            const fileWriter = createWriteStream( fileName )
              .on('close', _ => cb(null, {
                hash: checkSum,
                path: fileName,
                size: fileWriter.bytesWritten,
              }))
            passWriter.pipe(fileWriter)
            passWriter
              .on('error', err => {
                fileWriter.end()
                cb(err)
              })
              .end()
          }))
          .end()
      })
      .on('data', chunk => {
        passHash.write(chunk)
        passWriter.write(chunk)
      })
  }
}

const upload = multer({
  fileFilter: (_, file, cb) => cb(
    null,
    file.mimetype.startsWith('image/')
    || file.mimetype === 'application/octet-stream'
    && /.+?\.hei[cf]$/.test(file.originalname)
  ),
  fileSize: 2 * 1 << 20, // 2MB
  storage: new ImageStorage({
    destination: (_, __, cb) => cb(null, __dirname)
  }),
})

express()
  .get('/img/:fileName', (req, res, next) => {
    createReadStream(join(__dirname, req.params.fileName)).on('error', next).pipe(res)
  })
  .post('/img/upload', upload.single('file'), (req, res, next) => {
    if( !req.file ) return next( new Error('Unsupported file format.') )
    res.json({ ok: true, file_name: basename(req.file.path) })
  })
  .listen(PORT, _ => console.log('> Server listening on port %d', PORT))
