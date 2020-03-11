import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import Lock from './lock';

const lockPassword = [1, 5, 9];
function App() {
  const container = useRef(null);
  const lock = useRef(null);
  const [isLock, setIsLock] = useState(true);
  useEffect(() => {
    lock.current = new Lock({
      container: container.current,
      keyborad: [4, 5],
      // callback: result => {
      //   lock.current.loading('加载中, 请稍后~');
      //   setTimeout(() => {
      //     if (result.toString() === lockPassword.toString()) {
      //       setIsLock(false);
      //       lock.current.success();
      //     } else {
      //       lock.current.error();
      //     }
      //   }, 1000)
      // },
      callback: result => new Promise((resolve, reject) => {
        setTimeout(() => {
          if (result.toString() === lockPassword.toString()) {
            setIsLock(false);
            resolve();
          } else {
            reject();
          }
        }, 1000);
      })
    })
  }, [])
  return (
    <>
      <div ref={container} className='container' />
      <div style={{textAlign: 'center'}}>{isLock ? 'lock' : 'unlock' }</div>
    </>
  );
}

export default App;
