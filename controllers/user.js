// Import the user service for handling user-related operations
const userService = require ('../services/user');
const User = require ('../models/user');

// Function to create a new user
const createUser = async (req, res) => {
  try {
    // Attempt to create a user and respond with the result
    res.json(await userService.createUser(req.body.username, req.body.displayName, req.body.password, req.body.profilePic));
  } catch (error) {
    // If an error occurs (e.g., username already taken), respond with an error message
    res.status(401).json({error: 'Username already taken. Please select a different username'})
  }
}

// Function to handle user login
const loginUser = async (req, res) => {
  try {
    // Attempt to log in the user and respond with the result
    const user = await userService.loginUser(req,res);
  } catch (error) {
    // If an error occurs (e.g., incorrect username or password), respond with an error message
    res.status(401).json({ error: 'Incorrect username or password' });
  }
};

// Function to handle the request to user data
const getUserProfile = async (req, res) => {
  try {
      // Attempt to retrieve user profile data and respond with the result
      const userProfile = await userService.getUserProfile(req.params.id);
      res.status(200).json(userProfile);
  } catch (error) {
      // If an error occurs (e.g., user profile not found), respond with an error message
      res.status(404).json({ error: 'User profile not found' });
  }
}

// Function to delete a user
const deleteUser = async (req, res) => {
  try {
    // Attempt to delete a user and respond with the result
    const user = await userService.deleteUser(req.params.id);
    res.json(user);
  } catch (error) {
    // If an error occurs (e.g., user not found), respond with an error message
    res.status(404).json({ error: ['User not found'] });
  }
};

// Function to update user profile
const updateUser = async (req, res) => {
  try {
    // Attempt to update user profile and respond with the result
    const user = await userService.updateUser(req.params.id, req.body.displayName,
       req.body.profilePic);
    res.json(user);
  } catch (error) {
    // If an error occurs (e.g., user not found), respond with an error message
    res.status(404).json({ error: ['User not found'] });
  }
};
// Controller function to handle sending friend requests
const sendFriendRequest = async (req, res) => {
  try {
    // Extract necessary data from the request
    const { username, friendUsername } = req.body;

    // Call the userService function to send the friend request
    const message = await userService.sendFriendRequest(username, friendUsername);

    // Return success response with the message from the service
    res.status(200).json({ message });
  } catch (error) {
    console.error(error);
    const errorMessage = error.message || "Failed to send friend request. Please try again.";
    res.status(500).json({ message: errorMessage });
  }
};
// Function to get friend requests
const getFriendRequests = async (req, res) => {
  const { id: username } = req.params; // Rename id to username
  try {
    const friendRequestsDetails = await userService.getFriendRequests(username);
    res.status(200).json(friendRequestsDetails);
   } catch (error) {
    console.error('Controller error:', error.message);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
};

// Controller function to accept a friend request
const acceptFriendRequest = async (req, res) => {
  const { id, fid } = req.params; // id is the current user's id, fid is the friend's id

  try {
    // Remove friend request from the receiver's received requests
    await userService.removeFriendRequest(id, fid);

    // Add both users to each other's friends list
    await userService.addFriend(id, fid);
    // await userService.addFriend(fid, id);

    // Return the friend's details (you may customize this as needed)
    const friend = await userService.getUserById(fid);
    res.status(200).json(friend);
  } catch (error) {
    console.error('Controller error:', error.message);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
};

// Controller function to decline a friend request or remove a friend
const removeFriendOrRequest = async (req, res) => {
  const { id, fid } = req.params; // id is the current user's username, fid is the friend's id

  try {
    // Find the user by username
    const user = await User.findOne({ username: id });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the friend by ID
    const friend = await User.findById(fid);

    if (!friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    if (user.friends.includes(fid) && friend.friends.includes(user._id)) {
      // If users are already friends, remove them from each other's friends list
      await userService.removeFriend(user._id, fid);
    } else {
      // If not friends, remove the friend request from each other's lists
      await userService.removeFriendRequest(user.username, fid);
    }

    res.status(204).send(); // No content in response
  } catch (error) {
    console.error('Controller error:', error.message);
    res.status(500).json({ error: 'Failed to decline friend request' });
  }
};
// Controller function to fetch a user's friends
const getUserFriends = async (req, res) => {
  const { id } = req.params; // id is the username of the user

  try {
    // Call the service function to get the user's friends
    const friends = await userService.getUserFriends(id);
    
    // Return the friends list in the response
    res.status(200).json(friends);
  } catch (error) {
    console.error('Controller error:', error.message);
    res.status(500).json({ error: 'Failed to fetch user friends' });
  }
};


module.exports = { createUser, loginUser, getUserProfile, deleteUser, 
   updateUser, acceptFriendRequest, sendFriendRequest, getFriendRequests, acceptFriendRequest, removeFriendOrRequest, getUserFriends
  }

