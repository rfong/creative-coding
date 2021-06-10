#!/bin/bash

# Builds this directory with `snowpack` and then moves it to the dist
# directory. Doing this because I don't currently have a functioning way to
# configure snowpack.

npm run build
rm build/README.md build/package.json build/package-lock.json build/build.sh
rm -rf ../dist
mv build ../dist
