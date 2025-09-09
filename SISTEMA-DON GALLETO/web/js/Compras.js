// Cargar los proveedores
function cargarProveedores() {
    fetch('http://localhost:8080/DON_GALLETO_Ventas/api/compra/getAllProveedores')
            .then(response => response.json())
            .then(data => {
                const select = document.getElementById('proveedor');
                select.innerHTML = '<option value="" selected disabled>Seleccione el proveedor</option>';
                if (data && data.length > 0) {
                    data.forEach(proveedor => {
                        const option = document.createElement('option');
                        option.value = proveedor.id_proveedor;
                        option.textContent = proveedor.nombreProveedor;
                        select.appendChild(option);
                    });
                } else {
                    const option = document.createElement('option');
                    option.value = "";
                    option.textContent = "No se encontraron proveedores";
                    select.appendChild(option);
                }
            })
            .catch(error => {
                console.error('Error al cargar proveedores:', error);
                const select = document.getElementById('proveedor');
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "Error al cargar proveedores";
                select.appendChild(option);
            });
}

window.onload = cargarProveedores;

//Cargar los insumos
function cargarInsumos(idProveedor) {
    fetch(`http://localhost:8080/DON_GALLETO_Ventas/api/compra/getAllInsumos/${idProveedor}`)
            .then(response => response.json())
            .then(data => {
                const selectInsumos = document.getElementById('insumocarrito');
                // Limpiar las opciones previas
                selectInsumos.innerHTML = '<option value="" selected disabled>Seleccione el insumo</option>';

                if (Array.isArray(data) && data.length > 0) {
                    data.forEach(insumo => {
                        const option = document.createElement('option');
                        option.value = insumo.id_insumo;
                        option.textContent = insumo.nombreInsumo;
                        selectInsumos.appendChild(option);
                    });
                } else {
                    const option = document.createElement('option');
                    option.value = "";
                    option.textContent = "No hay insumos disponibles para este proveedor";
                    selectInsumos.appendChild(option);
                }
            })
            .catch(error => {
                console.error('Error al cargar los insumos:', error);
            });
}

// Actualizar automáticamente la unidad al seleccionar un insumo
const selectInsumo = document.getElementById('insumocarrito');
selectInsumo.addEventListener('change', async function() {
    const idInsumo = this.value;
    if (!idInsumo) return;

    try {
        const response = await fetch(`http://localhost:8080/DON_GALLETO_Ventas/api/compra/getUnidadInsumo/${idInsumo}`);
        const data = await response.json();
        if (data.unidad) {
            document.getElementById('pesocarrito').value = data.unidad;
        } else {
            document.getElementById('pesocarrito').value = '';
        }
    } catch (err) {
        console.error('Error al obtener la unidad del insumo:', err);
        document.getElementById('pesocarrito').value = '';
    }
});


// Obtener el ID del proveedor
function obtenerProveedorSeleccionado() {
    const proveedorId = document.getElementById("proveedor").value;
    return {id: proveedorId};
}
// Enviar el carrito
async function enviarCarrito() {
    if (carrito.length === 0) {
        Swal.fire({
            title: "Carrito vacío",
            text: "Por favor, agregue artículos antes de comprar.",
            icon: "warning",
            confirmButtonText: "Aceptar"
        });
        return;
    }
    const proveedorSelect = document.getElementById('proveedor');
    const id_proveedor = proveedorSelect.value;

    if (!id_proveedor) {
        Swal.fire({
            title: "Proveedor no seleccionado",
            text: "Por favor, seleccione un proveedor.",
            icon: "warning",
            confirmButtonText: "Aceptar"
        });
        return;
    }

    // Estructura del objeto
    const compra = {
        proveedor: {id_proveedor: id_proveedor},
        fecha: new Date().toISOString().split("T")[0],
        cantidad: carrito.reduce((sum, item) => sum + parseInt(item.cantidad), 0),
        peso: carrito.reduce((sum, item) => sum + parseFloat(item.peso || 0), 0),
        precio: carrito.reduce((sum, item) => sum + parseFloat(item.precio || 0), 0),
    };

    const insumosJson = JSON.stringify(carrito); // Convertir el carrito a JSON

    try {
        const response = await fetch("http://localhost:8080/DON_GALLETO_Ventas/api/compra/insertarCompra", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                compra: JSON.stringify(compra),
                insumosJson: insumosJson,
            }),
        });

        if (response.ok) {
            const result = await response.json();
            Swal.fire({
                title: "Éxito",
                text: result.result || "Compra realizada con éxito.",
                icon: "success",
                confirmButtonText: "Aceptar"
            }).then(() => {
                carrito = [];
                actualizarTabla();
                obtenerCompras();

                // Reiniciar el select
                const select = document.getElementById('proveedor');
                select.innerHTML = '<option value="" selected disabled>Seleccione el proveedor</option>';

                cargarProveedores();
            });
        } else {
            const error = await response.json();
            Swal.fire({
                title: "Error",
                text: error.error || "Hubo un error al procesar la compra.",
                icon: "error",
                confirmButtonText: "Aceptar"
            });
        }
    } catch (error) {
        console.error("Error al enviar el carrito:", error);
        Swal.fire({
            title: "Error",
            text: "No se pudo enviar la compra. Por favor, intente nuevamente.",
            icon: "error",
            confirmButtonText: "Aceptar"
        });
    }
}

