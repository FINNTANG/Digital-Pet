import React, { useEffect } from 'react';
import DigitalPet from './components/DigitalPet.jsx';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function App() {
  useEffect(() => {
    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // 创建相机
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 4, 21);

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('background-canvas').appendChild(renderer.domElement);

    // 创建控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;

    // 创建点的材质和几何体
    const pts = [];
    const sizes = [];
    const shift = [];

    // 生成更多但更小的星空点
    for (let i = 0; i < 40000; i++) {
      pts.push(new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * 0.5 + 9.5));
      sizes.push(Math.random() * 0.8 + 0.3);
      shift.push(
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 0.05,
        Math.random() * 0.5 + 0.2
      );
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    geometry.setAttribute("sizes", new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 4));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      color: 0x00ff66,
      opacity: 0.8
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      points.rotation.y += 0.0003;
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 窗口大小调整
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      document.getElementById('background-canvas').removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div id="background-canvas" className="fixed top-0 left-0 w-full h-full z-[-1]" />
      <DigitalPet />
    </div>
  );
}

export default App; 