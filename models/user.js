const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema ({
  username: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  
  profilePic: {
    type: String, 
    required: true
  },

  friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],

  friendRequests: {
    received: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },

  posts: [{ type: Schema.Types.ObjectId, ref: 'Post'}], // Added posts list
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
})

const User = mongoose.model('User', UserSchema);

module.exports = User;