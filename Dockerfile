
FROM node:erbium

RUN sed -i -e 's/deb.debian.org/archive.debian.org/g' \
    -e 's|security.debian.org|archive.debian.org/|g' \
    -e '/stretch-updates/d' /etc/apt/sources.list
RUN apt-get update && apt-get install -y

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install --production
COPY . /usr/src/app
CMD [ "npm", "start" ]
