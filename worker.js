const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const { match } = require('assert');
const { regex } = workerData;

const directories = [];
let matchedFiles = [];
let availableThreads;

parentPort.on('message', (msg) => {
  availableThreads = msg.availableThreads;
  if (msg.type === 'init') {
    searchForFile(msg.startPath);
  } else if (msg.type === 'getMatches') {
    parentPort.postMessage({
      type: 'get',
      matchedFiles
    });
  } else if (msg.type === 'offload') {
    if (directories.length) {
      parentPort.postMessage({
        type: 'offload',
        startPath: directories.shift()
      });
    }
  } else if (msg.type === 'search') {
    searchForFile(msg.startPath);
  }
});

function searchForFile(startPath) {
  fs.readdir(startPath, {
    withFileTypes: true
  }, function (err, files) {
    if (err) { // TODO dont do return
      return 'Search progressing...';
    }

    files.forEach(function (file) {
      if (file.isDirectory()) {
        directories.push(path.join(startPath, file.name));
      } else if (file.isFile() && regex.test(file.name)) {
        matchedFiles.push(path.join(startPath, file.name));
      }
    });

    if (availableThreads && directories.length) {
      parentPort.postMessage({
        type: 'offload-all',
        directories: directories.splice(0, availableThreads)
      });
    } else if (directories.length) {
      searchForFile(directories.shift());
    } else {
      const temp = [...matchedFiles];
      matchedFiles = [];
      parentPort.postMessage({
        type: 'complete',
        matchedFiles: temp
      });
    }
  });
}
