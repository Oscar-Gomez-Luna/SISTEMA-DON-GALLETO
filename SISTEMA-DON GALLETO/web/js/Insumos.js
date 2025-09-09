let insumos;
//Alertas
function cargarAlertas() {
    const apiUrl = "http://localhost:8080/DON_GALLETO_Ventas/api/insumos/alertas";

    fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                //console.log("Datos recibidos de las alertas:", data);

                const alertasDiv = document.getElementById("alertas");

                alertasDiv.innerHTML = "";

                if (Array.isArray(data)) {
                    data.forEach(alerta => {
                        const alertaElemento = document.createElement("p");

                        alertaElemento.textContent = alerta.mensajeAlerta;

                        if (alerta.mensajeAlerta.includes("está a punto de acabarse")) {
                            alertaElemento.style.background = "yellow";
                        } else if (alerta.mensajeAlerta.includes("tiene que resurtirse")) {
                            alertaElemento.style.background = "red";
                            alertaElemento.style.color = "white";
                        }

                        alertasDiv.appendChild(alertaElemento);
                    });
                } else if (data.message) {
                    const mensaje = document.createElement("p");
                    mensaje.textContent = data.message;
                    mensaje.style.color = "gray";
                    alertasDiv.appendChild(mensaje);
                } else {
                    const errorMensaje = document.createElement("p");
                    errorMensaje.textContent = "Formato de respuesta desconocido.";
                    errorMensaje.style.color = "gray";
                    alertasDiv.appendChild(errorMensaje);
                }
            })
            .catch(error => {
                console.error("Error al obtener las alertas:", error);
                alert("Ocurrió un error al cargar las alertas.");
            });
}

// Cargar todos los insumos
function cargarCatInsumos() {
    fetch("http://localhost:8080/DON_GALLETO_Ventas/api/insumos/getAllInsumos")
            .then(response => response.json())
            .then(response => {
                let mostrar = "";
                insumos = response;
                //console.log("Insumos cargados desde la API:", insumos);

                for (var i = 0; i < response.length; i++) {
                    let fecha = new Date(response[i].fecha);

                    if (isNaN(fecha)) {
                        fecha = new Date();
                    }

                    mostrar += '<tr>';
                    mostrar += '<td>' + response[i].nombreInsumo + '</td>';
                    mostrar += '<td>' + response[i].unidad + '</td>';
                    mostrar += '<td>' + response[i].cantidad + '</td>';
                    mostrar += '<td>' + response[i].total + '</td>';
                    mostrar += '<td> <button class="boton-tabla" onclick="modificarInsumo(' + i + ');"><img src="img/borrarmerma.png" alt="eliminar" style="width: 20px; height: 20px;"/></td>';
                    mostrar += '</tr>';
                }
                document.getElementById("tblInsumos").innerHTML = mostrar;
            })
            .catch(error => {
                console.error("Error al cargar los insumos:", error);
            });
}

window.onload = function () {
    // Cargar alertas e insumos por separado
    cargarCatInsumos();
    setTimeout(cargarAlertas, 1000);
};

//Merma
function enviarMerma() {
    const nombreInsumo = document.getElementById("insumomerma").value;
    const idInsumo = document.getElementById("insumomerma").getAttribute("data-id");
    const cantidadMerma = document.getElementById("cantidadmerma").value;
    const descripcion = document.getElementById("descripccionerma")?.value || "";

    if (!idInsumo || isNaN(cantidadMerma) || cantidadMerma <= 0) {
        Swal.fire({
            title: "Advertencia",
            text: "Por favor, ingrese valores válidos para el insumo y la cantidad de merma.",
            icon: "warning",
            confirmButtonText: "Aceptar"
        });
        return;
    }

    fetch("http://localhost:8080/DON_GALLETO_Ventas/api/insumos/mermaInsumos", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            idInsumo,
            cantidadMerma,
            descripcion
        })
    })
            .then(async response => {
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    Swal.fire({
                        title: "Error",
                        text: data.result || "Ocurrió un error al procesar la merma.",
                        icon: "error",
                        confirmButtonText: "Aceptar"
                    });
                    return;
                }

                Swal.fire({
                    title: "Éxito",
                    text: data.result || "Merma completada correctamente.",
                    icon: "success",
                    confirmButtonText: "Aceptar"
                });
                cerrarModal();
                cargarAlertas();
                cargarCatInsumos();
            })
            .catch(error => {
                console.error("Error al enviar la merma:", error);
                Swal.fire({
                    title: "Error",
                    text: "Se produjo un error al enviar la merma. Por favor, intente nuevamente.",
                    icon: "error",
                    confirmButtonText: "Aceptar"
                });
            });

}

