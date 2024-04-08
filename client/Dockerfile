# pull official base image
FROM node:21-alpine3.18

# set working directory
WORKDIR /code

# add `/app/node_modules/.bin` to $PATH
ENV PATH /code/node_modules/.bin:$PATH
ARG REACT_APP_SOCKET_HOST
ENV REACT_APP_SOCKET_HOST http://localhost:5000

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install --silent

# add app
COPY . ./

# start app
CMD ["npm", "start"]
