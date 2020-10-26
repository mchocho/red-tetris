module.exports.createId = function(len=6, chars='abcdefghjkmnopqrstwxyz0123456789')
{
	let id = '';
	while (len--)
		id += chars[Math.random() * chars.length | 0];

	return id;
}

module.exports.getSession = function(sessions, id)
{
	return sessions.get(id);
}