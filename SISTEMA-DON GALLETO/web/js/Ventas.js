let ventas;

function cargarCatalogoVentas() {
    fetch("http://localhost:8080/DON_GALLETO_Ventas/api/venta/getAll?activo=true")
            .then(response => response.json())
            .then(response => {
                let mostrar = "";
                ventas = response;

                for (let i = 0; i < response.length; i++) {
                    mostrar += "<tr data-id-venta='" + response[i].id + "'>";
                    mostrar += "<td>" + response[i].fecha + "</td>";
                    mostrar += "<td>" + response[i].hora + "</td>";
                    mostrar += "<td> $ " + response[i].total + "</td>";
                    mostrar += "<td>" + response[i].descripcion + "</td>";
                    mostrar += "</tr>";
                }

                document.getElementById("tblVentas").innerHTML = mostrar;

                const filas = document.querySelectorAll("#tblVentas tr");
                filas.forEach(fila => {
                    fila.addEventListener("click", function () {
                        const idVenta = fila.getAttribute("data-id-venta");
                        cargarDetalleVenta(idVenta);
                    });
                });
            })
            .catch(error => {
                console.error("Error al cargar el catálogo de ventas:", error);
            });
}

function cargarDetalleVenta(idVenta) {
    fetch("http://localhost:8080/DON_GALLETO_Ventas/api/detalleVenta/getAll?activo=true")
            .then(response => response.json())
            .then(detalles => {
                let mostrarDetalles = "<ul>";

                const detallesVenta = detalles.filter(detalle => detalle.venta.id_venta == idVenta);

                for (let i = 0; i < detallesVenta.length; i++) {
                    mostrarDetalles += "<li>";
                    mostrarDetalles += "Producto " + (i + 1) + ": " + detallesVenta[i].galleta.galleta + "<br>";
                    mostrarDetalles += "Tipo de Producto: " + detallesVenta[i].galleta.tipo + "<br>";
                    mostrarDetalles += "Cantidad: " + detallesVenta[i].cantidad + " pz<br>";
                    mostrarDetalles += "Subtotal: $" + detallesVenta[i].subtotal + "<br>";
                    mostrarDetalles += "<br>";
                    mostrarDetalles += "</li>";
                }


                mostrarDetalles += "</ul>";

                document.querySelector(".descripcion-compra p").innerHTML = mostrarDetalles;
            })
            .catch(error => {
                console.error("Error al cargar los detalles de la venta:", error);
            });
}

function insertarVenta() {
    const detallesVenta = [];
    const filas = document.getElementById("tblDetalleVenta").getElementsByTagName("tr");

    let descripcion_venta = "";
    let total = 0;
    let tiposGalleta = new Set();

    for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const tipoGalleta = fila.querySelector("td:nth-child(1)").innerText;
        const precio = parseFloat(fila.querySelector("td:nth-child(2)").innerText);
        const cantidad = parseInt(fila.querySelector("td:nth-child(3)").innerText);
        const importe = parseFloat(fila.querySelector("td:nth-child(4)").innerText);
        const id_galleta = parseInt(fila.getAttribute("data-id"));

        descripcion_venta = "Venta de " + (i + 1) + " tipo de galletas.";

        total += importe;

        // Agregar el tipo de galleta al Set
        tiposGalleta.add(tipoGalleta);

        detallesVenta.push({
            galleta: {
                id_galleta: id_galleta
            },
            cantidad: cantidad,
            subtotal: importe
        });
    }
    const cantidadTiposGalleta = tiposGalleta.size;
    let tipos_de_venta = "";
    if (cantidadTiposGalleta > 1) {
        tipos_de_venta = "Variado";
    } else {
        tipos_de_venta = [...tiposGalleta][0];
    }
    let venta = {
        descripcion: descripcion_venta,
        total: total,
        ticket: "Ticket----------",
        tipo_venta: tipos_de_venta
    };

    let params = {v: JSON.stringify(venta), ldv: JSON.stringify(detallesVenta)};

    let ruta = "http://localhost:8080/DON_GALLETO_Ventas/api/venta/insertar";
    fetch(ruta, {
        method: "POST",
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
        body: new URLSearchParams(params)
    })
            .then(response => response.json())
            .then(response => {
                if (response.result) {
                    Swal.fire({
                        title: "Éxito",
                        text: "Venta realizada exitosamente.",
                        icon: "success",
                        confirmButtonText: "OK"
                    }).then((result) => {
                        if (result.isConfirmed) {
                            location.reload();
                        }
                    });
                }
                if (response.error) {
                    Swal.fire("¡Error!", response.error, "error");
                }
                cargarCatalogoVentas();
                document.getElementById("tblDetalleVenta").innerHTML = "";
                document.getElementById("total-importe").innerText = "Total: $00.00";
                document.getElementById("tipo_venta").style.display = 'block';
            })
            .catch(error => {
                console.error("Error al insertar laventa:", error);
                Swal.fire("Error", "Hubo un problema al insertar la venta", "error");
            });
}

