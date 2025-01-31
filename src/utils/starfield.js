// 调整粒子生成
function createStarfield() {
  const container = document.createElement('div');
  container.className = 'starfield-container';
  
  // 减少粒子数量
  const numberOfParticles = Math.floor((window.innerWidth * window.innerHeight) / 10000); // 降低密度
  
  for (let i = 0; i < numberOfParticles; i++) {
    const particle = document.createElement('div');
    particle.className = 'pixel-dot';
    
    // 随机位置
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    // 降低亮度
    particle.style.opacity = `${Math.random() * 0.05}`; // 大幅降低最大不透明度到0.05
    
    // 随机动画延迟
    particle.style.setProperty('--float-delay', `-${Math.random() * 4}s`);
    particle.style.setProperty('--float-duration', `${4 + Math.random() * 2}s`);
    
    container.appendChild(particle);
  }
  
  document.body.appendChild(container);
}

export default createStarfield; 