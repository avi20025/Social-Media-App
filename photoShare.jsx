import React, {useContext, useEffect, useState} from "react";
import ReactDOM from "react-dom/client";
import {CircularProgress, Grid, Paper} from "@mui/material";
import {HashRouter, Navigate, Route, Routes, useParams} from "react-router-dom";

import "./styles/main.css";
import axios from 'axios';
import TopBar from "./components/TopBar";
import UserDetail from "./components/UserDetail";
import UserList from "./components/UserList";
import UserPhotos from "./components/UserPhotos";
import UserComments from "./components/UserComments";
import LoginRegister from "./components/LoginRegister";
import { TopBarContext, TopBarContextProvider } from "./components/TopBar/Context";
import PhotoUpload from "./components/PhotoUpload";
import FavoritePhotos from "./components/FavoritePhotos";


function UserDetailRoute() {
  const {userId} = useParams();
  console.log("UserDetailRoute: userId is:", userId);
  return <UserDetail userId={userId} />;
}

function UserPhotosRoute() {
  const {userId, photoIndex} = useParams();
  return <UserPhotos userId={userId} photoIndex={photoIndex} />;
}

function UserCommentsRoute() {
  const {userId} = useParams();
  return <UserComments userId={userId} />;
}

function PhotoShare() {
  const { userLoggedIn, setContext, setUserLoggedIn, setLeftContext } = useContext(TopBarContext);
  // This state is used to track if the browser has checked if a user is already logged in
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check if the user has already signed in before
    const userId = localStorage.getItem("user_id");
    const firstName = localStorage.getItem("first_name");
    if (userId && firstName) {
      // If the user has signed in, set the temp session in memory
      setUserLoggedIn(true);
      setLeftContext(`Hi, ${firstName}`);
    }
    setAuthChecked(true);

    function fetchAppVersion() {
      axios
        .get("http://localhost:3000/test/info")
        .then((response) => {
          setContext(`Running Version: v${response.data.__v}`);
        })
        .catch((error) => {
          console.error("Failed to fetch app version:", error);
        });
    }

    fetchAppVersion();
  }, [setContext, setUserLoggedIn, setLeftContext, setAuthChecked]);


  if (!authChecked) return <CircularProgress />;

  return (
    <HashRouter>
      <div>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TopBar />
          </Grid>
          <div className="main-topbar-buffer" />
          <Grid item sm={3}>
            <Paper className="main-grid-item">
              <UserList />
            </Paper>
          </Grid>
          <Grid item sm={9}>
            <Paper className="main-grid-item">
              <Routes>
                {/* Redirect to login page if the user is not signed in */}
                <Route
                  path="/users/:userId"
                  element={
                    userLoggedIn ? (
                      <UserDetailRoute />
                    ) : (
                      <Navigate to="/login-register" replace />
                    )
                  }
                />
                <Route
                  path="/photos/:userId/:photoIndex?"
                  element={
                    userLoggedIn ? (
                      <UserPhotosRoute />
                    ) : (
                      <Navigate to="/login-register" replace />
                    )
                  }
                />
                <Route path="/users" element={<UserList />} />
                <Route
                  path="/users/:userId/comments"
                  element={
                    userLoggedIn ? (
                      <UserCommentsRoute />
                    ) : (
                      <Navigate to="/login-register" replace />
                    )
                  }
                />
                <Route
                  path="/photo-upload"
                  element={
                    userLoggedIn ? (
                      <PhotoUpload />
                    ) : (
                      <Navigate to="/login-register" replace />
                    )
                  }
                />
                <Route
                  path="/favorites"
                  element={
                    userLoggedIn ? (
                      <FavoritePhotos />
                    ) : (
                      <Navigate to="/login-register" replace />
                    )
                  }
                />
                <Route path="/login-register" element={<LoginRegister />} />
                <Route
                  path="/"
                  element={
                    userLoggedIn ? (
                      <Navigate to={`/users/${localStorage.getItem("user_id")}`} replace />
                    ) : (
                      <Navigate to="/login-register" replace />
                    )
                  }
                />
              </Routes>
            </Paper>
          </Grid>
        </Grid>
      </div>
    </HashRouter>
  );
}


const root = ReactDOM.createRoot(document.getElementById("photoshareapp"));
root.render(
  // Top bar context will hold the top bar's state (the text to display), if a user has logged in, and other details
  // This is so we can update it with the user's name, or check when advanced features are enabled across all components
  <TopBarContextProvider>
    <PhotoShare />
  </TopBarContextProvider>
);