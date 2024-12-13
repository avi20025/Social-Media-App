import "./styles.css";
import {Button, Typography} from "@mui/material";
import React from "react";
import Comments from "../PhotoComments";
import PhotoLikes from "../PhotoLikes";
import PhotoFavorites from "../PhotoFavorites";

function StepperView({ photos, currentIndex, nextPhoto, prevPhoto, rerenderParentCallback}) {
  currentIndex = parseInt(currentIndex, 10); // Passed as a string in the URL

  console.log("photos:" + photos)
  console.log("currentIndex:" + currentIndex)


  const formatDate = (dateTime) => {
    let photoDate = new Date(dateTime);
    if (!Number.isNaN(photoDate.getTime())) {
      let options = {
        hour: '2-digit',
        minute: '2-digit',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      };
      let formattedDate = photoDate.toLocaleString('en-US', options);
      let [date, time] = formattedDate.split('at');
      return `Posted at ${time} on ${date}`;
    }
    return ''; // Invalid date
  };

  return (
    <div className="users-photos-wrapper-stepper-view">
      {/* Navigation Buttons */}
      <div className="users-photos-wrapper-stepper-view-controls">
        <Button
          variant="contained"
          color="primary"
          onClick={prevPhoto}
          disabled={currentIndex === 0} // Disable when at the first photo
          style={{ marginRight: '10px' }}
        >
          Previous
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={nextPhoto}
          disabled={currentIndex === photos.length - 1} // Disable when at the last photo
          style={{ marginLeft: '10px' }}
        >
          Next
        </Button>
      </div>

      {/* Show the current photo */}
      {photos.length > 0 && (
        <>
          <PhotoFavorites photoId={photos[currentIndex]._id} />
            <img
            className="users-photos-wrapper-photo-box-image"
            src={`/images/${photos[currentIndex].file_name}`}
            alt={photos[currentIndex]._id}
          />

          {/* Show the formatted date */}
          <Typography variant="body1" className="users-photos-wrapper-photo-time">
            {photos.length > 0 ? formatDate(photos[currentIndex].date_time) : ''}
          </Typography>

          <PhotoLikes photoId={photos[currentIndex]._id} />
        </>
      )}



      {/* Show the photo comments (if there are any) */}
      {photos[currentIndex] && photos[currentIndex].comments && (
        <Comments
          comments={photos[currentIndex].comments}
          photoID={photos[currentIndex]._id}
          rerenderParentCallback={rerenderParentCallback}
        />
      )}
    </div>
  );
}

export default StepperView;