const Post = require('../models/post');
const User = require('../models/user');
const Comment = require('../models/comment');
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;
const { checkBlacklistedURL, checkInBloom } = require('../utils/BloomFilterHelper');

const createPost = async (posterUsername ,username, userPic, postText, postImage, postTime) => {
  try {
    // Await the result of checkBlacklistedURL
    const isBlacklisted = await checkBlacklistedURL(postText);

    if (isBlacklisted) {
      throw new Error('The post includes a BLACKLISTED url, Please try again');
    }

    // Save the new post
    const newPost = new Post ({ 
      posterUsername,
      username, 
      userPic,
      postText,
      postImage,
      postTime
    });

  const savedPost = await newPost.save();
  // Retrieve the user by his username
  const user = await User.findOne({ username: posterUsername });
  if (!user) {
    throw new Error('User not found');
  }
  // Add the new post to the user's posts array
  user.posts.push(savedPost._id);
  await user.save();
  // console.log('UPLOAD POST');
  return savedPost;
  } catch (error) {
    // Throw the error so the controller can catch it.
    throw error;
  }
};

// Function to update post by id
const updatePost = async (pid, newText, newPicture) => {

  try {
    // Await the result of checkBlacklistedURL
    const isBlacklisted = await checkBlacklistedURL(newText);

    if (isBlacklisted) {
      throw new Error('The post includes a BLACKLISTED url, Please try again');
    }

  // Find the post by its ID
  const post = await getPostById(pid);
  if (!post){
    throw new Error('Post not found');
  }
  // Update the post fields
  post.postText = newText;
  post.postImage = newPicture;

  // Save the updated post
  const updatedPost = await post.save();
  // Update the user's posts array
  const user = await User.findOne( { username: post.posterUsername} );
  if (!user) {
    throw new Error('User not found');
  }
  const postIndex = user.posts.findIndex(postId => postId.equals(updatedPost._id));
  if (postIndex !== -1) {
    // Update the post in the user's posts array
    user.posts[postIndex] = updatedPost._id;
    // Save the updated user document
    await user.save();
  }
  return updatePost;
  } catch (error) {
  // Throw the error so the controller can catch it.
    throw error;
  }
};

// Function to find a post by Id
const getPostById = async (pid) => {
  //const post = await Post.findOne({ _id: pid });
  const post = await Post.findById(pid);
  if (!post) {
    throw new Error('Post not found');
  }
  return post;
};

// Function to find a comment by Id
const getCommentById = async (cid) => {
  const comment = await Comment.findById(cid);
  if (!comment) {
    throw new Error('Comment not found');
  }
  return comment;
}



// Function to delete post by id
const deletePost = async (pid) => {
  // Find the post by its ID
  const post = await getPostById(pid);
  if (!post) {
    throw new Error('Post not found');
  }
  // Find the user associated with the post
  const user = await User.findOne({ username: post.posterUsername });
  if (!user) {
    throw new Error('User not found');
  }
  // Remove the post from the user's posts array
  user.posts = user.posts.filter(postId => !postId.equals(post._id));
  // Save the updated user document
  await user.save();
  // Delete the post from the posts database
  await post.deleteOne();
  return post;
};

// Function handles the deletion of comment
const deleteComment = async (pid, cid) => {
  // Find the comment by its Id and the associated post by its Id
  const comment = await getCommentById(cid);
  const post = await getPostById(pid);
  if (!comment) {
    throw new Error('Comment not found');
  }
  if(!post) {
    throw new Error ('Post not found');
  }
  // Find the user associated with this comment
  const user = await User.findOne({username : comment.username});
  if(!user) {
    throw new Error('User not found');
  }
  // Remove the comment from the user comments list, post comments list
  user.comments = user.comments.filter(commentId => !commentId.equals(comment._id));
  post.comments = post.comments.filter(commentId => !commentId.equals(comment._id));

  // Remove the comment from the comments database
  await comment.deleteOne();
  return comment;
}

const editComment = async () => {

}
// **** OLD VERSION ****
// Function to get posts of a friend
// const getFriendPosts = async (token, usernameFriend) => {
//   // Decode the token to get the username of the logged-in user
//   const decoded = jwt.verify(token, SECRET_KEY);
//   const loggedInUsername = decoded.username;
//   // Check if the logged-in user and the poster are friends
//   const loggedInUser = await User.findOne({ username: loggedInUsername }).populate('friends');
//   // const desiredUser = await User.findOne({ username: usernameFriend });
//   const desiredUser = await User.findOne({ username: usernameFriend }).populate({ path: 'posts', options: { sort: { postTime: -1 } } }); // Populate the posts field and sort by createdAt in descending order


//   if (!loggedInUser) {
//      throw new Error('User not found');
//   }
//   if (loggedInUsername === usernameFriend) {
//     // If the logged-in user is viewing their own posts
//     return { areFriends: true, friendPosts: desiredUser.posts };
//   } else {
//     const areFriends = loggedInUser.friends.some(friend => friend.username === usernameFriend);
//     if (areFriends) {
//       return { areFriends: true, friendPosts: desiredUser.posts };
//     } else {
//       // If they are not friends, respond with an error message
//       return { areFriends: false, friendPosts: [] };
//     }
//   }
// };

