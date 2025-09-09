package org.utl.dsm.rest;

import org.utl.dsm.controller.ControllerProduccion;
import org.utl.dsm.model.Galleta;
import com.google.gson.Gson;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.utl.dsm.dao.DAOProduccion;

@Path("produccion")
public class RestProduccion {

    private final ControllerProduccion controller = new ControllerProduccion();
    private final Gson gson = new Gson();

    @GET
    @Path("obtenerStock")
    @Produces(MediaType.APPLICATION_JSON)
    public Response obtenerStock() {
        try {
            List<Galleta> stock = controller.obtenerStock();

            Map<Integer, Integer> stockMap = new HashMap<>();
            for (Galleta galleta : stock) {
                stockMap.put(galleta.getId_galleta(), galleta.getExistencia());
            }

            // mapa a JSON
            String jsonOutput = gson.toJson(stockMap);

            return Response.ok(jsonOutput).build();
        } catch (Exception e) {
            e.printStackTrace();
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"message\":\"Error al obtener el stock.\"}")
                    .build();
        }
    }

    @POST
    @Path("sumarStock")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response sumarStock(String requestBody) {
        try {
            Galleta galleta = gson.fromJson(requestBody, Galleta.class);

            if (galleta.getId_galleta() <= 0 || galleta.getExistencia() <= 0) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"message\":\"Datos inválidos para actualizar el stock.\"}")
                        .build();
            }

            controller.sumarStock(galleta.getId_galleta(), galleta.getExistencia());
            return Response.ok("{\"message\":\"Stock actualizado correctamente.\"}").build();
        } catch (Exception e) {
            e.printStackTrace();
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"message\":\"Error al actualizar el stock en la base de datos.\"}")
                    .build();
        }
    }

    @Path("registrarMermaGalletas")
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    public Response registrarMermaGalletas(@FormParam("g") String galleta,
            @FormParam("c") String cantidad,
            @FormParam("d") String descripcion) {
        String out;
        try {
            String mensaje = DAOProduccion.registrarMermaGalletas(
                    Integer.parseInt(galleta),
                    Integer.parseInt(cantidad),
                    descripcion
            );

            out = "{\"message\":\"" + mensaje + "\"}";
            return Response.ok(out).build();
        } catch (SQLException ex) {
            out = "{\"error\":\"" + ex.getMessage() + "\"}";
            return Response.status(Response.Status.BAD_REQUEST).entity(out).build();
        } catch (Exception ex) {
            out = "{\"error\":\"Error inesperado: " + ex.getMessage() + "\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(out).build();
        }
    }

    @Path("registrarMermaInsumos")
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    public Response registrarMermaInsumos(@FormParam("g") @DefaultValue("") String galleta,
            @FormParam("c") @DefaultValue("") String cantidad,
            @FormParam("d") @DefaultValue("") String descripcion) {

        String out = "";
        try {

            ControllerProduccion cp = new ControllerProduccion();

            cp.registrarMermaInsumos(Integer.parseInt(galleta), Integer.parseInt(cantidad), descripcion);

            out = "{\"message\":\"Merma de galletas registrada correctamente.\"}";
            return Response.ok(out).build();
        } catch (Exception ex) {
            out = "{\"message\":\"No se encontraron Ventas Registrados\n" + ex.getMessage() + "\"}";
            return Response.ok(out).build();
        }
    }
}
