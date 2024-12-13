/**
 * This builds on the webServer of previous projects in that it exports the
 * current directory via webserver listing on a hard code (see portno below)
 * port. It also establishes a connection to the MongoDB named 'project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch
 * any file accessible to the current user in the current directory or any of
 * its children.
 *
 * This webServer exports the following URLs:
 * /            - Returns a text status message. Good for testing web server
 *                running.
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns the population counts of the project6 collections in the
 *                database. Format is a JSON object with properties being the
 *                collection name and the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the
 * database:
 * /user/list         - Returns an array containing all the User objects from
 *                      the database (JSON format).
 * /user/:id          - Returns the User object with the _id of id (JSON
 *                      format).
 * /photosOfUser/:id  - Returns an array with all the photos of the User (id).
 *                      Each photo should have all the Comments on the Photo
 *                      (JSON format).
 */

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

const session = require("express-session");
const bodyParser = require("body-parser");

const multer = require("multer");
const processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

const fs = require("fs");
// const async = require("async");

const express = require("express");
const app = express();

// Load the Mongoose schema for User, Photo, and SchemaInfo
const User = require("./schema/user.js");
const Photo = require("./schema/photo.js");
const SchemaInfo = require("./schema/schemaInfo.js");

// XXX - Your submission should work without this line. Comment out or delete
// this line for tests and before submission!
// const models = require("./modelData/photoApp.js").models;
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1/project6", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// MIDDLEWARE
app.use(session({secret: "secretKey", resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

// We have the express static module
// (http://expressjs.com/en/starter/static-files.html) do all the work for us.
app.use(express.static(__dirname));


const passwordHashFunctions = require("./password");
function userLoggedIn(request, response, next) {
  // If the user id in the session is set then the user is logged in
  if (!request.session.user_id) {
    return response.status(401).send("You must be logged in the use this API.");
  }

  return next();
}

app.use((request, response, next) => {
  // Require authentication on every path except login, logout, and /user (for registering a user)
  if (request.path === "/admin/login" || request.path === "/admin/logout" || request.path === "/user") {
    return next();
  }

  return userLoggedIn(request, response, next);
});

/* PROJECT 8 APIS */
app.get('/user/:id/extended_detail', async function (request, response) {
  const userId = request.params.id;

  // Validate the id provided in the url
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return response.status(400).send("Invalid user ID format.");
  }

  try {
    // Fetching photos of userID
    const photos = await Photo.find({user_id: userId});

    if(photos.length === 0) {
      return response.status(401).send("User has no photos");
    }

    // Finding the most recently updated photo by the user
    const mostRecentUpload = photos.reduce(
      (latest, photo, index) => {
        if (new Date(photo.date_time) > new Date(latest.photo.date_time)) {
          return { photo, photoIndex: index };
        }
        return latest;
      },
      { photo: photos[0], photoIndex: 0 }
    );

    // Finding photo with most comments
    const mostCommentedPhoto = photos.reduce(
      (mostComments, photo, index) => {
        if (photo.comments.length > mostComments.photo.comments.length) {
          return { photo, photoIndex: index };
        }
        return mostComments;
      },
      { photo: photos[0], photoIndex: 0 }
    );

    // Preparing json response object
    const responseData = {
      mostRecentPhoto: {
        _id: mostRecentUpload.photo.id,
        file_name: mostRecentUpload.photo.file_name,
        date_time: mostRecentUpload.photo.date_time,
        user_id: mostRecentUpload.photo.user_id,
        photo_index: mostRecentUpload.photoIndex,
      },
      photoWithMostComments: {
        _id: mostCommentedPhoto.photo.id,
        file_name: mostCommentedPhoto.photo.file_name,
        user_id: mostCommentedPhoto.photo.user_id,
        comment_count: mostCommentedPhoto.photo.comments.length,
        photo_index: mostCommentedPhoto.photoIndex,
      }
    };

    return response.status(200).send(responseData);
  } catch (error) {
    console.error("Error within extended detail function", error);
    return response.status(500).send("Error retrieving data.");
  }
});

// Like APIs
app.post("/like_photo", async function (request, response) {
  const userID = request.session.user_id;
  const photoID = request.body.photo_id;

  // Validate provided IDs
  if (!request.session.user_id) return response.status(401).send("You must be logged in the use this API.");
  if (!mongoose.Types.ObjectId.isValid(userID)) return response.status(400).send("Invalid user ID format.");
  if (!mongoose.Types.ObjectId.isValid(photoID)) return response.status(400).send("Invalid photo ID format.");

  try {
    const photo = await Photo.findOne({_id: photoID});
    if (!photo) {
      return response.status(404).send("No photo was found matching the provided ID");
    }

    const photosLikedBy = photo.liked_by;
    if (photosLikedBy.includes(userID)) {
      return response.status(403).send("User has already liked this photo");
    }

    // Add the user's ID to the photo's liked by ID array
    photosLikedBy.push(userID);

    // Update the photo
    const filter = {_id: photoID};
    const update = {
      liked_by: photosLikedBy,
      like_count: photo.like_count + 1 // Increment the like count as well
    };
    await Photo.findOneAndUpdate(filter, update);

    return response.status(200).send("Like added successfully");
  } catch (error) {
    console.error("Error adding like to photo " + photoID + "\n Error: ", error);
    return response.status(500).send("An error occurred while adding the like to the photo.");
  }
});

app.post("/unlike_photo", async function (request, response) {
  const userID = request.session.user_id;
  const photoID = request.body.photo_id;

  // Validate provided IDs
  if (!request.session.user_id) return response.status(401).send("You must be logged in the use this API.");
  if (!mongoose.Types.ObjectId.isValid(userID)) return response.status(400).send("Invalid user ID format.");
  if (!mongoose.Types.ObjectId.isValid(photoID)) return response.status(400).send("Invalid photo ID format.");

  try {
    const photo = await Photo.findOne({_id: photoID});
    if (!photo) {
      return response.status(404).send("No photo was found matching the provided ID");
    }

    let photosLikedBy = photo.liked_by;
    if (!photosLikedBy.includes(userID)) {
      return response.status(403).send("User has hasn't liked this photo before");
    }

    photosLikedBy = photosLikedBy.filter(e => e.toString() !== userID.toString());

    // Update the photo
    const filter = {_id: photoID};
    const update = {
      liked_by: photosLikedBy,
      like_count: photo.like_count - 1
    };
    await Photo.findOneAndUpdate(filter, update);

    return response.status(200).send("Photo unliked successfully");
  } catch (error) {
    console.error("Error removing like from photo " + photoID + "\n Error: ", error);
    return response.status(500).send("An error occurred while removing the like from the photo.");
  }
});

app.post("/photo_like_details", async function (request, response) {
  const userID = request.session.user_id;
  const photoID = request.body.photo_id;

  // Validate provided IDs
  if (!request.session.user_id) return response.status(401).send("You must be logged in the use this API.");
  if (!mongoose.Types.ObjectId.isValid(userID)) return response.status(400).send("Invalid user ID format.");
  if (!mongoose.Types.ObjectId.isValid(photoID)) return response.status(400).send("Invalid photo ID format.");

  try {
    const photo = await Photo.findOne({_id: photoID});
    if (!photo) {
      return response.status(404).send("No photo was found matching the provided ID");
    }

    // This API should return if the provided user ID has liked the photo
    // and how many current likes the photo has
    return response.status(200).send({
      like_count: photo.like_count,
      has_user_liked: photo.liked_by.includes(userID),
    });
  } catch (error) {
    console.error("Error fetching like details for photo  " + photoID + "\n Error: ", error);
    return response.status(500).send("An error occurred while fetching the photo's like details.");
  }
});

// Favorite APIs
app.post('/favorite_photo', async function (request, response) {
  const userID = request.session.user_id;
  const photoID = request.body.photo_id;

  // Validate provided IDs
  if (!request.session.user_id) return response.status(401).send("You must be logged in the use this API.");
  if (!mongoose.Types.ObjectId.isValid(userID)) return response.status(400).send("Invalid user ID format.");
  if (!mongoose.Types.ObjectId.isValid(photoID)) return response.status(400).send("Invalid photo ID format.");

  try {
    const user = await User.findOne({_id: userID});
    if (!user) {
      return response.status(404).send("No user was found matching the provided ID");
    }

    const userFavorites = user.favorite_photos;
    if (userFavorites.includes(photoID)) {
      return response.status(403).send("User has already favorited this photo");
    }

    // Add the photo's ID into the user's favorite photo ID list
    userFavorites.push(photoID);

    // Update the user in the database with their new favorite list
    const filter = {_id: userID};
    const update = {
      favorite_photos: userFavorites,
    };
    await User.findOneAndUpdate(filter, update);

    return response.status(200).send("Favorite added successfully");
  } catch (error) {
    console.error("Error adding favoriting photo " + photoID + "\n Error: ", error);
    return response.status(500).send("An error occurred while favoriting the photo.");
  }
});

app.post('/unfavorite_photo', async function (request, response) {
  const userID = request.session.user_id;
  const photoID = request.body.photo_id;

  // Validate provided IDs
  if (!request.session.user_id) return response.status(401).send("You must be logged in the use this API.");
  if (!mongoose.Types.ObjectId.isValid(userID)) return response.status(400).send("Invalid user ID format.");
  if (!mongoose.Types.ObjectId.isValid(photoID)) return response.status(400).send("Invalid photo ID format.");

  try {
    const user = await User.findOne({_id: userID});
    if (!user) {
      return response.status(404).send("No user was found matching the provided ID");
    }

    let userFavorites = user.favorite_photos;
    if (!userFavorites.includes(photoID)) {
      return response.status(403).send("User has not favorited this photo");
    }

    // Remove the photo's ID from the user's favorite photo ID list
    userFavorites = userFavorites.filter(e => e.toString() !== photoID.toString());

    // Update the user in the database
    const filter = {_id: userID};
    const update = {
      favorite_photos: userFavorites,
    };
    await User.findOneAndUpdate(filter, update);

    return response.status(200).send("Favorite removed successfully");
  } catch (error) {
    console.error("Error removing favorite from photo " + photoID + "\n Error: ", error);
    return response.status(500).send("An error occurred while removing the favorite from the photo.");
  }
});

app.post('/has_favorited', async function (request, response) {
  const userID = request.session.user_id;
  const photoID = request.body.photo_id;

  // Validate provided IDs
  if (!request.session.user_id) return response.status(401).send("You must be logged in the use this API.");
  if (!mongoose.Types.ObjectId.isValid(userID)) return response.status(400).send("Invalid user ID format.");
  if (!mongoose.Types.ObjectId.isValid(photoID)) return response.status(400).send("Invalid photo ID format.");

  try {
    const user = await User.findOne({_id: userID});
    if (!user) {
      return response.status(404).send("No user was found matching the provided ID");
    }

    const userFavorites = user.favorite_photos;

    if (userFavorites.includes(photoID)) {
      return response.status(200).send({is_favorite: true});
    } else {
      return response.status(200).send({is_favorite: false});
    }
  } catch (error) {
    console.error("Error checking favorite on photo " + photoID + "\n Error: ", error);
    return response.status(500).send("An error occurred while checking if photo was favorited.");
  }
});

app.get('/user_favorites', async function (request, response) {
  const userID = request.session.user_id;

  // Validate provided IDs
  if (!request.session.user_id) return response.status(401).send("You must be logged in the use this API.");
  if (!mongoose.Types.ObjectId.isValid(userID)) return response.status(400).send("Invalid user ID format.");

  try {
    const user = await User.findOne({_id: userID});
    if (!user) {
      return response.status(404).send("No user was found matching the provided ID");
    }

    // Get the list of favorite photo IDs
    const userFavorites = user.favorite_photos;
    // Resolve all of the photo IDs into the actual photo object
    const favoritePhotos = await Photo.find({ _id: { $in: userFavorites } });

    // Return the photo objects NOT the IDs
    return response.status(200).send({favorite_photos: favoritePhotos});
  } catch (error) {
    console.error("Error getting the user's favorite photos \n Error: ", error);
    return response.status(500).send("An error occurred while getting the users favorite photos.");
  }
});

/*
  PROJECT 7 APIS
*/
app.post("/admin/login", async function (request, response){
  var loginName = request.body.login_name;
  if (!loginName) return response.status(400).send("Please provide a non empty login name");

  try {
    const user = await User.findOne({ login_name: loginName });
    if (!user) return response.status(400).send(`No user found with the provided login name "${loginName}"`);

    if (!passwordHashFunctions.doesPasswordMatch(user.password_digest, user.salt, request.body.password)) {
      return response.status(400).send("Incorrect password provided");
    }

    request.session.user_id = user._id;
    request.session.first_name = user.first_name;

    // Update the last activity in the database
    user.last_activity = "Logged in";
    await user.save();

    return response.json({
      _id: user._id,
      first_name: user.first_name,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return response.status(500).send("An error occurred during login.");
  }
});

app.post("/admin/logout", async function (request, response) {
  if (!request.session.user_id) {
    return response.status(400).send("No user is currently logged in");
  }
  const userId = request.session.user_id;

  try {
    await new Promise((resolve, reject) => {
      request.session.destroy((err) => {
        if (err) {
          reject(new Error("An error occurred during logout."));
        } else {
          resolve();
        }
      });
    });

    // Update the last activity in the database
    await User.findByIdAndUpdate(userId, { last_activity: "Logged out" });
    return response.send("Logged out successfully.");
  } catch (error) {
    return response.status(500).send(error.message);
  }
});

app.post("/commentsOfPhoto/:photo_id", async function (request, response) {
  if (!request.session.user_id) return response.status(401).send("You must be logged in the use this API.");

  const photoId = request.params.photo_id;
  const commentText = request.body.comment;
  if (!commentText) return response.status(400).send("Please write a non-empty comment");

  try {
    const photo = await Photo.findOne({_id: photoId});
    if (!photo) return response.status(404).send("The provided ID did not match to a photo.");

    const photoComments = photo.comments;

    photoComments.push({
      comment: commentText,
      date_time: Date.now(),
      user_id: request.session.user_id,
    });

    const filter = {_id: photoId};
    const update = {comments: photoComments};
    await Photo.findOneAndUpdate(filter, update);

    // Update the user's last_activity status
    await User.findByIdAndUpdate(request.session.user_id, { last_activity: "Added a comment" });

    return response.status(200).send("Comment added successfully");
  } catch (error) {
    console.error("Error adding comment:", error);
    return response.status(500).send("An error occurred while adding the comment.");
  }
});

app.post('/photos/new', async function(request, response) {
  if (!request.session.user_id) return response.status(401).send("You must be logged in the use this API.");

  // Use multer to process the file in the form body
  return processFormBody(request, response, async (err) => {
    if (err || !request.file) {
      console.error("Error processing upload:", err);
      return response.status(400).send("Error processing the file to upload.");
    }

    // Check the file type
    const validPhotoTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validPhotoTypes.includes(request.file.mimetype)) {
      return response.status(400).send("Invalid file type. Allowed file types - JPEG/JPG and PNG.");
    }

    // Unique filename
    const filename = `U${new Date().valueOf()}_${request.file.originalname}`;

    try {
      await fs.promises.writeFile(`./images/${filename}`, request.file.buffer);

      // Create the photo document in the database
      const newPhoto = new Photo({
        file_name: filename,
        user_id: request.session.user_id,
        like_count: 0,
        liked_by: []
      });

      await newPhoto.save();

      // Update the user's last_activity to the photo filename (so we can display the thumbnail on the frontend)
      await User.findByIdAndUpdate(request.session.user_id, { last_activity:
        `photo:${filename}` // The mongoose schema expects a string, we need the filename for the thumbnail
      });

      return response.status(200).send("Photo uploaded successfully!");
    } catch (error) {
      console.error("Error saving photo:", error);
      return response.status(500).send("An error occurred while saving the photo in the backend.");
    }
  });
});

app.post('/user', async function(request, response) {
  const { login_name, password, first_name, last_name, location, description, occupation } = request.body;

  if (!login_name) {
    return response.status(400).send("Username is required.");
  }
  if (!password) {
    return response.status(400).send("Password is required.");
  }
  if (!first_name) {
    return response.status(400).send("First name is required.");
  }
  if (!last_name) {
    return response.status(400).send("Last name is required.");
  }

  try {
    const existingUser = await User.findOne({ login_name: login_name });
    if (existingUser) return response.status(400).send("A user already exists with that username.");

    const salt_hash = passwordHashFunctions.makePasswordEntry(password);

    const newUser = new User({
      login_name: login_name,
      password_digest: salt_hash.hash,
      salt: salt_hash.salt,
      favorite_photos: [],
      first_name: first_name,
      last_name: last_name,
      last_activity: "Registered as a user",
      // These fields are allowed to be empty
      location: location || '',
      description: description || '',
      occupation: occupation || ''
    });

    await newUser.save();

    return response.status(200).json({
      _id: newUser._id,
      login_name: login_name
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    return response.status(500).send("An error occurred during registration.");
  }
});

// APIS FROM PROJECT 5-6
app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

/**
 * Use express to handle argument passing in the URL. This .get will cause
 * express to accept URLs with /test/<something> and return the something in
 * request.params.p1.
 * 
 * If implement the get as follows:
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns an object with the counts of the different collections
 *                in JSON format.
 */
app.get("/test/:p1", async function (request, response) {
  // Express parses the ":p1" from the URL and returns it in the request.params
  // objects.
  console.log("/test called with param1 = ", request.params.p1);

  const param = request.params.p1 || "info";

  if (param === "info") {
    // Fetch the SchemaInfo. There should only one of them. The query of {} will
    // match it.
    try{

      const info = await SchemaInfo.find({});
      if (info.length === 0) {
            // No SchemaInfo found - return 500 error
            return response.status(500).send("Missing SchemaInfo");
      }
      console.log("SchemaInfo", info[0]);
      return response.json(info[0]); // Use `json()` to send JSON responses
    } catch(err){
      // Handle any errors that occurred during the query
      console.error("Error in /test/info:", err);
      return response.status(500).json(err); // Send the error as JSON
    }

  } else if (param === "counts") {
   // If the request parameter is "counts", we need to return the counts of all collections.
// To achieve this, we perform asynchronous calls to each collection using `Promise.all`.
// We store the collections in an array and use `Promise.all` to execute each `.countDocuments()` query concurrently.
   
    
const collections = [
  { name: "user", collection: User },
  { name: "photo", collection: Photo },
  { name: "schemaInfo", collection: SchemaInfo },
];

try {
  await Promise.all(
    collections.map(async (col) => {
      col.count = await col.collection.countDocuments({});
      return col;
    })
  );

  const obj = {};
  for (let i = 0; i < collections.length; i++) {
    obj[collections[i].name] = collections[i].count;
  }
  return response.end(JSON.stringify(obj));
} catch (err) {
  return response.status(500).send(JSON.stringify(err));
}
  } else {
    // If we know understand the parameter we return a (Bad Parameter) (400)
    // status.
    return response.status(400).send("Bad param " + param);
  }
});

/**
 * URL /user/list - Returns all the User objects.
 */
app.get("/user/list", async function (request, response) {
  try {
    const users = await User.find({}).select("_id, first_name last_name last_activity");
    if (users.length === 0) {
      return response.status(500).send("No users found.");
    }

    return response.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    return response.status(500).send("Error fetching users.");
  }
});

/**
 * URL /user/:id - Returns the information for User (id).
 */
app.get("/user/:id", async function (request, response) {
  try {
    const userId = request.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.status(400).send("Invalid user ID format.");
    }

    const user = await User.findOne({
      _id: userId,
    }).select("_id first_name last_name location description occupation");

    if (!user) {
      return response.status(404).send("No user found.");
    }

    return response.status(200).json(user);
  } catch (err) {
    console.error("Error fetching the user:", err);
    return response.status(500).send("Error fetching the user.");
  }
});

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
app.get("/photosOfUser/:id", async function (request, response) {
  const userId = request.params.id;

  // Validate the id provided in the url
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return response.status(400).send("Invalid user ID format.");
  }

  try {
    // Do the object fetches concurrently
    const [user, photos] = await Promise.all([
      User.findById(userId),
      // Do a find (not findById) b/c the ID of the photo is different from the user ID
      Photo.find({ user_id: userId }),
    ]);

    if (!user) {
      return response.status(404).send("User not found.");
    } else if (!photos) {
      return response.status(404).send("User photos not found.");
    }

    // Gather all the photos concurrently
    const resultPhotos = await Promise.all(
        photos.map(async (photo) => {
          // Gather all the comments concurrently
          const commentWithUserInfo = await Promise.all(
              photo.comments.map(async (comment) => {
                // Each comment should have the minimal user info
                const commentUser = await User.findById(comment.user_id)
                    .select("_id first_name last_name");

                return {
                  _id: comment._id,
                  comment: comment.comment,
                  date_time: comment.date_time,
                  user: commentUser, // This is the user with minimal info provided
                };
              })
          );

          // Attach the comment(s) to the photo object
          return {
            _id: photo._id,
            file_name: photo.file_name,
            date_time: photo.date_time,
            user_id: photo.user_id,
            comments: commentWithUserInfo,
            likes: photo.like_count,
          };
        })
    );

    return response.status(200).json(resultPhotos);
  } catch (error) {
    console.error("Error within photosOfUser function", error);
    return response.status(500).send("Error retrieving data.");
  }
});

/* ---------------------- APIs for extra credit */
// Get the user's photo and comment count
app.get("/extraUserData/:id", async function (request, response) {
  try {
    const userId = request.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.status(400).send("Invalid user ID format.");
    }

    const photoCount = await Photo.countDocuments({ user_id: userId });

    // This will have a list of every photo that the user has commented on
    const photosWithUsersComment = await Photo.find({ "comments.user_id": userId });
    let userCommentCount = 0;
    // We need to go through every comment on that photo because the user may have commented multiple times
    photosWithUsersComment.forEach(photo => {
      userCommentCount += photo.comments.filter(comment => comment.user_id.equals(userId)).length;
    });

    return response.status(200).json({
      userId: userId,
      photoCount: photoCount,
      commentCount: userCommentCount,
    });
  } catch (err) {
    console.error("Error fetching extra user data:", err);
    return response.status(500).send("Error fetching extra user data.");
  }
});

// Get all the comments associated with a user
app.get("/userComments/:id", async function (request, response) {
  try {
    const userId = request.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.status(400).send("Invalid user ID format.");
    }

    const usersComments = [];

    // Get all the photos that the user has commented on
    const photosWithUsersComment = await Photo.find({ "comments.user_id": userId })
      .select("_id user_id file_name comments");

    // This will store each user's photo list indexed by their photo ID
    // We will use this to pass the photoIndex in with the response so we can
    // route to that SPECIFIC photo whenever the comment is clicked on
    const photoIndexMap = {};

    // These are all the photos that we will need to resolve
    const photoPromises = photosWithUsersComment.map(async (photo) => {
      const photoOwnerId = photo.user_id.toString();

      // Fetch this user's photos, if we haven't already (cache for better performance)
      if (!photoIndexMap[photoOwnerId]) {
        const userPhotos = await Photo.find({ user_id: photoOwnerId }).select("_id");
        photoIndexMap[photoOwnerId] = userPhotos.map((p) => p._id.toString());
      }

      // Get the index of the current photo in the owner's photo list
      const photoIndex = photoIndexMap[photoOwnerId].indexOf(photo._id.toString());

      photo.comments.forEach((comment) => {
        // If the target user has commented on this user's photo, add it to the results
        if (comment.user_id.toString() === userId) {
          usersComments.push({
            photoCreatorId: photo.user_id,
            photoIndex: photoIndex,
            photoId: photo._id,
            file_name: photo.file_name,
            commentText: comment.comment,
            commentId: comment._id,
          });
        }
      });
    });

    await Promise.all(photoPromises);
    return response.status(200).json(usersComments);
  } catch (err) {
    console.error("Error fetching user's comments:", err);
    return response.status(500).send("Error fetching user's comments.");
  }
});

const server = app.listen(3000, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});
