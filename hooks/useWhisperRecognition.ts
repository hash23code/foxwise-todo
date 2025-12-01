import { useState, useRef, useCallback } from 'react';

interface WhisperRecognitionHook {
  isRecording: boolean;
  transcript: string;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
  isProcessing: boolean;
}

interface UseWhisperRecognitionOptions {
  language?: string;
  onTranscript?: (text: string) => void;
}

export function useWhisperRecognition(options: UseWhisperRecognitionOptions = {}): WhisperRecognitionHook {
  const { language = 'auto', onTranscript } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Media recording not supported in this browser');
      return;
    }

    try {
      setError(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Use webm format with opus codec (widely supported and good quality)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Clean up audio analysis resources
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;

        if (audioChunksRef.current.length === 0) {
          setError('No audio data recorded');
          setIsRecording(false);
          return;
        }

        // Create blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Send to Whisper API
        try {
          setIsProcessing(true);

          const formData = new FormData();
          // Convert to file format Whisper expects
          const audioFile = new File([audioBlob], 'recording.webm', { type: mimeType });
          formData.append('audio', audioFile);

          // Only send language if not auto-detect
          if (language && language !== 'auto') {
            // Convert language codes: fr-CA -> fr, en-US -> en
            const langCode = language.split('-')[0];
            formData.append('language', langCode);
          }

          const response = await fetch('/api/speech-to-text', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to transcribe audio');
          }

          const data = await response.json();

          // Validate transcription - must have at least 3 characters and not be just noise/numbers
          const transcribedText = data.text?.trim() || '';
          const isValidTranscription = transcribedText.length >= 3 && /[a-zA-ZÀ-ÿ]{2,}/.test(transcribedText);

          if (data.text && isValidTranscription) {
            setTranscript(data.text);
            if (onTranscript) {
              onTranscript(data.text);
            }
          } else {
            console.log('[Whisper] Transcription rejected (too short or noise):', transcribedText);
            setError('Transcription trop courte ou bruit ambiant détecté');
          }
        } catch (err: any) {
          console.error('Error transcribing audio:', err);
          setError(err.message || 'Failed to transcribe audio');
        } finally {
          setIsProcessing(false);
          setIsRecording(false);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Set up silence detection using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Silence detection threshold (0-255) - increased to avoid ambient noise
      const SILENCE_THRESHOLD = 15; // Increased from 5 to reduce false positives
      const SILENCE_DURATION = 2000; // 2 seconds of silence

      const checkAudioLevel = () => {
        if (!analyserRef.current || !mediaRecorderRef.current) return;

        analyser.getByteTimeDomainData(dataArray);

        // Calculate RMS (root mean square) to detect volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const volume = rms * 100;

        // If speaking (above threshold), reset silence timer
        if (volume > SILENCE_THRESHOLD) {
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
        } else {
          // If silent and no timer running, start silence timer
          if (!silenceTimeoutRef.current) {
            silenceTimeoutRef.current = setTimeout(() => {
              console.log('[Whisper] Silence detected, stopping recording');
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
              }
            }, SILENCE_DURATION);
          }
        }

        // Continue checking
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      // Start monitoring audio level
      checkAudioLevel();

    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Failed to start recording');
      setIsRecording(false);
    }
  }, [isSupported, language, onTranscript]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();

      // Clean up audio analysis
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;

      // Note: isRecording will be set to false in the onstop handler
    }
  }, [isRecording]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isRecording,
    isProcessing,
    transcript,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported,
    error,
  };
}
