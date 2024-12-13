"use strict";

/**
 * Mocha test of  Project 7 web API. Run using this command:
 *   node_modules/.bin/mocha serverApiTest.js
 */

const assert = require("assert");
const http = require("http");
const async = require("async");
const _ = require("lodash");
const {ObjectId} = require("mongodb");

const models = require("../modelData/photoApp.js").models;

const port = 3000;
const host = "127.0.0.1";

// Valid properties of a user list model
const userListProperties = ["first_name", "last_name", "_id", "last_activity"];
// Valid properties of a user detail model
const userDetailProperties = [
  "first_name",
  "last_name",
  "_id",
  "location",
  "description",
  "occupation",
];
const userExtraDetailProperties = [
  "mostRecentPhoto",
  "photoWithMostComments",
];
// Valid properties of the photo model
const photoProperties = ["file_name", "date_time", "user_id", "_id", "comments", "likes"];
// Valid comments properties
const commentProperties = ["comment", "date_time", "_id", "user"];

function assertEqualDates(d1, d2) {
  assert(new Date(d1).valueOf() === new Date(d2).valueOf());
}

/**
 * MongoDB automatically adds some properties to our models. We allow these to
 * appear by removing them when before checking for invalid properties. This way
 * the models are permitted but not required to have these properties.
 */
function removeMongoProperties(model) {
  return model;
}

