FROM python:3.8.1-slim-buster

WORKDIR /app
ADD ./server/requirements.txt /app/backend/

RUN pip install --upgrade pip
RUN pip install gunicorn
RUN pip install -r backend/requirements.txt

ADD ./docker /app/docker
ADD ./server /app/backend

ENV CHAT_URL https://bbrnation.com/bot/crib_message/
