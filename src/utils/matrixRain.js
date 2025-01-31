function initMatrixRain() {
  const canvas = document.createElement('div');
  canvas.className = 'matrix-container';
  document.body.appendChild(canvas);

  // 字符集
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()';

  // 创建多个雨滴列
  function createRainDrop() {
    const character = document.createElement('div');
    character.className = 'matrix-character';
    character.textContent = chars[Math.floor(Math.random() * chars.length)];
    
    const x = Math.random() * window.innerWidth;
    const duration = 3 + Math.random() * 2;
    
    character.style.left = `${x}px`;
    character.style.animationDuration = `${duration}s`;
    
    const brightness = Math.random();
    if (brightness < 0.05) {
        character.classList.add('bright');
    } else if (brightness < 0.3) {
        character.classList.add('medium');
    } else {
        character.classList.add('dim');
    }

    canvas.appendChild(character);

    character.addEventListener('animationend', () => {
        canvas.removeChild(character);
    });
  }

  // 持续创建新的雨滴
  function rain() {
    const rainDrops = Math.floor(window.innerWidth / 12);
    for (let i = 0; i < rainDrops; i++) {
        setTimeout(createRainDrop, Math.random() * 300);
    }
  }

  // 更频繁地创建新的雨滴
  setInterval(rain, 100);
}

export default initMatrixRain; 