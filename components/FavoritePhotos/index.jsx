import React, {useContext, useEffect, useState} from 'react';
import "./styles.css";
import {Button, Divider, Modal, Typography} from "@mui/material";
import axios from "axios";
import {Box} from "@mui/system";
import {TopBarContext} from "../TopBar/Context";

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  textAlign: 'center',
  p: 4,
};

function FavoritePhotos() {
  const { setContext } = useContext(TopBarContext);
  const [favoritePhotos, setFavoritePhotos] = useState([]);

  // Set the text within the top right of the Top Bar
  useEffect(() => {
    setContext(`Favorite Photos`);

    // Fetch all the photos that the user has favorited
    function fetchFavoritePhotoIds() {
      axios.get('user_favorites')
        .then((response) => {
          setFavoritePhotos(response.data.favorite_photos);
        })
        .catch((error) => {
          console.error("Failed to favorite photos", error);
        });
    }

    fetchFavoritePhotoIds();
  }, [setContext, setFavoritePhotos]);


  // Modal code
  // This is the state if the modal is opened or not
  const [openFavoriteModal, setOpenFavoriteModal] = useState(false);
  // This is the photo that is displayed in the modal
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const handleOpen = (photo) => {
    setSelectedPhoto(photo);
    setOpenFavoriteModal(true);
  };
  const handleClose = () => {
    setOpenFavoriteModal(false);
    setSelectedPhoto(null);
  };

  const handleRemoveFromFavorites = (photoId) => {
   // Remove the photo from the favorites list on the backend
    axios.post(`unfavorite_photo`, {photo_id: photoId})
      .then(() => {
        // Remove the photo from the favorites list on the front end
        setFavoritePhotos((prevPhotos) => prevPhotos.filter(photo => photo._id !== photoId));
      })
      .catch((error) => {
        console.error("Failed to remove favorite photo", error);
      });
  };

  return (
    // This is the photo grid element that contains the photo thumbnail
    <div className="favorite-photos-container">
      <div className="favorite-photos-header-container">
        <Typography variant="h2" className="favorite-photos-header">
          Your Favorite Photos
        </Typography>
        <Divider style={{ margin: '10px auto', width: '80%' }} />
      </div>
      <div className="favorite-photos-grid">
        {favoritePhotos.length === 0 ? (
          // Display this text if the user has no favorite photos yet
          <Typography variant="h6">
            No favorites added yet
          </Typography>
        ) : (
          favoritePhotos.map((photo) => {
          return (
            <div key={photo._id} className="favorite-photo-thumbnail-container">
              <div className="favorite-photo-thumbnail-container-thumbnail-remove-text">
                {/* Button to open modal */}
                <button
                  className="favorite-photo-thumbnail-button"
                  onClick={() => handleOpen(photo)}
                >
                  <img
                    className="favorite-photo-thumbnail"
                    src={`/images/${photo.file_name}`}
                    alt={`Thumbnail of ${photo._id}`}
                  />
                </button>
                <br />
                {/* Button to remove from favorites */}
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  className="favorite-photo-remove-favorite-button"
                  onClick={() => handleRemoveFromFavorites(photo._id)}
                >
                  Remove From Favorites
                </Button>
              </div>
            </div>
          );
          })
        )}
      </div>

      {/* This is the photo modal */}
      {selectedPhoto && (
        <Modal
          open={openFavoriteModal}
          onClose={handleClose}
        >
          <Box sx={modalStyle}>
            <img
              className="favorite-photo-modal-image"
              src={`/images/${selectedPhoto.file_name}`}
              alt={selectedPhoto._id}
            />
            <Typography variant="body1" className="favorite-photo-modal-time">
              {`Posted at ${new Date(selectedPhoto.date_time).toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}`}
            </Typography>
          </Box>
        </Modal>
      )}
    </div>
  );
}

export default FavoritePhotos;