// Detectar el cambio en el select
document.getElementById('proveedor').addEventListener('change', function () {
    var proveedorSeleccionado = this.value;
    if (proveedorSeleccionado) {
        abrirModalCompras();
    }
});

document.getElementById("btnComprar").addEventListener("click", enviarCarrito);

// /////////////////////////////////////////////////////////////////////////////
//Funcionalidad del modal
let carrito = [];
//Funcionalidad del modal
async function guardar() {
    const selectInsumo = document.getElementById('insumocarrito');
    const insumoId = selectInsumo.value;
    const insumoTexto = selectInsumo.options[selectInsumo.selectedIndex]?.text || "";

    const proveedorSelect = document.getElementById('proveedor');
    const proveedor = proveedorSelect.value;

    const cantidad = parseInt(document.getElementById('cantidadcarrito').value);
    const precio = parseFloat(document.getElementById('preciocarrito').value);
    const peso = parseFloat(document.getElementById('pesocarrito').value);

    const fechaInput = document.getElementById('fechacarrito');
    if (!fechaInput.value) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }
    const fecha = fechaInput.value;

    const total = cantidad * precio;

    if (!insumoId || !proveedor || isNaN(cantidad) || isNaN(precio) || isNaN(peso) || !fecha) {
        Swal.fire({
            title: "Error",
            text: "Todos los campos son obligatorios y deben ser válidos.",
            icon: "error",
            confirmButtonText: "Aceptar"
        });
        return;
    }

    // Construir objeto compra
    const compra = {
        proveedor: {id_proveedor: parseInt(proveedor)},
        cantidad: cantidad,
        precio: precio,
        peso: peso,
        fecha: fecha,
        estatus: 1
    };

    try {
        const response = await fetch("http://localhost:8080/DON_GALLETO_Ventas/api/compra/validarCompra", {
            method: "POST",
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            body: new URLSearchParams({compra: JSON.stringify(compra)})
        });

        if (response.ok) {
            const nuevoItem = {
                insumo: insumoTexto,
                proveedor,
                cantidad,
                precio,
                total,
                fecha,
                peso
            };
            carrito.push(nuevoItem);

            //console.log("Carrito actualizado:", JSON.stringify(carrito, null, 2));

            limpiarCampos();
            actualizarTabla();
        } else {
            const error = await response.json();
            Swal.fire({
                title: "Error de validación",
                text: error.error || "Error en los datos de la compra.",
                icon: "error",
                confirmButtonText: "Aceptar"
            });
        }

    } catch (err) {
        console.error("Error al validar la compra:", err);
        Swal.fire({
            title: "Error",
            text: "No se pudo validar la compra. Intente nuevamente.",
            icon: "error",
            confirmButtonText: "Aceptar"
        });
    }
}

// Calcular el total
function calcularTotal() {
    const cantidad = parseFloat(document.getElementById('cantidadcarrito').value) || 0;
    const precio = parseFloat(document.getElementById('preciocarrito').value) || 0;
    const total = cantidad * precio;

    document.getElementById('totalcarrito').value = total.toFixed(2);
}

// /////////////////////////////////////////////////////////////////////////////

