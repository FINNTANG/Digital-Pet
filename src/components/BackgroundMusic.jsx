import React, { useEffect, useRef, useState } from 'react';

const BackgroundMusic = ({ audioUrl }) => {
  const audioRef = useRef(document.getElementById('backgroundMusic'));
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.load();
      audio.volume = 0.2;

      const handleCanPlayThrough = () => {
        console.log('Audio can play through');
      };

      const handleError = (e) => {
        console.error('Audio error:', e);
      };

      audio.addEventListener('canplaythrough', handleCanPlayThrough);
      audio.addEventListener('error', handleError);

      const handleFirstInteraction = () => {
        try {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                console.log('Audio started playing');
                document.removeEventListener('click', handleFirstInteraction);
              })
              .catch((error) => {
                console.error('Play failed:', error);
              });
          }
        } catch (error) {
          console.error('Play error:', error);
        }
      };

      document.addEventListener('click', handleFirstInteraction);

      return () => {
        audio.removeEventListener('canplaythrough', handleCanPlayThrough);
        audio.removeEventListener('error', handleError);
        document.removeEventListener('click', handleFirstInteraction);
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error('Play failed:', error);
            });
        }
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Toggle play error:', error);
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <button
        onClick={togglePlay}
        className="bg-[#1a1a1a] px-4 py-2 border-2 border-white font-['Press_Start_2P'] text-xs text-white"
        style={{
          boxShadow: 'inset -2px -2px 0 0 #000, inset 2px 2px 0 0 #444'
        }}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400' : 'bg-red-400'}`} />
          {isPlaying ? 'SOUND ON' : 'SOUND OFF'}
        </div>
      </button>
    </div>
  );
};

export default BackgroundMusic;
