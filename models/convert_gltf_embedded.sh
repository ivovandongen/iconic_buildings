#!/bin/bash

for f in *.fbx; do
  filename=$(basename -- "$f")
  extension="${filename##*.}"
  filename="${filename%.*}"
  echo "Converting ${f} to ${filename}_embedded.gltf"
  FBX2glTF-darwin-x64 -e "$f" -o "${filename}_embedded"
done