//Actualizar tabla
function actualizarTabla() {
    const tabla = document.querySelector('.table tbody');
    tabla.innerHTML = '';

    carrito.forEach((item, index) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${item.insumo}</td>
            <td>${item.proveedor}</td>
            <td>${item.cantidad}</td>
            <td>${item.precio}</td>
            <td>
                <button class="btn-delete" onclick="eliminarItem(${index})">
                <img src="img/eliminnar.png" alt="Eliminar" style="width: 30px; height: 30px;" />
            </button>
            </td>
        `;
        tabla.appendChild(fila);
    });
}

// Función para eliminar un elemento del carrito
function eliminarItem(index) {
    carrito.splice(index, 1);

    actualizarTabla();
}

// /////////////////////////////////////////////////////////////////////////////

//Solo permite numeros
function validarNumeros(cantidadcarrito) {
    cantidadcarrito.value = cantidadcarrito.value.replace(/[^0-9]/g, '');
}

//Solo permite nummeros y pubto decimal
function validarNumero(pesocarrito) {
    pesocarrito.value = pesocarrito.value.replace(/[^0-9.]/g, '');

    if ((pesocarrito.value.match(/\./g) || []).length > 1) {
        pesocarrito.value = pesocarrito.value.replace(/\.(?=.*\.)/g, '');
    }
}

function validarNumer(preciocarrito) {
    preciocarrito.value = preciocarrito.value.replace(/[^0-9.]/g, '');

    if ((preciocarrito.value.match(/\./g) || []).length > 1) {
        preciocarrito.value = preciocarrito.value.replace(/\.(?=.*\.)/g, '');
    }
}

// /////////////////////////////////////////////////////////////////////////////

function limpiarCampos() {
    var insumocarrito = document.getElementById('insumocarrito');
    var cantidadcarrito = document.getElementById('cantidadcarrito');
    var pesocarrito = document.getElementById('pesocarrito');
    var precciocarrito = document.getElementById('preciocarrito');
    var totalcarrito = document.getElementById('totalcarrito');
    var fecha = document.getElementById('fechacarrito');

    insumocarrito.value = '';
    cantidadcarrito.value = '';
    pesocarrito.value = '';
    precciocarrito.value = '';
    totalcarrito.value = '';
    fecha.value = new Date().toISOString().split('T')[0];
}

function obtenerCompras() {
    const url = 'http://localhost:8080/DON_GALLETO_Ventas/api/compra/getAll';

    fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al obtener los datos de la API');
                }
                return response.json();
            })
            .then(data => {
                mostrarComprasEnTabla(data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
}

function mostrarComprasEnTabla(compras) {
    const tablaBody = document.querySelector('.tabla-ventas tbody');
    tablaBody.innerHTML = '';

    compras.forEach(compra => {
        const fila = document.createElement('tr');

        const celdaFecha = document.createElement('td');
        celdaFecha.textContent = compra.fecha;
        fila.appendChild(celdaFecha);

        const celdaHora = document.createElement('td');
        celdaHora.textContent = compra.numeroOrden || 'No disponible';
        fila.appendChild(celdaHora);

        const celdaCosto = document.createElement('td');
        celdaCosto.textContent = "$" + compra.precio;
        fila.appendChild(celdaCosto);

        const celdaEstatus = document.createElement('td');
        celdaEstatus.textContent = (compra.estatus === 0) ? 'Pendiente' : 'Entregado';
        fila.appendChild(celdaEstatus);

        fila.addEventListener('click', () => {
            mostrarDescripcionCompra(compra);
        });

        tablaBody.appendChild(fila);
    });

}

function mostrarDescripcionCompra(compra) {
    const descripcionContenedor = document.querySelector('.descripcion-compra p');
    const boton = document.getElementById('botonAccion');
    boton.style.display = 'none';

    fetch('http://localhost:8080/DON_GALLETO_Ventas/api/detalleCompra/getAll')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al obtener los detalles de la compra');
                }
                return response.json();
            })
            .then(detalles => {
                const detalleCompra = detalles.find(detalle => detalle.compra.id_comprasRealizadas === compra.id_comprasRealizadas);

                if (detalleCompra) {
                    const descripcionJSON = JSON.parse(detalleCompra.descripcion);
                    let detallesHTML = descripcionJSON.map(det => `
                    <li>
                        <strong>Insumo:</strong> ${det.insumo} <br>
                        <strong>Unidad:</strong> ${det.peso}<br>
                        <strong>Precio Unitario:</strong> $${det.precio} <br>
                        <strong>Cantidad:</strong> ${det.cantidad} <br>
                        <strong>Total:</strong> $${det.total_precio} <br>
                    </li>
                `).join('');

                    descripcionContenedor.innerHTML = `<ul>${detallesHTML}</ul>`;

                    if (compra.estatus === 0) {
                        boton.style.display = 'block';
                        boton.onclick = () => confirmarCompra(compra);
                    } else {
                        boton.style.display = 'none';
                    }

                } else {
                    descripcionContenedor.textContent = 'No se encontraron detalles para esta compra.';
                    boton.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                descripcionContenedor.textContent = 'Error al obtener los detalles de la compra.';
                boton.style.display = 'none';
            });
}

function confirmarCompra(compra) {
    fetch('http://localhost:8080/DON_GALLETO_Ventas/api/detalleCompra/confirmarCompra', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({idCompra: compra.id_comprasRealizadas})
    })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la solicitud');
                }
                return response.json().catch(() => ({})); // por si la API no devuelve nada
            })
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: '¡Compra confirmada!',
                    text: 'La compra ha sido confirmada correctamente.'
                }).then(() => {
                    obtenerCompras();
                    mostrarDescripcionCompra(compra);
                });
            })
            .catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Hubo un problema al confirmar la compra: ' + error.message
                });
            });
}

document.addEventListener('DOMContentLoaded', function () {
    obtenerCompras();
});

function abrirModalVENTAS() {
    const modal = document.getElementById("modalVENTAS");
    modal.style.display = "flex";
    obtenerCompras();
}

function cerrarModalVENTAS() {
    const modal = document.getElementById("modalVENTAS");
    modal.style.display = "none";
}

// /////////////////////////////////////////////////////////////////////////////

//Funcion del modal abrir y cerrar
function abrirModalCompras() {
    const proveedorID = document.getElementById("proveedor").value;

    if (proveedorID) {
        document.getElementById('modalCarrito').style.display = 'flex';
        const proveedorNombre = document.querySelector("#proveedor option:checked").text;
        document.getElementById('proveedorcarrito').value = proveedorNombre;
        cargarInsumos(proveedorID);
        const fechaActual = new Date();
        const fechaFormateada = fechaActual.toISOString().split('T')[0];
        document.getElementById('fechacarrito').value = fechaFormateada;
    }
}

function cerrarModalCompras() {
    document.getElementById('modalCarrito').style.display = 'none';
}

function abrirModal() {
    document.getElementById('modal').style.display = 'flex';
    limpiarCamposProveedor();
}

function limpiarCamposProveedor() {
    var nombreProveedorInput = document.getElementById('nombreProveedorInput');

    nombreProveedorInput.value = '';
}

function cerrarModal() {
    document.getElementById('modal').style.display = 'none';
    limpiarCamposProveedor();
}

function abrirModalPROVEEDOR() {
    document.getElementById('modalVENTAS').style.display = 'flex'; 
}

function cerrarModalPROVEEDOR() {
    const modal = document.getElementById('modalVENTAS');
    modal.style.display = 'none';

    const descripcionContenedor = document.querySelector('.descripcion-compra p');
    descripcionContenedor.textContent = 'Compra seleccionada.';

    // Ocultar el botón
    const boton = document.getElementById('botonAccion');
    boton.style.display = 'none';
}

function redireccionar(url) {
    window.location.href = "index.html";
}

function agregarProveedor(event) {
    event.preventDefault();

    var nombreProveedor = document.getElementById('nombreProveedorInput').value.trim();

    //console.log("Valor de 'nombreProveedor' capturado:", nombreProveedor);

    if (!nombreProveedor) {
        //console.log("El nombre del proveedor está vacío.");

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El nombre del proveedor no puede estar vacío.'
        });

        return;
    }

    // Crear el objeto proveedor
    var proveedor = {
        nombreProveedor: nombreProveedor
    };

    //console.log("Objeto proveedor enviado:", proveedor);

    // Crear la petición AJAX
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'http://localhost:8080/DON_GALLETO_Ventas/api/proveedor/add', true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = function () {
        if (xhr.status === 200) {
            Swal.fire({
                icon: 'success',
                title: 'Proveedor Agregado',
                text: 'Proveedor agregado con éxito: ' + nombreProveedor
            });
            limpiarCamposProveedor();
            cargarProveedores();
            cerrarModal();
        } else {
            //console.log("Error al agregar proveedor. Estado:", xhr.status);

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un error al agregar el proveedor.'
            });
        }
    };

    // Enviar el objeto proveedor como JSON
    xhr.send(JSON.stringify(proveedor));
}
