#!/bin/bash

for f in *.fbx; do
  filename=$(basename -- "$f")
  extension="${filename##*.}"
  filename="${filename%.*}"
  echo "Converting ${f} to ${filename}.glb"
  FBX2glTF-darwin-x64 --binary "$f" -o "${filename}"
  base64 -i "${filename}.glb" -o "${filename}.glb.base64"
done
