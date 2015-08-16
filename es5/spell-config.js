'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var fileLines = [];
var globalDictionary = [];
var fileDictionary = {};
var isCrLf = false;
var globalDictionaryIndex = -1;

function parse() {
  var lastNonCommentIndex = -1;
  var inGlobal = true;
  var currentFile = undefined;
  fileLines.forEach(function (line, index) {
    if (line.indexOf('#') === 0) {
      return;
    }
    var fileMatch = line.match(/^\s*-\s+(.*)/);
    if (fileMatch) {
      if (inGlobal) {
        globalDictionaryIndex = lastNonCommentIndex === -1 ? index : lastNonCommentIndex + 1;
        inGlobal = false;
      } else {
        fileDictionary[currentFile].index = lastNonCommentIndex + 1;
      }
      currentFile = fileMatch[1];
      fileDictionary[currentFile] = { words: [] };
    } else {
      var word = line.trim();
      if (inGlobal) {
        globalDictionary.push(word);
      } else {
        fileDictionary[currentFile].words.push(word);
      }
    }
    lastNonCommentIndex = index;
  });
  if (inGlobal) {
    globalDictionaryIndex = lastNonCommentIndex === -1 ? index : lastNonCommentIndex + 1;
  } else {
    fileDictionary[currentFile].index = lastNonCommentIndex;
  }
}

function emptyFile() {
  fileLines = ["# markdown-spellcheck spelling configuration file", "# Format - lines begining # are comments", "# global dictionary is at the start, file overrides afterwards", "# one word per line, to define a file override use ' - filename'", "# where filename is relative to this configuration file"];
  globalDictionaryIndex = fileLines.length;
}

function initialise(filename, done) {
  _fs2['default'].readFile(filename, { encoding: 'utf-8' }, function (err, data) {
    if (err) {
      emptyFile();
      return done();
    }
    if (data.indexOf('\r') >= 0) {
      isCrLf = true;
      data = data.replace(/\r/g, "");
    }
    fileLines = data.split('\n');
    parse();
    return done();
  });
}

function writeFile(done) {
  console.log("writing file");
  var data = fileLines.join(isCrLf ? "\r\n" : "\n");
  _fs2['default'].writeFile('./.spelling', data, function (err) {
    if (err) console.error(err);
    done();
  });
}

function addToGlobalDictionary(word) {
  globalDictionary.push(word);
  fileLines.splice(globalDictionaryIndex, 0, word);
  globalDictionaryIndex++;
  for (var filename in fileDictionary) {
    if (fileDictionary.hasOwnProperty(filename)) {
      fileDictionary[filename].index++;
    }
  }
}

function addToFileDictionary(filename, word) {
  if (fileDictionary.hasOwnProperty(filename)) {
    var fileDict = fileDictionary[filename];
    fileLines.splice(fileDict.index, 0, word);
    for (var _filename in fileDictionary) {
      if (fileDictionary.hasOwnProperty(_filename) && fileDictionary[_filename].index >= fileDict.index) {
        fileDictionary[_filename].index++;
      }
    }
    fileDict.words.push(word);
  } else {
    fileLines.push(" - " + filename);
    fileLines.push(word);
    fileDictionary[filename] = {
      index: fileLines.length,
      words: [word]
    };
  }
}

function getGlobalWords() {
  return globalDictionary;
}

function getFileWords(filename) {
  if (fileDictionary.hasOwnProperty(filename)) {
    return fileDictionary[filename].words;
  }
  return [];
}

exports['default'] = {
  initialise: initialise,
  writeFile: writeFile,
  addToGlobalDictionary: addToGlobalDictionary,
  addToFileDictionary: addToFileDictionary,
  getGlobalWords: getGlobalWords,
  getFileWords: getFileWords
};
module.exports = exports['default'];