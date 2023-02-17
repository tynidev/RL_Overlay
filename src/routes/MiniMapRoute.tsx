import React, { useEffect, useState } from "react";
import MiniMap from "../components/MiniMap";
import Match from "../match";

interface MiniMapProps {
  match: Match;
  width: number;
  height: number;
}

const MiniMapRoute: React.FunctionComponent<MiniMapProps> = (props) => {
  const [state, setState] = useState(MiniMap.GetState(props.match));

  useEffect(() => {
    const fn = props.match.OnBallMove((ball) => {
      setState(MiniMap.GetState(props.match));
    });
    return () => fn(props.match);
  }, [props.match]);

  return (
    <div className="overlay" style={{ width: props.width }}>
      <MiniMap {...state} height={props.height} />
    </div>
  );
};

export default MiniMapRoute;
