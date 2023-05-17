import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { ExecutorContext, readJsonFile, writeJsonFile } from '@nx/devkit';
import { BuildExecutorSchema } from './schema';
import { PackagePaths, getPackagePaths } from '../../utils';

type ModuleType = 'es6' | 'commonjs';

export default async function runExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  if (!context.projectsConfigurations || !context.projectName) {
    throw new Error('no project configurations');
  }

  const { sourceRoot, root } =
    context.projectsConfigurations.projects[context.projectName];

  const { root: workspaceRoot } = context;
  const paths = getPackagePaths(workspaceRoot, root);

  fs.rmSync(paths.dist, { recursive: true, force: true });

  if (!sourceRoot || !root) {
    return;
  }

  runSwc(paths, 'es6');
  runSwc(paths, 'commonjs');

  copyPackageJson(paths);
  copyReadme(paths);

  return {
    success: true,
  };
}

function copyReadme(paths: PackagePaths) {
  fs.copyFileSync(paths.readme, path.join(paths.dist, 'README.md'));
}

function copyPackageJson(paths: PackagePaths) {
  const packageJson = readJsonFile(paths.packageJson);
  packageJson.types = './src/index.d.ts';
  packageJson.main = './lib-commonjs/index.js';
  packageJson.main = './lib/index.js';
  packageJson.sideEffects = false;
  packageJson.license = 'MIT';
  Object.assign(packageJson, {
    types: './src/index.d.ts',
    main: './lib-commonjs/index.js',
    module: './lib/index.js',
    sideEffects: false,
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'https://github.com/microsoft/fluentui-contrib',
    },
  });
  writeJsonFile(path.resolve(paths.dist, 'package.json'), packageJson);
}

function runSwc(paths: PackagePaths, type: ModuleType) {
  const destPath = type === 'commonjs' ? paths.commonjs : paths.esm;
  const swcCmd = getSwcCmd({
    srcPath: 'src',
    destPath: destPath,
    swcrcPath: '.swcrc',
    type,
  });

  console.log('running', swcCmd);
  execSync(swcCmd, { cwd: paths.root });
}

function getSwcCmd({
  srcPath,
  swcrcPath,
  destPath,
  type,
}: {
  srcPath: string;
  swcrcPath: string;
  destPath: string;
  type: ModuleType;
}) {
  return `npx swc ${srcPath} -d ${destPath} --config-file=${swcrcPath} --config module.type=${type}`;
}
