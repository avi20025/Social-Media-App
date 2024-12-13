import React, {useCallback, useContext, useState} from 'react';
import axios from "axios";
import {Alert, Button, TextField, Typography} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {TopBarContext} from "../TopBar/Context";
import "./styles.css";
import RegisterUser from "./RegisterUser";

function LoginRegister() {
  const { setUserLoggedIn, setLeftContext } = useContext(TopBarContext);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [loginFailureMessage, setLoginFailureMessage] = useState('');
  const navigate = useNavigate();

  const handleUserNameChange = (e) => setUserName(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);

  const onLoginButtonClick = useCallback(async (event) => {
    // Prevent the button from refreshing the page
    event.preventDefault();

    if (!userName) {
      setLoginFailureMessage('Please enter a username');
      return;
    }
    if (!password) {
      setLoginFailureMessage('Please enter a password');
      return;
    }

    const postBody = {
      login_name: userName,
      password: password
    };

    axios.post("http://localhost:3000/admin/login", postBody)
      .then((response) => {
        // Set the local storage with the user's ID and first name
        // This is used to keep the user logged in across page refreshes
        localStorage.setItem("user_id", response.data._id);
        localStorage.setItem("first_name", response.data.first_name);
        setUserLoggedIn(true);
        setLeftContext(`Hi, ${response.data.first_name}`);
        navigate(`/users/${response.data._id}`);
      })
      .catch((err) => {
        if (err.response) {
          setLoginFailureMessage(err.response.data);
        } else if (err.request) {
          setLoginFailureMessage("No response received from the server.");
        } else {
          setLoginFailureMessage("An unexpected error occurred: " + err.message);
        }
      });
  }, [userName, password, setUserLoggedIn, setLeftContext, navigate, setLoginFailureMessage]);

  const onCreateAccountButtonClick = useCallback(async (event) => {
    event.preventDefault();
    setCreatingAccount(!creatingAccount);
  }, [setCreatingAccount, creatingAccount]);

  return (
    !creatingAccount ? (
      // USER LOGIN
      <div className="login-page-container">
        <Typography variant="h3">
          Welcome! <br/> Please log in below.
        </Typography>

        <TextField
          label="Username"
          placeholder="Enter username"
          variant="outlined"
          fullWidth
          required
          value={userName}
          onChange={handleUserNameChange}
          sx={{
            margin: '10px auto',
            width: '50%'
          }}
        />
        <br/>
        <TextField
          label="Password"
          placeholder="Enter password"
          type="password"
          variant="outlined"
          fullWidth
          required
          value={password}
          onChange={handlePasswordChange}
          sx={{
            margin: '10px auto',
            width: '50%'
          }}
        />
        {/* Log in failure message alert */}
        {loginFailureMessage && (
          <Alert severity="error" sx={{width: "40%", margin: "10px auto 10px", textAlign: "center"}}>
            {loginFailureMessage}
          </Alert>
        )}
        <br/>
        <Button
          type="submit"
          color="primary"
          variant="contained"
          onClick={onLoginButtonClick}
          sx={{width: '50%'}}
        >
          Log in
        </Button>
        <br/>
        <Button
          type="submit"
          size="small"
          color="primary"
          variant="text"
          onClick={onCreateAccountButtonClick}
          sx={{
            width: '50%',
            mt: "10px"
          }}
        >
          Don&#39;t have an account? Create one here.
        </Button>
      </div>
    ) : (
      // NEW USER REGISTRATION
      <div className="login-page-container">
        <RegisterUser />
        <Button
          type="submit"
          size="small"
          color="primary"
          variant="text"
          onClick={onCreateAccountButtonClick}
          sx={{
            width: '50%',
            mt: "10px"
          }}
        >
          Back to Login
        </Button>
      </div>
      )
  );
}

export default LoginRegister;