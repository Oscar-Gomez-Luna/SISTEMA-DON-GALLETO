package org.utl.dsm.controller;

import org.utl.dsm.cqrs.CQRSProveedor;
import org.utl.dsm.model.Proveedor;

public class ControllerProveedor {

    private CQRSProveedor cqrsProveedores;

    public ControllerProveedor() {
        cqrsProveedores = new CQRSProveedor();
    }

    // Insertar un proveedor nuevo
    public void insertarProveedor(Proveedor proveedor) throws Exception {
        try {
            cqrsProveedores.agregarProveedor(proveedor); 
            System.out.println("Proveedor insertado exitosamente");
        } catch (Exception e) {
            System.err.println("Error al insertar el proveedor: " + e.getMessage());
            throw e;
        }
    }

}
