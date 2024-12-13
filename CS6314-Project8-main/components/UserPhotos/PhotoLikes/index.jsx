import "./styles.css";
import React, {useEffect, useState} from "react";
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import axios from "axios";

function PhotoLikes({photoId}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Check if the user has liked the photo before when we load the component
  useEffect( () => {
    function checkForLikes() {
      const postBody = {
        photo_id: photoId,
      };
      axios.post('photo_like_details', postBody)
        .then((response) => {
          setLiked(response.data.has_user_liked);
          setLikeCount(response.data.like_count);
        })
        .catch((error) => {
          console.log("error liking photo " + photoId + " " + error);
        });
    }

    checkForLikes();
  }, [photoId]);

  const handleLike = async () => {
    try {
      if (!liked) {
        const postBody = {
          photo_id: photoId,
        };
        await axios.post('like_photo', postBody);
        setLiked(true);
        setLikeCount(likeCount + 1);
      } else {
        const postBody = {
          photo_id: photoId,
        };
        await axios.post('unlike_photo', postBody);
        setLiked(false);
        setLikeCount(likeCount - 1);
      }
    } catch (error) {
      console.error("Error changing the photo like status:", error);
    }
  };

  return (
    <div className="like-container">
      <div className="like-button-wrapper">
        <button className="like-button" onClick={handleLike}>
          {liked ? (
            <ThumbDownIcon color="inherit" style={{ fontSize: "24px" }} />
          ) : (
            <ThumbUpIcon color="inherit" style={{ fontSize: "24px" }} />
          )}
          <span style={{ marginLeft: "8px" }}>
            {liked ? "Dislike Photo" : "Like Photo"}
          </span>
        </button>
      </div>
      <div className="like-count">Like count: {likeCount}</div>
    </div>
  );

}

export default PhotoLikes;