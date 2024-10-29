const postService = require ('../services/post');
const jwt = require("jsonwebtoken")
const SECRET_KEY = process.env.SECRET_KEY;

// Function to create a new post
const createPost = async (req, res) => {
  //  I need to figure out how to use the user's picture and username.
  try {
      res.json(await postService.createPost(req.body.posterUsername,req.body.username, req.body.userPic, req.body.postText, req.body.postImage, req.body.postTime));
    } catch (error) {
      if (error.message === 'User not found') {
        res.status(404).json({ error: ['User not found'] });
      } else if (error.message === 'The post includes a BLACKLISTED url, Please try again') {
        res.status(400).json({ error: ['The post includes a BLACKLISTED url, Please try again'] });
      } else {
        // Handle other unexpected errors
        console.error(error);
        res.status(500).json({ error: ['Internal server error'] });
      }
    }
  };

const updatePost = async (req, res) => {
  try {
    // Maybe need to change to : req.body.pid if will decide to add pid field to model
    const post = await postService.updatePost(req.params.pid, req.body.postText,
      req.body.postImage);
    res.json(post);
  } catch (error) {
    if (error.message === 'The post includes a BLACKLISTED url, Please try again') {
      res.status(400).json({ error: ['The post includes a BLACKLISTED url, Please try again'] });
    } else {
      res.status(404).json({ error: ['Post not found'] });
    }
  }
};



// Returns the friend's posts.
const getFriendPosts = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
     // Assuming id is the username of the friend
    const { areFriends, friendPosts } = await postService.getFriendPosts(token, req.params.id);
    // Send the response based on whether they are friends or not
    if (areFriends) {
      res.status(200).json({ areFriends, friendPosts });
    } else {
      res.status(200).json({ areFriends, message: 'You are not friends with this user' });
    }
  } catch (error) {
    res.status(404).json({ error: 'User not found' });
  }
};

// Controller function to handle fetching all posts
const getFeedPosts = async (req, res) => {
  try {
    // Decode the JWT to get the username of the connected user
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, SECRET_KEY);
    const decodedUsername = decodedToken.username;
    // Fetch all posts from the database
    const posts = await postService.getFeedPosts(decodedUsername);
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: 'There are no posts yet' });
  }
};


// Function to delete an existing post
const deletePost = async (req, res) => {
  try {
    const deletedPost = await postService.deletePost(req.params.pid);
    res.json(deletedPost);
  } catch (error) {
    res.status(404).json({ error: ['Post not found'] });
  }
};

const deleteComment = async (req, res) => {
    try {
      // Extracting the CommentID and PostId
      const { postId, commentId } = req.params;
      const deletedComment = await postService.deleteComment(postId, commentId);
      res.json(deletedComment);
    } catch (error) {
      res.status(404).json({ error: ['Comment not found'] });
    }
  };

// Function to handle the like
const updatePostLikeStatus = async (req, res) => {
  try {
    const { id, pid } = req.params; // id is the current user's username, pid is the post's id
    const { isLiked } = req.body;
    // Call the service function to update the post like status
    const response = await postService.updatePostLikeStatus(id, pid, isLiked);

    // Check if the service function was successful
    if (response.success) {
      // Return success response to the client
      return res.json({ success: true, likeCount: response.likeCount });
    } else {
      // Return failure response to the client with appropriate message
      return res.status(404).json({ success: false, message: response.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Comment functions section:
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;  // Assuming postId is sent as a URL parameter
    const { username, displayName, profilePic, commentText } = req.body;  // Extract necessary data from the request body

    // Call the addComment function from postService and pass the necessary arguments
    const savedComment = await postService.addComment(postId, username, displayName, profilePic, commentText);

    // Send the saved comment back as a response
    res.status(201).json({ success: true, comment: savedComment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const editComment = async (req, res) => {
  try {

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


module.exports = { createPost, updatePost, deletePost, getFriendPosts, getFeedPosts, updatePostLikeStatus, addComment, editComment, deleteComment
}
