until cd /app/backend/server
do
    echo "Waiting for server volume..."
done

gunicorn -b 0.0.0.0:5000 --access-logfile --worker-class eventlet -w 1 app:app