const getFriendPosts = async (token, usernameFriend) => {
  const decoded = jwt.verify(token, SECRET_KEY);
  const loggedInUsername = decoded.username;

  const loggedInUser = await User.findOne({ username: loggedInUsername }).populate('friends');
  const desiredUser = await User.findOne({ username: usernameFriend })
    .populate({ path: 'posts', options: { sort: { postTime: -1 } }, populate: { path: 'comments' } }); // Populate comments within posts

  if (!loggedInUser) {
    throw new Error('User not found');
  }
  if (loggedInUsername === usernameFriend) {
    return { areFriends: true, friendPosts: desiredUser.posts };
  } else {
    const areFriends = loggedInUser.friends.some(friend => friend.username === usernameFriend);
    if (areFriends) {
      return { areFriends: true, friendPosts: desiredUser.posts };
    } else {
      return { areFriends: false, friendPosts: [] };
    }
  }
};

//  **** OLD VERSION ****
// Service function to fetch a maximum of 25 posts, consisting of the newest posts from non-friends and friends of the connected user
// const getFeedPosts = async (decodedUsername) => {
//   try {
//     // Find the connected user and populate the 'friends' field
//     const connectedUser = await User.findOne({ username: decodedUsername }).populate('friends');

//     if (!connectedUser) {
//       throw new Error('Connected user not found');
//     }

//     // Extract the usernames of the connected user's friends
//     const friendUsernames = connectedUser.friends.map(friend => friend.username);

//     // Fetch the newest 5 posts from non-friends
//     const nonFriendPosts = await Post.find({ posterUsername: { $nin: friendUsernames } })
//       .sort({ postTime: -1 })
//       .limit(5);

//     // Fetch the newest 20 posts from friends
//     const friendPosts = await Post.find({ posterUsername: { $in: friendUsernames } })
//       .sort({ postTime: -1 })
//       .limit(20);
//     // Combine the posts from non-friends and friends
//     let combinedPosts = [...nonFriendPosts, ...friendPosts];

//     // Sort the combined posts by postTime in descending order
//     combinedPosts.sort((a, b) => new Date(b.postTime) - new Date(a.postTime));

//     // Return a maximum of 25 posts
//     combinedPosts = combinedPosts.slice(0, 25);

//     return combinedPosts;
//   } catch (error) {
//     console.error(error);
//     throw new Error('Failed to fetch posts');
//   }
// };
const getFeedPosts = async (decodedUsername) => {
  try {
    const connectedUser = await User.findOne({ username: decodedUsername }).populate('friends');
    if (!connectedUser) {
      throw new Error('Connected user not found');
    }

    const friendUsernames = connectedUser.friends.map(friend => friend.username);

    const nonFriendPosts = await Post.find({ posterUsername: { $nin: friendUsernames } })
      .sort({ postTime: -1 })
      .limit(5)
      .populate('comments');  // Populate comments

    const friendPosts = await Post.find({ posterUsername: { $in: friendUsernames } })
      .sort({ postTime: -1 })
      .limit(20)
      .populate('comments');  // Populate comments

    let combinedPosts = [...nonFriendPosts, ...friendPosts];
    combinedPosts.sort((a, b) => new Date(b.postTime) - new Date(a.postTime));

    return combinedPosts.slice(0, 25);  // Return a maximum of 25 posts
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch posts');
  }
};


// Function to handle like
const updatePostLikeStatus = async (username, postId, isLiked) => {

  try {
    let post = await Post.findById(postId);

    if (!post) {
      return { success: false, message: 'Post not found.' };
    }
    // Find the user based on the provided username
    let user = await User.findOne({ username });

    if (!user) {
      return { success: false, message: 'User not found.' };
    }
    const userIdString = user._id.toString();

    if (isLiked && !post.likes.includes(userIdString)) {
      post.likes.push(userIdString);
      post.likeCount += 1; // Increment likeCount
    } else if (!isLiked && post.likes.includes(userIdString)) {
      post.likes = post.likes.filter(like => like.toString() !== userIdString);
      post.likeCount -= 1; // Decrement likeCount
    }

    await post.save();
    return { success: true, likeCount: post.likeCount };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Internal server error.' };
  }
};

// The comment functions:
const addComment = async (postId, username, displayName, profilePic, commentText) => {
  try {
    // Await the result of checkBlacklistedURL
    // const isBlacklisted = await checkBlacklistedURL(postText);

    // if (isBlacklisted) {
    //   throw new Error('The post includes a BLACKLISTED url, Please try again');
    // }
    // Create a new comment
    const newComment = new Comment ({
      username,
      displayName,
      profilePic,
      commentText,
      postId
    });
    console.log('In the addComment service: ' + newComment);

// Save the new comment to the database
const savedComment = await newComment.save();

// Find the user by username
const user = await User.findOne({ username });
if (!user) {
  throw new Error('User not found');
}

// Add the comment to the user's comments list and save the user
user.comments.push(savedComment._id);
await user.save();

// Find the post by postId
const post = await Post.findById(postId);
if (!post) {
  throw new Error('Post not found');
}

// Add the comment to the post's comments list and save the post
post.comments.push(savedComment._id);
await post.save();

return savedComment;
} catch (error) {
// Throw the error so the controller can catch it
throw error;
}
};


module.exports = { createPost, getPostById ,updatePost, deletePost, getFeedPosts, getFriendPosts, updatePostLikeStatus, addComment, editComment, deleteComment
}