// Import necessary modules and middleware
const userController = require('../controllers/user');
const postController = require('../controllers/post');
const isValidToken = require('../middleware/tokenChecker');
const { acceptFriendRequest} = require('../controllers/user');
const express = require('express');
// Create a router instance
var router = express.Router();
// Route for creating a new user (POST request)
router.route('/').post(userController.createUser);
// Route for getting a user's profile by ID (GET request)
// Requires a valid token for authentication
router.get('/:id', isValidToken, userController.getUserProfile);
// Route for updating a user's profile by ID (PATCH request)
// Requires a valid token for authentication
router.patch('/:id', isValidToken, userController.updateUser);
// Route for deleting a user by ID (DELETE request)
// Requires a valid token for authentication
router.delete('/:id', isValidToken, userController.deleteUser);
router.post('/:id/friends', isValidToken, userController.sendFriendRequest);
// Router to the user's friend requests
router.get('/:id/friend-requests', isValidToken, userController.getFriendRequests);
// routes to accept and decline friend requests and delete friend
router.patch('/:id/friends/:fid', isValidToken, acceptFriendRequest);
router.delete('/:id/friends/:fid', isValidToken, userController.removeFriendOrRequest);
// GET user's friends
router.get('/:id/friends', isValidToken , userController.getUserFriends);
// Route to handle post like or unlike
router.patch('/:id/posts/:pid/like', isValidToken, postController.updatePostLikeStatus);
//routes for updatind and deleting a post
router.route('/:id/posts/:pid')
             .patch(isValidToken, postController.updatePost)
             .delete(isValidToken, postController.deletePost)
//routes for creating a post and getting all posts           
router.route('/:id/posts')
             // maybe need to add another middleware method
             .get(isValidToken,postController.getFriendPosts)
             .post(isValidToken,postController.createPost)
module.exports = router;