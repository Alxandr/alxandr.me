#!/bin/bash

find . -type f -name package.json ! -path "*/node_modules/*" | while read package; do
  pushd "$(dirname $package)"
  npm i
  popd
done
