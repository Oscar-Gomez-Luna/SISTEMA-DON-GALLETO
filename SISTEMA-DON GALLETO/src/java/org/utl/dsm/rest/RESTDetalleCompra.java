package org.utl.dsm.rest;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.io.IOException;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.utl.dsm.controller.ControllerDetalleCompra;
import org.utl.dsm.model.DetalleCompra;

@Path("detalleCompra")
public class RESTDetalleCompra {

    @Path("getAll")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllDetalleCompra() {
        String out = "";
        try {
            ControllerDetalleCompra cdc = new ControllerDetalleCompra();
            List<DetalleCompra> listaDetalleCompra = cdc.getAllDetalleCompras();
            Gson objGson = new Gson();
            out = objGson.toJson(listaDetalleCompra);
        } catch (ClassNotFoundException | SQLException | IOException ex) {
            out = "{\"error\":\"No se encontraron Detalles de Compra Registrados\n" + ex.getMessage() + "\"}";
        }
        return Response.ok(out).build();
    }

// Endpoint para confirmar compra y actualizar stock
    @Path("confirmarCompra")
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response confirmarCompra(String body) {
        String out = "";
        try {
            Gson gson = new Gson();
            JsonObject json = gson.fromJson(body, JsonObject.class);
            int idCompra = json.get("idCompra").getAsInt();

            ControllerDetalleCompra controller = new ControllerDetalleCompra();
            boolean exito = controller.confirmarCompra(idCompra);

            if (exito) {
                out = "{\"mensaje\":\"Compra con ID " + idCompra + " confirmada y stock actualizado.\"}";
            } else {
                out = "{\"error\":\"No se pudo confirmar la compra. Verifique el ID o el estado.\"}";
            }
        } catch (ClassNotFoundException | SQLException | IOException ex) {
            out = "{\"error\":\"Error al procesar la solicitud: " + ex.getMessage() + "\"}";
        }

        return Response.ok("{\"message\":\"Compra confirmada correctamente\"}")
                .type(MediaType.APPLICATION_JSON)
                .build();

    }
}
