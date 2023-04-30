// File name: ./build.js
/* eslint-env node */
const execSync = require('child_process').execSync;
const { generate } = require('build-number-generator')
const env = Object.create(process.env);

env.NEXT_PUBLIC_APP_BUILD_VERSION= generate("0.0.1");

console.log('Used env variables: ' + JSON.stringify(env));
console.log('Run command: react-scripts start');
execSync('next build', { env: env, stdio: 'inherit' });