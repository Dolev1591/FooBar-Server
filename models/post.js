const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema ({
  
  posterUsername: { // THE USER'S USERNAME
    type: String,
    required: true
  },
  username: { //THE USER'S DISPLAY NAME
    type: String,
    required: true
  }, 
  userPic: { // THE USER'S PICTURE
    type: String, 
    required: true
  },
  postText : {
    type: String,
    required: true
  }, 
  postImage: {
    type: String // Need to figute out what type to use
  },
  postTime: {
    type: String,
    default: () => {
        const now = new Date();
        // Get the current date, hour, and minutes
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        // Construct the string in the desired format: YYYY-MM-DD HH:mm
        return `${year}-${month}-${day} ${hour}:${minutes}`;
    }
  },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Array of User references who liked the post
  likeCount: {
    type: Number,
    default: 0
  },
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;