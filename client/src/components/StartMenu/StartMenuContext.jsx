import React from "react";
import useModal from "../../hooks/useModal";
import StartMenu from "./StartMenu";
let StartMenuContext;
let { Provider } = (StartMenuContext = React.createContext());

let StartMenuProvider = ({ children }) => {
  let { modal, handleModal, modalContent } = useModal();
  return (
    <Provider value={{ modal, handleModal, modalContent }}>
      <StartMenu />
      {children}
    </Provider>
  );
};

export { StartMenuContext, StartMenuProvider };