import React, { useState, useEffect, useRef, useCallback } from 'react';
import petState from '../utils/petState.jsx';
import { getRandomDialogue } from '../utils/dialogueSystem.jsx';
import analyzeImage from '../utils/imageAnalysis.js';
import chatMessage from '../utils/chatGenerate.js';
import '../styles/Pet.css';
import { HintWindow } from './ui/hint';
import BackgroundMusic from './BackgroundMusic';

const DigitalPet = () => {
  const [dialogue, setDialogue] = useState(null);
  const [status, setStatus] = useState(petState.state);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [currentSprite, setCurrentSprite] = useState('');
  const [dialoguePosition, setDialoguePosition] = useState(() => {
    const initialX = (window.innerWidth - 500) / 2;
    const initialY = window.innerHeight - 400;
    return { x: initialX, y: initialY };
  });
  const [activeWindow, setActiveWindow] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [windowPositions, setWindowPositions] = useState({
    camera: { x: window.innerWidth / 2 - 400, y: window.innerHeight / 2 - 300 },
    chat: { x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 200 },
    hint: { x: window.innerWidth / 2 - 225, y: window.innerHeight / 2 - 175 },
    analysis: { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 250 }
  });
  const dialogueRef = useRef(null);
  const [showHint, setShowHint] = useState(false);
  const [cameraPosition, setCameraPosition] = useState(() => ({
    x: (window.innerWidth - 800) / 2, // 800是相机窗口的最大宽度
    y: 100, // 设置一个合适的初始Y位置
  }));
  const [cameraIsDragging, setCameraIsDragging] = useState(false);
  const [cameraDragOffset, setCameraDragOffset] = useState({ x: 0, y: 0 });
  const cameraRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef(new Audio('./background-music.mp3')); // 使用正确的文件路径
  const [draggedWindow, setDraggedWindow] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const [isTypingHint, setIsTypingHint] = useState(false);
  const [displayedHint, setDisplayedHint] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  // 修改提示信息为更简洁的版本
  const hintMessage = `[ DIGITAL PET GUIDE ]

❤️ Health & Mood
• Both stats decrease over time
• Keep them above 30% to avoid distress

🎮 Controls
• FEED - Show objects via camera
• TALK - Chat with your pet

💡 Tips
• Different items = Different reactions
• Regular chats = Happy pet
• Low stats = Sad expressions

Have fun with your new digital friend! ✨`;

  // 检查摄像头权限
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' });
        setCameraPermission(result.state);

        result.addEventListener('change', () => {
          setCameraPermission(result.state);
        });
      } catch (err) {
        console.log('Permission check not supported');
      }
    };

    checkCameraPermission();
  }, []);

  // 清理摄像头资源
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 修改状态更新速度
  useEffect(() => {
    const interval = setInterval(() => {
      petState.health = Math.max(0, petState.health - 1); // 每3秒降低1点健康值
      petState.happiness = Math.max(0, petState.happiness - 1); // 每3秒降低1点心情值
      petState.updateState();
      setStatus(petState.state);
    }, 3000); // 保持3秒的间隔

    return () => clearInterval(interval);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        streamRef.current = stream;
        setIsCameraActive(true);
        setShowCamera(true);
        setCapturedImage(null);

        // 修改这里：设置固定的初始位置
        const windowWidth = 1000;
        const mainContainer = document.querySelector('.pet-container');
        const mainRect = mainContainer.getBoundingClientRect();

        setCameraPosition({
          x: mainRect.left + (mainRect.width - windowWidth) / 2 + 150,
          y: 150, // 使用固定的 y 值，而不是相对于 mainRect.top 的值
        });
      }
    } catch (err) {
      console.error('摄像头启动失败:', err);
      alert('无法启动摄像头，请确保允许摄像头访问权限');
    }
  };

  const LoadingIndicator = () => (
    <div className="loading-indicator">
      <span className="thinking-emoji">🤔</span>
      <span>Thinking</span>
      <div className="loading-dots">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    </div>
  );

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    streamRef.current = null;
    setIsCameraActive(false);
    setShowCamera(false);
  };

  const captureImage = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageData);
      
      // 调用图像分析API
      try {
        const result = await analyzeImage(imageData);
        setAnalysisResult(result);
        setShowAnalysis(true);
      } catch (error) {
        console.error('图像分析失败:', error);
      }
    }
  };

  // 修改 typeMessage 函数
  const typeMessage = async (message) => {
    setIsTyping(true);
    let displayText = '';
    for (let i = 0; i < message.length; i++) {
      displayText += message[i];
      setDisplayedMessage(displayText);
      await new Promise((resolve) => setTimeout(resolve, 50)); // 控制打字速度
    }
    setIsTyping(false);
  };

  const handleChat = () => {
    setShowChat(true);
    const newDialogue = getRandomDialogue(petState.state);
    setDialogue(newDialogue);
    typeMessage(newDialogue.message);
  };

  const handleResponse = async (option) => {
    setIsWaitingResponse(true);
    const isSilent = option === '...';
    petState.interact(isSilent);
    try {
      const response = await chatMessage(
        petState.health,
        petState.happiness,
        option,
      );

      await typeMessage(response.message);

      setDialogue({
        message: response.message,
        options: [
          ...response.options,
          "I'm sorry, I can't keep you company right now",
        ],
      });

      // 添加值的限制
      petState.health = Math.min(
        100,
        Math.max(0, petState.health + response.health),
      );
      petState.happiness = Math.min(
        100,
        Math.max(0, petState.happiness + response.mood),
      );
      setStatus(petState.state);
    } catch (error) {
      console.error('Conversation generation failed:', error);
      setDisplayedMessage("Sorry, I'm a bit tired right now...");
    } finally {
      setIsWaitingResponse(false);
    }
  };

  const getPetSprite = () => {
    // 根据状态和心情值选择不同表情
    if (petState.health < 30 || petState.happiness < 30) {
      return ['(´;ω;`)', '(╥﹏╥)', '(｡•́︿•̀｡)', '(っ˘̩╭╮˘̩)っ'][
        Math.floor(Math.random() * 4)
      ];
    }

    switch (status) {
      case 'happy':
        return ['(｡◕‿◕｡)', '(◕‿◕✿)', '(◠‿◠)', '(＾▽＾)', '(◍•ᴗ•◍)'][
          Math.floor(Math.random() * 5)
        ];
      case 'sad':
        return ['(´･_･`)', '(｡•́︿•̀｡)', '(｡╯︵╰｡)', '(っ- ‸ – ς)'][
          Math.floor(Math.random() * 4)
        ];
      case 'sick':
        return ['(；一_一)', '(￣ヘ￣)', '(-.-)Zzz...', '(。-ω-)'][
          Math.floor(Math.random() * 4)
        ];
      case 'dead':
        return ['(×_×)', '(✖╭╮✖)', '(╯︵╰,)', '(︶︹︺)'][
          Math.floor(Math.random() * 4)
        ];
      default:
        return ['(・∀・)', '(｡♥‿♥｡)', '(◕ᴗ◕✿)', '(◠‿◠✿)', '(◕‿◕)'][
          Math.floor(Math.random() * 5)
        ];
    }
  };

  useEffect(() => {
    setCurrentSprite(getPetSprite());
  }, [status, petState.health, petState.happiness]);

  // 在组件顶部添加装饰点生成函数
  const generatePixelDots = () => {
    const dots = [];
    for (let i = 0; i < 50; i++) {
      const style = {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        '--float-duration': `${3 + Math.random() * 2}s`,
        '--float-delay': `-${Math.random() * 2}s`,
      };
      dots.push(<div key={i} className="pixel-dot" style={style} />);
    }
    return dots;
  };

  // 修改拖拽相关的状态和逻辑
  const handleMouseDown = (e, windowType) => {
    // 只有点击工具栏才能拖动
    if (e.target.closest('.window-close')) {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedWindow(windowType);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // 存储初始位置
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top
    };
  };

  const handleMouseMove = useCallback((e) => {
    if (draggedWindow && dragRef.current) {
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      
      // 添加边界限制
      const newX = Math.max(0, Math.min(window.innerWidth - 400, dragRef.current.initialLeft + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - 300, dragRef.current.initialTop + deltaY));
      
      setWindowPositions(prev => ({
        ...prev,
        [draggedWindow]: {
          x: newX,
          y: newY
        }
      }));
    }
  }, [draggedWindow]);

  const handleMouseUp = useCallback(() => {
    setDraggedWindow(null);
    dragRef.current = null;
  }, []);

  // 确保关闭按钮正常工作
  const handleClose = (windowType) => {
    if (windowType === 'camera') {
      stopCamera();
      setShowCamera(false);
    } else if (windowType === 'chat') {
      setShowChat(false);
    } else if (windowType === 'hint') {
      setShowHint(false);
    } else if (windowType === 'analysis') {
      setShowAnalysis(false);
    }
    // 清除该窗口的位置信息
    setWindowPositions(prev => ({
      ...prev,
      [windowType]: {
        x: window.innerWidth / 2 - (windowType === 'camera' ? 400 : windowType === 'chat' ? 250 : windowType === 'hint' ? 225 : 150),
        y: window.innerHeight / 2 - (windowType === 'camera' ? 300 : windowType === 'chat' ? 200 : windowType === 'hint' ? 175 : 250)
      }
    }));
  };

  // 添加和移除事件监听器
  useEffect(() => {
    if (draggedWindow) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedWindow, handleMouseMove, handleMouseUp]);

  // 添加窗口大小变化的监听
  useEffect(() => {
    const handleResize = () => {
      // 当窗口大小改变时，重新计算对话框位置，保持在底部中间
      setDialoguePosition((prev) => ({
        x: (window.innerWidth - 500) / 2,
        y: window.innerHeight - 400,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 优化音频控制函数
  const toggleSound = useCallback(() => {
    const audio = audioRef.current;
    
    if (!soundEnabled) {
      // 添加用户交互检查
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // 播放成功
            console.log('Audio started playing');
          })
          .catch(error => {
            console.error('Audio playback failed:', error);
            // 重置状态
            setSoundEnabled(false);
          });
      }
    } else {
      audio.pause();
    }
    setSoundEnabled(!soundEnabled);
  }, [soundEnabled]);

  // 初始化音频设置
  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;
    audio.volume = 0.5; // 设置适当的音量
    
    // 添加音频加载事件监听
    const handleCanPlay = () => {
      console.log('Audio can play');
      if (soundEnabled) {
        audio.play().catch(console.error);
      }
    };
    
    audio.addEventListener('canplay', handleCanPlay);
    
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  // 监听音频状态变化
  useEffect(() => {
    const audio = audioRef.current;
    
    if (soundEnabled) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Audio playback failed:', error);
          setSoundEnabled(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [soundEnabled]);

  // 添加打字机效果的函数
  const typeHintMessage = useCallback(async (message) => {
    setIsTypingHint(true);
    setDisplayedHint('');
    
    for (let i = 0; i < message.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      setDisplayedHint(prev => prev + message[i]);
    }
    setIsTypingHint(false);
  }, []);

  // 修改显示提示的处理函数
  const handleShowHint = () => {
    setShowHint(true);
    typeHintMessage(hintMessage);
  };

  return (
    <div className="w-full h-full relative">
      {/* 状态条 */}
      <div className="status-container">
        <div className={`status-bar health-bar ${petState.health < 30 ? 'warning' : ''}`}>
          <div className="status-icon health-icon"></div>
          <div className="progress-container">
            <div 
              className="progress health-progress"
              style={{
                width: `${Math.min(100, Math.max(0, petState.health))}%`
              }}
            />
            <span className="progress-text">{`${Math.round(petState.health)}%`}</span>
          </div>
        </div>
        <div className={`status-bar happiness-bar ${petState.happiness < 30 ? 'warning' : ''}`}>
          <div className="status-icon happiness-icon"></div>
          <div className="progress-container">
            <div 
              className="progress happiness-progress"
              style={{
                width: `${Math.min(100, Math.max(0, petState.happiness))}%`
              }}
            />
            <span className="progress-text">{`${Math.round(petState.happiness)}%`}</span>
          </div>
        </div>
      </div>

      {/* 宠物显示框 */}
      <div className="flex justify-center items-center min-h-screen">
        <div className="pet-window">
          <div className="window-toolbar">
            <span className="window-title">REALITYEATER.EXE</span>
            <button className="window-close">×</button>
          </div>
          <div className="pet-content">
            <div className={`pet-face ${status}`}>
              {currentSprite}
            </div>
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
        <button 
          className="control-button feed-button" 
          onClick={() => {
            if (!showCamera) {  // 添加条件检查
              setShowCamera(true);
              startCamera();
            }
          }}
        >
          FEED
        </button>
        <button 
          className="control-button talk-button" 
          onClick={() => {
            if (!showChat) {  // 添加条件检查
              handleChat();
            }
          }}
        >
          TALK
        </button>
        <button 
          className="control-button hint-button" 
          onClick={() => {
            if (!showHint) {  // 添加条件检查
              handleShowHint();
            }
          }}
        >
          HINT
        </button>
      </div>

      {/* 音频控制按钮 */}
      <div className="absolute bottom-4 right-4">
        <button 
          className={`sound-toggle ${soundEnabled ? 'on' : 'off'}`}
          onClick={toggleSound}
        >
          <div className="toggle-slider"></div>
        </button>
      </div>

      {/* 相机窗口 */}
      {showCamera && (
        <div 
          className="camera-window"
          style={{
            left: `${windowPositions.camera.x}px`,
            top: `${windowPositions.camera.y}px`,
            position: 'fixed'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'camera')}
        >
          <div className="window-toolbar">
            <span className="window-title">CAMERA.EXE</span>
            <button 
              className="window-close"
              onClick={(e) => {
                e.stopPropagation();
                handleClose('camera');
              }}
            >×</button>
          </div>
          <div className="camera-content">
            <video ref={videoRef} autoPlay playsInline />
            <button className="take-photo-btn" onClick={captureImage}>
              Take Photo
            </button>
          </div>
        </div>
      )}

      {/* 聊天窗口 */}
      {showChat && (
        <div 
          className="chat-window"
          style={{
            left: `${windowPositions.chat.x}px`,
            top: `${windowPositions.chat.y}px`,
            position: 'fixed'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'chat')}
        >
          <div className="window-toolbar">
            <span className="window-title">CHAT.EXE</span>
            <button 
              className="window-close"
              onClick={(e) => {
                e.stopPropagation();
                handleClose('chat');
              }}
            >×</button>
          </div>
          <div className="chat-content">
            <div className="chat-message">{displayedMessage}</div>
            {dialogue && dialogue.options && (
              <div className="chat-options">
                {dialogue.options.map((option, index) => (
                  <button 
                    key={index} 
                    className="chat-option"
                    onClick={() => handleResponse(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 提示窗口 */}
      {showHint && (
        <div 
          className="hint-window"
          style={{
            left: `${windowPositions.hint.x}px`,
            top: `${windowPositions.hint.y}px`,
            position: 'fixed'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'hint')}
        >
          <div className="window-toolbar">
            <span className="window-title">HINT.EXE</span>
            <button 
              className="window-close"
              onClick={(e) => {
                e.stopPropagation();
                handleClose('hint');
              }}
            >×</button>
          </div>
          <div className="hint-content">
            <pre className="hint-text">{displayedHint}</pre>
          </div>
        </div>
      )}

      {showAnalysis && analysisResult && (
        <div 
          className="analysis-window"
          style={{
            left: `${windowPositions.analysis.x}px`,
            top: `${windowPositions.analysis.y}px`,
            position: 'fixed'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'analysis')}
        >
          <div className="window-toolbar">
            <span className="window-title">ANALYSIS.EXE</span>
            <button 
              className="window-close"
              onClick={(e) => {
                e.stopPropagation();
                setShowAnalysis(false);
              }}
            >×</button>
          </div>
          <div className="analysis-content">
            <img src={capturedImage} alt="Captured" className="analysis-image" />
            <div className="analysis-result">
              {analysisResult.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalPet;
