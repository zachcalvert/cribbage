from flask.cli import FlaskGroup

from app.games import cribbage


cli = FlaskGroup(cribbage)


@cli.command("populate_redis")
def populate_redis():
    pass


if __name__ == "__main__":
    cli()