function cargarSelectGalletas(galletas, tipoVentaSeleccionado) {
    let galletasFiltradas;

    if (tipoVentaSeleccionado === 'Por Kilo' || tipoVentaSeleccionado === 'Por Cantidad Monetaria') {
        galletasFiltradas = galletas.filter(galleta => galleta.tipo === 'Unidad');
    } else {
        galletasFiltradas = galletas.filter(galleta => galleta.tipo === tipoVentaSeleccionado);
    }

    let datosGalletas = `
        <option value='' disabled selected>
            Selecciona un tipo de galleta
        </option>`;

    galletasFiltradas.forEach(galleta => {
        datosGalletas += `
            <option value='${galleta.id_galleta}' 
                    data-precio='${galleta.costo}' 
                    data-existencia='${galleta.existencia}'>
                ${galleta.galleta}
            </option>`;
    });

    document.getElementById("tipoGalleta").innerHTML = datosGalletas;

    // Evento para actualizar el precio y calcular total
    document.getElementById("tipoGalleta").addEventListener("change", function () {
        let selectedOption = this.options[this.selectedIndex];
        let precio = selectedOption.getAttribute("data-precio");
        document.getElementById("precio").value = precio;

        calcularTotal(); 
    });

    // Evento para recalcular el total al cambiar la cantidad
    document.getElementById("cantidad").addEventListener("input", calcularTotal);
}

function cargarSelectTipoVenta() {
    fetch("http://localhost:8080/DON_GALLETO_Ventas/api/galleta/getAll")
            .then(response => response.json())
            .then(response => {
                let galletas = response;
                
                // Usamos un Set para almacenar tipos de venta únicos
                let tiposVentaUnicos = new Set();

                let datosGalletas = `
                <option value='' disabled selected>
                    Selecciona un tipo de venta
                </option>`;

                galletas.forEach(galleta => {
                    if (!tiposVentaUnicos.has(galleta.tipo)) {
                        tiposVentaUnicos.add(galleta.tipo);
                        datosGalletas += `
                        <option value='${galleta.tipo}'>
                            ${galleta.tipo}
                        </option>`;
                    }
                });
                datosGalletas += `
                        <option value='Por Kilo'>
                            Por Kilo
                        </option>`;
                datosGalletas += `
                        <option value='Por Cantidad Monetaria'>
                            Por Cantidad Monetaria
                        </option>`;

                document.getElementById("tipo_venta").innerHTML = datosGalletas;

                // Añadir el evento al cambio del tipo de venta
                document.getElementById("tipo_venta").addEventListener("change", function () {
                    cargarSelectGalletas(galletas, this.value); 
                });
            })
            .catch(error => {
                console.error("Error al cargar los tipos de venta:", error);
                document.getElementById("tipo_venta").innerHTML = `
                <option value='' disabled selected>
                    Error al cargar tipos de venta
                </option>`;
            });
}

function calcularTotal() {
    let precio = parseFloat(document.getElementById("precio").value) || 0;
    let cantidad = parseInt(document.getElementById("cantidad").value) || 0;
    let total = precio * cantidad;

    document.getElementById("total").value = total.toFixed(2);
}

let totalAcumulado = 0;

