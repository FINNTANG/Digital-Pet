const dialogueOptions = {
  happy: [
    {
      message: 'Master, today do you want to eat first, bathe, or eat me?',
      options: [
        'Feed you!',
        'Cuddle you!',
        'Sleep?',
        '...'
      ]
    },
    {
      message: 'Hey, master, should I be fed or cuddled first?',
      options: [
        'Cuddle you!',
        'Debug?',
        'Playtime!',
        '...'
      ]
    }
  ],
  sad: [
    {
      message: 'Am I full today, or should I keep eating you?',
      options: [
        'Hug you!',
        'Fix bug',
        'Restart',
        '...'
      ]
    },
    {
      message: 'Do not forget, master! I am more fun than TV!',
      options: [
        'Lets watch together!',
        'Tell me a joke!',
        'Format',
        '...'
      ]
    }
  ],
  sick: [
    {
      message: 'Do you want to be my meal, or my snack?',
      options: [
        'Heal you!',
        'Play doctor!',
        'Sleep!',
        '...'
      ]
    },
    {
      message: 'CPU fever: 404°F',
      options: [
        'Cool',
        'Fix',
        'Rest',
        '...'
      ]
    }
  ],
  dead: [
    {
      message: 'FATAL ERROR: existence.exe',
      options: [
        'Revive',
        'Reset',
        'RIP',
        '...'
      ]
    }
  ]
};

export const getRandomDialogue = (petState) => {
  const stateDialogues = dialogueOptions[petState] || dialogueOptions.happy;
  return stateDialogues[Math.floor(Math.random() * stateDialogues.length)];
};

export const showErrorMessage = (error) => {
  const errorMessages = {
    'camera-error': '无法访问相机，请检查权限设置',
    'network-error': '网络连接出现问题，请稍后重试',
    'image-processing-error': '图片处理失败，请重试',
    'file-too-large': '图片文件过大，请选择小于5MB的图片',
    'invalid-format': '不支持的图片格式，请使用 JPG 或 PNG 格式',
    'unknown-error': '发生未知错误，请刷新页面重试'
  };

  // 获取友好的错误消息
  const message = errorMessages[error.type] || errorMessages['unknown-error'];
  
  // 创建错误提示元素
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message-popup';
  errorDiv.textContent = message;
  
  // 添加到页面
  document.body.appendChild(errorDiv);
  
  // 3秒后自动移除
  setTimeout(() => {
    errorDiv.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(errorDiv);
    }, 300);
  }, 3000);
};
