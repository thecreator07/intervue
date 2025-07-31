"use client";

import React, { useEffect, useRef } from "react";

interface UserCameraFeedProps {
  className?: string;
  muted?: boolean;
  playing?: boolean;
}

export default function UserCameraFeed({
  className,
  muted = true,
  playing = true,
}: UserCameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // store stream

  useEffect(() => {
    const videoElement = videoRef.current;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing front camera:", err);
      }
    };

    if (playing) {
      startCamera();
    } else {
      // ❌ Stop camera when playing is false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoElement) {
        videoElement.srcObject = null;
      }
    }

    return () => {
      // ❌ Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [playing]);

  return (
    <video
      ref={videoRef}
      className={className}
      muted={muted}
      playsInline
      autoPlay
    />
  );
}
