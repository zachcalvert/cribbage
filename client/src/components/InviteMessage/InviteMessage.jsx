import React from "react";
import { Card, CardActions, CardContent, Link, makeStyles, ThemeProvider, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    width: 350,
    height: 'auto',
    margin: 'auto',
    padding: theme.spacing(1),
    [theme.breakpoints.down('md')]: {
      marginLeft: 400
    },
    [theme.breakpoints.down('sm')]: {
      marginLeft: 'auto'
    }
  },
  title: {
    fontSize: 24,
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
