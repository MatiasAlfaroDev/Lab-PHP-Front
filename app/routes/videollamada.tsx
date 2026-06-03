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

        // 🔵 activar cámara y mic
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);

        // 🟢 LOCAL VIDEO
        const attachLocal = () => {
          const pub =
            room.localParticipant.videoTrackPublications.values().next().value;

          if (pub?.track && localVideoRef.current) {
            pub.track.attach(localVideoRef.current);
          }
        };

        room.localParticipant.on("trackPublished", attachLocal);
        attachLocal();

        // 🔴 REMOTO (1 a 1 correcto)
        room.on("trackSubscribed", (track, publication, participant) => {
          if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
            track.attach(remoteVideoRef.current);
          }
        });

        // 👥 participantes
        setParticipants(room.numParticipants);

        room.on("participantConnected", () => {
          setParticipants(room.numParticipants);
        });

        room.on("participantDisconnected", () => {
          setParticipants(room.numParticipants);
        });
      } catch (err) {
        console.error("LiveKit error:", err);
      }
    };

    join();

    return () => {
      room.disconnect();
    };
  }, []);

  // 🎤 MIC
  const toggleMic = async () => {
    if (!roomRef.current) return;

    const enabled = !micOn;
    setMicOn(enabled);

    await roomRef.current.localParticipant.setMicrophoneEnabled(enabled);
  };

  // 📷 CAM
  const toggleCam = async () => {
    if (!roomRef.current) return;

    const enabled = !camOn;
    setCamOn(enabled);

    const pub =
      await roomRef.current.localParticipant.setCameraEnabled(enabled);

    if (enabled && pub?.track && localVideoRef.current) {
      pub.track.attach(localVideoRef.current);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white">

      {/* HEADER */}
      <div className="px-5 py-3 flex justify-between items-center border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="font-semibold">🎥 Videollamada</div>

        <div className="text-sm text-white/60 bg-white/5 px-3 py-1 rounded-full border border-white/10">
          👥 {participants} conectado{participants > 1 ? "s" : ""}
        </div>
      </div>

      {/* VIDEO AREA */}
      <div className="flex-1 relative">

        {/* 🔴 REMOTO */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute w-full h-full object-cover bg-black"
        />

        {/* overlay */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-white/50 text-sm bg-black/40 px-4 py-2 rounded-xl border border-white/10 backdrop-blur">
            Esperando otro usuario...
          </div>
        </div>

        {/* 🟢 LOCAL */}
        <div className="absolute bottom-5 right-5 w-48 h-32 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

      </div>

      {/* CONTROLES */}
      <div className="p-4 flex justify-center gap-4 bg-black/60 backdrop-blur border-t border-white/10">

        <button
          onClick={toggleMic}
          className={`px-5 py-2 rounded-full transition font-medium ${
            micOn
              ? "bg-emerald-500/90 hover:bg-emerald-500"
              : "bg-red-500/90 hover:bg-red-500"
          }`}
        >
          🎤 {micOn ? "Mic ON" : "Mic OFF"}
        </button>

        <button
          onClick={toggleCam}
          className={`px-5 py-2 rounded-full transition font-medium ${
            camOn
              ? "bg-emerald-500/90 hover:bg-emerald-500"
              : "bg-red-500/90 hover:bg-red-500"
          }`}
        >
          📷 {camOn ? "Cam ON" : "Cam OFF"}
        </button>

        <button
          onClick={() => navigate("/")}
          className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10"
        >
          Salir
        </button>

      </div>
    </div>
  );
}