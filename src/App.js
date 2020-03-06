import React, { useRef, useEffect } from 'react';
import './App.css';
import Lock from './lock';

function App() {
  const container = useRef(null);
  const lock = useRef(null);
  useEffect(() => {
    lock.current = new Lock({
      container: container.current
    })
  })
  return (
    <div ref={container} className='container'>

    </div>
  );
}

export default App;
