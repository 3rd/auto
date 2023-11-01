#!/usr/bin/env bash
set -uf -o pipefail
IFS=$'\n\t'

npm install -g pnpm

cd /root/source || exit
HUSKY=0 pnpm i --frozen-lockfile --force
pnpm run build

mkdir /root/build
npm pack --pack-destination /root/build

cd /root/build || exit
npm install -g andrei.fyi-auto-0.0.0-semantic-release.tgz

cd /root/source || exit
mkdir ~/.config
npx tsx src/e2e
