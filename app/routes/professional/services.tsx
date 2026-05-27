import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000/api";

type Servicio = {
  servicio_id: number;
  nombre: string;
  descripcion: string;
  modalidad: string;
  tipo: string;
  precio: number;
  duracion: number;
  pausa: number;
  min_cancelacion: number;
};

export default function Services() {
  const [services, setServices] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  // FORM STATE
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    modalidad: "VIRTUAL",
    tipo: "",
    precio: "",
    duracion: "",
    pausa: "",
    min_cancelacion: "",
  });

  const token = localStorage.getItem("citapro_token");

  // GET servicios
  const fetchServicios = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/mis-servicios`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setServices(data.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  // CREATE servicio
  const handleCreate = async () => {
    try {
      const response = await fetch(`${API_URL}/servicios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...form,
          modalidad: form.modalidad.toUpperCase(),
          precio: Number(form.precio),
          duracion: Number(form.duracion),
          pausa: Number(form.pausa),
          min_cancelacion: Number(form.min_cancelacion),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Servicio creado");
        setOpenModal(false);
        setForm({
          nombre: "",
          descripcion: "",
          modalidad: "VIRTUAL",
          tipo: "",
          precio: "",
          duracion: "",
          pausa: "",
          min_cancelacion: "",
        });
        fetchServicios();
      } else {
        alert(data.message || "Error");
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Servicios</h1>
          <p className="text-ink-muted mt-1">{services.length} servicios</p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-ink text-white px-4 py-2 rounded"
        >
          + Nuevo servicio
        </button>
      </div>

      {/* TABLE (NO TOCADO) */}
      <div className="bg-surface border border-border rounded overflow-hidden">
        <div className="grid grid-cols-5 px-5 py-3 border-b">
          <div>SERVICIO</div>
          <div>MODALIDAD</div>
          <div>DURACIÓN</div>
          <div>PRECIO</div>
          <div>TIPO</div>
        </div>

        {services.map((s) => (
          <div
            key={s.servicio_id}
            className="grid grid-cols-5 px-5 py-4 border-b"
          >
            <div>
              <p className="font-semibold">{s.nombre}</p>
              <p className="text-sm text-gray-500">{s.descripcion}</p>
            </div>

            <div>{s.modalidad}</div>
            <div>{s.duracion} min</div>
            <div>${s.precio}</div>
            <div>{s.tipo}</div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-[500px] space-y-3">
            <h2 className="text-xl font-bold">Nuevo servicio</h2>

            <input
              placeholder="Nombre"
              className="w-full border p-2"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />

            <textarea
              placeholder="Descripción"
              className="w-full border p-2"
              value={form.descripcion}
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
            />

            <select
              className="w-full border p-2"
              value={form.modalidad}
              onChange={(e) =>
                setForm({ ...form, modalidad: e.target.value })
              }
            >
              <option value="VIRTUAL">Virtual</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="HIBRIDO">Híbrido</option>
            </select>

            <input
              placeholder="Tipo"
              className="w-full border p-2"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            />

            <input
              type="number"
              placeholder="Precio"
              className="w-full border p-2"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
            />

            <input
              type="number"
              placeholder="Duración (min)"
              className="w-full border p-2"
              value={form.duracion}
              onChange={(e) =>
                setForm({ ...form, duracion: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Pausa (min)"
              className="w-full border p-2"
              value={form.pausa}
              onChange={(e) => setForm({ ...form, pausa: e.target.value })}
            />

            <input
              type="number"
              placeholder="Mínimo de cancelación (hrs)"
              className="w-full border p-2"
              value={form.min_cancelacion}
              onChange={(e) => setForm({ ...form, min_cancelacion: e.target.value })}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-3 py-1 border"
                onClick={() => setOpenModal(false)}
              >
                Cancelar
              </button>

              <button
                className="px-3 py-1 bg-ink text-white"
                onClick={handleCreate}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}