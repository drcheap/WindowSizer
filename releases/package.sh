#!/bin/bash

if [ -z "$1" ]
then
   echo Must specify version number: X.Y.Z
   exit 1
fi

VERSION="$1"

ZIP="/c/Program Files/7-Zip/7z"
FILE="releases/WindowSizer-${VERSION}.zip"

pushd .. || { echo "Cannot change directory to .." ; exit 2; }
[ -f "$FILE" ] && rm "$FILE"
"$ZIP" a -tzip -mx9 -mm=Deflate -mfb=258 -mpass=15 -r -xr!.git* -xr!releases -xr!screenshots -xr!README.md "$FILE" -- *
popd || { echo "Cannot return to previous directory" ; exit 2; }
