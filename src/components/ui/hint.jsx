import React, { useState, useEffect, useRef } from 'react';

export function HintWindow({ message, isOpen, onClose }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const hintRef = useRef(null);

  // 现有的打字效果
  useEffect(() => {
    if (isOpen && currentIndex < message.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + message[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, isOpen, message]);

  useEffect(() => {
    if (isOpen) {
      setDisplayedText('');
      setCurrentIndex(0);
      // 设置初始位置在屏幕中央
      setPosition({
        x: (window.innerWidth - 500) / 2,
        y: (window.innerHeight - 400) / 2
      });
    }
  }, [isOpen]);

  // 拖拽处理函数
  const handleMouseDown = (e) => {
    if (hintRef.current) {
      const rect = hintRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      
      // 确保窗口不会被拖出视口
      const maxX = window.innerWidth - (hintRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (hintRef.current?.offsetHeight || 0);
      
      setPosition({
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 添加和移除事件监听器
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div 
        ref={hintRef}
        className={`w-[80%] max-w-[500px] relative bg-[#1a1a1a] border-2 border-white ${isDragging ? 'dragging' : ''}`}
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 0 2px #fff, 0 0 0 4px #000, 0 0 0 5px rgba(255, 255, 255, 0.3)',
          cursor: isDragging ? 'grabbing' : 'auto'
        }}
      >
        <div 
          className="h-8 bg-[#2c2c2c] border-b-2 border-white flex items-center justify-between px-2"
          onMouseDown={handleMouseDown}
          style={{ cursor: 'grab' }}
        >
          <div 
            className="text-white text-xs font-['Press_Start_2P'] px-2 py-1 bg-[#1a1a1a] border border-white"
            style={{
              boxShadow: 'inset -1px -1px 0 0 rgba(0, 0, 0, 0.3), inset 1px 1px 0 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            HINT.EXE
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-500 font-['Press_Start_2P'] px-2"
          >
            ×
          </button>
        </div>
        <div 
          className="p-6 font-['Press_Start_2P'] text-xs whitespace-pre-wrap leading-relaxed"
          style={{
            background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)',
            textShadow: '0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)'
          }}
        >
          {displayedText.split('\n').map((line, index) => {
            if (line.startsWith('[')) {
              return <div key={index} className="text-cyan-400 font-bold mb-4">{line}</div>;
            } else if (line.startsWith('•')) {
              return <div key={index} className="text-gray-300 ml-4 mb-2">{line}</div>;
            } else if (line.startsWith('❤️') || line.startsWith('🎮') || line.startsWith('💡')) {
              return <div key={index} className="text-yellow-400 font-bold mt-4 mb-2">{line}</div>;
            } else if (line.includes('✨')) {
              return <div key={index} className="text-green-400 mt-4 text-center">{line}</div>;
            } else {
              return <div key={index} className="text-white mb-2">{line}</div>;
            }
          })}
          <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-blink"></span>
        </div>
      </div>
    </div>
  );
} 