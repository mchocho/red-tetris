import React from 'react';
import './css/index.css';
import 'nes.css/css/nes.min.css';

import Menu from './components/menu'; 
import Game from './components/game'; 
import Pause from './components/pause'; 
import GameOver from './components/gameOver'; 
import Winner from './components/winner'; 
import Loading from './components/loading'; 
import Error from './components/error'; 
import Multiplayer from './components/multiplayer'; 
import Controls from './components/controls'; 
import Settings from './components/settings'; 
import GameManager from './js/manager';

function App() {
  window.DEV = true;
  window.EVENTS = true;
  window.COLLISION = true;

  const gameManager = GameManager();

  document.addEventListener('DOMContentLoaded', gameManager.onReady(gameManager))

  return (
    <div className="App">
      <Menu />
      <Loading />
      <Multiplayer />
      <Settings />
      <Controls />
      <Error />
      <Pause />
      <GameOver />
      <Winner />
      <Game />

    </div>
  );
}

export default App;
