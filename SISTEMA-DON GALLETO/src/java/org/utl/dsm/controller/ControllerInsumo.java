package org.utl.dsm.controller;

import java.io.IOException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import org.utl.dsm.cqrs.CQRSInsumo;
import org.utl.dsm.dao.DAOInsumo;
import org.utl.dsm.model.AlertaInsumo;
import org.utl.dsm.model.Insumo;

public class ControllerInsumo {

    private DAOInsumo insumoDAO;
    private CQRSInsumo insumoCQRS;

    public ControllerInsumo() {
        insumoDAO = new DAOInsumo();
        insumoCQRS = new CQRSInsumo();
    }

    //Todo
    public List<Insumo> obtenerInsumos() {
        List<Insumo> libros = new ArrayList<>();
        try {
            libros = insumoDAO.getAllInsumos();
        } catch (IOException | ClassNotFoundException | SQLException e) {
            System.err.println("Error al obtener insumos: " + e.getMessage());
        }
        return libros;
    }

    //Merma insumo
    public void actualizarInsumoMerma(Insumo insumo) throws Exception {
        insumoCQRS.MermaInsumo(insumo);
        System.out.println("Insumo y merma actualizados correctamente.");
    }

    //Alertas
    public List<AlertaInsumo> verificarAlertas() {
        try {
            return insumoCQRS.verificarAlertasInsumos();
        } catch (Exception e) {
            System.err.println("Error al verificar las alertas de los insumos: " + e.getMessage());
            return null;
        }
    }

}
