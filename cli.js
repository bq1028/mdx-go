#!/usr/bin/env node
const path = require('path')
const meow = require('meow')
const chalk = require('chalk')
const open = require('react-dev-utils/openBrowser')

const config = require('pkg-conf').sync('mdx-go')
const { pkg } = require('read-pkg-up').sync()

const log = (...msg) => {
  console.log(
    chalk.green('[mdx-go]'),
    ...msg
  )
}

log.error = (...msg) => {
  console.log(
    chalk.red('[err]'),
    ...msg
  )
}

const cli = meow(`
  Usage:

    $ mdx-go docs

    $ mdx-go build docs

`, {
  flags: {
    port: {
      type: 'string',
      alias: 'p',
      default: '8080'
    },
    open: {
      type: 'boolean',
      alias: 'o',
      default: true
    },
    outDir: {
      type: 'string',
      alias: 'd',
      default: 'dist'
    }
  }
})

const [ cmd, input ] = cli.input

if (!cmd && !input) {
  cli.showHelp(0)
}

const opts = Object.assign({
  pkg,
  dirname: path.resolve(input || cmd),
}, config, cli.flags)

opts.outDir = path.resolve(opts.outDir)

if (pkg && pkg.dependencies) {
  if (pkg.dependencies['styled-components']) {
    opts.cssLibrary = 'styled-components'
  } else if (pkg.dependencies['emotion']) {
    opts.cssLibrary = 'emotion'
  }
}

switch (cmd) {
  case 'build':
    log('building...')
    const build = require('./lib/build')
    build(opts)
      .catch(err => {
        log.error(err)
        process.exit(1)
      })
      .then(stats => {
        log('bye bye')
      })
    break
  case 'dev':
  default:
    log('starting dev server...')
    const dev = require('./lib/dev')
    dev(opts)
      .then(server => {
        const { port } = server.address()
        const url = `http://localhost:${port}`
        log('listening on', chalk.green(url))
        if (opts.open) open(url)
      })
      .catch(err => {
        log.error(err)
        process.exit(1)
      })
}

require('update-notifier')({ pkg: cli.pkg }).notify()
