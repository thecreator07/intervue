"use client";

import React, { useEffect, useRef} from "react";

interface VideoFeed {
  className?: string;
  playing: boolean;
}

export default function UserCameraFeed({ className, playing }: VideoFeed) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera with audio
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true, // ✅ enable mic
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera/mic access error:", err);
      }
    };

    startCamera();

    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [playing]);

  // Handle play/pause logic based on the 'playing' prop
  useEffect(() => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [playing]);

  return (
    <video
      ref={videoRef}
      className={className}
      muted
      playsInline
      autoPlay
    />
  );
}
