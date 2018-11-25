'use strict' /* eslint-disable no-console */

const { createWriteStream, readFileSync } = require('fs')
const { join } = require('path')
const Canvas = require('canvas')
const libheif = require('./libheif')

const FILE_NAME = 'autumn_1440x960'
const fileBuffer = readFileSync( join(__dirname, `${FILE_NAME}.heic`) )

const decoder = new libheif.HeifDecoder()
const [ image ] = decoder.decode( new Uint8Array(fileBuffer, 0, fileBuffer.byteLength) )

const w = image.get_width()
const h = image.get_height()

const canvas = new Canvas(w, h)
const ctx = canvas.getContext('2d')
const imgData = ctx.createImageData(w, h)

image.display(imgData, dispayData => {
  ctx.putImageData(dispayData, 0, 0)
  const jpeg = join(__dirname, `${FILE_NAME}.jpeg`)
  const writer = createWriteStream( jpeg ).on('close', _ => console.log(`File saved: ${jpeg}`))
  canvas.jpegStream().pipe( writer )
})
