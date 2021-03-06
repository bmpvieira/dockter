#!/usr/bin/env node

import os from 'os'
// @ts-ignore
import yargonaut from 'yargonaut'
import yargs from 'yargs'
import yaml from 'js-yaml'

const VERSION = require('../package').version

import DockerCompiler from './DockerCompiler'
import { ApplicationError } from './errors'
import CachingUrlFetcher from './CachingUrlFetcher'

const compiler = new DockerCompiler(new CachingUrlFetcher())

yargonaut
  .style('blue')
  .helpStyle('green')
  .errorsStyle('red')

yargs
  .scriptName('dockter')

  // Help global option
  .alias('h', 'help')
  .usage('$0 <cmd> [args]')

  // Version global option
  .alias('v', 'version')
  .version(VERSION)
  .describe('version', 'Show version')

  // Ensure at least one command
  .demandCommand(1, 'Please provide a command.')
  // Provide suggestions regarding similar commands if no matching command is found
  .recommendCommands()
  // Any command-line argument given that is not demanded, or does not have a corresponding description, will be reported as an error.
  // Unrecognized commands will also be reported as errors.
  .strict()

  // Compile command
  // @ts-ignore
  .command('compile [folder]', 'Compile a project to a software environment', yargs => {
    yargs.positional('folder', {
      type: 'string',
      default: '.',
      describe: 'The path to the project folder'
    })
  }, async (args: any) => {
    await compiler.compile('file://' + args.folder, false).catch(error)
  })

  // Build command
  // @ts-ignore
  .command('build [folder]', 'Build a Docker image for project', yargs => {
    yargs.positional('folder', {
      type: 'string',
      default: '.',
      describe: 'The path to the project folder'
    })
  }, async (args: any) => {
    await compiler.compile('file://' + args.folder, true).catch(error)
  })

  // Execute command
  // @ts-ignore
  .command('execute [folder]', 'Execute a project', yargs => {
    yargs.positional('folder', {
      type: 'string',
      default: '.',
      describe: 'The path to the project folder'
    })
  }, async (args: any) => {
    const node = await compiler.execute('file://' + args.folder).catch(error)
    output(node, args.format)
  })

  .parse()

/**
 * Print output to stdout
 *
 * @param object The object to print
 * @param format The format use: `json` or `yaml`
 */
function output (object: any, format: string = 'json') {
  if (object) console.log(format === 'yaml' ? yaml.safeDump(object, { lineWidth: 120 }) : JSON.stringify(object, null, '  '))
}

/**
 * Print an error to stderr
 *
 * @param error The error to print
 */
function error (error: Error) {
  if (error instanceof ApplicationError) {
    console.error(error.message)
  } else {
    console.error('Woops, sorry something went wrong :(')
    console.error('Please help us fix this issue by posting this output to https://github.com/stencila/dockter/issues/new')
    console.error(`  args: ${process.argv.slice(2).join(' ')}`)
    console.error(`  version: ${VERSION}`)
    console.error(`  platform: ${os.platform()}`)
    console.error(error)
    process.exit(1)
  }
}
