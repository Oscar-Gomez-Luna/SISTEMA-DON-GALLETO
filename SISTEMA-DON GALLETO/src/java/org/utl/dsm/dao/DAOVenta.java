package org.utl.dsm.dao;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import java.io.IOException;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import org.utl.dsm.bd.ConexionMySQL;
import org.utl.dsm.model.DetalleVenta;
import org.utl.dsm.model.Venta;

public class DAOVenta {

    public int insertarVenta(Venta v, List<DetalleVenta> detalleVenta) throws SQLException, IOException, ClassNotFoundException {
        String query = "{call insertarVenta(?,?,?,?,?,?)}";
        ConexionMySQL connMysql = new ConexionMySQL();

        // lista detalleVenta a  JSON
        Gson gson = new Gson();
        JsonArray jsonArray = new JsonArray();

        for (DetalleVenta detalle : detalleVenta) {
            JsonObject jsonObject = new JsonObject();
            jsonObject.addProperty("id_galleta", detalle.getGalleta().getId_galleta());
            jsonObject.addProperty("cantidad", detalle.getCantidad());
            jsonObject.addProperty("subtotal", detalle.getSubtotal());
            jsonArray.add(jsonObject);
        }

        String detallesJson = gson.toJson(jsonArray);

        Connection conn = connMysql.abrirConexion();
        CallableStatement cstm = (CallableStatement) conn.prepareCall(query);

        cstm.setString(1, v.getDescripcion());
        cstm.setFloat(2, v.getTotal());
        cstm.setString(3, v.getTicket());
        cstm.setString(4, v.getTipo_venta());
        cstm.setString(5, detallesJson);

        cstm.registerOutParameter(6, Types.INTEGER);

        cstm.execute();

        v.setId_venta(cstm.getInt(6));

        cstm.close();
        conn.close();
        connMysql.cerrarConexion(conn);

        return v.getId_venta();
    }

    public List<Venta> getAll() throws SQLException, ClassNotFoundException, IOException {
        List<Venta> listaVentas = new ArrayList<>();
        ConexionMySQL connMySQL = new ConexionMySQL();

        String query = "SELECT * FROM ventas;";

        Connection conn = connMySQL.abrirConexion();

        PreparedStatement pstmt = conn.prepareStatement(query);

        ResultSet rs = pstmt.executeQuery();

        while (rs.next()) {
            Venta v = new Venta();
            v.setId_venta(rs.getInt("id_venta"));
            v.setDescripcion(rs.getString("descripcion"));
            v.setTotal(rs.getFloat("total"));
            v.setFecha(rs.getDate("fecha"));
            v.setHora(rs.getTime("hora"));
            v.setTicket(rs.getString("ticket"));
            v.setTipo_venta(rs.getString("tipoVenta"));

            listaVentas.add(v);
        }

        rs.close();
        pstmt.close();
        conn.close();
        connMySQL.cerrarConexion(conn);

        return listaVentas;
    }
}
