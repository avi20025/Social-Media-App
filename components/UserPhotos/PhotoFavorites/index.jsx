import "./styles.css";
import React, {useEffect, useState} from "react";
import {Button, Typography} from "@mui/material";
import StarIcon from '@mui/icons-material/Star';
import axios from "axios";

function PhotoFavorites({photoId}) {
  const [favorited, setFavorited] = useState(false);

  useEffect( () => {
    function checkIfFavorited() {
      const postBody = {
        photo_id: photoId,
      };
      axios.post('has_favorited', postBody)
        .then((response) => {
          setFavorited(response.data.is_favorite);
        })
        .catch((error) => {
          console.log("error checking favorite status on photo " + photoId + " " + error);
        });
    }

    checkIfFavorited();
  }, [photoId]);


  const handleFavoritePhoto = async () => {
    try {
      const postBody = {
        photo_id: photoId,
      };
      await axios.post('favorite_photo', postBody);
      setFavorited(true);
    } catch (error) {
      console.error("Error changing the photo like status:", error);
    }
  };

  return (
    <>
      <Button
        disabled={favorited}
        variant="contained"
        color="primary"
        size="small"
        onClick={handleFavoritePhoto}
        sx={{
          backgroundColor: "#f1c40f",
          mb: "10px",
          '&:hover': {
            backgroundColor: "#d4ac0d",
          },
        }}
      >
        Favorite Photo
      </Button>
      <br/>

      {favorited && (
        <div style={{marginBottom: "5px"}}>
          <Typography variant="body1" display="inline" alignItems="center">
            <StarIcon fontSize="inherit" style={{ verticalAlign: 'middle', color: '#f1c40f', marginRight: '5px' }} />
            This photo is favorited!
          </Typography>
          <br/>
        </div>
      )}
    </>
  );
}

export default PhotoFavorites;