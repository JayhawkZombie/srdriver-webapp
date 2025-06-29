#!/usr/bin/env bash
set -e

# 1. Go up one level and make a backup
cd ..
cp -r srdriver-webapp srdriver-webapp-backup

# 2. Move back into the project
cd srdriver-webapp

# 3. Move all contents from vite folder up (including hidden files)
shopt -s dotglob nullglob
mv srdriver-webapp-vite/* .
mv srdriver-webapp-vite/.* . 2>/dev/null || true
shopt -u dotglob nullglob

# 4. Remove everything except .git, node_modules, and the files just moved up
find . -mindepth 1 -maxdepth 1 \
  ! -name '.' \
  ! -name '..' \
  ! -name '.git' \
  ! -name 'node_modules' \
  ! -name 'srdriver-webapp-vite' \
  ! -name 'srdriver-webapp-backup' \
  ! -name "$(basename "$0")" \
  -exec rm -rf {} +

# 5. Remove the now-empty vite folder
rm -rf srdriver-webapp-vite

echo "Migration complete! A backup is at ../srdriver-webapp-backup"
   