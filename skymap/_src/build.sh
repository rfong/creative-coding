#!/bin/bash

# Builds this directory with `snowpack` and then moves it to the dist
# directory. Doing this because I don't currently have a functioning way to
# configure snowpack.

# Build
npm run build

# Clean up because I can't config
rm build/README.md build/package.json build/package-lock.json build/build.sh
mv build/_snowpack build/snowpack
perl -pi -e "s/_snowpack/snowpack/g" build/*.js

# Move up a dir and rename
rm -rf ../dist
mv build ../dist
