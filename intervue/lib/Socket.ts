let socket: WebSocket;

export function connectSocket(session: string) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";

  socket = new WebSocket(`${protocol}://intervue-hq0w.onrender.com?session=${session}`);
// socket = new WebSocket(`${protocol}://localhost:5000?session=${session}`);
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
