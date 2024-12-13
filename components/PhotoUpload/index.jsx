import React, {useContext, useRef, useState} from "react";

import "./styles.css";
import axios from "axios";
import {Alert, Button, Typography} from "@mui/material";
import {TopBarContext} from "../TopBar/Context";

function PhotoUpload() {
  const { setContext } = useContext(TopBarContext);
  setContext("Uploading a photo");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [loginFailureMessage, setLoginFailureMessage] = useState('');

  const uploadInputRef = useRef(null);
  const handleUploadButtonClicked = (e) => {
    e.preventDefault();
    const fileInput = uploadInputRef.current;

    // Check if a file was selected by the user
    if (fileInput && fileInput.files.length > 0) {
      // Create a DOM form and add the file to it under the name 'uploadedphoto'
      const domForm = new FormData();
      domForm.append('uploadedphoto', fileInput.files[0]);

      axios.post('/photos/new', domForm)
        .then(() => {
          setLoginFailureMessage('');
          setUploadSuccess(true);
        })
        .catch(err => {
          setLoginFailureMessage(err.response);
        });
    } else {
      setLoginFailureMessage("No file selected");
    }
  };

  return (
    <div className="photo-upload-container">
      <Typography variant="h5" sx={{marginBottom: "10px"}}>
        Please Select A Photo To Upload
      </Typography>

      <input
        type="file"
        accept="image/*"
        ref={uploadInputRef}
        style={{margin: "10px 0"}}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleUploadButtonClicked}
      >
        Upload Photo
      </Button>

      {uploadSuccess && (
        <Alert severity="success" sx={{width: "60%", margin: "20px auto 0"}}>
          Photo uploaded successfully!
        </Alert>
      )}
      {loginFailureMessage && (
        <Alert severity="error" sx={{width: "60%", margin: "20px auto 0"}}>
          Photo was not uploaded. {loginFailureMessage}
        </Alert>
      )}
    </div>
  );
}

export default PhotoUpload;