import React, {useCallback, useState} from 'react';
import {Button, Divider, List, TextField, Typography} from "@mui/material";
import {Link} from 'react-router-dom';
import "./styles.css";
import axios from "axios";

function Comments({ comments, photoID, rerenderParentCallback }) {
  const [isWritingComment, setIsWritingComment] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleCommentTextChange = (e) => setCommentText(e.target.value);

  const onCommentButtonClick = useCallback((event) => {
    event.preventDefault();
    setIsWritingComment(!isWritingComment);
  });

  const onCommentSubmitButtonClick = useCallback(async (event) => {
    event.preventDefault();
    console.log("Creating a comment with text: " + commentText);

    setIsWritingComment(false);

    const postBody = { comment: commentText };
    axios.post(`/commentsOfPhoto/${photoID}`, postBody)
      .then(() => {
          rerenderParentCallback();
        }
      )
      .catch((err) => {
          alert("Error creating comment: " + err);
        }
      );
  });


  const dateOptions = {
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };

  return (
    <div className="users-photos-wrapper-photo-comments">
      <Divider className="users-photos-wrapper-photo-comments-divider" />
      <Typography variant="h5" className="users-photos-wrapper-photo-comments-title">
        Comments - {' '}
        <Button
          size="small"
          variant="contained"
          onClick={onCommentButtonClick}
          color={!isWritingComment ? "primary" : "error"}>
          {!isWritingComment ? "Add Comment" : "Cancel"}
        </Button>
      </Typography>
      {isWritingComment && (
        <div className="users-photos-wrapper-photo-create-comment">
          <TextField
            id="outlined-multiline-static"
            label="New Comment"
            multiline
            rows={2}
            sx={{ width: "50%" }}
            onChange={handleCommentTextChange}
          />
          <Button
            size="medium"
            variant="contained"
            sx={{ ml: "10px" }}
            onClick={onCommentSubmitButtonClick}>
            Submit
          </Button>
        </div>
        )}
      <List>
        {comments.length > 0 ? (
          comments.map((comment) => {
            const formattedDate = new Date(comment.date_time).toLocaleString('en-US', dateOptions);
            const [commentDate, commentTime] = formattedDate.split('at');
            const commentFriendlyDate = `${commentDate} at ${commentTime}`;

            return (
              <div key={comment._id} className="users-photos-wrapper-photo-comment">
                <Typography variant="body1" className="users-photos-wrapper-photo-comment-time">
                  Written by{' '}
                  <Link to={`/users/${comment.user._id}`}>
                    {comment.user.first_name} {comment.user.last_name}
                  </Link>{' '}
                  - {commentFriendlyDate}
                </Typography>
                <Divider style={{ marginBottom: '7px', marginTop: '3px' }} />
                <Typography variant="body1" className="users-photos-wrapper-photo-comment-text">
                  {comment.comment}
                </Typography>
              </div>
            );
          })
        ) : (
          <Typography variant="body1" className="users-photos-wrapper-photo-no-comments">
            No comments yet.
          </Typography>
        )}
      </List>
    </div>

  );
}

export default Comments;
