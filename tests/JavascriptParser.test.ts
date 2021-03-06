import { fixture } from './test-functions'
import JavascriptParser from '../src/JavascriptParser'
import { Person, SoftwarePackage } from '@stencila/schema'

import MockUrlFetcher from './MockUrlFetcher'

const urlFetcher = new MockUrlFetcher()

// Increase timeout (in milliseconds) to allow for HTTP requests
// to get package meta data
jest.setTimeout(30 * 60 * 1000)
describe('JavascriptParser', () => {
  /**
   * When applied to an empty folder, parse should return null.
   */
  test('parse:empty', async () => {
    const parser = new JavascriptParser(urlFetcher, fixture('empty'))
    expect(await parser.parse()).toBeNull()
  })

  /**
   * When applied to a folder with no JS code, parse should return null.
   */
  test('parse:non-js', async () => {
    const parser = new JavascriptParser(urlFetcher, fixture('r-date'))
    expect(await parser.parse()).toBeNull()
  })

  /**
   * When applied to a folder with a `package.json` file, parse should return
   * a `SoftwarePackage` with `name`, `softwareRequirements` etc
   * populated correctly.
   */
  test('parse:js-requirements', async () => {
    const parser = new JavascriptParser(urlFetcher, fixture('js-requirements'))
    const pkg = await parser.parse() as SoftwarePackage

    expect(pkg.name).toEqual('js-package')
    expect(pkg.license).toEqual('ISC')
    expect(pkg.authors).toEqual([Person.fromText('Jason Bloggs <j.bloggs@example.com> (https://jbloggs.example.com)')])
    expect(pkg.codeRepository).toEqual('https://github.com/stencila/dockter/')
    expect(pkg.softwareRequirements.length).toEqual(5)
    const expecteds = [
      ['is-array', '1.0.1'],
      ['mkdirp', '0.5.1'],
      ['rimraf', '2.6.2'],
      ['array-swap', '0.0.2'],
      ['a-package-that-is-not-on-npm', 'org/repo']
    ]

    for (let index in expecteds) {
      let { name, version } = pkg.softwareRequirements[index]
      expect(name).toEqual(expecteds[index][0])
      expect(version).toEqual(expecteds[index][1])
    }
  })

  /**
   * When applied to a folder with a `*.js` files, parse should return
   * a `SoftwarePackage` with `name`, `softwareRequirements` etc
   * populated correctly.
   */
  test('parse:js-sources', async () => {
    const parser = new JavascriptParser(urlFetcher, fixture('js-sources'))
    const pkg = await parser.parse() as SoftwarePackage

    expect(pkg.name).toEqual('js-sources')
    expect(pkg.softwareRequirements.length).toEqual(2)
    expect(pkg.softwareRequirements[1].name).toEqual('array-swap')
    expect(pkg.softwareRequirements[0].name).toEqual('is-sorted')
  })

  /**
   * When applied to a folder with both `*.js` files and a `package.json` file, then parse should return a
   * `SoftwarePackage` with `name`, `softwareRequirements` etc populated from the `package.json` in that directory.
   */
  test('parse:js-mixed', async () => {
    const parser = new JavascriptParser(urlFetcher, fixture('js-mixed'))
    const pkg = await parser.parse() as SoftwarePackage

    expect(pkg.name).toEqual('js-mixed')
    expect(pkg.description).toEqual('A test Node.js package for js-mixed')
    expect(pkg.version).toEqual('1.2.3')
    expect(pkg.softwareRequirements.length).toEqual(1)
    expect(pkg.softwareRequirements[0].name).toEqual('is-even')
    expect(pkg.softwareRequirements[0].version).toEqual('4.5.6')
  })
})
