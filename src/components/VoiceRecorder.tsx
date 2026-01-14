"use client";

import { useState, useRef, useEffect } from "react";

interface VoiceRecorderProps {
  onComplete: (voiceSampleUrl: string) => void;
  userId: string;
}

const SAMPLE_TEXT = `Once upon a time, in a cozy little cottage nestled between tall oak trees, there lived a curious little bunny named Whiskers. Every night, as the stars began to twinkle in the velvet sky, Whiskers would snuggle into their soft, warm bed. The gentle breeze whispered lullabies through the window, and soon, Whiskers would drift off to the most wonderful dreams.`;

export function VoiceRecorder({ onComplete, userId }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d >= 60) {
            stopRecording();
            return 60;
          }
          return d + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Please allow microphone access to record your voice.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setDuration(0);
  };

  const handleConfirm = async () => {
    if (!audioUrl) return;

    setIsUploading(true);

    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];

        const uploadRes = await fetch("/api/voice/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio: base64,
            userId,
          }),
        });

        const data = await uploadRes.json();

        if (data.voiceSampleUrl) {
          onComplete(data.voiceSampleUrl);
        } else {
          throw new Error("Upload failed");
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Error uploading voice sample. Please try again.");
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Sample Text */}
      <div className="glass-card-subtle p-5">
        <p className="text-sm text-secondary mb-3 flex items-center gap-2">
          📖 Read this aloud in your storytelling voice:
        </p>
        <p className="leading-relaxed italic">
          &ldquo;{SAMPLE_TEXT}&rdquo;
        </p>
      </div>

      {/* Recording Controls */}
      {!audioUrl ? (
        <div className="text-center py-6">
          {/* Timer */}
          <div className="text-5xl font-mono mb-2 tabular-nums">
            {formatTime(duration)}
          </div>

          {/* Recording indicator */}
          {isRecording ? (
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 font-medium">Recording...</span>
            </div>
          ) : (
            <p className="text-secondary mb-6">
              Record for 30-60 seconds
            </p>
          )}

          {/* Record Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={duration >= 60}
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all shadow-lg ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 scale-110"
                : "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            }`}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <span className="w-8 h-8 bg-white rounded-sm" />
            ) : (
              <span className="text-4xl">🎙️</span>
            )}
          </button>

          {isRecording && duration >= 30 && (
            <p className="text-green-600 mt-6 flex items-center justify-center gap-2 animate-fade-in">
              ✨ Great! You can stop recording now.
            </p>
          )}

          {!isRecording && duration === 0 && (
            <p className="text-tertiary mt-6 text-sm">
              Tap the microphone to start recording
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Playback */}
          <div className="glass-card-subtle p-5">
            <p className="text-sm text-secondary mb-3 flex items-center gap-2">
              🎧 Preview your recording:
            </p>
            <audio src={audioUrl} controls className="w-full" />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={resetRecording}
              disabled={isUploading}
              className="btn-secondary flex-1"
            >
              Re-record
            </button>
            <button
              onClick={handleConfirm}
              disabled={isUploading}
              className="btn-primary flex-1"
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : (
                "Use This Recording"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
