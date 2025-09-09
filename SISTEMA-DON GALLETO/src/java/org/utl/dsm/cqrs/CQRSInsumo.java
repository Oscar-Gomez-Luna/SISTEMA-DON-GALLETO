package org.utl.dsm.cqrs;

import java.io.IOException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import org.utl.dsm.dao.DAOInsumo;
import org.utl.dsm.model.AlertaInsumo;
import org.utl.dsm.model.Insumo;

/**
 *
 * @author ascen
 */
public class CQRSInsumo {
    private DAOInsumo insumoDAO;

    public CQRSInsumo() {
        insumoDAO = new DAOInsumo();
    }
//Merma
public void MermaInsumo(Insumo insumo) throws Exception {
        validarID(insumo.getId_insumo());
        validarCantidad(insumo.getCantidad());
        insumoDAO.actualizarInsumoMerma(insumo.getId_insumo(), insumo.getCantidad(), insumo.getDescripcion());
    }

    private void validarID(int id_insumo) throws Exception {
        if (id_insumo <= 0) {
            throw new Exception("El id del insumo debe ser un número entero positivo.");
        }
        if (id_insumo > 1000) {
            throw new Exception("El id del insumo no puede ser mayor a 1,000.");
        }
    }

    private void validarCantidad(double cantidad) throws Exception {
        if (cantidad <= 0) {
            throw new Exception("La cantidad debe ser un número positivo.");
        }
        if (cantidad > 10000) {
            throw new Exception("La cantidad no puede ser mayor a 10,000.");
        }
    }
    
// /////////////////////////////////////////////////////////////////////////////
    //Alertas
    public List<AlertaInsumo> verificarAlertasInsumos() throws Exception {
        List<Insumo> insumos = insumoDAO.obtenerTodosInsumos();
        List<AlertaInsumo> alertas = new ArrayList<>();

        // Verificamos los insumos
        for (Insumo insumo : insumos) {
            double totalInsumo = insumo.getTotal();
            String nombreInsumo = insumo.getNombreInsumo();

            if (totalInsumo <= 2500) {
                alertas.add(new AlertaInsumo(nombreInsumo, "El insumo " + nombreInsumo + " tiene que resurtirse."));
            } else if (totalInsumo > 2500 && totalInsumo <= 7000) {
                alertas.add(new AlertaInsumo(nombreInsumo, "El insumo " + nombreInsumo + " está a punto de acabarse."));
            }
        }

        return alertas;
    }

}