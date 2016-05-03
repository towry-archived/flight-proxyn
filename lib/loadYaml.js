const yaml = require('js-yaml');
const fs = require('fs');

module.exports = function (yamlFilePath) {
	try {
		var data = yaml.safeLoad(fs.readFileSync(yamlFilePath, 'utf8'));
		return data;
	} catch (e) {
		return null;
	}
}
