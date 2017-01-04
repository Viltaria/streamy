const EventEmitter = require('events').EventEmitter
const path = require('path')
const util = require('util')

const findit = require('findit')

const FORMATS = ['.mp3', '.m4a'] // supported formats

module.exports = MusicLibrary

//
//  MusicLibrary: populates self#songs with name:filepath pairs
//
//  MusicLibrary emits these events:
//    songs:add
//    ready
//
//  opts has these optional keys:
//    root: relative directory to serve [defaults to ./public/music]
//
function MusicLibrary (opts) {
  EventEmitter.call(this)

  if (!opts) opts = {}
  else if (typeof opts !== 'object') throw new Error('MusicLibrary opts must be of type object')

  this.opts = opts
  this.songs = {}
  this.populate()
}

util.inherits(MusicLibrary, EventEmitter)

MusicLibrary.prototype.populate = function () {
  const self = this
  const root = this.opts.root || path.join(__dirname, '/public/music')
  const finder = findit.find(root)

  //  cache music library for socket connections
  finder.on('file', function (fpath, stat) {
    var ext = path.extname(fpath)
    if (FORMATS.indexOf(ext) !== -1 && stat.size) {
      var songTitle = path.basename(fpath, ext)

      self.songs[songTitle] = fpath
      self.emit('songs:add', songTitle)
    }
  })
  finder.on('end', function () {
    self.emit('ready')
  })
}
