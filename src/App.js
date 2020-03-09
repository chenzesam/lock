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
      callback: result => {
        if (result.toString() === lockPassword.toString()) {
          setIsLock(false);
        }
      }
    })
  }, [])
  return (
    <>
      <div ref={container} className='container' />
      <div>{isLock ? 'lock' : 'unlock' }</div>
    </>
  );
}

export default App;
