import React, {useCallback, useContext} from "react";
import {AppBar, Button, Checkbox, FormControlLabel, Toolbar, Typography} from "@mui/material";

import "./styles.css";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import { TopBarContext } from "./Context";

function TopBar() {
  // context = the text that the TopBar should display in the top right
  // advancedFeatures = the state of the advanced features checkbox
  // setWasClicked = the function to set the wasClicked state (we will make it true b/c the user clicked the checkbox)
  // leftContext = used to display the text "Please Log In" or "Hi, <firstname>"
  // userLoggedIn = enables access to pages other than the log in screen
  const {
    context,
    setAdvancedFeatures,
    advancedFeatures,
    setWasClicked,
    leftContext,
    userLoggedIn,
    setUserLoggedIn,
    setLeftContext,
  } = useContext(TopBarContext);
  const navigate = useNavigate();

  const onLogoutButtonClick = useCallback((event) => {
    event.preventDefault();

    axios.post('/admin/logout', {})
      .finally(() => {  // This is finally b/c we want to log out on success or failure
        // Local storage is used to keep the user logged in across page refreshes
        localStorage.removeItem("user_id");
        localStorage.removeItem("first_name");
        // State is used to show that a user has logged in in this current browser (before refresh)
        setUserLoggedIn(false);
        setLeftContext("Please Login");
      });
  }, [setUserLoggedIn, setLeftContext]);

  const onAddPhotoButtonClick = useCallback((event) => {
    event.preventDefault();
    navigate('/photo-upload');
  }, [navigate]);

  const onViewFavoritesButtonClick = useCallback((event) => {
    event.preventDefault();
    navigate('/favorites');
  }, [navigate]);

  return (
    <AppBar className="topbar-appBar" position="absolute">
      <Toolbar>
        <Typography variant="h5" color="inherit">
          {leftContext} |
        </Typography>

        {/* Advanced Features checkbox */}
        <FormControlLabel
          style={{ marginLeft: "7px" }}
          labelPlacement="start"
          label="Advanced Features"
          control={(
            <Checkbox
              sx={{marginRight: "7px"}}
              checked={advancedFeatures}
              color="default"
              onChange={e => {
                setAdvancedFeatures(e.target.checked);
                setWasClicked(true);
              }}
            />
          )}
        />

        {/* Add photo and log out buttons */}
        {userLoggedIn && (
          <>
            <Typography variant="h5" color="inherit">
              {' '}|{' '}
            </Typography>

            <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
              <Button
                size="small"
                variant="contained"
                color="success"
                disableElevation={true}
                sx={{ml: "7px", mr: "7px", mb: "3px", padding: "2px 4px"}}
                onClick={onAddPhotoButtonClick}>
                Add Photo
              </Button>

              <Button
                size="small"
                variant="contained"
                disableElevation={true}
                sx={{
                  ml: "7px",
                  mr: "7px",
                  padding: "2px 4px",
                  backgroundColor: "#f1c40f",
                  '&:hover': {
                    backgroundColor: "#d4ac0d",
                  },
                }}
                onClick={onViewFavoritesButtonClick}>
                View Favorites
              </Button>
            </div>

            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={onLogoutButtonClick}
              disableElevation={true}>
              Log Out
            </Button>
          </>
        )}

        <Typography variant="h6" color="inherit" style={{marginLeft: "auto"}}>
          {context}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
