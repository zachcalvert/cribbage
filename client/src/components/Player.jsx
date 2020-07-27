import React, {useEffect, useState} from "react";

export const Player = (name) => {

  return (
      <div className="player">
        <span>{JSON.stringify( name )}</span>
      </div>
  );
}