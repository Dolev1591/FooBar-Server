const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Each comment should have The USERNAME, the USERPIC and the TEXT.
// NOTE: Each user now should have a list of his comments (and only them he can delete).
// NOTE: Each Post should have a list of his comments.
// We Use DisplayName as the name of the user that displayed

const CommentSchema = new Schema ({
  username: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  profilePic: {
    type: String, 
    required: true
  },
  commentText: {
    type: String,
    required: true
  },
  postId: {
    type: String,
    required: true
  },  
})

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;