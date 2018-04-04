var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var chatlogSchema = new Schema({
	fromUser: String,
	type: String,
	msg: String,
	created_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('chatlog', chatlogSchema);