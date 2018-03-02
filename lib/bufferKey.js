module.exports = function bufferKey(content, deployId) {
	const message = {
		deployId,
		content
	};
	return JSON.stringify(message);
};