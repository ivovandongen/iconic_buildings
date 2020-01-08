#!/bin/bash

for f in *.fbx; do
  filename=$(basename -- "$f")
  extension="${filename##*.}"
  filename="${filename%.*}"
  echo "Converting ${f} to ${filename}_draco.glb"
  FBX2glTF-darwin-x64 --binary --draco "$f" -o "${filename}_draco"
done