describe(" Photo App: Server API Tests", function () {
  let authCookie; // Session took from login request

  describe("login the user took", function () {
    it("can login took with a post to /admin/login", function (done) {
      const postBody = JSON.stringify({ login_name: "took", password: "weak" });

      const options = {
        hostname: host,
        port: port,
        path: "/admin/login",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": postBody.length,
        },
      };

      const request = http.request(options, function (response) {
        let responseBody = "";
        response.on("data", function (chunk) {
          responseBody += chunk;
        });

        response.on("end", function () {
          assert.strictEqual(
            response.statusCode,
            200,
            "HTTP response status code not OK"
          );
          // If express-session middleware was enabled we should have a
          // 'set-cookie' response header with the Express session cookie. We
          // assume it will be the first (and only) cookie.
          authCookie =
            response.headers["set-cookie"] && response.headers["set-cookie"][0];
          done();
        });
      });

      request.write(postBody);
      request.end();
    });

    it("can retrieve the Express session cookie", function (done) {
      assert(authCookie, "found a session cookie in the login POST response");
      assert(
        authCookie.match(/^connect\.sid=/),
        "looks like an Express cookie"
      );
      done();
    });
  });

  describe("test /user/list", function (done) {
    let userList;
    const Users = models.userListModel();

    it("can get the list of user", function (done) {
      http.get(
        {
          hostname: host,
          port: port,
          path: "/user/list",
          headers: { Cookie: authCookie },
        },
        function (response) {
          let responseBody = "";
          response.on("data", function (chunk) {
            responseBody += chunk;
          });

          response.on("end", function () {
            assert.strictEqual(
              response.statusCode,
              200,
              "HTTP response status code not OK"
            );
            userList = JSON.parse(responseBody);
            done();
          });
        }
      );
    });

    it("is an array", function (done) {
      assert(Array.isArray(userList));
      done();
    });

    it("has the correct number elements", function (done) {
      assert.strictEqual(
        userList.length,
        Users.length,
        "Wrong number of users. Did you forget to run loadDatabase.js?"
      );
      done();
    });

    it("has an entry for each of the users", function (done) {
      async.each(
        Users,
        function (realUser, callback) {
          const user = _.find(userList, {
            first_name: realUser.first_name,
            last_name: realUser.last_name,
          });
          assert(
            user,
            "could not find user " +
              realUser.first_name +
              " " +
              realUser.last_name
          );
          assert.strictEqual(
            _.countBy(userList, "_id")[user._id],
            1,
            "Multiple users with id:" + user._id
          );
          const extraProps = _.difference(
            Object.keys(removeMongoProperties(user)),
            userListProperties
          );
          assert.strictEqual(
            extraProps.length,
            0,
            "user object has extra properties: " + extraProps
          );
          callback();
        },
        done
      );
    });
  });

  describe("test /user/:id", function (done) {
    let userList;
    const Users = models.userListModel();

    it("can get the list of user", function (done) {
      http.get(
        {
          hostname: host,
          port: port,
          path: "/user/list",
          headers: { Cookie: authCookie },
        },
        function (response) {
          let responseBody = "";
          response.on("data", function (chunk) {
            responseBody += chunk;
          });

          response.on("end", function () {
            assert.strictEqual(
              response.statusCode,
              200,
              "HTTP response status code not OK"
            );
            userList = JSON.parse(responseBody);
            done();
          });
        }
      );
    });

    it("can get each of the user detail with /user/:id", function (done) {
      async.each(
        Users,
        function (realUser, callback) {
          const user = _.find(userList, {
            first_name: realUser.first_name,
            last_name: realUser.last_name,
          });
          assert(
            user,
            "could not find user " +
              realUser.first_name +
              " " +
              realUser.last_name
          );
          let userInfo;
          const id = user._id;
          http.get(
            {
              hostname: host,
              port: port,
              path: "/user/" + id,
              headers: { Cookie: authCookie },
            },
            function (response) {
              let responseBody = "";
              response.on("data", function (chunk) {
                responseBody += chunk;
              });

              response.on("end", function () {
                userInfo = JSON.parse(responseBody);
                assert.strictEqual(userInfo._id, id);
                assert.strictEqual(userInfo.first_name, realUser.first_name);
                assert.strictEqual(userInfo.last_name, realUser.last_name);
                assert.strictEqual(userInfo.location, realUser.location);
                assert.strictEqual(userInfo.description, realUser.description);
                assert.strictEqual(userInfo.occupation, realUser.occupation);

                const extraProps = _.difference(
                  Object.keys(removeMongoProperties(userInfo)),
                  userDetailProperties
                );
                assert.strictEqual(
                  extraProps.length,
                  0,
                  "user object has extra properties: " + extraProps
                );
                callback();
              });
            }
          );
        },
        done
      );
    });

    it("can return a 400 status on an invalid user id", function (done) {
      http.get(
        {
          hostname: host,
          port: port,
          path: "/user/1",
          headers: { Cookie: authCookie },
        },
        function (response) {
          let responseBody = "";
          response.on("data", function (chunk) {
            responseBody += chunk;
          });

          response.on("end", function () {
            assert.strictEqual(response.statusCode, 400);
            done();
          });
        }
      );
    });
  });

  describe("test /photosOfUser/:id", function (done) {
    let userList;
    const Users = models.userListModel();
    let lastUserID;

    it("can get the list of user", function (done) {
      http.get(
        {
          hostname: host,
          port: port,
          path: "/user/list",
          headers: { Cookie: authCookie },
        },
        function (response) {
          let responseBody = "";
          response.on("data", function (chunk) {
            responseBody += chunk;
          });

          response.on("end", function () {
            assert.strictEqual(
              response.statusCode,
              200,
              "HTTP response status code not OK"
            );
            userList = JSON.parse(responseBody);
            done();
          });
        }
      );
    });

    it("can get each of the user photos with /photosOfUser/:id", function (done) {
      async.each(
        Users,
        function (realUser, callback) {
          // validate the the user is in the list once
          const user = _.find(userList, {
            first_name: realUser.first_name,
            last_name: realUser.last_name,
          });
          assert(
            user,
            "could not find user " +
              realUser.first_name +
              " " +
              realUser.last_name
          );
          let photos;
          const id = user._id;
          lastUserID = id;
          http.get(
            {
              hostname: host,
              port: port,
              path: "/photosOfUser/" + id,
              headers: { Cookie: authCookie },
            },
            function (response) {
              let responseBody = "";
              response.on("data", function (chunk) {
                responseBody += chunk;
              });
              response.on("error", function (err) {
                callback(err);
              });

              response.on("end", function () {
                assert.strictEqual(
                  response.statusCode,
                  200,
                  "HTTP response status code not OK"
                );
                photos = JSON.parse(responseBody);

                const real_photos = models.photoOfUserModel(realUser._id);

                assert.strictEqual(
                  real_photos.length,
                  photos.length,
                  "wrong number of photos returned"
                );
                _.forEach(real_photos, function (real_photo) {
                  const matches = _.filter(photos, {
                    file_name: real_photo.file_name,
                  });
                  assert.strictEqual(
                    matches.length,
                    1,
                    " looking for photo " + real_photo.file_name
                  );
                  const photo = matches[0];
                  const extraProps1 = _.difference(
                    Object.keys(removeMongoProperties(photo)),
                    photoProperties
                  );
                  assert.strictEqual(
                    extraProps1.length,
                    0,
                    "photo object has extra properties: " + extraProps1
                  );
                  assert.strictEqual(photo.user_id, id);
                  assertEqualDates(photo.date_time, real_photo.date_time);
                  assert.strictEqual(photo.file_name, real_photo.file_name);

                  // Validating like count
                  assert.strictEqual(
                      photo.like_count,
                      real_photo.like_count,
                      "like count mismatch for photo " + real_photo.file_name
                  );

                  if (real_photo.comments) {
                    assert.strictEqual(
                      photo.comments.length,
                      real_photo.comments.length,
                      "comments on photo " + real_photo.file_name
                    );

                    _.forEach(real_photo.comments, function (real_comment) {
                      const comment = _.find(photo.comments, {
                        comment: real_comment.comment,
                      });
                      assert(comment);
                      const extraProps2 = _.difference(
                        Object.keys(removeMongoProperties(comment)),
                        commentProperties
                      );
                      assert.strictEqual(
                        extraProps2.length,
                        0,
                        "comment object has extra properties: " + extraProps2
                      );
                      assertEqualDates(
                        comment.date_time,
                        real_comment.date_time
                      );

                      const extraProps3 = _.difference(
                        Object.keys(removeMongoProperties(comment.user)),
                        userListProperties
                      );
                      assert.strictEqual(
                        extraProps3.length,
                        0,
                        "comment user object has extra properties: " +
                          extraProps3
                      );
                      assert.strictEqual(
                        comment.user.first_name,
                        real_comment.user.first_name
                      );
                      assert.strictEqual(
                        comment.user.last_name,
                        real_comment.user.last_name
                      );
                    });
                  } else {
                    assert(!photo.comments || photo.comments.length === 0);
                  }
                });
                callback();
              });
            }
          );
        },
        function (err) {
          done();
        }
      );
    });

    it("can return a 400 status on an invalid id to photosOfUser", function (done) {
      http.get(
        {
          hostname: host,
          port: port,
          path: "/photosOfUser/1",
          headers: { Cookie: authCookie },
        },
        function (response) {
          let responseBody = "";
          response.on("data", function (chunk) {
            responseBody += chunk;
          });

          response.on("end", function () {
            assert.strictEqual(response.statusCode, 400);
            done();
          });
        }
      );
    });
  });

  describe("Photo App: Extra Credit API Tests", function () {
    describe("test /extraUserData/:id", function () {
      const Users = models.userListModel();

      it("can get the comment/photo count data with /extraUserData/:id", function (done) {
        async.each(
          Users,
          function (user, callback) {
            const id = user._id;
            http.get(
              {
                hostname: host,
                port: port,
                path: "/extraUserData/" + id,
                headers: { Cookie: authCookie },
              },
              function (response) {
                let responseBody = "";
                response.on("data", function (chunk) {
                  responseBody += chunk;
                });

                response.on("end", function () {
                  const extraUserData = JSON.parse(responseBody);
                  assert.strictEqual(extraUserData.userId, id);
                  assert.strictEqual(typeof extraUserData.photoCount, 'number');
                  assert.strictEqual(typeof extraUserData.commentCount, 'number');

                  callback();
                });
              }
            );
          },
          done
        );
      });

      it("returns a 400 status when an invalid ID is passed", function (done) {
        http.get(
          {
            hostname: host,
            port: port,
            path: "/extraUserData/fdasfdsa",
            headers: { Cookie: authCookie },
          },
          function (response) {
            let responseBody = "";
            response.on("data", function (chunk) {
              responseBody += chunk;
            });

            response.on("end", function () {
              assert.strictEqual(response.statusCode, 400);
              done();
            });
          }
        );
      });
    });

    describe("test /userComments/:id", function () {
      const Users = models.userListModel();

      it("can get the comments a user made with /userComments/:id", function (done) {
        async.each(
          Users,
          function (user, callback) {
            const id = user._id;
            http.get(
              {
                hostname: host,
                port: port,
                path: "/userComments/" + id,
                headers: { Cookie: authCookie },
              },
              function (response) {
                let responseBody = "";
                response.on("data", function (chunk) {
                  responseBody += chunk;
                });

                response.on("end", function () {
                  const usersComments = JSON.parse(responseBody);
                  assert(Array.isArray(usersComments), "Expected usersComments to be an array");

                  usersComments.forEach(comment => {
                    assert.strictEqual(comment.photoCreatorId, user._id);
                    assert.strictEqual(typeof comment.photoIndex, 'number', "photoIndex should be a number");
                    assert.strictEqual(typeof comment.photoId, 'string', "photoId should be a string");
                    assert.strictEqual(typeof comment.file_name, 'string', "file_name should be a string");
                    assert.strictEqual(typeof comment.commentText, 'string', "commentText should be a string");
                    assert.strictEqual(typeof comment.commentId, 'string', "commentId should be a string");
                  });

                  callback();
                });
              }
            );
          },
          done
        );
      });

      it("returns a 400 status on an invalid user ID format", function (done) {
        http.get(
          {
            hostname: host,
            port: port,
            path: "/userComments/fdafdsafd",
            headers: { Cookie: authCookie },
          },
          function (response) {
            let responseBody = "";
            response.on("data", function (chunk) {
              responseBody += chunk;
            });

            response.on("end", function () {
              assert.strictEqual(response.statusCode, 400);
              done();
            });
          }
        );
      });
    });
  });

  describe("Project 8 API Tests", function (done) {
    const Users = models.userListModel();
    let userList;


    describe("test /user/:id/extended_detail", function () {
      it("can return a 400 status on an invalid user id", function (done) {
        http.get(
          {
            hostname: host,
            port: port,
            path: "/user/fdjksafhdjs/extended_detail",
            headers: { Cookie: authCookie },
          },
          function (response) {
            let responseBody = "";
            response.on("data", function (chunk) {
              responseBody += chunk;
            });

            response.on("end", function () {
              assert.strictEqual(response.statusCode, 400);
              done();
            });
          }
        );
      });

      it("can return a 401 status when no session is passed", function (done) {
        http.get(
          {
            hostname: host,
            port: port,
            path: "/user/valid/extended_detail",
            headers: {},
          },
          function (response) {
            let responseBody = "";
            response.on("data", function (chunk) {
              responseBody += chunk;
            });

            response.on("end", function () {
              assert.strictEqual(response.statusCode, 401);
              done();
            });
          }
        );
      });

      it("can get the list of users for the extended_detail", function (done) {
        http.get(
          {
            hostname: host,
            port: port,
            path: "/user/list",
            headers: { Cookie: authCookie },
          },
          function (response) {
            let responseBody = "";
            response.on("data", function (chunk) {
              responseBody += chunk;
            });

            response.on("end", function () {
              assert.strictEqual(
                response.statusCode,
                200,
                "HTTP response status code not OK"
              );
              userList = JSON.parse(responseBody);
              done();
            });
          }
        );
      });

      it("can get each of the user detail with /user/:id/extended_detail", function (done) {
        async.each(
          Users,
          function (realUser, callback) {
            const user = _.find(userList, {
              first_name: realUser.first_name,
              last_name: realUser.last_name,
            });
            assert(
              user,
              "could not find user " +
              realUser.first_name +
              " " +
              realUser.last_name
            );
            let userInfo;
            const id = user._id;
            http.get(
              {
                hostname: host,
                port: port,
                path: "/user/" + id + "/extended_detail",
                headers: { Cookie: authCookie },
              },
              function (response) {
                let responseBody = "";
                response.on("data", function (chunk) {
                  responseBody += chunk;
                });

                response.on("end", function () {
                  userInfo = JSON.parse(responseBody);
                  assert.strictEqual(response.statusCode, 200);

                  const extraProps = _.difference(
                    Object.keys(removeMongoProperties(userInfo)),
                    userExtraDetailProperties
                  );
                  assert.strictEqual(
                    extraProps.length,
                    0,
                    "user object has extra properties: " + extraProps
                  );
                  callback();
                });
              }
            );
          },
          done
        );
      });
    });

    describe("test /like_photo", function() {
        it("can return a 401 status when user is not logged in", function (done) {
          const postData = JSON.stringify({ photo_id: "validPhotoId" });

          const options = {
            hostname: host,
            port: port,
            path: "/like_photo",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": postData.length,
            },
          };

          const req = http.request(options, function (response) {
            assert.strictEqual(response.statusCode, 401);
            done();
          });

          req.write(postData);
          req.end();
    });

        it("can return a 400 status when photo ID format is invalid", function (done) {
            const requestData = JSON.stringify({ photo_id: "invalidPhotoID" });

            const options = {
                hostname: host,
                port: port,
                path: "/like_photo",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(requestData),
                    Cookie: authCookie,
                },
            };

            const req = http.request(options, (res) => {
                assert.strictEqual(res.statusCode, 400);
                let responseBody = "";
                res.on("data", (chunk) => {
                    responseBody += chunk;
                });
                res.on("end", () => {
                    assert.strictEqual(responseBody, "Invalid photo ID format.");
                    done();
                });
            });

            req.write(requestData);
            req.end();
        });

        it("can return a 404 status if no photo is found", function (done) {
            // Creates a non-existent photo
            const nonExistentPhotoID = new models.photoOfUserModel();
            const requestData = JSON.stringify({ photo_id: new ObjectId() });

            const options = {
                hostname: host,
                port: port,
                path: "/like_photo",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(requestData),
                    Cookie: authCookie,
                },
            };

            const req = http.request(options, (res) => {
                assert.strictEqual(res.statusCode, 404);
                let responseBody = "";
                res.on("data", (chunk) => {
                    responseBody += chunk;
                });
                res.on("end", () => {
                    assert.strictEqual(
                        responseBody,
                        "No photo was found matching the provided ID"
                    );
                    done();
                });
            });

            req.write(requestData);
            req.end();
        });
    });

    describe("test /unlike_photo", function() {
        it("can return a 401 status when user is not logged in", function (done) {
            const photoID = new models.photoOfUserModel();
            const requestData = JSON.stringify({ photo_id: photoID._id });

            const options = {
                hostname: host,
                port: port,
                path: "/unlike_photo",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(requestData),
                },
            };

            const req = http.request(options, (res) => {
                assert.strictEqual(res.statusCode, 401);
                let responseBody = "";
                res.on("data", (chunk) => {
                    responseBody += chunk;
                });
                res.on("end", () => {
                    assert.strictEqual(responseBody, "You must be logged in the use this API.");
                    done();
                });
            });

            req.write(requestData);
            req.end();
        });

        it("can return a 404 status if no photo is found", function (done) {
            const nonExistentPhotoID = new models.photoOfUserModel();
            const requestData = JSON.stringify({ photo_id: new ObjectId() });

            const options = {
                hostname: host,
                port: port,
                path: "/unlike_photo",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(requestData),
                    Cookie: authCookie,
                },
            };

            const req = http.request(options, (res) => {
                assert.strictEqual(res.statusCode, 404);
                let responseBody = "";
                res.on("data", (chunk) => {
                    responseBody += chunk;
                });
                res.on("end", () => {
                    assert.strictEqual(responseBody, "No photo was found matching the provided ID");
                    done();
                });
            });

            req.write(requestData);
            req.end();
        });
    });

    describe("test /photo_like_details", function() {
        it("can return a 401 status when user is not logged in", function (done) {
            const postData = JSON.stringify({ photo_id: "validPhotoId" });

            const options = {
                hostname: host,
                port: port,
                path: "/photo_like_details",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": postData.length,
                },
            };

            const req = http.request(options, function (response) {
                let responseBody = "";
                response.on("data", function (chunk) {
                    responseBody += chunk;
                });

                response.on("end", function () {
                    assert.strictEqual(response.statusCode, 401);
                    done();
                });
            });

            req.write(postData);
            req.end();
        });

        it("can return a 404 status if no photo is found", function (done) {
            const postData = JSON.stringify({ photo_id: "64c109b3fdc9e1c000000000" }); // Assuming this is a non-existent valid ObjectId

            const options = {
                hostname: host,
                port: port,
                path: "/photo_like_details",
                method: "POST",
                headers: {
                    Cookie: authCookie,
                    "Content-Type": "application/json",
                    "Content-Length": postData.length,
                },
            };

            const req = http.request(options, function (response) {
                let responseBody = "";
                response.on("data", function (chunk) {
                    responseBody += chunk;
                });

                response.on("end", function () {
                    assert.strictEqual(response.statusCode, 404);
                    done();
                });
            });

            req.write(postData);
            req.end();
        });
    });

    describe("test /favorite_photo", function() {
      it("can return a 401 status when user is not logged in", function (done) {
        const postData = JSON.stringify({ photo_id: "validPhotoId" });

        const options = {
          hostname: host,
          port: port,
          path: "/favorite_photo",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": postData.length,
          },
        };

        const req = http.request(options, function (response) {
          assert.strictEqual(response.statusCode, 401);
          done();
        });

        req.write(postData);
        req.end();
      });

      it("can return a 400 status when photo ID format is invalid", function (done) {
        const requestData = JSON.stringify({ photo_id: "invalidPhotoID" });

        const options = {
          hostname: host,
          port: port,
          path: "/favorite_photo",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(requestData),
            Cookie: authCookie,
          },
        };

        const req = http.request(options, (res) => {
          assert.strictEqual(res.statusCode, 400);
          let responseBody = "";
          res.on("data", (chunk) => {
            responseBody += chunk;
          });
          res.on("end", () => {
            assert.strictEqual(responseBody, "Invalid photo ID format.");
            done();
          });
        });

        req.write(requestData);
        req.end();
      });
    })

    describe("test /unfavorite_photo", function() {
      it("can return a 401 status when user is not logged in", function (done) {
        const postData = JSON.stringify({ photo_id: "validPhotoId" });

        const options = {
          hostname: host,
          port: port,
          path: "/unfavorite_photo",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": postData.length,
          },
        };

        const req = http.request(options, function (response) {
          assert.strictEqual(response.statusCode, 401);
          done();
        });

        req.write(postData);
        req.end();
      });

      it("can return a 400 status when photo ID format is invalid", function (done) {
        const requestData = JSON.stringify({ photo_id: "invalidPhotoID" });

        const options = {
          hostname: host,
          port: port,
          path: "/unfavorite_photo",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(requestData),
            Cookie: authCookie,
          },
        };

        const req = http.request(options, (res) => {
          assert.strictEqual(res.statusCode, 400);
          let responseBody = "";
          res.on("data", (chunk) => {
            responseBody += chunk;
          });
          res.on("end", () => {
            assert.strictEqual(responseBody, "Invalid photo ID format.");
            done();
          });
        });

        req.write(requestData);
        req.end();
      });
    })

    describe("test /has_favorited", function() {
      it("can return a 401 status when user is not logged in", function (done) {
        const postData = JSON.stringify({ photo_id: "validPhotoId" });

        const options = {
          hostname: host,
          port: port,
          path: "/has_favorited",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": postData.length,
          },
        };

        const req = http.request(options, function (response) {
          assert.strictEqual(response.statusCode, 401);
          done();
        });

        req.write(postData);
        req.end();
      });

      it("can return a 400 status when photo ID format is invalid", function (done) {
        const requestData = JSON.stringify({ photo_id: "invalidPhotoID" });

        const options = {
          hostname: host,
          port: port,
          path: "/has_favorited",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(requestData),
            Cookie: authCookie,
          },
        };

        const req = http.request(options, (res) => {
          assert.strictEqual(res.statusCode, 400);
          let responseBody = "";
          res.on("data", (chunk) => {
            responseBody += chunk;
          });
          res.on("end", () => {
            assert.strictEqual(responseBody, "Invalid photo ID format.");
            done();
          });
        });

        req.write(requestData);
        req.end();
      });
    })
  });
});
