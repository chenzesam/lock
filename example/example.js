const containers = document.querySelectorAll('.container');
const lock = new Lock({
  container: containers[0],
  onResult: (result) => {
    lock.checking();
    setTimeout(() => {
      if (result.join('') === '123') {
        lock.success();
        setTimeout(() => {
          lock.destroy();
        }, 1000);
      } else {
        lock.error();
      }
    }, 3000);
  },
  onChange: (result) => {
    console.log(result);
  },
  keyboard: [4, 4],
});

const lock2 = new Lock({
  container: containers[1],
  onResult: (result) => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (result.join('') === '123') {
        resolve();
      } else {
        reject();
      }
    }, 1000);
  }),
  keyboard: [3, 3],
});
