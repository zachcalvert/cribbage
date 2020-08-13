## Real-time, multiplayer card games

### To run the cards server locally:
* docker-compose up --build

### To run the tests
* docker-compose exec -T flask coverage run -m  pytest
* docker-compose exec -T flask coverage report -m
