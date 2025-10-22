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

          if (data.text) {
            setTranscript(data.text);
            if (onTranscript) {
              onTranscript(data.text);
            }
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

    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Failed to start recording');
      setIsRecording(false);
    }
  }, [isSupported, language, onTranscript]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
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
