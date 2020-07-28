## Real-time, multiplayer card games

### To run cribbage.live locally:
* docker-compose up --build
* npm start

### To run the tests
* docker-compose exec -T flask coverage run -m  pytest
* docker-compose exec -T flask coverage report -m
