const mongoose = require("mongoose");

const loginLogSchema = new mongoose.Schema({

email:{
type:String,
required:true
},

role:{
type:String,
required:true
},

ip:{
type:String
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("LoginLog",loginLogSchema);