FROM node:18

WORKDIR /root/source
COPY . .

WORKDIR /root/build
COPY package.json ./
COPY yarn.lock ./
COPY dist ./dist

CMD ["/root/source/src/e2e/docker.sh"]
