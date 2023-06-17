
FROM node:14

WORKDIR /app

COPY package*.json /app
COPY yarn.lock /app
COPY . /app

RUN yarn install
RUN ROUTER_BASE="/k8s/clusters/c-9686q/api/v1/namespaces/default/services/http:helloworld:8555/proxy/" yarn build

EXPOSE 3000
CMD [ "yarn", "start" ]