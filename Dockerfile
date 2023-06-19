
FROM node:14

WORKDIR /app

COPY package*.json /app
COPY yarn.lock /app
COPY . /app

RUN yarn install
RUN RESOURCE_BASE="./" yarn build

EXPOSE 3000
CMD [ "yarn", "start" ]