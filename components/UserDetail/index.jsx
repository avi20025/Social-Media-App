import React, {useContext, useEffect, useState} from "react";
import {Button, Divider, Typography} from "@mui/material";

import "./styles.css";
import {useNavigate} from "react-router-dom";
import axios from 'axios';
import {TopBarContext} from "../TopBar/Context";

function UserDetail({userId}) {
  const [user, setUser] = useState({});
  const [extendedDetails, setExtendedDetails] = useState(null);
  const navigate = useNavigate();

  // Update the TopBar when this component is loaded
  const { setContext } = useContext(TopBarContext);
  useEffect(() => {
    setContext(`${user.first_name} ${user.last_name}'s details`);
  }, [setContext, user.first_name, user.last_name]);

  // Fetch the user's information
  useEffect(() => {
    function fetchUserInfo() {
      axios
        .get(`http://localhost:3000/user/${userId}`)
        .then((response) => {
          setUser(response.data);
        })
        .catch((error) => {
          console.error("Failed to fetch user data:", error);
        });
    }

    function fetchExtendedUserInfo() {
      axios
        .get(`http://localhost:3000/user/${userId}/extended_detail`)
        .then((response) => {
          setExtendedDetails(response.data);
        })
        .catch((error) => {
          console.error("Failed to fetch extended user data:", error);
          setExtendedDetails(null);
        });
    }

    fetchUserInfo();
    fetchExtendedUserInfo();
  }, [userId]); // Only run once the userId is updated

  const handleClick = (photoCreatorId, photoIndex) => {
    navigate(`/photos/${photoCreatorId}/${photoIndex}`);
  };

  const dateOptions = {
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };

  return (
    <div className="user-detail-box">
      <Typography variant="h3" className="user-detail-box-username">
        User {user.first_name} {user.last_name}
        <br/>
        <Button
          onClick={() => navigate(`/photos/${user._id}`)}
          className="user-detail-box-photos-button"
          variant="contained"
        >
          View Photos
        </Button>
      </Typography>
      <Divider/>
      <Typography variant="h6" className="user-detail-box-details">
        Location: {user.location} | Occupation: {user.occupation}
      </Typography>
      <Typography variant="body1" className="user-detail-box-description">
        Description: {user.description}
      </Typography>

      {extendedDetails && extendedDetails.mostRecentPhoto && (
        <>
        <Divider sx={{mb: "10px", mt: "10px"}}/>
        {/*  Most recently uploaded photo */}
        <Typography variant="h6" sx={{mt: "20px"}}>
          Most recently uploaded photo
        </Typography>

        <button
          key={`${extendedDetails.mostRecentPhoto._id}_mostRecent`}
          className="user-detail-box-wrapper-photo-text-container"
          onClick={() => handleClick(
            extendedDetails.mostRecentPhoto.user_id,
            extendedDetails.mostRecentPhoto.photo_index
          )}
        >
          <div className="user-detail-box-wrapper-photo-text">
            <img
              className="user-detail-box-photo-thumbnail"
              src={`/images/${extendedDetails.mostRecentPhoto.file_name}`}
              alt={`Thumbnail of ${extendedDetails.mostRecentPhoto._id}`}
            />
            <Divider orientation="vertical" className="user-detail-box-photo-thumbnail-divider"/>
            <Typography variant="body1" className="user-detail-box-photo-thumbnail-text">
              Uploaded at { new Date(extendedDetails.mostRecentPhoto.date_time).toLocaleString('en-US', dateOptions) }
            </Typography>
          </div>
        </button>

        <br/>

        {/*  Photo with most comments */}
        <Typography variant="h6" sx={{mt: "20px"}}>
          Photo with the most comments
        </Typography>
        <button
          key={`${extendedDetails.photoWithMostComments._id}_mostComments`}
          className="user-detail-box-wrapper-photo-text-container"
          onClick={() => handleClick(
            extendedDetails.photoWithMostComments.user_id,
            extendedDetails.photoWithMostComments.photo_index
          )}
        >
          <div className="user-detail-box-wrapper-photo-text">

            <img
              className="user-detail-box-photo-thumbnail"
              src={`/images/${extendedDetails.photoWithMostComments.file_name}`}
              alt={`Thumbnail of ${extendedDetails.photoWithMostComments._id}`}
            />
            <Typography variant="body1" className="user-detail-box-photo-thumbnail-text">
              Comment count: {extendedDetails.photoWithMostComments.comment_count}
            </Typography>
          </div>
        </button>
        </>
        )}
    </div>
  );
}

export default UserDetail;
