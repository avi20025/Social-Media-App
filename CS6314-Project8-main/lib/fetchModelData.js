// class FetchError extends Error {
//   constructor(status, statusText) {
//     super(`Error ${status}: ${statusText}`);
//     this.status = status;
//     this.statusText = statusText;
//   }
// }
//
// /**
//  * fetchModel - Fetch a model from the web server.
//  *
//  * @param {string} url      The URL to issue the GET request.
//  *
//  * @returns a Promise that should be filled with the response of the GET request
//  * parsed as a JSON object and returned in the property named "data" of an
//  * object. If the request has an error, the Promise should be rejected with an
//  * object that contains the properties:
//  * {number} status          The HTTP response status
//  * {string} statusText      The statusText from the xhr request
//  */
// function fetchModel(url) {
//   return new Promise(function (resolve, reject) {
//     const fetchRes = fetch(url);
//     fetchRes.then((response) => {
//       // Successful API call
//       if (response.ok) {
//         response.json().then((data) => {
//           resolve({ data: data });
//         });
//       }
//
//       // Unsuccessful API call
//       else {
//         response.json().then(() => {
//           reject(new FetchError(response.status, response.statusText));
//         });
//       }
//     });
//   });
// }
//
// export default fetchModel;
