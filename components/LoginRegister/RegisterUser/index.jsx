import {Alert, Button, TextField, Typography} from "@mui/material";
import React, { useState, useCallback } from "react";
import './styles.css';
import axios from "axios";

function RegisterUser() {
  const [formData, setFormData] = useState({
    userName: '',
    password: '',
    secondPassword: '',
    firstName: '',
    lastName: '',
    location: '',
    description: '',
    occupation: ''
  });
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadFailure, setUploadFailure] = useState(false);
  const [failureMessage, setFailureMessage] = useState('');


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value
    }));
  };

const onRegisterUserButtonClick = useCallback(async (event) => {
  event.preventDefault();
  if (formData.password !== formData.secondPassword) {
    setUploadFailure(true);
    setFailureMessage('Please make sure your passwords match.')
    return;
  }

  const postData = {
    login_name: formData.userName,
    password: formData.password,
    first_name: formData.firstName,
    last_name: formData.lastName,
    location: formData.location,
    description: formData.description,
    occupation: formData.occupation
  };

  await axios.post("http://localhost:3000/user", postData)
    .then((response) => {
      console.log(response);

      // Clear the input fields
      setFormData({
        userName: '',
        password: '',
        secondPassword: '',
        firstName: '',
        lastName: '',
        location: '',
        description: '',
        occupation: ''
      });

      setUploadFailure(false);
      setUploadSuccess(true);
    })
    .catch((err) => {
      if (err.response) {
        setFailureMessage(err.response.data);
      } else if (err.request) {
        setFailureMessage("No response received from the server.");
      } else {
        setFailureMessage("An unexpected error occurred: " + err.message);
      }

      setUploadFailure(true);
    });
}, [formData, setFailureMessage, setUploadFailure, setFormData]);


  return (
    <>
      <Typography variant="h3">
        Create an account
      </Typography>

      {uploadSuccess && (
        <Alert severity="success" sx={{width: "40%", margin: "20px auto 20px", textAlign: "center"}}>
          User {formData.firstName + " " + formData.lastName} created successfully!
        </Alert>
      )}
      {uploadFailure && (
        <Alert severity="error" sx={{width: "40%", margin: "20px auto 20px", textAlign: "center"}}>
          User was not created. {failureMessage}
        </Alert>
      )}

      <TextField
        label="Username"
        placeholder="Enter username"
        variant="outlined"
        fullWidth
        required
        name="userName"
        value={formData.userName}
        onChange={handleChange}
        sx={{ margin: '10px auto', width: '40%' }}
      />
      <br />
      <TextField
        label="Password"
        placeholder="Enter password"
        type="password"
        variant="outlined"
        fullWidth
        required
        name="password"
        value={formData.password}
        onChange={handleChange}
        sx={{ margin: '10px 10px 10px 0', width: '40%' }}
      />
      <TextField
        label="Confirm Password"
        placeholder="Enter password"
        type="password"
        variant="outlined"
        fullWidth
        required
        name="secondPassword"
        value={formData.secondPassword}
        onChange={handleChange}
        sx={{ margin: '10px 0', width: '40%' }}
      />
      <br />

      <TextField
        label="First Name"
        placeholder="Enter first name"
        variant="outlined"
        fullWidth
        required
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        sx={{ margin: '10px 10px 10px 0', width: '40%' }}
      />
      <TextField
        label="Last Name"
        placeholder="Enter last name"
        variant="outlined"
        fullWidth
        required
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        sx={{ margin: '10px 0', width: '40%' }}
      />
      <br />

      <TextField
        label="Location"
        placeholder="Enter location"
        variant="outlined"
        fullWidth
        name="location"
        value={formData.location}
        onChange={handleChange}
        sx={{ margin: '10px auto', width: '50%' }}
      />
      <br />

      <TextField
        label="Description"
        placeholder="Enter description"
        variant="outlined"
        fullWidth
        name="description"
        value={formData.description}
        onChange={handleChange}
        sx={{ margin: '10px auto', width: '50%' }}
      />
      <br />

      <TextField
        label="Occupation"
        placeholder="Enter occupation"
        variant="outlined"
        fullWidth
        name="occupation"
        value={formData.occupation}
        onChange={handleChange}
        sx={{ margin: '10px auto', width: '50%' }}
      />
      <br />

      <Button
        type="submit"
        size="medium"
        color="success"
        variant="contained"
        onClick={onRegisterUserButtonClick}
        sx={{ width: '50%', mt: "10px" }}
      >
        Register Me
      </Button>
    </>
  );
}

export default RegisterUser;
