"use client";

import React, { useEffect, useRef } from "react";

interface VideoFeed {
  className?: string;
  playing: boolean;
}

export default function UserCameraFeed({ className, playing }: VideoFeed) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera with audio
  useEffect(() => {
    // If playing is true, start the camera
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true, // Enable mic
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera/mic access error:", err);
      }
    };

    // If playing is true, start the camera, otherwise stop the camera
    if (playing) {
      startCamera();
    } else {
      stopCamera();
    }

    // Cleanup function
    return () => {
      stopCamera();
    };
  }, [playing]); // Runs every time `playing` changes

  // Stop the camera and release the stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop()); // Stop all tracks (video + audio)
      streamRef.current = null; // Clear the stream reference
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null; // Clear the video element source
    }
  };

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
