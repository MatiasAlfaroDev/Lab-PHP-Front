import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  type Participant,
} from "livekit-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Settings,
  Users,
  SwitchCamera,
  AlertTriangle,
  Volume2,
  Loader2,
  User,
  WifiOff,
} from "lucide-react";
import { api } from "~/lib/api";
import { useAuth } from "~/context/AuthContext";

type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

interface RemoteState {
  identity: string;
  name: string;
  videoTrack: Track | null;
  audioTrack: Track | null;
  micOn: boolean;
  cameraOn: boolean;
  speaking: boolean;
}

function VideoTile({
  videoTrack,
  audioTrack,
  name,
  isLocal,
  micOn,
  cameraOn,
  speaking,
}: {
  videoTrack: Track | null;
  audioTrack?: Track | null;
  name: string;
  isLocal?: boolean;
  micOn: boolean;
  cameraOn: boolean;
  speaking?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoTrack) return;
    videoTrack.attach(el);
    return () => {
      videoTrack.detach(el);
    };
  }, [videoTrack]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioTrack || isLocal) return;
    audioTrack.attach(el);
    return () => {
      audioTrack.detach(el);
    };
  }, [audioTrack, isLocal]);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-zinc-900 border flex items-center justify-center min-h-[140px] ${
        speaking ? "border-emerald-400" : "border-white/10"
      }`}
    >
      {/* el <video> nunca se desmonta: LiveKit reutiliza el mismo track al
          mutear/desmutear la cámara, así que desmontar el elemento rompía
          el attach() en el siguiente toggle */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${isLocal ? "-scale-x-100" : ""} ${
          cameraOn && videoTrack ? "" : "hidden"
        }`}
      />
      {!(cameraOn && videoTrack) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <span className="text-sm">{name}</span>
        </div>
      )}

      {!isLocal && <audio ref={audioRef} autoPlay />}

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/55 backdrop-blur px-2.5 py-1 rounded-lg text-xs">
        {!micOn && <MicOff className="w-3.5 h-3.5 text-red-400" />}
        <span>
          {name}
          {isLocal ? " (Tú)" : ""}
        </span>
      </div>
    </div>
  );
}

function DeviceList({
  devices,
  activeId,
  onSelect,
  emptyLabel,
  fallbackLabel,
}: {
  devices: MediaDeviceInfo[];
  activeId?: string;
  onSelect: (deviceId: string) => void;
  emptyLabel: string;
  fallbackLabel: string;
}) {
  if (devices.length === 0) {
    return <p className="text-sm text-white/40 px-1">{emptyLabel}</p>;
  }

  return (
    <div className="max-h-40 overflow-y-auto rounded-lg bg-white/5 border border-white/10 divide-y divide-white/5">
      {devices.map((d, i) => (
        <button
          key={d.deviceId}
          type="button"
          onClick={() => onSelect(d.deviceId)}
          className={`w-full text-left px-3 py-2 text-sm truncate transition-colors ${
            d.deviceId === activeId
              ? "bg-primary/30 text-white"
              : "text-white/80 hover:bg-white/10"
          }`}
        >
          {d.label || `${fallbackLabel} ${i + 1}`}
        </button>
      ))}
    </div>
  );
}

