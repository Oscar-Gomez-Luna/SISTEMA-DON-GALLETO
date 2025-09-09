// Cargar el stock inicial de todas las galletas
function cargarStock() {
    fetch("http://localhost:8080/DON_GALLETO_Ventas/api/produccion/obtenerStock")
            .then(response => {
                if (!response.ok) {
                    console.error("HTTP Error:", response.status, response.statusText);
                    throw new Error("Error al obtener el stock.");
                }
                return response.json();
            })
            .then(stockMap => {
                //console.log("Stock recibido:", stockMap);
                for (const id in stockMap) {
                    const contador = document.getElementById(`contador-${id}`);
                    if (contador) {
                        contador.textContent = stockMap[id];

                        // Cambiar el color del círculo según la cantidad
                        const circulo = document.getElementById(`circle-${id}`);
                        const cantidad = stockMap[id];
                        if (cantidad > 400) {
                            circulo.className = "status-circle status-green";
                        } else if (cantidad > 150) {
                            circulo.className = "status-circle status-yellow";
                        } else {
                            circulo.className = "status-circle status-red";
                        }
                    }
                }
            })
            .catch(error => console.error("Error al cargar el stock:", error));
}

// Sumar stock a una galleta
function addCookie(event, id) {
    event.stopPropagation();
    const contador = document.getElementById(`contador-${id}`);
    let cantidad = parseInt(contador.textContent, 10);
    cantidad++;
    contador.textContent = cantidad;

    fetch("http://localhost:8080/DON_GALLETO_Ventas/api/produccion/sumarStock", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id_galleta: id, existencia: 250})
    })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error al actualizar el stock en la base de datos." + response.status);
                }
                return response.json();
            })
            .then(() => {
                //console.log(`Stock actualizado para la galleta con ID: ${id}`);
                location.reload();
            })
            .catch(error => console.error("Error al actualizar el stock:", error));
}

function registrarMermaGalletas() {
    const idGalleta = parseInt(document.getElementById("tipoGalleta").value);
    const descripcionInput = document.getElementById("descripcionGalleta").value.trim();
    const descripcion = descripcionInput === "" ? "" : descripcionInput;
    const cantidad = parseInt(document.getElementById("cantidadGalleta").value);
    const fechaInput = document.getElementById("fechaGalleta");
    fechaInput.value = new Date().toISOString().split("T")[0];
    fechaInput.readOnly = true;

    if (!idGalleta || !cantidad || cantidad <= 0) {
        Swal.fire({
            title: "Campos incompletos",
            text: "Por favor, completa todos los campos correctamente.",
            icon: "warning",
            confirmButtonText: "Aceptar"
        });
        return;
    }

    let params = {
        g: idGalleta,
        c: cantidad,
        d: descripcion,
        f: fechaInput.value
    };

    fetch("http://localhost:8080/DON_GALLETO_Ventas/api/produccion/registrarMermaGalletas", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"},
        body: new URLSearchParams(params)
    })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error al registrar la merma de galletas.");
                }
                return response.json();
            })
            .then(() => {
                Swal.fire({
                    title: "Éxito",
                    text: "Merma de galletas descontada correctamente.",
                    icon: "success",
                    confirmButtonText: "Aceptar"
                });
                location.reload();
                cerrarModal("modalMermasGalleta");
            })
            .catch(error => {
                Swal.fire({
                    title: "Error",
                    text: "No se pudo registrar la merma de galletas. Intenta de nuevo.",
                    icon: "error",
                    confirmButtonText: "Aceptar"
                });
                console.error("Error al registrar merma de galletas:", error);
            });
}

// Registrar merma de insumos
function registrarMermaInsumos() {
    const idInsumo = parseInt(document.getElementById("tipoInsumo").value);
    const descripcionInput = document.getElementById("descripcionInsumo").value.trim();
    const descripcion = descripcionInput === "" ? "" : descripcionInput;
    const cantidad = parseInt(document.getElementById("cantidadInsumo").value);
    const fechaIsumos = document.getElementById("fechaInsumo");
    fechaIsumos.value = new Date().toISOString().split("T")[0];
    fechaIsumos.readOnly = true;

    if (!idInsumo || !cantidad || cantidad <= 0) {
    Swal.fire({
        title: "Campos incompletos",
        text: "Por favor, completa todos los campos correctamente.",
        icon: "warning",
        confirmButtonText: "Aceptar"
    });
    return;
}


    let params = {g: JSON.stringify(idInsumo), c: JSON.stringify(cantidad), d: JSON.stringify(descripcion)};

    //console.log(params);
    fetch("http://localhost:8080/DON_GALLETO_Ventas/api/produccion/registrarMermaInsumos", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"},
        body: new URLSearchParams(params)
    })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error al registrar la merma de insumos." + response.status);
                }
                return response.json();
            })
            .then(() => {
                cerrarModal("modalMermas");
                Swal.fire({
                    title: "Éxito",
                    text: "Merma de insumos descontada correctamente.",
                    icon: "success",
                    confirmButtonText: "Aceptar"
                });
            })
            .catch(error => console.error("Error al registrar merma de insumos:", error));
}

// Cerrar un modal
function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = "none";
    }
    limpiarFormulario(id);
}

// Abrir un modal
function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = "block";

        const fechaInput = document.getElementById("fechaGalleta");
        fechaInput.value = new Date().toISOString().split("T")[0];
        fechaInput.readOnly = true;
        
        const fechaIsumos = document.getElementById("fechaInsumo");
        fechaIsumos.value = new Date().toISOString().split("T")[0];
        fechaIsumos.readOnly = true;
    }
}

// Función para alternar la tarjeta (volteo)
function toggleCard(event) {
    const card = event.currentTarget;
    if (card.classList.contains("is-flipped")) {
        card.classList.remove("is-flipped");
    } else {
        card.classList.add("is-flipped");
    }
}

// Inicializar los datos al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    cargarStock();
});

function redireccionar(url) {
    window.location.href = "index.html";
}

function limpiarFormulario(id) {
    const contenedor = document.getElementById(id);
    if (!contenedor) return;

    const elementos = contenedor.querySelectorAll("input, textarea, select");

    elementos.forEach(el => {
        switch (el.type) {
            case "checkbox":
            case "radio":
                el.checked = false;
                break;
            case "number":
            case "text":
            case "date":
            case "textarea":
            case "select-one":
            case "select-multiple":
            default:
                el.value = "";
                break;
        }
    });
}
