package org.utl.dsm.controller;

import org.utl.dsm.dao.DAOProduccion;
import org.utl.dsm.model.Galleta;

import java.util.List;

public class ControllerProduccion {

    private final DAOProduccion dao = new DAOProduccion();

    public List<Galleta> obtenerStock() throws Exception {
        return dao.obtenerStock();
    }

    public void sumarStock(int idGalleta, int cantidad) throws Exception {
        dao.sumarStock(idGalleta, cantidad);
    }

    public void registrarMermaGalletas(int idGalleta, int cantidad, String descripcion) throws Exception {
    if (idGalleta <= 0 || cantidad <= 0) {
        throw new IllegalArgumentException("Datos inválidos para registrar merma de galletas.");
    }

    if (descripcion != null && descripcion.trim().isEmpty()) {
        descripcion = null;
    }

    DAOProduccion dao = new DAOProduccion();
    dao.registrarMermaGalletas(idGalleta, cantidad, descripcion);
}


    public void registrarMermaInsumos(int idInsumo, int cantidad, String descripcion) throws Exception {
        if (idInsumo <= 0 || cantidad <= 0) {
            throw new IllegalArgumentException("Datos inválidos para registrar merma de insumos.");
        }
        
        if (descripcion != null && descripcion.trim().isEmpty()) {
        descripcion = null;
    }

        DAOProduccion dao = new DAOProduccion();
        dao.registrarMermaInsumos(idInsumo, cantidad, descripcion);
    }
}
