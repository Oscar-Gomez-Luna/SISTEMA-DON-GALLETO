package org.utl.dsm.dao;

import com.mysql.cj.jdbc.CallableStatement;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.utl.dsm.bd.ConexionMySQL;
import org.utl.dsm.model.Insumo;
import org.utl.dsm.model.Proveedor;

/**
 *
 * @author ascen
 */
public class DAOInsumo {

    //Ver todo
    public List<Insumo> getAllInsumos() throws SQLException, ClassNotFoundException, IOException {
        ConexionMySQL connMysql = new ConexionMySQL();
        Connection conn = connMysql.abrirConexion();

        String query = "SELECT * FROM vista_insumos";
        PreparedStatement pstmt = conn.prepareStatement(query);
        ResultSet rs = pstmt.executeQuery();

        List<Insumo> insumos = new ArrayList<>();
        while (rs.next()) {
            Insumo insumoObj = new Insumo();

            insumoObj.setId_insumo(rs.getInt("id_insumo"));
            insumoObj.setNombreInsumo(rs.getString("nombreInsumo"));
            insumoObj.setUnidad(rs.getString("unidad"));
            insumoObj.setCantidad(rs.getInt("cantidad"));
            insumoObj.setTotal(rs.getDouble("total"));
            insumoObj.setFecha(rs.getDate("fecha"));

            Proveedor p = new Proveedor();
            p.setId_proveedor(rs.getInt("id_proveedor"));
            p.setNombreProveedor(rs.getString("nombreProveedor"));

            insumoObj.setProveedor(p);

            insumos.add(insumoObj);

        }
        rs.close();
        pstmt.close();
        conn.close();
        connMysql.cerrarConexion(conn);
        return insumos;
    }

// Merma (actualizar la cantidad y registrar descripción)
    public void actualizarInsumoMerma(int idInsumo, double totalDescuento, String descripcion) throws SQLException, ClassNotFoundException, IOException {
        ConexionMySQL connMysql = new ConexionMySQL();
        Connection conn = connMysql.abrirConexion();

        String query = "{CALL actualizarTotalInsumoMerma(?, ?, ?)}";

        try (PreparedStatement pstmt = conn.prepareStatement(query)) {
            pstmt.setInt(1, idInsumo);
            pstmt.setDouble(2, totalDescuento);

            if (descripcion != null) {
                pstmt.setString(3, descripcion);
            } else {
                pstmt.setNull(3, java.sql.Types.VARCHAR);
            }

            pstmt.executeUpdate();
            System.out.println("Insumo actualizado correctamente con merma.");
        } catch (SQLException e) {
            System.err.println("Error al actualizar el insumo: " + e.getMessage());
            throw e;
        } finally {
            connMysql.cerrarConexion(conn);
        }
    }

    //Alertas
    public List<Insumo> obtenerTodosInsumos() throws SQLException, ClassNotFoundException, IOException {
        ConexionMySQL connMysql = new ConexionMySQL();
        Connection conn = connMysql.abrirConexion();
        List<Insumo> listaInsumos = new ArrayList<>();

        String query = "SELECT id_insumo, nombreInsumo, total FROM insumos";
        PreparedStatement pstmt = conn.prepareStatement(query);
        ResultSet rs = null;

        try {
            rs = pstmt.executeQuery();

            while (rs.next()) {
                Insumo insumo = new Insumo();
                insumo.setId_insumo(rs.getInt("id_insumo"));
                insumo.setNombreInsumo(rs.getString("nombreInsumo"));
                insumo.setTotal(rs.getDouble("total"));

                listaInsumos.add(insumo);
            }
        } catch (SQLException e) {
            System.err.println("Error al obtener insumos: " + e.getMessage());
            throw e;
        } finally {
            if (rs != null) {
                rs.close();
            }
            pstmt.close();
            conn.close();
            connMysql.cerrarConexion(conn);
        }

        return listaInsumos;
    }

}
