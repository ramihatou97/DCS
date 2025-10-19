#!/bin/bash
# Script to convert ES6 module to CommonJS for backend

FILE="$1"

if [ -z "$FILE" ]; then
  echo "Usage: $0 <file>"
  exit 1
fi

# Create backup
cp "$FILE" "$FILE.bak"

# Convert import statements to require
# Handle: import { a, b } from 'module'
sed -i '' 's/^import { \([^}]*\) } from '\''\([^'\'']*\)'\''.*$/const { \1 } = require('\''\2'\'');/g' "$FILE"

# Handle: import a from 'module'
sed -i '' 's/^import \([^ ]*\) from '\''\([^'\'']*\)'\''.*$/const \1 = require('\''\2'\'');/g' "$FILE"

# Handle: import * as name from 'module'
sed -i '' 's/^import \* as \([^ ]*\) from '\''\([^'\'']*\)'\''.*$/const \1 = require('\''\2'\'');/g' "$FILE"

# Convert export statements
sed -i '' 's/^export const /const /g' "$FILE"
sed -i '' 's/^export function /function /g' "$FILE"
sed -i '' 's/^export async function /async function /g' "$FILE"
sed -i '' 's/^export default /module.exports = /g' "$FILE"

echo "Converted $FILE to CommonJS"
echo "Backup saved as $FILE.bak"
