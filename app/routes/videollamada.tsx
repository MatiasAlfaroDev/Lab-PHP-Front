import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Room, Track } from "livekit-client";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

export default function Videollamada() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const roomRef = useRef<Room | null>(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [participants, setParticipants] = useState(1);

  // SALIR
  const salir = async () => {
    try {
      await api.post(
        `/videollamada/${id}/estado`,
        { estado: "finalizada" },
        token
      );

      await roomRef.current?.disconnect();
    } finally {
      navigate("/");
    }
  };

  // cierre brusco
  useEffect(() => {
    const handleUnload = () => {
      navigator.sendBeacon(
        `${import.meta.env.VITE_API_URL}/videollamada/${id}/estado`,
        JSON.stringify({ estado: "finalizada" })
      );
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [id]);

  useEffect(() => {
    if (!id || !token) return;

    const room = new Room();
    roomRef.current = room;

    const attachLocalVideo = () => {
      room.localParticipant.videoTrackPublications.forEach((pub) => {
        if (pub.track && localVideoRef.current) {
          pub.track.attach(localVideoRef.current);
        }
      });
    };

    const join = async () => {
      try {
        // token livekit
        const res = await api.get<{
          success: boolean;
          data: { token: string; url: string };
        }>(`/videollamada/token/${id}`, token);

        const { token: livekitToken, url } = res.data;

        await room.connect(url, livekitToken);

        // estado en curso
        await api.post(
          `/videollamada/${id}/estado`,
          { estado: "en_curso" },
          token
        );

        // 🔵 cámara y mic
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);

        // 🟢 LOCAL VIDEO (CORRECTO)
        attachLocalVideo();
        room.localParticipant.on("trackPublished", attachLocalVideo);

        // 🔴 REMOTO
        room.on("trackSubscribed", (track) => {
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
  }, [id, token]);

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

    await roomRef.current.localParticipant.setCameraEnabled(enabled);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white">

      {/* HEADER */}
      <div className="px-5 py-3 flex justify-between items-center border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="font-semibold">🎥 Videollamada</div>

        <div className="text-sm text-white/60 bg-white/5 px-3 py-1 rounded-full border border-white/10">
          👥 {participants}
        </div>
      </div>

      {/* VIDEO */}
      <div className="flex-1 relative">

        {/* 🔴 remoto */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute w-full h-full object-cover bg-black"
        />

        {/* 🟢 local */}
        <div className="absolute bottom-5 right-5 w-48 h-32 rounded-2xl overflow-hidden border border-white/20 bg-black">
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
      <div className="p-4 flex justify-center gap-4 bg-black/60 border-t border-white/10">

        <button
          onClick={toggleMic}
          className={`px-5 py-2 rounded-full ${
            micOn ? "bg-green-500" : "bg-red-500"
          }`}
        >
          🎤
        </button>

        <button
          onClick={toggleCam}
          className={`px-5 py-2 rounded-full ${
            camOn ? "bg-green-500" : "bg-red-500"
          }`}
        >
          📷
        </button>

        <button
          onClick={salir}
          className="px-5 py-2 rounded-full bg-white/10"
        >
          Salir
        </button>

      </div>
    </div>
  );
}