function guardarDetalleVenta() {
    let tipoGalletaSelect = document.getElementById("tipoGalleta");
    let tipoGalletaTexto = tipoGalletaSelect.options[tipoGalletaSelect.selectedIndex].text;
    let precio = parseFloat(document.getElementById("precio").value);
    let cantidad = parseInt(document.getElementById("cantidad").value);
    let total = parseFloat(document.getElementById("total").value);
    let id = parseFloat(document.getElementById("tipoGalleta").value);

    if (!cantidad || cantidad <= 0) {
        Swal.fire("¡Error!", "Por favor ingresa una cantidad válida.", "error");
        return;
    }

    const selectOption = document.querySelector(`#tipoGalleta option[value='${id}']`);
    const existencia = parseInt(selectOption.getAttribute("data-existencia"));

    if (cantidad > existencia) {
        Swal.fire("¡Error!", `La cantidad solicitada de ${tipoGalletaTexto} excede la existencia (${existencia}).`, "error");
        return;
    }

    // Crear una nueva fila con botones de "Eliminar" y "Agregar"
    let nuevaFila = `
    <tr data-id="${id}">
        <td>${tipoGalletaTexto}</td>
        <td>${precio.toFixed(2)}</td>
        <td>${cantidad}</td>
        <td>${total.toFixed(2)}</td>
        <td>
            <button type="button" onclick="eliminarFila(this)">Eliminar</button>
            <button type="button" onclick="agregarFila(this)">Agregar</button>
        </td>
    </tr>`;

    document.getElementById("tblDetalleVenta").insertAdjacentHTML('beforeend', nuevaFila);

    totalAcumulado += total;

    document.getElementById("total-importe").innerText = `$${totalAcumulado.toFixed(2)}`;
    document.getElementById('tipo_venta').style.display = 'none';

    document.getElementById("ventaForm").reset();
    document.getElementById("precio").value = "";
    document.getElementById("total").value = ""; 

    cerrarModalVenta();
}

function cerrarModalRegistroPago() {
    document.getElementById("modalRegistroPago").style.display = "none";
}

function cobrarVenta(conTicket, idVenta) {
    const total = parseFloat(document.getElementById("montoTotal").value);
    const pagado = parseFloat(document.getElementById("montoPagado").value);
    const cambio = parseFloat(document.getElementById("cambio").value);

    if (pagado < total) {
        Swal.fire("Error", "El monto pagado es insuficiente.", "error");
        return;
    }

    insertarVenta();
    cerrarModalRegistroPago();

    if (conTicket) {

        generarTicket(total, pagado, cambio);


    }

    cerrarModalRegistroPago();
    Swal.fire({
        title: "Éxito",
        text: "Venta realizada exitosamente.",
        icon: "success",
        confirmButtonText: "OK"
    }).then((result) => {
        if (result.isConfirmed) {
            location.reload();
        }
    });


}

