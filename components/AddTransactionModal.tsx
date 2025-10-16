"use client";

import { useState, useRef, useEffect } from "react";
import { X, Mic, MicOff, Loader2, Plus, Upload, Image as ImageIcon, Trash2, Camera, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// GoogleGenerativeAI is now called from API route
import { createTransaction } from "@/lib/api/transactions";

// Helper function to get local date in YYYY-MM-DD format
const getLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

interface TransactionData {
  type: "income" | "expense" | "bills" | "debt_payment" | "savings";
  category: string;
  amount: number;
  description: string;
  date: string;
}

export default function AddTransactionModal({ isOpen, onClose, userId, onSuccess }: AddTransactionModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<"en-US" | "fr-FR">(() => {
    // Load saved language preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voiceInputLanguage');
      if (saved === 'fr-FR') return 'fr-FR';
    }
    return 'en-US';
  });
  const [useBrowserSpeechAPI, setUseBrowserSpeechAPI] = useState(false);
  const [recordingMethod, setRecordingMethod] = useState<'browser' | 'gemini'>('gemini');
  const [browserName, setBrowserName] = useState<string>('Unknown');

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState<TransactionData>({
    type: "expense",
    category: "",
    amount: 0,
    description: "",
    date: getLocalDateString(),
  });

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Save language preference when it changes
  const handleLanguageChange = (newLanguage: "en-US" | "fr-FR") => {
    setLanguage(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('voiceInputLanguage', newLanguage);
    }
  };

  useEffect(() => {
    // Detect browser name
    const detectBrowser = async () => {
      if (typeof window === 'undefined') return;

      const ua = navigator.userAgent;
      let detectedBrowser = 'Unknown';

      // Check for Brave first (has a special API)
      if ((navigator as any).brave && await (navigator as any).brave.isBrave?.()) {
        detectedBrowser = 'Brave';
      }
      // Check for Edge
      else if (ua.includes('Edg/') || ua.includes('Edge/')) {
        detectedBrowser = 'Edge';
      }
      // Check for Opera
      else if (ua.includes('OPR/') || ua.includes('Opera/')) {
        detectedBrowser = 'Opera';
      }
      // Check for Chrome (must be after Edge/Opera/Brave since they're Chromium-based)
      else if (ua.includes('Chrome/')) {
        detectedBrowser = 'Chrome';
      }
      // Check for Safari
      else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
        detectedBrowser = 'Safari';
      }
      // Check for Firefox
      else if (ua.includes('Firefox/')) {
        detectedBrowser = 'Firefox';
      }

      setBrowserName(detectedBrowser);
      console.log('[Voice Input] Detected browser:', detectedBrowser);
      console.log('[Voice Input] User Agent:', ua);
    };

    detectBrowser();

    // Only use Web Speech API on Chrome, Edge, and Safari (not Brave or other browsers)
    // Brave has issues with Web Speech API even though it's Chromium-based
    const shouldUseBrowserAPI = async () => {
      if (typeof window === 'undefined') return false;
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return false;

      const ua = navigator.userAgent;

      // Check if it's Brave - don't use browser API
      if ((navigator as any).brave && await (navigator as any).brave.isBrave?.()) {
        console.log('[Voice Input] Brave detected - using Gemini API instead of browser API');
        return false;
      }

      // Only allow Chrome, Edge, and Safari
      if (ua.includes('Edg/') || ua.includes('Edge/')) {
        console.log('[Voice Input] Edge detected - using free browser API');
        return true;
      } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
        console.log('[Voice Input] Safari detected - using free browser API');
        return true;
      } else if (ua.includes('Chrome/') && !ua.includes('Edg/') && !ua.includes('OPR/') && !ua.includes('Opera/')) {
        console.log('[Voice Input] Chrome detected - using free browser API');
        return true;
      }

      console.log('[Voice Input] Other Chromium browser detected - using Gemini API');
      return false;
    };

    shouldUseBrowserAPI().then(useBrowser => {
      if (useBrowser) {
        console.log('[Voice Input] Enabling Web Speech API');
        setUseBrowserSpeechAPI(true);
        setRecordingMethod('browser');

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language;
        recognitionRef.current.maxAlternatives = 1;
        console.log('[Voice Input] Web Speech API initialized with language:', language);

      recognitionRef.current.onresult = (event: any) => {
        console.log('Speech recognition result received');
        let finalText = '';
        let interimText = '';

        // Process all results
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }

        if (finalText) {
          console.log('Final transcript:', finalText);
          setTranscript(prev => (prev + ' ' + finalText).trim());
          setInterimTranscript(''); // Clear interim when we have final
        } else {
          console.log('Interim transcript:', interimText);
          // Update interim without affecting final transcript
          setInterimTranscript(interimText);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error, event);

        let errorMessage = 'Voice recognition error. ';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found. Please check your microphone.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
            break;
          case 'network':
            errorMessage = 'Web Speech API network error. This usually happens when the browser cannot connect to speech recognition servers. Try again or use Chrome/Edge.';
            break;
          default:
            errorMessage = `Error: ${event.error}. Please try again.`;
        }

        setError(errorMessage);
        setIsListening(false);
      };

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };
      } else {
        console.log('[Voice Input] Using Gemini API for transcription');
        setUseBrowserSpeechAPI(false);
        setRecordingMethod('gemini');
      }
    });

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [language]);

  const startListening = async () => {
    console.log('[Voice Input] startListening called with method:', recordingMethod);

    try {
      setTranscript("");
      setInterimTranscript("");
      setError("");
      setIsListening(true);

      if (recordingMethod === 'browser' && recognitionRef.current) {
        // Use browser's Web Speech API (free)
        console.log('[Voice Input] Using browser Web Speech API');
        console.log('[Voice Input] Requesting microphone permission...');
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[Voice Input] Starting speech recognition with language:', language);
        recognitionRef.current.start();
      } else {
        // Use MediaRecorder + Gemini API (fallback for unsupported browsers)
        console.log('[Voice Input] Using MediaRecorder + Gemini API');
        console.log('[Voice Input] Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[Voice Input] Microphone permission granted');

        audioChunksRef.current = [];

        // Create MediaRecorder with the best available format
        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/wav';

        console.log('[Voice Input] Using mime type:', mimeType);

        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
            console.log('[Voice Input] Audio chunk received, size:', event.data.size);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          console.log('[Voice Input] Recording stopped, processing audio...');
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log('[Voice Input] Audio blob created, size:', audioBlob.size);

          // Stop all audio tracks
          stream.getTracks().forEach(track => track.stop());

          // Convert to base64 and send to Gemini
          await transcribeWithGemini(audioBlob, mimeType);
        };

        mediaRecorderRef.current.start();
        console.log('[Voice Input] MediaRecorder started');
        setInterimTranscript('Recording... (Click stop when done)');
      }
    } catch (err: any) {
      console.error('[Voice Input] Error:', err);
      setIsListening(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Microphone access denied. Please allow microphone access in your browser settings.");
      } else {
        setError("Could not access microphone. Please check your microphone settings.");
      }
    }
  };

  const stopListening = async () => {
    console.log('[Voice Input] stopListening called');
    setIsListening(false);

    if (recordingMethod === 'browser' && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('[Voice Input] Error stopping recognition:', e);
      }
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
        console.log('[Voice Input] MediaRecorder stopped');
      } catch (e) {
        console.error('[Voice Input] Error stopping MediaRecorder:', e);
      }
    }
  };

  const transcribeWithGemini = async (audioBlob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setInterimTranscript('Transcribing with Gemini AI...');

    try {
      console.log('[Voice Input] Audio blob size:', audioBlob.size, 'bytes');
      console.log('[Voice Input] Converting audio to base64...');

      // Convert blob to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      console.log('[Voice Input] Base64 audio length:', base64Audio.length);
      console.log('[Voice Input] Sending audio to Gemini API...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout (increased from 30)

      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType,
          language,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Voice Input] Transcription error:', errorData);
        throw new Error(errorData.error || 'Transcription failed');
      }

      const result = await response.json();
      console.log('[Voice Input] Transcription result:', result);

      if (result.success && result.transcription) {
        setTranscript(result.transcription);
        setInterimTranscript('');
        console.log('[Voice Input] Transcription successful:', result.transcription);
      } else {
        throw new Error('Invalid transcription response');
      }
    } catch (err: any) {
      console.error('[Voice Input] Error transcribing audio:', err);
      if (err.name === 'AbortError') {
        setError('Transcription took too long. Try speaking for less than 10 seconds.');
      } else {
        setError(`Transcription failed: ${err.message}. Try using browser mode or check your internet connection.`);
      }
      setInterimTranscript('');
    } finally {
      setIsProcessing(false);
    }
  };

  const processVoiceInput = async (text: string) => {
    setIsProcessing(true);
    setError("");

    try {
      console.log("Starting AI processing for text:", text);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        // Call the API route instead of Gemini directly
        console.log("Sending request to API route...");
        const response = await fetch('/api/parse-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            language,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log("API response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API error:", errorData);
          throw new Error(errorData.error || errorData.details || 'API request failed');
        }

        const result = await response.json();
        console.log("Received response from API:", result);

        if (!result.success || !result.data) {
          throw new Error("Invalid API response format");
        }

        const parsed = result.data;
        console.log("Parsed transaction data:", parsed);

        // Update form with parsed data
        setFormData({
          type: parsed.type || "expense",
          category: parsed.category || "",
          amount: parseFloat(parsed.amount) || 0,
          description: parsed.description || text,
          date: getLocalDateString(),
        });

        setTranscript("");
        console.log("Successfully processed voice input");
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          throw new Error('Request timeout - AI processing took too long. Please try again.');
        }
        throw fetchErr;
      }
    } catch (err: any) {
      console.error("Error processing voice input:", err);
      console.error("Error details:", {
        message: err.message,
        status: err.status,
        statusText: err.statusText,
        name: err.name,
        stack: err.stack
      });

      // Provide more specific error messages
      let errorMessage = "Failed to process voice input. ";

      if (err.message?.includes("API key")) {
        errorMessage = err.message;
      } else if (err.message?.includes("fetch") || err.name === "TypeError") {
        errorMessage = `Network error: ${err.message}. The Gemini API might be blocked or the key might be invalid.`;
      } else if (err.message?.includes("429")) {
        errorMessage = "AI service rate limit reached. Please try again in a moment.";
      } else if (err.message?.includes("403")) {
        errorMessage = "API key is invalid or doesn't have access. Please check your Gemini API key.";
      } else if (err.message?.includes("400")) {
        errorMessage = "Invalid request to AI service. Please try rephrasing your transaction.";
      } else {
        errorMessage += `Error: ${err.message || 'Unknown error'}. Please fill the form manually.`;
      }

      setError(errorMessage);
      // Still set the description even if parsing fails
      setFormData(prev => ({ ...prev, description: text }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is too large. Maximum size is 10MB.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
      // Auto-analyze after capture
      setTimeout(() => analyzeReceiptImage(), 500);
    };
    reader.readAsDataURL(file);
    setError("");
  };

  const handleCameraCapture = () => {
    // Trigger the camera input
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (JPG, PNG, etc.)');
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file is too large. Maximum size is 10MB.');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        // Auto-analyze after drop
        setTimeout(() => analyzeReceiptImage(), 500);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleDropZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const analyzeReceiptImage = async () => {
    if (!uploadedImage || !imageFile) {
      setError("Please upload an image first");
      return;
    }

    setIsAnalyzingImage(true);
    setError("");

    try {
      console.log("[Receipt Upload] Starting analysis...");

      // Convert image to base64
      const reader = new FileReader();
      const base64Image = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      console.log("[Receipt Upload] Image converted to base64");

      const response = await fetch('/api/analyze-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64Image,
          mimeType: imageFile.type,
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze receipt');
      }

      const result = await response.json();
      console.log("[Receipt Upload] Analysis result:", result);

      if (result.success && result.data) {
        const data = result.data;
        setFormData({
          type: data.type || "expense",
          category: data.category || "",
          amount: data.amount || 0,
          description: data.description || "",
          date: data.date || getLocalDateString(),
        });
        console.log("[Receipt Upload] Form updated with analyzed data");
      } else {
        throw new Error("Invalid response from analysis");
      }
    } catch (err: any) {
      console.error("[Receipt Upload] Error:", err);
      setError(`Failed to analyze receipt: ${err.message}`);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.category || !formData.amount) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      await createTransaction({
        user_id: userId,
        ...formData,
        wallet_id: null,
        is_recurring: false,
        recurring_frequency: null,
        recurring_end_date: null,
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      console.error("Error adding transaction:", err);
      setError("Failed to add transaction. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      type: "expense",
      category: "",
      amount: 0,
      description: "",
      date: getLocalDateString(),
    });
    setTranscript("");
    setInterimTranscript("");
    setError("");
    removeImage();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 max-w-2xl w-full border border-gray-700 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Add Transaction
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Voice Input Section */}
          <div className="mb-3 p-3 bg-gradient-to-br from-purple-900/20 to-gray-800/50 rounded-xl border border-purple-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    AI Voice Input
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {browserName && `${browserName} browser • `}
                    {recordingMethod === 'browser'
                      ? '✓ Using Browser API (Free)'
                      : '✓ Using Gemini API (Universal)'
                    }
                  </p>
                </div>
                {/* Language selector */}
                <div className="flex gap-1 bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => handleLanguageChange("en-US")}
                    disabled={isListening || isProcessing}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${
                      language === "en-US"
                        ? "bg-purple-500 text-white"
                        : "text-gray-400 hover:text-white"
                    } disabled:opacity-50`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => handleLanguageChange("fr-FR")}
                    disabled={isListening || isProcessing}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${
                      language === "fr-FR"
                        ? "bg-purple-500 text-white"
                        : "text-gray-400 hover:text-white"
                    } disabled:opacity-50`}
                  >
                    FR
                  </button>
                </div>
              </div>
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`relative p-4 rounded-full transition-all shadow-2xl group ${
                  isListening
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></span>
                {isListening ? (
                  <MicOff className="w-6 h-6 text-white relative z-10" />
                ) : (
                  <div className="relative z-10">
                    <Mic className="w-6 h-6 text-white" />
                    <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1 animate-pulse" />
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[8px] bg-yellow-400 text-purple-900 rounded-full font-bold">AI</span>
                  </div>
                )}
              </button>
            </div>

            {(isListening || transcript || interimTranscript) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-gray-900/50 rounded-lg mb-3"
              >
                <p className={`text-xs mb-1 ${isListening ? 'text-green-400' : 'text-gray-400'}`}>
                  {isListening ? 'Listening...' : 'Recorded:'}
                </p>
                <p className="text-white text-sm">
                  {transcript}
                  {transcript && interimTranscript && ' '}
                  {interimTranscript && <span className="text-gray-400 italic">{interimTranscript}</span>}
                  {!transcript && !interimTranscript && "Start speaking..."}
                </p>
              </motion.div>
            )}

            {transcript && !isListening && !isProcessing && (
              <button
                onClick={() => processVoiceInput(transcript)}
                className="relative w-full px-4 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white text-sm rounded-lg transition-all flex items-center justify-center gap-2 mb-3 shadow-lg hover:shadow-2xl font-semibold overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity"></span>
                <span className="relative flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Process with AI
                  <span className="text-xs bg-yellow-400 text-purple-900 px-1.5 py-0.5 rounded-full font-bold">AI</span>
                </span>
              </button>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2 text-orange-400 mb-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing with AI...</span>
              </div>
            )}

            <p className="text-gray-400 text-sm">
              {language === "en-US"
                ? 'Click the microphone and say something like: "I spent 50 dollars on groceries today"'
                : 'Cliquez sur le microphone et dites quelque chose comme: "J\'ai dépensé 50 dollars en épicerie aujourd\'hui"'
              }
            </p>
          </div>

          {/* Image Upload Section */}
          <div className="mb-3 p-3 bg-gradient-to-br from-blue-900/20 to-gray-800/50 rounded-xl border border-blue-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    AI Receipt Scanner
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Scan, drag, or click to upload</p>
                </div>
              </div>
              {/* AI Scan Camera Button */}
              <button
                onClick={handleCameraCapture}
                type="button"
                disabled={isAnalyzingImage}
                className="relative p-4 rounded-full bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-700 hover:via-cyan-700 hover:to-indigo-700 text-white transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed group"
                title="AI Scan with Camera"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></span>
                <div className="relative z-10">
                  <Camera className="w-6 h-6 text-white" />
                  <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1 animate-pulse" />
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[8px] bg-yellow-400 text-blue-900 rounded-full font-bold">AI</span>
                </div>
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />

            {uploadedImage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3"
              >
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded receipt"
                    className="w-full max-h-48 object-contain rounded-lg border border-gray-600"
                  />
                  <button
                    onClick={removeImage}
                    type="button"
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </motion.div>
            )}

            {isAnalyzingImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30"
              >
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <div>
                  <p className="text-blue-400 font-medium text-sm">AI Analyzing Receipt...</p>
                  <p className="text-xs text-gray-400">Extracting transaction details</p>
                </div>
              </motion.div>
            )}

            {!uploadedImage && !isAnalyzingImage && (
              <motion.div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleDropZoneClick}
                className={`relative border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
                    : 'border-gray-600 hover:border-blue-500 hover:bg-gray-800/50'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="text-center py-2">
                  <motion.div
                    className="flex items-center justify-center gap-2 mb-2"
                    animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: isDragging ? Infinity : 0, duration: 1 }}
                  >
                    <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
                    <Sparkles className={`w-4 h-4 ${isDragging ? 'text-blue-400' : 'text-gray-500'}`} />
                  </motion.div>

                  <p className={`text-base font-semibold mb-1 ${isDragging ? 'text-blue-400' : 'text-white'}`}>
                    {isDragging
                      ? language === "en-US" ? 'Drop here!' : 'Déposez ici !'
                      : language === "en-US" ? 'Drag & Drop or Click' : 'Glisser-déposer ou cliquer'
                    }
                  </p>

                  <p className="text-gray-400 text-xs">
                    {language === "en-US"
                      ? 'AI will extract details automatically'
                      : 'L\'IA extraira les détails automatiquement'
                    }
                  </p>
                </div>

                {/* Visual indicator for drag over */}
                {isDragging && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-blue-500/5 rounded-lg pointer-events-none"
                  />
                )}
              </motion.div>
            )}
          </div>

          {/* Manual Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="bills">Bills</option>
                <option value="debt_payment">Debt Payment</option>
                <option value="savings">Savings</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category *</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                placeholder="e.g., Groceries, Salary, Rent"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                placeholder="0.00"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                placeholder="Optional notes..."
                rows={2}
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            {error && (
              <div className="p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-xs">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
