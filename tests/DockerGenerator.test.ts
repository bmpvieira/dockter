import fixture from './fixture'
import DockerGenerator from '../src/DockerGenerator'
import { SoftwareEnvironment, SoftwarePackage } from '../src/context';

/**
 * When applied to an empty environment, generate should return
 * Dockerfile with just FROM
 */
test('generate:empty', async () => {
  const environ = new SoftwareEnvironment()
  const generator = new DockerGenerator(environ)
  expect(await generator.generate()).toEqual('FROM ubuntu:18.04\n')
})

/**
 * When applied to an environment with packages from several languages, generate should return
 * Dockerfile with R and the packages installed
 */
test('generate:packages', async () => {
  const pkg1 = new SoftwarePackage()
  pkg1.name = 'ggplot2'
  pkg1.runtimePlatform = 'R'

  const pkg2 = new SoftwarePackage()
  pkg2.name = 'bokeh'
  pkg2.runtimePlatform = 'Python'

  const environ = new SoftwareEnvironment()
  environ.datePublished = '2017-01-01'
  environ.softwareRequirements = [pkg1, pkg2]
  
  const generator = new DockerGenerator(environ)
  expect(await generator.generate()).toEqual(`FROM ubuntu:16.04

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      apt-transport-https \\
      ca-certificates \\
      software-properties-common

RUN apt-add-repository \"deb https://mran.microsoft.com/snapshot/2017-01-01/bin/linux/ubuntu xenial/\" \\
 && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      python3 \\
      python3-pip \\
      r-base \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*
`)
})