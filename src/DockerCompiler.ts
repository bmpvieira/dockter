import fs from 'fs'
import path from 'path'

import { SoftwareSourceCode, SoftwareEnvironment } from './context'

import Parser from './Parser'
import DockerParser from './DockerParser'
import RParser from './RParser'

import DockerGenerator from './DockerGenerator'
import DockerBuilder from './DockerBuilder'
import DockerExecutor from './DockerExecutor'

export default class DockerCompiler {

  /**
   * Compile a folder into a Docker image
   *
   * @param source The folder, Dockerfile or `SoftwareEnvironment` to compile
   * @param build Should the Docker image be built?
   */
  async compile (source: string, build: boolean = true): Promise<SoftwareEnvironment | null> {
    let folder
    if (source.substring(0, 7) === 'file://') {
      folder = source.substring(7)
    } else {
      folder = source
    }

    let dockerfile
    let environ

    if (fs.existsSync(path.join(folder, 'Dockerfile'))) {
      dockerfile = 'Dockerfile'
      environ = await new DockerParser(folder).parse()
    } else {
      // If there is a `environ.jsonld` file then use
      // TODO

      // Obtain environments for each language parser
      let parser: Parser
      for (parser of [
        new RParser(folder)
      ]) {
        const environLang = await parser.parse()
        if (environLang) {
          environ = environLang
          break
        }
      }

      // Normalise and compact the `environ` so that duplicates do not
      // exists e.g. packages required by multiple other packages
      // TODO

      if (!environ) environ = new SoftwareEnvironment()

      // Write `.environ.jsonld`
      // TODO

      // Generate Dockerfile
      dockerfile = '.Dockerfile'
      new DockerGenerator(environ, folder).generate()
    }

    if (build) {
      // Use the name of the environment, if possible
      let name = (environ && environ.name) || undefined
      // Build the image!
      const builder = new DockerBuilder()
      await builder.build(folder, name, dockerfile)
    }

    return environ
  }

  async execute (source: string): Promise<string> {
    // Compile the environment first
    let environ = await this.compile(source)
    if (!environ) throw new Error('Environment not created')
    if (!environ.name) throw new Error('Environment does not have a name')

    // Execute the environment's image (which is built in compile())
    const executor = new DockerExecutor()
    const result = await executor.execute(environ.name)

    return result
  }
}
