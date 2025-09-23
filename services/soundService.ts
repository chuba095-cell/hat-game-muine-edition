// Инициализирует AudioContext один раз для повторного использования.
let audioContextInstance: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    if (audioContextInstance) {
        return audioContextInstance;
    }
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            audioContextInstance = new AudioContext();
            return audioContextInstance;
        }
    } catch (e) {
        console.error("Web Audio API is not supported in this browser");
    }
    return null;
}

/**
 * Эта функция должна быть вызвана один раз после взаимодействия с пользователем (например, клика),
 * чтобы разблокировать аудиоконтекст в браузерах со строгой политикой автовоспроизведения.
 */
export const unlockAudio = () => {
    const audioContext = getAudioContext();
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

/**
 * Воспроизводит звук правильного ответа.
 */
export const playCorrectSound = () => {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  // Убедимся, что контекст запущен
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Свойства звука: короткий, приятный "дзынь"
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Начальная громкость
  oscillator.frequency.setValueAtTime(900, audioContext.currentTime); // Начальная частота
  oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.05); // Легкое повышение тона

  // Запуск и планирование остановки
  oscillator.start(audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.15);
  oscillator.stop(audioContext.currentTime + 0.15);
};


/**
 * Воспроизводит звук окончания таймера.
 */
export const playTimerEndSound = () => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Свойства звука: резкий, цифровой сигнал
    oscillator.type = 'square';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);
    oscillator.stop(audioContext.currentTime + 0.2);
};

/**
 * Воспроизводит звук тиканья таймера.
 */
export const playTimerTickSound = () => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Короткий, четкий звук "тиканья"
    oscillator.type = 'triangle';
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);

    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.05);
    oscillator.stop(audioContext.currentTime + 0.05);
};

/**
 * Воспроизводит звук постановки на паузу.
 */
export const playPauseSound = () => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Пронзительный, нисходящий звук
    oscillator.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.15);
    oscillator.stop(audioContext.currentTime + 0.15);
};

/**
 * Воспроизводит звук снятия с паузы.
 */
export const playUnpauseSound = () => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Пронзительный, восходящий звук
    oscillator.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.15);
    oscillator.stop(audioContext.currentTime + 0.15);
};