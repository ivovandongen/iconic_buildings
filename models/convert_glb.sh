#!/bin/bash

for f in *.fbx; do
  echo "Converting $f"
  FBX2glTF-darwin-x64 --binary "$f"
done
