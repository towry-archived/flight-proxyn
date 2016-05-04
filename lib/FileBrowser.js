const path = require('path');
const fs = require('fs');

function Iterator (arr) {
	this._list = arr;
	this._index = 0;
	this._len = arr.length;
}

Iterator.prototype.next = function () {
	if (this._index >= this._len) {
		return null;
	}

	return this._list[this._index++];
}

function Node() {
	this._name = '';
	this._isDirectory = false;
	this._isFile = false;
	this._child = [];
	this._parent = null;
	this._path = '';
}

Node.create = function (dir, parent, isFile) {
	if (isFile === true) {
		var node = new Node();
		node._name = path.basename(dir);
		node._isFile = isFile;
		node._parent = parent;
		node._path = dir;
		if (parent) {
			parent.push(node);
		}
		return node;
	}

	// is dir
	var parentNode = new Node();
	parentNode._name = path.basename(dir);
	parentNode._isDirectory = true;
	parentNode._parent = parent;
	parentNode._path = dir;
	if (parent) {
		parent.push(parentNode);
	}

	fs.readdirSync(dir).forEach(function (file) {
		var stat = fs.statSync(path.join(dir, file));
		Node.create(path.join(dir, file), parentNode, stat.isFile());
	});

	return parentNode;
}

Node.prototype.isDirectory = function () {
	return this._isDirectory;
}

Node.prototype.isFile = function () {
	return this._isFile;
}

Node.prototype.name = function () {
	return this._name;
}

Node.prototype.iter = function () {
	return new Iterator(this._child);
}

Node.prototype.push = function (node) {
	if (!(node instanceof Node)) {
		throw new Error('node must be an Node instance');
	}
	this._child.push(node);
}

Node.prototype.hasChildren = function () {
	return this._child.length > 0;
}

Node.prototype.path = function () {
	return this._path;
}

function FileBrowser(base) {
	this.base = base;
	this.tree = null;
}
module.exports = FileBrowser;

/**
 * If the request url is like:
 * /static-server1/assets/cssbin/main-bundle-ms-jflaHASHsjdfl.css
 *
 * and the local search path is ./local_base, and the file we wanted
 * is located at ./local_base/assets/cssbin/main-bundle.css
 * we search start from `cssbin` directory to top directory.
 */
FileBrowser.prototype.search = function (filepath) {
	this.fresh();

	var splits = filepath.split('/');
	var top = null;
	var found = null;
	var tree = this.tree;

	for (var i = 0; i < splits.length; i++) {
		top = splits[i];
		if (top === '') {
			continue;
		}

		found = this.searchInTree(tree, top);
		if (found === null) {
			continue;
		} else {
			tree = found;
			if (i == splits.length - 1 && !tree.hasChildren()) {
				return tree;
			}

			found = null;
		}
	}

	// if found is not null, we found it!
	return found;
}

FileBrowser.prototype.searchInTree = function (tree, name) {
	var iter = tree.iter();	
	var node = null;
	var found = null;

	while (node = iter.next()) {
		if (node.name() === name) {
			found = node;
			break;
		}
	}

	return found
}

FileBrowser.prototype.deepSearch = function (name, node, left) {

}

FileBrowser.prototype.fresh = function () {
	var stat = fs.statSync(this.base);
	if (!stat.isDirectory()) {
		throw new Error("base must be a directory");
	}

	this.tree = Node.create(this.base, null, false);
}


FileBrowser.prototype.toString = function () {
	console.log(this.tree);
}
