#!/bin/sh

until cd /app/backend
do
    echo "Waiting for server volume..."
done

gunicorn -b 0.0.0.0:5000 --worker-class eventlet -w 1 app:app
