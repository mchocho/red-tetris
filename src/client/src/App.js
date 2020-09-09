import React from 'react';
// import logo from './logo.svg';
import 'nes.css/css/nes.min.css';

import GameView from './components/game'; 
import Error from './components/error'; 
import Game from './components/game'; 
import GameOver from './components/gameOver'; 
import Winner from './components/winner'; 
import Loading from './components/loading'; 
import Menu from './components/menu'; 
import Multiplayer from './components/multiplayer'; 
import Settings from './components/settings'; 
import GameManager from './js/manager';

window.DEV = true;
window.EVENTS = true;
window.COLLISION = true;

function App() {

  const gameManager = GameManager();

  document.addEventListener('DOMContentLoaded', gameManager.onReady(gameManager))

  // console.log(gameManager);

  return (
    <div className="App">
      <Menu />
      <Loading />
      <Multiplayer />
      <Settings />
      <Error />
      <GameOver />
      <Winner />
      <GameView />

    </div>
  );
}

export default App;
