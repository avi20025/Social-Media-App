import React, {createContext, useState, useMemo} from "react";

export const TopBarContext = createContext("");

// The idea for this TopBarContext comes from https://react.dev/learn/passing-data-deeply-with-context
export function TopBarContextProvider({ children }) {
  // Used to store the text within the top right of the bar
  const [context, setContext] = useState("");
  // Used to store if the advanced features checkbox is checked or not
  const [advancedFeatures, setAdvancedFeatures] = useState(false);
  // Used to store if the toggle was updated via a user click or within the code
  const [wasClicked, setWasClicked] = useState(false);
  // Used to store the text in the top left of the bar
  const [leftContext, setLeftContext] = useState("Please Login");
  // Used to track if a user has logged in or not
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  // useMemo hook is used to ensure that the context value only changes when necessary (improves performance)
  const contextValue = useMemo(
    () => ({
      context,
      setContext,
      advancedFeatures,
      setAdvancedFeatures,
      wasClicked,
      setWasClicked,
      leftContext,
      setLeftContext,
      userLoggedIn,
      setUserLoggedIn
    }),
[
      context, setContext,
      advancedFeatures, setAdvancedFeatures,
      wasClicked, setWasClicked,
      leftContext, setLeftContext,
      userLoggedIn, setUserLoggedIn
  ]);

  return (
    <TopBarContext.Provider value={contextValue}>
      {children}
    </TopBarContext.Provider>
  );
}
