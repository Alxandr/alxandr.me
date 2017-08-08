#!/bin/bash

FILE=$1
DIR=$(dirname "$1")

pushd "$DIR"
npm install
popd