function redireccionar(url) {
    window.location.href = "index.html";
}

//Agregar los insumos
function actualizarEstatusCompra(event) {
    if (!event) {
        event = window.event;
    }
    // Evita que la página se recargue si es un formulario
    event.preventDefault();

    const numeroOrden = document.getElementById('ordenCompra').value.trim();

    if (numeroOrden === "") {
        Swal.fire({
            icon: 'warning',
            title: 'Por favor ingresa un número de orden válido.',
            confirmButtonText: 'OK'
        });
        return;
    }

    const url = "http://localhost:8080/DON_GALLETO_Ventas/api/insumos/actualizarInsumos";

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `numeroOrden=${encodeURIComponent(numeroOrden)}`
    })
            .then(response => response.json())
            .then(data => {
                if (data.estatus === 1) {
                    Swal.fire({
                        icon: 'info',
                        title: 'La compra ya está registrada.',
                        confirmButtonText: 'OK'
                    });
                } else if (data.estatus === 0) {
                    Swal.fire({
                        icon: 'success',
                        title: 'La compra puede ser registrada.',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        limpiarCampos();
                        cargarCatInsumos();
                    });
                } else if (data.message) {
                    Swal.fire({
                        icon: 'success',
                        title: data.message,
                        confirmButtonText: 'OK'
                    }).then(() => {
                        limpiarCampos();
                        cargarCatInsumos();
                    });
                } else if (data.error) {
                    Swal.fire({
                        icon: 'error',
                        title: data.error,
                        confirmButtonText: 'OK'
                    });
                }
            })
            .catch(error => {
                console.error("Error de red:", error);
                Swal.fire({
                    icon: 'error',
                    title: `Error de red: ${error.message}`,
                    confirmButtonText: 'OK'
                });
            });
}
// /////////////////////////////////////////////////////////////////////////////
//Modales merma

function modificarInsumo(i) {
    let insumoSeleccionado = insumos[i];

    document.getElementById("insumomerma").value = insumoSeleccionado.nombreInsumo;

    document.getElementById("insumomerma").setAttribute("data-id", insumoSeleccionado.id_insumo);

    document.getElementById("modalMerma").style.display = "flex";

    const fechaActual = new Date();
    const fechaFormateada = fechaActual.toISOString().split('T')[0];
    document.getElementById('fechamerma').value = fechaFormateada;
}

function cerrarModal() {
    document.getElementById("modalMerma").style.display = "none";
    limpiarCampo();
}

function limpiarCampos() {
    var ordenCompra = document.getElementById('ordenCompra');
    var insumosAgregar = document.getElementById('insumosAgregar');
    var fechaagregar = document.getElementById('fechaagregar');

    ordenCompra.value = '';
    insumosAgregar.value = '';
    fechaagregar.value = new Date().toISOString().split('T')[0];
}

function limpiarCampo() {
    var insumomerma = document.getElementById('insumomerma');
    var descripccionerma = document.getElementById('descripccionerma');
    var cantidadmerma = document.getElementById('cantidadmerma');
    var fechamerma = document.getElementById('fechamerma');

    insumomerma.value = '';
    descripccionerma.value = '';
    cantidadmerma.value = '';
    fechamerma.value = new Date().toISOString().split('T')[0];
}

function validarNumero(cantidadmerma) {
    cantidadmerma.value = cantidadmerma.value.replace(/[^0-9.]/g, '');

    if ((cantidadmerma.value.match(/\./g) || []).length > 1) {
        cantidadmerma.value = cantidadmerma.value.replace(/\.(?=.*\.)/g, '');
    }
}