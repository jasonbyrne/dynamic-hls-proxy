#!/bin/bash

npm run build
cp README.md dist/README.md
cp package.json dist/package.json

cd ./dist
npm publish