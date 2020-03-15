const containers = document.querySelectorAll('.container');
const lock = new Lock({
  container: containers[0],
  callback: result => {
    lock.loading();
    setTimeout(() => {
      if (result.join('') === '123') {
        lock.success();
      } else {
        lock.error();
      }
    }, 1000)
  },
  keyboard: [4, 4]
});

const lock2 = new Lock({
  container: containers[1],
  callback: result => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (result.join('') === '123') {
        resolve()
      } else {
        reject()
      }
    }, 1000)
  }),
  keyboard: [3, 3]
});