export default function Videollamada() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token, user } = useAuth();

  const roomRef = useRef<Room | null>(null);

  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<Track | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<
    Map<string, RemoteState>
  >(new Map());
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const [otherName, setOtherName] = useState<string | null>(null);

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>();
  const [activeMicId, setActiveMicId] = useState<string>();
  const [devicesOpen, setDevicesOpen] = useState(false);

  const [micPending, setMicPending] = useState(false);
  const [camPending, setCamPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<number | undefined>(undefined);

  // SALIR
  const salir = async () => {
    try {
      await api.post(`/videollamada/${id}/estado`, { estado: "finalizada" }, token);
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

  // el token de LiveKit solo trae el identity (id de usuario), no un nombre
  // legible, así que lo resolvemos con los mismos endpoints de los dashboards
  useEffect(() => {
    if (!id || !token || !user) return;

    const resolveName = async () => {
      try {
        if (user.role === "client") {
          const res = await api.get<{
            success: boolean;
            data: { reserva_id: number; servicio: { profesional_nombre: string } }[];
          }>("/mis-reservas", token);
          const match = res.data.find((b) => String(b.reserva_id) === String(id));
          if (match) setOtherName(match.servicio.profesional_nombre);
        } else if (user.role === "professional") {
          const res = await api.get<{
            success: boolean;
            data: { reserva_id: number; cliente_nombre: string }[];
          }>("/mi-agenda", token);
          const match = res.data.find((b) => String(b.reserva_id) === String(id));
          if (match) setOtherName(match.cliente_nombre);
        }
      } catch (err) {
        console.error("No se pudo resolver el nombre del otro participante:", err);
      }
    };

    resolveName();
  }, [id, token, user]);

  const loadDevices = useCallback(async (room: Room) => {
    try {
      const [cams, mics] = await Promise.all([
        Room.getLocalDevices("videoinput"),
        Room.getLocalDevices("audioinput"),
      ]);
      setCameras(cams);
      setMicrophones(mics);
      setActiveCameraId(room.getActiveDevice("videoinput") ?? cams[0]?.deviceId);
      setActiveMicId(room.getActiveDevice("audioinput") ?? mics[0]?.deviceId);
    } catch (err) {
      console.error("No se pudieron listar los dispositivos:", err);
    }
  }, []);

  useEffect(() => {
    if (!id || !token) return;

    let cancelled = false;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;
    setStatus("connecting");
    setRemoteParticipants(new Map());

    const upsert = (p: Participant, patch: Partial<RemoteState> = {}) => {
      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        const existing = next.get(p.identity);
        next.set(p.identity, {
          identity: p.identity,
          name: p.name || p.identity || "Participante",
          videoTrack: existing?.videoTrack ?? null,
          audioTrack: existing?.audioTrack ?? null,
          micOn: p.isMicrophoneEnabled,
          cameraOn: p.isCameraEnabled,
          speaking: existing?.speaking ?? false,
          ...patch,
        });
        return next;
      });
    };

    const setTrack = (p: Participant, kind: Track.Kind, track: Track | null) => {
      upsert(p, kind === Track.Kind.Video ? { videoTrack: track } : { audioTrack: track });
    };

    const remove = (p: Participant) => {
      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        next.delete(p.identity);
        return next;
      });
    };

    room
      .on(RoomEvent.ParticipantConnected, (p) => upsert(p))
      .on(RoomEvent.ParticipantDisconnected, remove)
      .on(RoomEvent.TrackSubscribed, (track, _pub, participant) =>
        setTrack(participant, track.kind, track)
      )
      .on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) =>
        setTrack(participant, track.kind, null)
      )
      .on(RoomEvent.TrackMuted, (_pub, participant) => {
        if (participant instanceof RemoteParticipant) upsert(participant);
      })
      .on(RoomEvent.TrackUnmuted, (_pub, participant) => {
        if (participant instanceof RemoteParticipant) upsert(participant);
      })
      .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const speakingIds = new Set(speakers.map((s) => s.identity));
        setRemoteParticipants((prev) => {
          const next = new Map(prev);
          for (const [key, val] of next) {
            next.set(key, { ...val, speaking: speakingIds.has(key) });
          }
          return next;
        });
      })
      .on(RoomEvent.Reconnecting, () => setStatus("reconnecting"))
      .on(RoomEvent.Reconnected, () => setStatus("connected"))
      .on(RoomEvent.Disconnected, () => setStatus((s) => (s === "error" ? s : "disconnected")))
      .on(RoomEvent.AudioPlaybackStatusChanged, () => {
        setNeedsAudioUnlock(!room.canPlaybackAudio);
      })
      .on(RoomEvent.LocalTrackPublished, (pub) => {
        if (pub.track?.kind === Track.Kind.Video) setLocalVideoTrack(pub.track);
      })
      .on(RoomEvent.LocalTrackUnpublished, (pub) => {
        if (pub.track?.kind === Track.Kind.Video) setLocalVideoTrack(null);
      })
      .on(RoomEvent.MediaDevicesChanged, () => loadDevices(room));

    const join = async () => {
      try {
        const res = await api.get<{
          success: boolean;
          data: { token: string; url: string };
        }>(`/videollamada/token/${id}`, token);

        if (cancelled) return;
        const { token: livekitToken, url } = res.data;

        await room.connect(url, livekitToken);
        if (cancelled) {
          await room.disconnect();
          return;
        }

        setStatus("connected");

        api
          .post(`/videollamada/${id}/estado`, { estado: "en_curso" }, token)
          .catch(() => {});

        // sincroniza participantes y tracks ya presentes al momento de conectar
        room.remoteParticipants.forEach((p) => {
          upsert(p);
          p.trackPublications.forEach((pub) => {
            if (pub.track) setTrack(p, pub.track.kind, pub.track);
          });
        });

        try {
          await Promise.all([
            room.localParticipant.setCameraEnabled(true),
            room.localParticipant.setMicrophoneEnabled(true),
          ]);
          setCamOn(true);
          setMicOn(true);
        } catch (mediaErr) {
          console.error("No se pudo acceder a cámara/micrófono:", mediaErr);
        }

        const localPub = Array.from(
          room.localParticipant.videoTrackPublications.values()
        )[0];
        if (localPub?.track) setLocalVideoTrack(localPub.track);

        setNeedsAudioUnlock(!room.canPlaybackAudio);
        await loadDevices(room);
      } catch (err) {
        console.error("LiveKit error:", err);
        if (!cancelled) setStatus("error");
      }
    };

    join();

    return () => {
      cancelled = true;
      room.disconnect();
    };
  }, [id, token, loadDevices]);

  const flashError = (msg: string) => {
    setActionError(msg);
    if (errorTimeoutRef.current) window.clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = window.setTimeout(() => setActionError(null), 4000);
  };

  const toggleMic = async () => {
    if (!roomRef.current || micPending) return;
    const enabled = !micOn;
    setMicPending(true);
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(enabled);
      setMicOn(enabled);
    } catch (err) {
      console.error("No se pudo cambiar el micrófono:", err);
      flashError("No se pudo cambiar el micrófono. Revisa los permisos o la conexión.");
    } finally {
      setMicPending(false);
    }
  };

  const toggleCam = async () => {
    if (!roomRef.current || camPending) return;
    const enabled = !camOn;
    setCamPending(true);
    try {
      await roomRef.current.localParticipant.setCameraEnabled(enabled);
      setCamOn(enabled);
    } catch (err) {
      console.error("No se pudo cambiar la cámara:", err);
      flashError("No se pudo cambiar la cámara. Revisa los permisos o la conexión.");
    } finally {
      setCamPending(false);
    }
  };

  const selectCamera = async (deviceId: string) => {
    if (!roomRef.current) return;
    await roomRef.current.switchActiveDevice("videoinput", deviceId);
    setActiveCameraId(deviceId);
  };

  const selectMic = async (deviceId: string) => {
    if (!roomRef.current) return;
    await roomRef.current.switchActiveDevice("audioinput", deviceId);
    setActiveMicId(deviceId);
  };

  const switchCamera = async () => {
    if (!roomRef.current || cameras.length < 2) return;
    const currentId = roomRef.current.getActiveDevice("videoinput") ?? activeCameraId;
    const idx = cameras.findIndex((d) => d.deviceId === currentId);
    const next = cameras[(idx + 1) % cameras.length];
    await selectCamera(next.deviceId);
  };

  const enableAudio = async () => {
    await roomRef.current?.startAudio();
    setNeedsAudioUnlock(false);
  };

  const remoteList = Array.from(remoteParticipants.values());
  const totalTiles = remoteList.length + 1;
  const gridCols =
    totalTiles <= 1
      ? "grid-cols-1"
      : totalTiles === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : totalTiles <= 4
          ? "grid-cols-2"
          : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className="h-dvh flex flex-col bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white">
      {/* HEADER */}
      <div className="px-4 sm:px-5 py-3 flex justify-between items-center border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="font-semibold flex items-center gap-2">
          <Video className="w-5 h-5" />
          Videollamada
        </div>

        <div className="flex items-center gap-2">
          {status === "connecting" && (
            <span className="text-sm text-white/60 flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Conectando...
            </span>
          )}
          {status === "reconnecting" && (
            <span className="text-sm text-amber-300 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reconectando...
            </span>
          )}
          {(status === "disconnected" || status === "error") && (
            <span className="text-sm text-red-300 flex items-center gap-1.5 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30">
              <WifiOff className="w-3.5 h-3.5" /> Sin conexión
            </span>
          )}
          <div className="text-sm text-white/60 bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {totalTiles}
          </div>
        </div>
      </div>

      {needsAudioUnlock && (
        <button
          onClick={enableAudio}
          className="mx-auto mt-3 flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-amber-400"
        >
          <Volume2 className="w-4 h-4" /> Activar audio
        </button>
      )}

      {actionError && (
        <div className="mx-auto mt-3 flex items-center gap-2 bg-red-500/15 text-red-200 border border-red-500/30 px-4 py-2 rounded-full text-sm">
          <AlertTriangle className="w-4 h-4" /> {actionError}
        </div>
      )}

      {/* GRID DE VIDEOS */}
      <div className={`flex-1 grid ${gridCols} gap-3 p-3 auto-rows-fr overflow-y-auto`}>
        <VideoTile
          videoTrack={localVideoTrack}
          name={user?.name ?? "Yo"}
          isLocal
          micOn={micOn}
          cameraOn={camOn}
        />

        {remoteList.map((p) => (
          <VideoTile
            key={p.identity}
            videoTrack={p.videoTrack}
            audioTrack={p.audioTrack}
            name={remoteList.length === 1 ? otherName ?? p.name : p.name}
            micOn={p.micOn}
            cameraOn={p.cameraOn}
            speaking={p.speaking}
          />
        ))}

        {remoteList.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 flex flex-col items-center justify-center gap-2 text-white/40 min-h-[140px]">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Esperando a que se una el otro participante...</span>
          </div>
        )}
      </div>

      {/* CONTROLES */}
      <div className="relative p-4 flex justify-center items-center gap-3 bg-black/60 border-t border-white/10">
        {devicesOpen && (
          <div className="absolute bottom-full mb-3 w-72 bg-zinc-900 border border-white/10 rounded-xl p-4 shadow-xl space-y-3">
            <div>
              <label className="text-xs text-white/50 block mb-1">Cámara</label>
              <DeviceList
                devices={cameras}
                activeId={activeCameraId}
                onSelect={selectCamera}
                emptyLabel="No se detectaron cámaras"
                fallbackLabel="Cámara"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Micrófono</label>
              <DeviceList
                devices={microphones}
                activeId={activeMicId}
                onSelect={selectMic}
                emptyLabel="No se detectaron micrófonos"
                fallbackLabel="Micrófono"
              />
            </div>
          </div>
        )}

        <button
          onClick={toggleMic}
          disabled={micPending}
          title={micOn ? "Apagar micrófono" : "Encender micrófono"}
          className={`w-12 h-12 flex items-center justify-center rounded-full transition disabled:opacity-50 ${
            micOn ? "bg-white/10 hover:bg-white/20" : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {micPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : micOn ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={toggleCam}
          disabled={camPending}
          title={camOn ? "Apagar cámara" : "Encender cámara"}
          className={`w-12 h-12 flex items-center justify-center rounded-full transition disabled:opacity-50 ${
            camOn ? "bg-white/10 hover:bg-white/20" : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {camPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : camOn ? (
            <Video className="w-5 h-5" />
          ) : (
            <VideoOff className="w-5 h-5" />
          )}
        </button>

        {cameras.length > 1 && (
          <button
            onClick={switchCamera}
            title="Cambiar cámara"
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={() => setDevicesOpen((v) => !v)}
          title="Configurar dispositivos"
          className={`w-12 h-12 flex items-center justify-center rounded-full transition ${
            devicesOpen ? "bg-white/25" : "bg-white/10 hover:bg-white/20"
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>

        <button
          onClick={salir}
          title="Salir de la llamada"
          className="w-14 h-12 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 transition"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {status === "error" && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 text-center p-6">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
          <p className="text-white/80 max-w-sm">
            No se pudo conectar a la videollamada. Verifica tu conexión e intenta nuevamente.
          </p>
          <button
            onClick={() => navigate(0)}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
