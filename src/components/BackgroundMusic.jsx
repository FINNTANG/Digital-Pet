import React, { useEffect, useRef, useState } from 'react';

const BackgroundMusic = ({ audioUrl }) => {
  const audioRef = useRef(null);
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
              .catch(error => {
                console.error("Play failed:", error);
              });
          }
        } catch (error) {
          console.error("Play error:", error);
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
            .catch(error => {
              console.error("Play failed:", error);
            });
        }
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Toggle play error:", error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={togglePlay}
        className="bg-[#1a1a1a] p-2 border-2 border-white font-['Press_Start_2P'] text-xs text-white"
        style={{
          boxShadow: 'inset -2px -2px 0 0 #000, inset 2px 2px 0 0 #444'
        }}
      >
        {isPlaying ? 'SOUND ON' : 'SOUND OFF'}
      </button>
      <audio
        ref={audioRef}
        src={`/assets/background-music.mp3`}
        loop
        preload="auto"
        type="audio/mpeg"
      />
    </div>
  );
};

export default BackgroundMusic; 