// Import necessary modules and dependencies
const User = require('../models/user');
const Post = require('../models/post');
const jwt = require("jsonwebtoken")
const SECRET_KEY = process.env.SECRET_KEY;
const mongoose = require('mongoose');

// Function to create a user
const createUser = async (username, displayName, password, profilePic) => {
  // Check if the DB if the username is already exists
  const existingUser = await User.findOne({ username });
  // If the username is already exists throw error indicates that.
  if (existingUser) {
    throw new Error('Username already taken. Please select a different username');
  }
   // Create a new user
   const newUser = new User({
    username,
    displayName,
    password,
    profilePic
  });
  return await newUser.save();
}

// Function to handle user login
const loginUser = async (req, res) => {
 // Find the user in the database based on the provided username
  const username = req.body.username;
  const password = req.body.password;
  const user = await User.findOne({ username });
 //handling the case that indeed the user is found
if (user && user.password === password) {
    res.status(201).json({ token: generatetoken(req,res)});
} else if (!user || user.password !== password) {
  throw new Error('Incorrect username or password');
}
};

// Function to get a single user's information by username
const getUserByUsername = async (username) => {
  // Find the user in the database based on the provided username
  const user = await User.findOne({ username });
  // Handling the case that indeed the user is found
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

// Function to delete a user by username
const deleteUser = async (username) => {
  // Find the user by username
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error('User not found');
  }
  // Find all posts associated with the user
  const userPosts = await Post.find({ posterUsername: username });
  // Delete each post from the Posts database
  await Promise.all(userPosts.map(async (post) => {
    await post.deleteOne();
  }));
  // Delete the user
  await user.deleteOne();
  return user;
};

// Function to update user information by username
const updateUser = async (username, displayName, profilePic) => {
  // Find the user by username
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error('User not found');
  }
  // Update user information
  user.displayName = displayName;
  user.profilePic = profilePic;
  // Save the updated user document
  await user.save();
  // Update all posts associated with the user
  const userPosts = await Post.find({ posterUsername: username });
  await Promise.all(userPosts.map(async (post) => {
    post.username = displayName;
    post.userPic = profilePic;
    await post.save();
  }));
  return user;
};

// Function to get a user's profile by username
const getUserProfile = async (username) => {
  // return await User.findOne({ username }).select('username displayName profilePic');
  return await User.findOne({ username }).select('_id username displayName profilePic');
}

//  A function to generate a unique token every time a user is logging in
const generatetoken = (req,res) => {
  const data = { username: req.body.username}
  const token = jwt.sign(data, SECRET_KEY,{ expiresIn:process.env.TOKEN_EXPIRATION })
  return token;
};
const getFriendsList = async (username) => {
  try {
    // Find the user by username and populate the friends list
    const user = await User.findOne({ username })
      .populate('friends', 'username displayName profilePic') // Adjust according to your needs
      .exec();
    if (!user) {
      return null; // User not found
    }
    // Map the populated friends to the desired structure
    const friendsList = user.friends.map(friend => ({
      username: friend.username,
      displayName: friend.displayName,
      profilePic: friend.profilePic,
      // Include any other friend details you need
    }));
    return friendsList;
  } catch (error) {
    console.error('Error fetching friends list:', error);
    throw new Error('Failed to retrieve friends list');
  }
};
// Service function to handle friend requests send
const sendFriendRequest = async (username, friendUsername) => {
  try {
    // Find the sender and receiver users in the database
    const sender = await User.findOne({username});
    const receiver = await User.findOne({username: friendUsername});
    // Check if sender and receiver exist
    if (!sender || !receiver) {
      throw { message: 'Sender or receiver not found' };
    }
    // Check if sender already sent a friend request to receiver
    if (sender.friendRequests.sent.includes(receiver._id)) {
      throw { message: 'You already sent a request to this user. Wait for their response.' };
    }
    // Check if receiver already sent a friend request to sender
    if (sender.friendRequests.received.includes(receiver._id)) {
    // if (receiver.friendRequests.received.includes(sender._id)) {
      throw { message: 'This user already sent you a request. Approve it, don\'t be rude.' };
    }
    // Update sender's friend requests
    sender.friendRequests.sent.push(receiver._id);
    await sender.save();
    // Add sender to the received friend requests of the receiver
    receiver.friendRequests.received.push(sender._id);
    await receiver.save();
    // Return success or handle any other necessary operations
    return "Friend request sent successfully";
  } catch (error) {
    console.error(error);
    // throw new Error('Failed to send friend request');
    throw error;
  }
};
// Service function to fetch friend requests received by the user
const getFriendRequests = async (username) => {
  try {
    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }
    // Retrieve the received friend requests
    const receivedRequests = user.friendRequests.received;
    // Fetch user details for each friend request
    const friendRequestsDetails = await Promise.all(receivedRequests.map(async (friendId) => {
      // Find the user associated with the friend request
      const friendUser = await User.findById(friendId);
      if (!friendUser) {
        throw new Error(`User with ID ${friendId} not found`);
      }
      // Extract relevant details from the user
      return {
        userId: friendUser._id,
        displayName: friendUser.displayName,
        profilePic: friendUser.profilePic
      };
    }));
    return friendRequestsDetails;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service function to remove a friend request from both of the friend and user relevant lists
const removeFriendRequest = async (username, friendId) => {
  try {
    // Find the user's ID based on the username
    const user = await User.findOne({ username: username });
    if (!user) {
      throw new Error('User not found');
    }
    // Remove friendId from the received requests of the user
    await User.findByIdAndUpdate(user._id, { $pull: { 'friendRequests.received': friendId } });
     // Find the friend based on the friendId
     const friend = await User.findById(friendId);
     if (!friend) {
       throw new Error('Friend not found');
     }
      // Remove userId from the sent requests of the friend
      await User.findByIdAndUpdate(friend._id, { $pull: { 'friendRequests.sent': user._id } });
  } catch (error) {
    throw new Error('Failed to remove friend request');
  }
};

// Service function to add a friend for both of user and friend
const addFriend = async (username, friendId) => {
  try {
    // Find the user's ID based on the username
    const user = await User.findOne({ username: username });
    const friend = await User.findById(friendId);
    if (!user || !friend) {
      throw new Error('User or friend not found');
    }
    // Add friendId to the user's friends list
    await User.findByIdAndUpdate(user._id, { $addToSet: { friends: friendId } });
    // Add userId to the friend's friends list
    await User.findByIdAndUpdate(friend._id, { $addToSet: { friends: user._id } });
  } catch (error) {
    throw new Error('Failed to add friend for both users');
  }
};
// Service function to get ALL user details by ID
const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    throw new Error('Failed to get user details');
  }
};
// Service function to remove a friend
const removeFriend = async (userId, friendId) => {
  try {
    // Remove friendId from the friends list of the user
    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    // Remove userId from the friends list of the friend
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
  } catch (error) {
    throw new Error('Failed to remove friend');
  }
};
// Service function to fetch a user's friends
const getUserFriends = async (username) => {
  try {
    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }
    // Retrieve the user's friends and their relevant details
    const friends = await User.find({ _id: { $in: user.friends } }, { profilePic: 1, displayName: 1 });
    return friends;
  } catch (error) {
    throw new Error('Failed to fetch user friends');
  }
};

module.exports = { createUser, loginUser, getUserProfile,
   getUserByUsername, deleteUser, updateUser, getFriendsList,
     generatetoken, sendFriendRequest, getFriendRequests, addFriend, removeFriendRequest, getUserById, removeFriend, getUserFriends }; 