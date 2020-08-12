import React  from "react";
import '../Player/Player.css'

export const Opponents = (props) => {

  const renderOpponents = () => {
    console.log('rendering the opponents: ' + props.opponents);
    return props.opponents.length ? (
      <>
        {props.opponents.map((opponent, index) => (
          <div key={index} className={`opponent opponent-${index}`}>{opponent}</div>
        ))}
      </>
    ) : (
      <span />
    );
  };

  return (
      <>
      { renderOpponents() }
      </>
  )
}