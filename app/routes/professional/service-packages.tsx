import { useEffect, useMemo, useState } from "react";

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
};

type PackageItem = {
  servicio_id: number;

  pivot?: {
    cantidad_sesiones: number;
  };

  cantidad_sesiones?: number;
};

type ServicePackage = {
  paquete_id: number;
  nombre: string;
  descripcion: string;
  precio_total: number;
  servicios: PackageItem[];
};

export default function ServicePackages() {
  const token = localStorage.getItem("citapro_token");

  const [services, setServices] = useState<Servicio[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [selectedPackage, setSelectedPackage] =
    useState<ServicePackage | null>(null);

  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);

  const [editingPackage, setEditingPackage] =
    useState<ServicePackage | null>(null);

  const [form, setForm] = useState<{
    nombre: string;
    descripcion: string;
    precio_total: string;
  }>({
    nombre: "",
    descripcion: "",
    precio_total: "",
  });

  const [selectedServices, setSelectedServices] = useState<
  {
    servicio_id: number;
    cantidad_sesiones: number;
  }[]
>([]);

  // =========================
  // GET MIS SERVICIOS
  // =========================
  const fetchServicios = async () => {
    try {
      const response = await fetch(
        `${API_URL}/mis-servicios`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      console.log("SERVICIOS:", data);

      if (data.success) {
        setServices(data.data);
      }
    } catch (error) {
      console.log("ERROR SERVICIOS", error);
    }
  };

  // =========================
  // GET PAQUETES
  // =========================
  const fetchPackages = async () => {
  try {
    const response = await fetch(
      `${API_URL}/paquetes`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    console.log("PAQUETES:", data);

    setPackages(data);

    if (data.length > 0) {
      setSelectedPackage(data[0]);
    }
  } catch (error) {
    console.log("ERROR PAQUETES", error);
  }
};
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      await fetchServicios();
      await fetchPackages();

      setLoading(false);
    };

    init();
  }, []);

  // =========================
  // HELPERS
  // =========================
  const resetForm = () => {
    setForm({
      nombre: "",
      descripcion: "",
      precio_total: "",
    });

    setSelectedServices([]);
    setEditingPackage(null);
  };

  const handleAddService = (
    servicio_id: number
  ) => {
    const exists = selectedServices.find(
      (s) => s.servicio_id === servicio_id
    );

    if (exists) return;

    setSelectedServices([
      ...selectedServices,
      {
  servicio_id,
  cantidad_sesiones: 1,
},
    ]);
  };

  const handleRemoveService = (
    servicio_id: number
  ) => {
    setSelectedServices(
      selectedServices.filter(
        (s) => s.servicio_id !== servicio_id
      )
    );
  };

  const handleChangeSessions = (
    servicio_id: number,
    sesiones: number
  ) => {
    setSelectedServices((prev) =>
      prev.map((s) =>
        s.servicio_id === servicio_id
          ? { ...s, cantidad_sesiones: sesiones }
          : s
      )
    );
  };

  const calculateTotal = (
    items: PackageItem[]
  ) => {
    return items.reduce((acc, item) => {
      const service = services.find(
        (s) =>
          s.servicio_id === item.servicio_id
      );

      if (!service) return acc;

      return (
        acc +
        service.precio *
        (item.pivot?.cantidad_sesiones ||
        item.cantidad_sesiones ||
        0)
      );
    }, 0);
  };

  const selectedTotal = useMemo(() => {
    return calculateTotal(selectedServices);
  }, [selectedServices, services]);

  // =========================
  // CREATE / EDIT
  // =========================
  const handleCreateOrEdit = async () => {
    if (!form.nombre) {
      alert("Debes agregar un nombre");
      return;
    }

    if (selectedServices.length === 0) {
      alert(
        "Debes agregar al menos un servicio"
      );
      return;
    }

    try {
      // =====================
      // EDIT MOCK
      // =====================
      if (editingPackage) {

        try {

          const response = await fetch(
            `${API_URL}/paquetes/${editingPackage.paquete_id}`,
            {
              method: "PUT",

              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },

              body: JSON.stringify({
                nombre: form.nombre,
                descripcion: form.descripcion,
                precio_total: Number(form.precio_total),
                servicios: selectedServices,
              }),
            }
          );

          const data = await response.json();

          console.log("UPDATE PACKAGE:", data);

          if (data.success) {

            alert("Paquete actualizado");

            await fetchPackages();

            setOpenModal(false);

            resetForm();

          } else {

            alert(
              data.message ||
              "Error al actualizar"
            );
          }

        } catch (error) {

          console.log(
            "ERROR UPDATE PACKAGE",
            error
          );
        }

        return;
      }

   // =====================
// CREATE REAL BACKEND
// =====================
try {
  const response = await fetch(
    `${API_URL}/paquetes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio_total: Number(form.precio_total),
        servicios: selectedServices,
      }),
    }
  );

  const data = await response.json();

  console.log(
    "CREATE PACKAGE:",
    data
  );

  if (!response.ok) {
    console.log("ERROR 422:", data);

    alert(
      data.message ||
        JSON.stringify(data)
    );

    return;
  }

  if (data.success) {
    alert(
      "Paquete creado correctamente"
    );

    await fetchPackages();

    setOpenModal(false);

    resetForm();
  } else {
    alert(
      data.message ||
        "Error al crear paquete"
    );
  }
} catch (error) {
  console.log(
    "ERROR CREATE PACKAGE",
    error
  );
}
    } catch (error) {
      console.log(
        "ERROR CREATE PACKAGE",
        error
      );
    }
  };

  const handleEdit = (
    pkg: ServicePackage
  ) => {
    setEditingPackage(pkg);

    setForm({
      nombre: pkg.nombre,
      descripcion: pkg.descripcion,
      precio_total: pkg.precio_total?.toString() || "",
    });

    setSelectedServices(

      pkg.servicios.map((item) => ({
        servicio_id: item.servicio_id,

        cantidad_sesiones:
          item.pivot?.cantidad_sesiones ||
          item.cantidad_sesiones ||
          1,
      }))
    );

    setOpenModal(true);
  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (
    id: number
  ) => {
    const confirmDelete = confirm(
      "¿Seguro que quieres eliminar este paquete?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/paquetes/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      console.log(
        "DELETE PACKAGE:",
        data
      );

      alert("Paquete eliminado");

      await fetchPackages();
    } catch (error) {
      console.log(
        "ERROR DELETE PACKAGE",
        error
      );
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="p-8">
        Cargando...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">
            Paquetes de servicios
          </h1>

          <p className="text-ink-muted mt-1">
            {packages.length} paquetes
            creados
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setOpenModal(true);
          }}
          className="bg-ink text-white px-4 py-2 rounded hover:bg-primary transition-colors"
        >
          + Nuevo paquete
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* SIDEBAR */}
        <div className="col-span-4 bg-surface border border-border rounded overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-ink">
              Mis paquetes
            </h2>
          </div>

          {packages.map((pkg) => (
            <button
              key={pkg.paquete_id}
              onClick={() =>
                setSelectedPackage(pkg)
              }
              className={`w-full text-left px-5 py-4 border-b border-border transition-colors hover:bg-bg ${
                selectedPackage?.paquete_id === pkg.paquete_id
                  ? "bg-bg"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ink">
                    {pkg.nombre}
                  </p>

                  <p className="text-sm text-ink-muted mt-1">
                    {pkg.descripcion}
                  </p>
                </div>

                <span className="text-xs font-bold text-ink-muted">
                  $
                  {pkg.precio_total}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* DETAIL */}
        <div className="col-span-8 bg-surface border border-border rounded overflow-hidden">
          {selectedPackage ? (
            <>
              <div className="px-6 py-5 border-b border-border flex items-start justify-between">
                <div>
                  <h2 className="font-display text-2xl text-ink">
                    {
                      selectedPackage.nombre
                    }
                  </h2>

                  <p className="text-ink-muted mt-1">
                    {
                      selectedPackage.descripcion
                    }
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleEdit(
                        selectedPackage
                      )
                    }
                    className="px-3 py-2 border border-border rounded text-sm hover:bg-bg"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(
                        selectedPackage.paquete_id
                      )
                    }
                    className="px-3 py-2 bg-red-500 text-white rounded text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {selectedPackage.servicios?.map(
                    (item) => {
                      const service =
                        services.find(
                          (s) =>
                            s.servicio_id ===
                            item.servicio_id
                        );

                      if (!service)
                        return null;

                      return (
                        <div
                          key={
                            item.servicio_id
                          }
                          className="border border-border rounded p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-ink">
                                {
                                  service.nombre
                                }
                              </p>

                              <p className="text-sm text-ink-muted mt-1">
                                {
                                  service.descripcion
                                }
                              </p>

                              <div className="flex gap-4 mt-3 text-sm text-ink-muted">
                                <span>
                                  {
                                    item.cantidad_sesiones
                                  }{" "}
                                  sesiones
                                </span>

                                <span>
                                  {
                                    service.duracion
                                  }{" "}
                                  min
                                </span>

                                <span>
                                  $
                                  {
                                    service.precio
                                  }{" "}
                                  c/u
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="font-bold text-ink">
                                $
                                {service.precio *
                                  (
                                    item.pivot?.cantidad_sesiones ||
                                    item.cantidad_sesiones ||
                                  0
                                  )
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
                  <div className="w-full">

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-ink">
                      Subtotal servicios
                    </span>

                    <span className="text-xl font-bold text-ink">
                      $
                      {calculateTotal(
                        selectedPackage.servicios
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-lg font-semibold text-ink">
                      Precio final del paquete
                    </span>

                    <span className="text-3xl font-bold text-ink">
                      $
                      {selectedPackage.precio_total}
                    </span>
                  </div>

                </div>

              </div>
            </>
          ) : (
            <div className="p-10 text-center text-ink-muted">
              Selecciona un paquete
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded w-[750px] max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl font-bold text-ink">
                {editingPackage
                  ? "Editar paquete"
                  : "Nuevo paquete"}
              </h2>
            </div>

            <div className="p-6 space-y-5">
              {/* NOMBRE */}
              <div>
                <label className="text-sm font-semibold">
                  Nombre
                </label>

                <input
                  className="w-full border border-border rounded p-2 mt-1"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nombre:
                        e.target.value,
                    })
                  }
                />
              </div>

              {/* DESCRIPCION */}
              <div>
                <label className="text-sm font-semibold">
                  Descripción
                </label>

                <textarea
                  rows={3}
                  className="w-full border border-border rounded p-2 mt-1"
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      descripcion:
                        e.target.value,
                    })
                  }
                />
              </div>

              {/* PRECIO */}
              <div>
                <label className="text-sm font-semibold">
                  Precio final del paquete
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  min={0}
                  className="w-full border border-border rounded p-2 mt-1"
                  value={form.precio_total}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      precio_total: e.target.value,
                    })
                  }
                />

                <p className="text-xs text-ink-muted mt-1">
                  Subtotal servicios: ${selectedTotal}
                </p>
              </div>

              {/* SERVICES */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-ink">
                    Servicios del paquete
                  </h3>

                  <span className="text-sm text-ink-muted">
                    Subtotal: $
                    {selectedTotal}
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedServices.map(
                    (item) => {
                      const service =
                        services.find(
                          (s) =>
                            s.servicio_id ===
                            item.servicio_id
                        );

                      if (!service)
                        return null;

                      return (
                        <div
                          key={
                            item.servicio_id
                          }
                          className="border border-border rounded p-4 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold">
                              {
                                service.nombre
                              }
                            </p>

                            <p className="text-sm text-ink-muted">
                              $
                              {
                                service.precio
                              }{" "}
                              por sesión
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min={1}
                              className="w-20 border border-border rounded p-2"
                              value={
                                item.cantidad_sesiones
                              }
                              onChange={(
                                e
                              ) =>
                                handleChangeSessions(
                                  item.servicio_id,
                                  Number(
                                    e.target
                                      .value
                                  )
                                )
                              }
                            />

                            <button
                              onClick={() =>
                                handleRemoveService(
                                  item.servicio_id
                                )
                              }
                              className="text-red-500 text-sm font-semibold"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* ADD SERVICES */}
              <div>
                <h3 className="font-semibold text-ink mb-3">
                  Agregar servicios
                </h3>

                <div className="space-y-2">
                  {services.map(
                    (service) => {
                      const alreadyAdded =
                        selectedServices.some(
                          (s) =>
                            s.servicio_id ===
                            service.servicio_id
                        );

                      return (
                        <div
                          key={
                            service.servicio_id
                          }
                          className="border border-border rounded p-4 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-ink">
                              {
                                service.nombre
                              }
                            </p>

                            <p className="text-sm text-ink-muted">
                              $
                              {
                                service.precio
                              }{" "}
                              ·{" "}
                              {
                                service.duracion
                              }{" "}
                              min
                            </p>
                          </div>

                          <button
                            disabled={
                              alreadyAdded
                            }
                            onClick={() =>
                              handleAddService(
                                service.servicio_id
                              )
                            }
                            className={`px-3 py-1 rounded text-sm font-semibold ${
                              alreadyAdded
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-ink text-white"
                            }`}
                          >
                            {alreadyAdded
                              ? "Agregado"
                              : "+"}
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-6 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => {
                  setOpenModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-border rounded"
              >
                Cancelar
              </button>

              <button
                onClick={
                  handleCreateOrEdit
                }
                className="px-4 py-2 bg-ink text-white rounded"
              >
                {editingPackage
                  ? "Guardar cambios"
                  : "Crear paquete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}