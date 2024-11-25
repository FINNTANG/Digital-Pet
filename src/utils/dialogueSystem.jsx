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
