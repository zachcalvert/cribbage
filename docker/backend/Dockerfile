FROM python:3.8.3-alpine

WORKDIR /app
ADD ./server/requirements.txt /app/backend/

RUN apk add --no-cache --virtual .build-deps gcc musl-dev
RUN pip install cython
RUN pip install --upgrade pip
RUN pip install gunicorn
RUN pip install -r backend/requirements.txt
RUN apk del .build-deps gcc musl-dev

ADD ./docker /app/docker
ADD ./server /app/backend
