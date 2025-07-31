let socket: WebSocket;

export function connectSocket(session: string) {
  socket = new WebSocket(`https://intervue-hq0w.onrender.com?session=${session}`);

  socket.onopen = () => {
    console.log("Connected to AI server");
  };

  return socket;
}

export function sendMessage(msg: string) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(msg);
  }
}
