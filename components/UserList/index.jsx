import React, {useContext, useEffect, useState} from "react";
import {
  Badge,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import axios from 'axios';

import "./styles.css";
import {useNavigate} from "react-router-dom";
import {Box} from "@mui/system";
import {TopBarContext} from "../TopBar/Context";

function UserList() {
  let [users, setUsers] = useState([]);
  let [extraUserData, setExtraUserData] = useState({});
  const navigate = useNavigate();

  const { advancedFeatures, userLoggedIn } = useContext(TopBarContext);

  // Fetch the list of users
  useEffect(() => {
    function fetchUserList() {
      axios
        .get("http://localhost:3000/user/list")
        .then((response) => {
          setUsers(response.data);
        })
        .catch((error) => {
          console.error("Failed to fetch list of users:", error);
        });
    }

    fetchUserList();

    // Poll the database every second
    const interval = setInterval(fetchUserList, 1000);

    // Clear the polling whenever the component unmounts
    return () => clearInterval(interval);
  }, [userLoggedIn]);

  // Load the extra user data if advanced features is enabled
  useEffect(() => {
    const fetchUserData = () => {
      if (advancedFeatures) {
        const requests = users.map(user => axios.get(`http://localhost:3000/extraUserData/${user._id}`));
        const extraUserDataFromAPI = {};

        // For each user, get their photo and comment count
        Promise.all(requests)
          .then((responses) => {
            responses.forEach((response) => {
              const { userId, photoCount, commentCount } = response.data;
              // Store the photo and comment count for each user in a map for later use
              extraUserDataFromAPI[userId] = { photoCount, commentCount };
            });

            setExtraUserData(extraUserDataFromAPI);
          })
          .catch((error) => {
            console.error("Error fetching user data:", error);
          });
      } else {
        // Remove the bubbles from the user's names
        setExtraUserData({});
      }
    };

    fetchUserData();
  }, [users, advancedFeatures]);


  return (
    <div className="side-list">
      <Typography variant="h5" className="user-list-header">User List</Typography>
      <Divider />
      {userLoggedIn ? (
      <List component="nav">
        {users.map(user => {
          const counts = extraUserData[user._id];
          return (
            <div key={user._id}>
              <ListItem sx={{
                display: 'flex',
                justifyContent: 'space-between',
                flexDirection: 'row'
              }}>
                <Box alignItems="center" flexGrow={1} sx={{
                  overflow: 'hidden',
                  paddingBottom: 1
                }}>
                  {/* The user's name and last status */}
                  <ListItemText
                    primary={`${user.first_name} ${user.last_name}`}
                    secondary={
                      user.last_activity
                        ? user.last_activity.startsWith('photo:')
                          ? "Last activity: Posted a photo"
                          : `Last activity: ${user.last_activity}`
                        : 'No recent activity'
                    }
                    sx={{ marginRight: 1, overflow: 'hidden' }}
                  />

                  {/* The photo thumbnail (if the user previously posted a photo) */}
                  {user.last_activity && user.last_activity.startsWith('photo:') && (
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'left' }}>
                      <img
                        src={`/images/${user.last_activity.split(':')[1]}`}
                        alt={`Thumbnail of ${user.last_activity.split(':')[1]}`}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </div>
                  )}

                  {/* BADGES FOR PHOTO AND COMMENT COUNT */}
                  {counts && (
                    <>
                      <Badge
                        badgeContent={counts.photoCount}
                        color="success"
                        sx={{
                          paddingLeft: 1.25,
                          marginRight: 2
                        }}
                      />
                      {/* When this badge is clicked, we navigate to the user's comments view */}
                      <Badge
                        badgeContent={counts.commentCount}
                        color="error"
                        onClick={() => navigate(`/users/${user._id}/comments`)}
                        sx={{
                          cursor: "pointer",
                          marginRight: 2,
                          paddingLeft: 1
                        }}
                      />
                    </>
                  )}
                </Box>

                {/* View user button */}
                <Button
                  onClick={() => navigate(`/users/${user._id}`)}
                  sx={{
                    minWidth: 'fit-content',
                    maxWidth: '80%'
                  }}
                >
                  View User
                </Button>
              </ListItem>
              <Divider/>
            </div>
          );
        })}
      </List>
        ) : (
        <Typography variant="body1" sx={{textAlign: "center"}}>
          Please log in to view the user list
        </Typography>
      )}
    </div>
  );
}

export default UserList;
