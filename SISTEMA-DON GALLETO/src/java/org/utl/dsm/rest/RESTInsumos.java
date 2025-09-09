package org.utl.dsm.rest;

import com.google.gson.Gson;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import org.utl.dsm.controller.ControllerInsumo;
import org.utl.dsm.model.AlertaInsumo;
import org.utl.dsm.model.Insumo;

/**
 *
 * @author ascen
 */
@Path("insumos")
public class RESTInsumos {

    private ControllerInsumo controllerinsumo;

    public RESTInsumos() {
        controllerinsumo = new ControllerInsumo();
    }

    //Mostrar todo
    @Path("getAllInsumos")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getAllinsumos() {
        String out = "";
        try {
            ControllerInsumo objCc = new ControllerInsumo();
            List<Insumo> listaInsumos = objCc.obtenerInsumos();

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

    //Merma insumos
    @Path("mermaInsumos")
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    public Response mermaInsumos(@FormParam("idInsumo") int idInsumo,
            @FormParam("cantidadMerma") double cantidadMerma,
            @FormParam("descripcion") String descripcion) {
        String out;
        try {
            Insumo insumo = new Insumo();
            insumo.setId_insumo(idInsumo);
            insumo.setCantidad(cantidadMerma);
            insumo.setDescripcion(descripcion);

            controllerinsumo.actualizarInsumoMerma(insumo);

            out = new Gson().toJson(
                    new MensajeResponse("Merma completada correctamente.")
            );
        } catch (Exception e) {
            e.printStackTrace();
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new Gson().toJson(
                            new MensajeResponse("Error: " + e.getMessage())
                    ))
                    .build();
        }

        return Response.ok(out).build();
    }

    // Clase para respuesta
    private static class MensajeResponse {

        private String result;

        public MensajeResponse(String result) {
            this.result = result;
        }

        public String getResult() {
            return result;
        }
    }

    //Alertas
    @Path("alertas")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response obtenerAlertas() {
        String jsonOutput;
        try {
            ControllerInsumo controllerInsumo = new ControllerInsumo();

            List<AlertaInsumo> alertas = controllerInsumo.verificarAlertas();

            Gson gson = new Gson();
            if (alertas == null || alertas.isEmpty()) {
                jsonOutput = "{\"message\":\"No hay insumos en alerta.\"}";
            } else {
                jsonOutput = gson.toJson(alertas);
            }

            return Response.ok(jsonOutput).build();
        } catch (Exception e) {
            e.printStackTrace();
            String errorResponse = "{\"error\":\"Ocurrió un error al procesar las alertas.\"}";
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse)
                    .build();
        }
    }
}
