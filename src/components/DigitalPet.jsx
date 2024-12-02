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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dialogueRef = useRef(null);
  const [showHint, setShowHint] = useState(false);
  const [cameraPosition, setCameraPosition] = useState(() => ({
    x: (window.innerWidth - 800) / 2, // 800是相机窗口的最大宽度
    y: 100, // 设置一个合适的初始Y位置
  }));
  const [cameraIsDragging, setCameraIsDragging] = useState(false);
  const [cameraDragOffset, setCameraDragOffset] = useState({ x: 0, y: 0 });
  const cameraRef = useRef(null);

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
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);

    const imageDataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageDataUrl);
    stopCamera();

    // 添加加载状态
    setIsAnalyzing(true);

    try {
      const analysis = await analyzeImage(imageDataUrl);
      setAnalysisResult(analysis);

      // 添加值的限制
      petState.health = Math.min(
        100,
        Math.max(0, petState.health + analysis.healthEffect),
      );
      petState.happiness = Math.min(
        100,
        Math.max(0, petState.happiness + analysis.moodEffect),
      );
      petState.updateState();
      setStatus(petState.state);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisResult('Sorry, I can not recognize this item');
    } finally {
      setIsAnalyzing(false);
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

  // 添加拖动处理函数
  const handleMouseDown = (e) => {
    if (dialogueRef.current) {
      const rect = dialogueRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;

        // 确保对话框不会被拖出视口
        const maxX =
          window.innerWidth - (dialogueRef.current?.offsetWidth || 0);
        const maxY =
          window.innerHeight - (dialogueRef.current?.offsetHeight || 0);

        setDialoguePosition({
          x: Math.max(0, Math.min(x, maxX)),
          y: Math.max(0, Math.min(y, maxY)),
        });
      }
    },
    [isDragging, dragOffset],
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 添加事件监听器
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

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

  // 添加相机窗口拖拽处理函数
  const handleCameraMouseDown = (e) => {
    if (cameraRef.current) {
      const rect = cameraRef.current.getBoundingClientRect();
      setCameraDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setCameraIsDragging(true);
    }
  };

  const handleCameraMouseMove = useCallback(
    (e) => {
      if (cameraIsDragging) {
        const x = e.clientX - cameraDragOffset.x;
        const y = e.clientY - cameraDragOffset.y;

        // 确保窗口不会被拖出视口
        const maxX = window.innerWidth - (cameraRef.current?.offsetWidth || 0);
        const maxY =
          window.innerHeight - (cameraRef.current?.offsetHeight || 0);

        setCameraPosition({
          x: Math.max(0, Math.min(x, maxX)),
          y: Math.max(0, Math.min(y, maxY)),
        });
      }
    },
    [cameraIsDragging, cameraDragOffset],
  );

  const handleCameraMouseUp = () => {
    setCameraIsDragging(false);
  };

  // 添加相机拖拽事件监听器
  useEffect(() => {
    if (cameraIsDragging) {
      window.addEventListener('mousemove', handleCameraMouseMove);
      window.addEventListener('mouseup', handleCameraMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleCameraMouseMove);
      window.removeEventListener('mouseup', handleCameraMouseUp);
    };
  }, [cameraIsDragging, handleCameraMouseMove]);

  return (
    <>
      <BackgroundMusic audioUrl="/music.mp3" />
      <div className="pixel-dots">{generatePixelDots()}</div>
      <HintWindow
        message={hintMessage}
        isOpen={showHint}
        onClose={() => setShowHint(false)}
      />
      <div className="pet-container">
        <div className="status-bar">
          <div className="status-indicator">
            <div className="status-header">
              <span className="status-label">Health</span>
            </div>
            <div className="progress-container">
              <div
                className={`progress-bar health ${
                  petState.health < 30 ? 'warning' : ''
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, petState.health))}%`,
                }}
              >
                <span className="progress-value">
                  {Math.round(petState.health)}%
                </span>
              </div>
            </div>
          </div>

          <div className="status-indicator">
            <div className="status-header">
              <span className="status-label">Happiness</span>
            </div>
            <div className="progress-container">
              <div
                className={`progress-bar happiness ${
                  petState.happiness < 30 ? 'warning' : ''
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, petState.happiness))}%`,
                }}
              >
                <span className="progress-value">
                  {Math.round(petState.happiness)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pet-display">
          <div className="window-toolbar">
            <div className="toolbar-title">REALITYEATER.EXE</div>
            <span className="window-controls">─ □ ×</span>
          </div>
          <div
            className={`mt-8 mb-8 text-8xl text-center pet-sprite ${status}`}
          >
            {currentSprite}
          </div>

          {/* 宠物对话窗口 */}
        </div>
        {showChat ? (
          <div
            ref={dialogueRef}
            className={`pet-dialogue-bubble ${isDragging ? 'dragging' : ''}`}
            style={{
              display: showChat ? 'block' : 'none',
              left: `${dialoguePosition.x}px`,
              top: `${dialoguePosition.y}px`,
            }}
          >
            <div className="dialogue-toolbar" onMouseDown={handleMouseDown}>
              <div className="dialogue-title">CHAT.EXE</div>
              <button
                className="dialogue-close"
                onClick={() => setShowChat(false)}
              >
                ×
              </button>
            </div>
            <div className="dialogue-content">
              {isWaitingResponse ? (
                <LoadingIndicator />
              ) : (
                <p className="typing-text">
                  {displayedMessage}
                  {isTyping && <span className="cursor">|</span>}
                </p>
              )}
            </div>

            {showChat && dialogue && !isTyping && (
              <div className="response-options">
                {dialogue.options.map((option, index) => (
                  <button
                    key={index}
                    className="response-button"
                    onClick={() => handleResponse(option)}
                    disabled={isWaitingResponse}
                  >
                    <span className="response-arrow">►</span>
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* 摄像头区域 */}
        <div
          className="camera-section"
          style={{
            display: showCamera ? 'block' : 'none',
            position: 'fixed',
            left: `${cameraPosition.x}px`,
            top: `${cameraPosition.y}px`,
            zIndex: 1000,
          }}
          ref={cameraRef}
        >
          <div className="camera-window">
            <div
              className="window-toolbar"
              onMouseDown={handleCameraMouseDown}
              style={{ cursor: 'grab' }}
            >
              <div className="toolbar-title">CAMERA.EXE</div>
              <button
                className="window-close"
                onClick={() => {
                  stopCamera();
                  setShowCamera(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="camera-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                }}
              />
              {isCameraActive && (
                <button className="capture-button" onClick={captureImage}>
                  Take Photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 已拍摄的图片分析窗口 */}
        {capturedImage && (
          <div className="analysis-window">
            <div className="window-toolbar">
              <div className="toolbar-title">ANALYSIS.EXE</div>
              <button
                className="window-close"
                onClick={() => {
                  setCapturedImage(null);
                  setAnalysisResult('');
                }}
              >
                ×
              </button>
            </div>
            <div className="analysis-content">
              <div className="captured-image-container">
                <div className="captured-image">
                  <img
                    src={capturedImage}
                    alt="captured"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                <div
                  className={`analysis-result ${
                    isAnalyzing ? 'analyzing' : ''
                  }`}
                >
                  {isAnalyzing ? (
                    <div className="analyzing-status">
                      <div className="loading-dots">
                        <span>Analyzing</span>
                        <span className="dots">...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="result-content">
                      {analysisResult.result ? (
                        <>
                          <div className="result-item">
                            <span className="label">Recognize objects:</span>
                            <span className="value">{analysisResult.name}</span>
                          </div>
                          <div className="result-item">
                            <span className="label">Reaction:</span>
                            <span
                              className={`value ${
                                analysisResult.isLike ? 'positive' : 'negative'
                              }`}
                            >
                              {analysisResult.isLike
                                ? 'Very interested！'
                                : 'Not very interested...'}
                            </span>
                          </div>
                          <div className="result-item">
                            <span className="label">Reason:</span>
                            <span className="value reason">
                              {analysisResult.reason}
                            </span>
                          </div>
                          {/* 添加心情和健康效果显示 */}
                          <div className="result-item">
                            <span className="label">Reaction:</span>
                            <div className="effects">
                              {analysisResult.moodEffect !== 0 && (
                                <span
                                  className={`effect ${
                                    analysisResult.moodEffect > 0
                                      ? 'positive'
                                      : 'negative'
                                  }`}
                                >
                                  Happiness{' '}
                                  {analysisResult.moodEffect > 0 ? '+' : ''}
                                  {analysisResult.moodEffect}
                                </span>
                              )}
                              {analysisResult.healthEffect !== 0 && (
                                <span
                                  className={`effect ${
                                    analysisResult.healthEffect > 0
                                      ? 'positive'
                                      : 'negative'
                                  }`}
                                >
                                  Health{' '}
                                  {analysisResult.healthEffect > 0 ? '+' : ''}
                                  {analysisResult.healthEffect}
                                </span>
                              )}
                              {analysisResult.moodEffect === 0 &&
                                analysisResult.healthEffect === 0 && (
                                  <span className="effect neutral">
                                    no effect
                                  </span>
                                )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="error-message">
                          Sorry, recognition failed... (｡•́︿•̀｡)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 控按钮 */}
        <div className="control-buttons">
          <button
            className="control-button feed-button"
            onClick={isCameraActive ? stopCamera : startCamera}
            disabled={cameraPermission === 'denied'}
          >
            <span className="camera-icon"></span>
            {isCameraActive ? 'CLOSE CAMERA' : 'FEED'}
          </button>
          <button className="control-button talk-button" onClick={handleChat}>
            <span className="chat-icon"></span>
            TALK
          </button>
          <button
            className="control-button hint-button"
            onClick={() => setShowHint(true)}
          >
            <span className="hint-icon"></span>
            HINT
          </button>
        </div>

        {/* 摄像头权限被拒绝的示 */}
        {cameraPermission === 'denied' && (
          <div className="relative px-4 py-3 text-red-700 bg-red-100 rounded border border-red-400">
            <span>
              Camera access is blocked. Please allow camera access in your
              browser settings.
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default DigitalPet;
