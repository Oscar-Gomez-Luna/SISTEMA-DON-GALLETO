package org.utl.dsm.controller;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;
import org.utl.dsm.dao.DAODetalleCompra;
import org.utl.dsm.model.DetalleCompra;

public class ControllerDetalleCompra {

    private DAODetalleCompra daoDetalleCompra;

    public ControllerDetalleCompra() {
        daoDetalleCompra = new DAODetalleCompra();
    }

    public List<DetalleCompra> getAllDetalleCompras() throws SQLException, ClassNotFoundException, IOException {
        DAODetalleCompra daodc = new DAODetalleCompra();
        List<DetalleCompra> listaDetalleCompra = daodc.obtenerTodasLosDetallesCompra();

        return listaDetalleCompra;
    }

    // Confirmar compra usando el DAO
    public boolean confirmarCompra(int idCompra) throws SQLException, ClassNotFoundException, IOException {
    DAODetalleCompra dao = new DAODetalleCompra();
    try {
        dao.confirmarCompraYActualizarStock(idCompra); // tu DAO lanza excepción si falla
        return true; // si no lanza excepción, fue exitoso
    } catch (Exception e) {
        return false;
    }
}


}
