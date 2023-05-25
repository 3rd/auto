#!/usr/bin/env bash
set -uf -o pipefail
IFS=$'\n\t'

cd /root/build || exit
HUSKY=0 yarn --immutable
npm install -g .

cd /root/source || exit
HUSKY=0 yarn --immutable

mkdir ~/.config
npx tsx src/e2e
