"use client";

import React from "react";
import UserCameraFeed from "./UserCameraFeed";

interface CallScreenProps {
  playing: boolean;
  streaming: boolean;
}

export default function VideoScreen({ streaming, playing }: CallScreenProps) {
  return (
    <div className="col-span-6 bg-white rounded-md shadow flex flex-col gap-2">
      {/* AI Video */}
      <div className="relative m-2 bg-black flex items-center justify-center h-1/2 rounded overflow-hidden">
        <div className="text-white text-xl">
          🎙️ {streaming ? "AI Speaker" : "AI Idle"}
        </div>

        
      </div>

      {/* User Video */}
      <div className="relative m-2 bg-black flex items-center justify-center h-1/2 rounded overflow-hidden">
        <div className="text-white text-xl">📹 User Speaking</div>

        <UserCameraFeed
          className="absolute inset-0 object-cover w-full h-full transform -scale-x-100"
          playing={playing}
        />
      </div>
    </div>
  );
}
