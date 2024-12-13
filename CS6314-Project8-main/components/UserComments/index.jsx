import React, {useContext, useEffect, useState} from "react";
import {Divider, List, Typography} from "@mui/material";
import axios from 'axios';
import {useNavigate} from "react-router-dom";
import {TopBarContext} from "../TopBar/Context";
import "./styles.css";

function UserComments({ userId }) {
  const [userComments, setUserComments] = useState([]);
  const [user, setUser] = useState({});

  const { setContext } = useContext(TopBarContext);
  useEffect(() => {
    // Fetch the user's information for Top Bar
    function fetchUserInfo() {
      axios
        .get(`http://localhost:3000/user/${userId}`)
        .then((response) => {
          setUser(response.data);
          // Update the Top Bar Context
          setContext(`${response.data.first_name}'s Comments`);
        })
        .catch((error) => {
          console.error("Failed to fetch user's info:", error);
        });
    }

    // Fetch all the comments associated with the user to display
    function fetchData() {
      axios
        .get(`http://localhost:3000/userComments/${userId}`)
        .then((response) => {
          setUserComments(response.data);
        })
        .catch((error) => {
          console.error("Failed to fetch the user's comments:", error);
        });
    }

    fetchUserInfo();
    fetchData();
  }, [userId]); // Only run once the userId is updated

  const navigate = useNavigate();
  const handleClick = (photoCreatorId, photoIndex) => {
    navigate(`/photos/${photoCreatorId}/${photoIndex}`);
  };

  return (
    userComments.length > 0 && (
      <div className="users-comments-wrapper-photo-comments">
        <Typography variant="h5" className="users-comments-wrapper-photo-comments-title">
          {user.first_name} {user.last_name}&#39;s Comments
        </Typography>
        <List>
          {userComments.map((comment) => (
            <button
              key={comment.commentId}
              className="users-comments-wrapper-photo-comment-container"
              onClick={() => handleClick(comment.photoCreatorId, comment.photoIndex)}
            >
              <div className="users-comments-wrapper-photo-comment">
                <img
                  className="users-comments-wrapper-photo-comment-thumbnail"
                  src={`/images/${comment.file_name}`}
                  alt={`Thumbnail of ${comment.photoId}`}
                />
                <Divider orientation="vertical" className="users-comments-wrapper-photo-comment-divider" />
                <Typography variant="body1" className="users-comments-wrapper-photo-comment-text">
                  {comment.commentText}
                </Typography>
              </div>
            </button>
          ))}
        </List>
      </div>
    )
  );

}

export default UserComments;