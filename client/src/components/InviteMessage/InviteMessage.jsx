import React from "react";
import { Card, CardActions, CardContent, Link, makeStyles, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    background: theme.palette.background.default,
    width: 'fit-content',
    height: 'auto',
    margin: 'auto',
    marginTop: theme.spacing(4),
    padding: theme.spacing(1)
  },
  title: {
    fontSize: 30,
  },
  pos: {
    marginBottom: 12,
  },
}));

export const InviteMessage = (props) => {
  const { room } = props;
  const classes = useStyles();
  const encoded = encodeURI(`https://cribbage.live/?game=${room}`);
  return  (
    <Card className={classes.root} variant="outlined">
      <CardContent>
        <Typography className={classes.title} color="textPrimary" gutterBottom>
          Welcome!
        </Typography>
        <Typography className={classes.pos} color="textSecondary">
          Invite others to play with the below link:
        </Typography>
        <Link color='inherit' href={encoded}>{encoded}</Link>
        </CardContent>
        <CardActions>
          <Typography color='textSecondary'>
            Or, click the Start button to play against the computer.
          </Typography>
        </CardActions>
    </Card>
  )
};