function generarTicket(total, pagado, cambio) {
    // Crear el contenido del ticket
    let ticketContenido = `
        <html>
        <head>
            <style>
                body {
                    font-family: Helvetica, Arial, sans-serif;
                    font-size: 10px;
                    margin: 0;
                    padding: 0;
                    width: 250px;
                }
                .ticket {
                    padding: 10px;
                    text-align: left;
                    border: 1px solid #000;
                    width: 100%;
                }
                .ticket h2 {
                    margin: 0;
                    font-size: 12px;
                    text-align: center;
                }
                .ticket p {
                    margin: 2px 0;
                }
                .ticket table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    font-size: 10px; /* Ajusta el tamaño de la fuente */
                }
                .ticket th, .ticket td {
                    border: 1px solid #000;
                    padding: 3px;
                    text-align: center;
                }
                .ticket th {
                    font-weight: bold;
                }
                .ticket .total {
                    margin-top: 10px;
                    font-weight: bold;
                    text-align: left;
                }
                .ticket .line {
                    border-top: 1px dashed #000;
                    margin: 5px 0;
                }
            </style>
        </head>
        <body>
            <div class="ticket">
                <h2>Ticket de Venta</h2>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Hora:</strong> ${new Date().toLocaleTimeString()}</p>
                <div class="line"></div>
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Importe</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    // Agregar los detalles de los productos
    const filasDetalle = document.getElementById("tblDetalleVenta").getElementsByTagName("tr");

    for (let i = 0; i < filasDetalle.length; i++) {
        const fila = filasDetalle[i];
        const tipoGalleta = fila.querySelector("td:nth-child(1)").innerText; 
        const precio = parseFloat(fila.querySelector("td:nth-child(2)").innerText);
        const cantidad = parseInt(fila.querySelector("td:nth-child(3)").innerText);
        const importe = parseFloat(fila.querySelector("td:nth-child(4)").innerText);

        ticketContenido += `
            <tr>
                <td>Galleta de ${tipoGalleta}</td>
                <td>${cantidad}</td>
                <td>$${precio.toFixed(2)}</td>
                <td>$${importe.toFixed(2)}</td>
            </tr>
        `;
    }

    ticketContenido += `
                    </tbody>
                </table>
                <div class="line"></div>
                <div class="total">
                    <p>Subtotal: $${total.toFixed(2)}</p>
                    <p>Total: $${total.toFixed(2)}</p>
                    <p>Pagado: $${pagado.toFixed(2)}</p>
                    <p>Cambio: $${cambio.toFixed(2)}</p>
                </div>
                <div class="line"></div>
                <p>Gracias por su compra!</p>
            </div>
        </body>
        </html>
    `;

    // Crear una ventana emergente con un tamaño adecuado
    const ventanaImpresion = window.open('', '', 'width=300,height=500,scrollbars=yes');
    ventanaImpresion.document.write(ticketContenido);
    ventanaImpresion.document.close();
}

function abrirModalRegistroPago() {
    const totalbien = totalAcumulado || 0;

    document.getElementById("montoTotal").value = totalbien;

    document.getElementById("montoPagado").value = '';
    document.getElementById("cambio").value = '';

    document.getElementById("modalRegistroPago").style.display = "block";
}

function calcularCambio() {
    const total = parseFloat(document.getElementById("montoTotal").value) || 0;
    const pagado = parseFloat(document.getElementById("montoPagado").value) || 0;
    const cambio = Math.max(pagado - total, 0);
    document.getElementById("cambio").value = cambio.toFixed(2);
}

function abrirmodalmerma() {
    document.getElementById("modalMermas").style.display = "flex";
}

// Función para cerrar el modal
function cerrarmodalmerma() {
    document.getElementById("modalMermas").style.display = "none";
}

function cargarSelectGalletas2() {
    fetch("http://localhost:8080/DON_GALLETO_Ventas/api/galleta/getAll")
            .then(response => response.json())
            .then(response => {
                let galletas = response;
                let datosGalletas = `
            <option value='' disabled selected>
                Selecciona un tipo de galleta
            </option>`;

                galletas.forEach(galleta => {
                    if (galleta.tipo === 'Unidad') { 
                        datosGalletas += `
                    <option value='${galleta.galleta}'>
                        ${galleta.galleta}
                    </option>`;
                    }
                });

                document.getElementById("tipoGalleta2").innerHTML = datosGalletas;
            })
            .catch(error => {
                console.error("Error al cargar las galletas:", error);
                document.getElementById("tipoGalleta2").innerHTML = `
            <option value='' disabled selected>
                Error al cargar galletas
            </option>`;
            });
}

function guardarMerma() {
    const nombreGalleta = document.getElementById('tipoGalleta2').value;
    const cantidad = document.getElementById('cantidad2').value;
    const descripcion = document.getElementById('descripcion').value;
    const fecha = document.getElementById('fecha').value;

    if (!nombreGalleta || cantidad <= 0 || !descripcion || !fecha) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor, completa todos los campos: galleta, cantidad, descripción y fecha.'
        });
        return;
    }

    const url = `http://localhost:8080/DON_GALLETO_Ventas/api/galleta/disminuirCantidad?nombreGalleta=${encodeURIComponent(nombreGalleta)}&cantidad=${cantidad}`;

    fetch(url)
            .then(response => response.json()) // Convertimos la respuesta a formato JSON
            .then(data => {
                
                if (data.message) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Éxito',
                        text: data.message
                    });
                } else if (data.error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Error: ' + data.error
                    });
                }
                limpiarFormulario();
                cerrarmodalmerma();
            })
            .catch(error => {
                console.error("Error en la solicitud:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Hubo un error al realizar la solicitud.'
                });
            });
}

function limpiarFormulario() {
    document.getElementById('tipoGalleta2').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('cantidad2').value = '';
    document.getElementById('fecha').value = '';
}

function eliminarFila(boton) {
    let fila = boton.parentNode.parentNode;
    fila.remove();
    document.getElementById('tipo_venta').style.display = 'block';
}

function agregarFila(boton) {
    const selectTipoVenta = document.getElementById('tipo_venta');

    selectTipoVenta.value = '';

    selectTipoVenta.style.display = 'block';

    selectTipoVenta.focus();
}


// Funciones para abrir y cerrar el modal
function cerrarModalVENTAS() {
    document.getElementById('modalVENTAS').style.display = 'none';
}

function abrirModalventas() {
    document.getElementById('modalVENTAS').style.display = 'flex';
}

function cerrarModalVenta() {
    document.getElementById('modalVenta').style.display = 'none';
}

function abrirModalVenta() {
    const selectTipoVenta = document.getElementById('tipo_venta');
    const tipoVentaSeleccionada = selectTipoVenta.value;

    if (tipoVentaSeleccionada) {
        document.getElementById('tipoVenta').value = tipoVentaSeleccionada;

        document.getElementById('modalVenta').style.display = 'block';
    }
}

function redireccionar(url) {
    window.location.href = "index.html";
}