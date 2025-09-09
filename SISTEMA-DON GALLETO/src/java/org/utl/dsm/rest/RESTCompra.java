package org.utl.dsm.rest;

import com.google.gson.Gson;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.utl.dsm.controller.ControllerCompra;
import org.utl.dsm.model.Compra;
import java.util.List;
import org.utl.dsm.cqrs.CQRSCompra;
import org.utl.dsm.model.Insumo;
import org.utl.dsm.model.Proveedor;

@Path("compra")
public class RESTCompra {

    private ControllerCompra controllerCompra;

    public RESTCompra() {
        controllerCompra = new ControllerCompra();
    }

    @GET
    @Path("getAll")
    @Produces(MediaType.APPLICATION_JSON)
    public Response obtenerTodasLasCompras() {
        try {

            List<Compra> listaCompras = controllerCompra.obtenerTodasLasCompras();

            String jsonOutput = new Gson().toJson(listaCompras);

            return Response.ok(jsonOutput).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\":\"Error al obtener las compras: " + e.getMessage() + "\"}")
                    .build();
        }
    }

    @Path("getAllProveedores")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllproveedor() {
        String out = "";
        try {
            ControllerCompra objCc = new ControllerCompra();
            List<Proveedor> listaProvedores = objCc.obtenerProveedores();

            Gson objGson = new Gson();
            out = objGson.toJson(listaProvedores);
            if (listaProvedores == null || listaProvedores.isEmpty()) {
                out = "{\"message\":\"No se encontraron proveedores\"}";
            }
        } catch (Exception e) {
            out = "{\"error\":\"Se produjo un error en la ejecución\"}";
            e.printStackTrace();
        }
        return Response.ok(out).build();
    }

    @Path("getAllInsumos/{idProveedor}")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllInsumos(@PathParam("idProveedor") int idProveedor) {
        String out = "";
        try {
            ControllerCompra objCc = new ControllerCompra();
            List<Insumo> listaInsumos = objCc.obtenerInsumos(idProveedor);

            Gson objGson = new Gson();
            out = objGson.toJson(listaInsumos);
            if (listaInsumos == null || listaInsumos.isEmpty()) {
                out = "{\"message\":\"No se encontraron insumos\"}";
            }
        } catch (Exception e) {
            out = "{\"error\":\"Se produjo un error en la ejecución\"}";
            e.printStackTrace();
        }
        return Response.ok(out).build();
    }

    @Path("insertarCompra")
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    public Response insertarCompra(@FormParam("compra") String compraJson, @FormParam("insumosJson") String insumosJson) {
        Gson objGson = new Gson();
        Compra compra;

        try {
            compra = objGson.fromJson(compraJson, Compra.class);

            int resultado = controllerCompra.insertarCompra(compra, insumosJson);

            if (resultado == 1) {
                return Response.ok("{\"result\":\"Compra registrada exitosamente\"}").build();
            } else {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\":\"No se pudo insertar la compra.\"}")
                        .build();
            }
        } catch (Exception e) {
            String mensaje = e.getMessage();
            if (mensaje != null && mensaje.contains("obligatorio") || mensaje.contains("válido") || mensaje.contains("mayor")) {

                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\":\"" + mensaje + "\"}")
                        .build();
            } else {

                e.printStackTrace();
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity("{\"error\":\"Error al insertar la compra: " + mensaje + "\"}")
                        .build();
            }
        }
    }

    @Path("validarCompra")
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    public Response validarCompra(@FormParam("compra") String compraJson) {
        Gson objGson = new Gson();
        Compra compra;

        try {
            compra = objGson.fromJson(compraJson, Compra.class);

            CQRSCompra cqrs = new CQRSCompra();
            cqrs.agregarCompraConValidacion(compra, "[]");

            return Response.ok("{\"result\":\"validacion_ok\"}").build();
        } catch (Exception e) {
            e.printStackTrace();
            String errorMessage = String.format("{\"error\":\"%s\"}", e.getMessage().replace("\"", "\\\""));
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(errorMessage)
                    .build();
        }
    }

    @Path("getUnidadInsumo/{idInsumo}")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getUnidadInsumo(@PathParam("idInsumo") int idInsumo) {
        try {
            ControllerCompra controller = new ControllerCompra();
            String unidad = controller.obtenerUnidadInsumo(idInsumo);
            return Response.ok("{\"unidad\":\"" + unidad + "\"}").build();
        } catch (Exception e) {
            e.printStackTrace();
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\":\"No se pudo obtener la unidad\"}")
                    .build();
        }
    }

}
