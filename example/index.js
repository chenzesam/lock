import Lock from 'lock';

const lock = new Lock({
  container: document.querySelector('.container'),
  onResult: (result) => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (result.join('') === '123') {
        resolve('123')
      } else {
        reject()
      }
    }, 2000)
  })
})