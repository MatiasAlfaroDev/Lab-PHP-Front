import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Room, Track } from "livekit-client";

export default function Videollamada() {
  const navigate = useNavigate();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const roomRef = useRef<Room | null>(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [participants, setParticipants] = useState(1);

  const RESERVA_ID = 1;

  useEffect(() => {
    const room = new Room();
    roomRef.current = room;

    const join = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/videollamada/token/${RESERVA_ID}`
        );

        const json = await res.json();
        const { token, url } = json.data;

        await room.connect(url, token);

        // 🎥 cámara + mic
        const videoPub = await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);

        if (videoPub?.track && localVideoRef.current) {
          videoPub.track.attach(localVideoRef.current);
        }

        // 👤 remoto
        room.on("trackSubscribed", (track) => {
          if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
            track.attach(remoteVideoRef.current);
          }
        });

        // 👥 participantes
        const updateParticipants = () => {
          const count = room.participants.size + 1; // +1 local
          setParticipants(count);

          // 🔴 si queda solo uno → cerrar sala
          if (count <= 1) {
            room.disconnect();
            navigate("/");
          }
        };

        room.on("participantConnected", updateParticipants);
        room.on("participantDisconnected", updateParticipants);

        // inicial
        updateParticipants();

      } catch (err) {
        console.error("LiveKit error:", err);
      }
    };

    join();

    // 🧹 cleanup al desmontar componente
    return () => {
      room.disconnect();
      roomRef.current = null;
    };
  }, []);

  // 🚪 cerrar si se cierra la pestaña
  useEffect(() => {
    const handleUnload = () => {
      roomRef.current?.disconnect();
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  // 🎤 mic
  const toggleMic = async () => {
    if (!roomRef.current) return;

    const enabled = !micOn;
    setMicOn(enabled);

    await roomRef.current.localParticipant.setMicrophoneEnabled(enabled);
  };

  // 📷 cam
  const toggleCam = async () => {
    if (!roomRef.current) return;

    const enabled = !camOn;
    setCamOn(enabled);

    const videoPub =
      await roomRef.current.localParticipant.setCameraEnabled(enabled);

    if (enabled && videoPub?.track && localVideoRef.current) {
      videoPub.track.attach(localVideoRef.current);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white">

      <div className="p-3 border-b border-white/10 flex justify-between">
        <span>🎥 Videollamada</span>
        <span>👥 {participants}</span>
      </div>

      <div className="flex-1 relative">

        {/* REMOTO */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute w-full h-full object-cover bg-black"
        />

        <div className="absolute inset-0 flex items-center justify-center text-white/40">
          Esperando otro usuario...
        </div>

        {/* LOCAL */}
        <div className="absolute bottom-4 right-4 w-40 h-28 bg-black border border-white/20 rounded overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

      </div>

      <div className="p-3 flex gap-3 justify-center">

        <button onClick={toggleMic}>
          🎤 Mic {micOn ? "ON" : "OFF"}
        </button>

        <button onClick={toggleCam}>
          📷 Cam {camOn ? "ON" : "OFF"}
        </button>

        <button onClick={() => navigate("/")}>
          Salir
        </button>

      </div>

    </div>
  );
}