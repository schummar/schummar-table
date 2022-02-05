import { makeStyles } from '@material-ui/core';
import React from 'react';

const useClasses = makeStyles((theme) => ({
  line: {
    position: 'relative',
    width: 2,
    margin: '0 -1px 0 -1px',
    background: theme.palette.primary.main,
  },
}));

export function InsertLine() {
  const classes = useClasses();
  return <div className={classes.line} />;
}
