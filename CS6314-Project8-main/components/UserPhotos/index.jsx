import React, {useCallback, useContext, useEffect, useState} from "react";
import {Divider, List, Typography} from "@mui/material";
import axios from 'axios';

import "./styles.css";
import {useNavigate} from "react-router-dom";
import {TopBarContext} from "../TopBar/Context";
import StepperView from "./StepperView";
import Comments from "./PhotoComments";
import PhotoLikes from "./PhotoLikes";
import PhotoFavorites from "./PhotoFavorites";

function UserPhotos({userId, photoIndex}) {
  const [userPhotos, setUserPhotos] = useState([]);
  const [user, setUser] = useState({first_name: "", last_name: ""});
  const [commentsUpdated, setCommentsUpdated] = useState(false);

  /* ------------------------ TOP BAR FUNCTIONS */
  const { setContext, advancedFeatures, wasClicked, setAdvancedFeatures, setWasClicked } = useContext(TopBarContext);
  // Set the text within the top right of the Top Bar
  useEffect(() => {
    setContext(`Photos of ${user.first_name} ${user.last_name}`);
  }, [setContext, user.first_name, user.last_name]);

  /* ------------------------ API CALLS */
  // Fetch the user's information and their associated photos
  useEffect(() => {
    function fetchData() {
      Promise.all([
        axios.get(`http://localhost:3000/photosOfUser/${userId}`),
        axios.get(`http://localhost:3000/user/${userId}`)
      ])
        .then(([userPhotoData, userData]) => {
          const photos = userPhotoData.data;

          // If we are on the normal photo view, we need to display
          // the photos by descending like count order
          if (!advancedFeatures) {
            // Sort photos by like count and time stamp
            const sortedPhotos = photos.sort((a, b) => {
              // If likes are the same, show the most recent photo first
              if (b.likes === a.likes) {
                return new Date(b.date_time) - new Date(a.date_time);
              }
              return b.likes - a.likes;
            });

            setUserPhotos(sortedPhotos);
          } else {
            setUserPhotos(userPhotoData.data);
          }

          setUser(userData.data);
        })
        .catch((error) => {
          console.error("Failed to fetch user or photo data:", error);
        });
    }

    fetchData();
    // Refetch the data whenever the userId changes, the user makes a comment, or the advanced
    // features checkbox is toggled
  }, [userId, commentsUpdated, advancedFeatures]);

  /* ------------------------ PHOTO STEPPER FUNCTIONS */
  const navigate = useNavigate();
  // URL UPDATES
  useEffect(() => {
    // If the USER clicked the button to disable advanced features or it was already be disabled when the URL was loaded
    if (!advancedFeatures && (wasClicked || photoIndex === undefined)) {
      navigate(`/photos/${userId}`, { replace: true }); // Navigate back to the default view (no stepper)
    }

    // Otherwise we navigate to the URL at photoIndex because the advancedFeatures was true
    else if (photoIndex !== undefined) {
      navigate(`/photos/${userId}/${photoIndex}`, { replace: true });
    }

    // If the user just clicked the button to enable advanced features, go to the first photo in their photo list
    else {
      navigate(`/photos/${userId}/0`, { replace: true });
    }
  }, [advancedFeatures, photoIndex, navigate]);

  useEffect(() => {
    if (photoIndex !== undefined) {
      setAdvancedFeatures(true);
      setWasClicked(false); // The URL was loaded and we set the advancedFeatures to true (therefore, the checkbox was not clicked by the user)
    }
  }, [photoIndex]);

  // Update photo index in the URL whenever the user changes photos
  const nextPhoto = useCallback(() => {
    const currentIndex = parseInt(photoIndex, 10); // Make sure photoIndex is a number
    const nextIndex = currentIndex < userPhotos.length - 1 ? currentIndex + 1 : userPhotos.length - 1;
    navigate(`/photos/${userId}/${nextIndex}`);
  }, [photoIndex, userPhotos.length, userId, navigate]);
  const prevPhoto = useCallback(() => {
    const currentIndex = parseInt(photoIndex, 10); // Make sure photoIndex is a number
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    navigate(`/photos/${userId}/${prevIndex}`);
  }, [photoIndex, userId, navigate]);

  return (
    <div className="users-photos-wrapper">
      <Typography variant="h2" className="users-photos-wrapper-header">
        {user.first_name}&#39;s Photos
      </Typography>

      {/* Check if the user has enabled the advanced features checkbox and there is a valid photo index */}
      { advancedFeatures && photoIndex !== undefined ? (
        <StepperView
          photos={userPhotos}
          currentIndex={photoIndex}
          nextPhoto={nextPhoto}
          prevPhoto={prevPhoto}
          rerenderParentCallback={() => setCommentsUpdated(!commentsUpdated)}
        />
      ) : (
        <>
          <Divider/>
          <List>
            {
              userPhotos.map(photo => {
                let photoDate = new Date(photo.date_time);

                let options = {
                  hour: '2-digit',
                  minute: '2-digit',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                };

                let formattedDate = photoDate.toLocaleString('en-US', options);
                let [date, time] = formattedDate.split('at');
                let friendlyDate = `Posted at ${time} on ${date}`;

                return (
                  <div key={photo._id} className="users-photos-wrapper-photo-box">
                    {/* Favorite Photo Button */}
                    <PhotoFavorites photoId={photo._id} />

                    { /* The actual photo */}
                    <img
                      className="users-photos-wrapper-photo-box-image"
                      src={`/images/${photo.file_name}`}
                      alt={photo._id}
                    />

                    { /* Photo time */}
                    <Typography variant="body1" className="users-photos-wrapper-photo-time">
                      {friendlyDate}
                    </Typography>

                    <PhotoLikes photoId={photo._id} />

                    {/* Photo comments, only render if there are any */}
                    {photo.comments &&
                      <Comments comments={photo.comments} photoID={photo._id} rerenderParentCallback={() => setCommentsUpdated(!commentsUpdated)}/>}
                  </div>
                );
              })
            }
          </List>
        </>
        )}
    </div>
  );
}

export default UserPhotos;
