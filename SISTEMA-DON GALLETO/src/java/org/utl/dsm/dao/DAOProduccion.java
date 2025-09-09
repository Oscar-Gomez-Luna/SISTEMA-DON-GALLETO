package org.utl.dsm.dao;

import org.utl.dsm.bd.ConexionMySQL;
import org.utl.dsm.model.Galleta;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class DAOProduccion {

    public List<Galleta> obtenerStock() throws Exception {
        ConexionMySQL connMySQL = new ConexionMySQL();  
        Connection conn = connMySQL.abrirConexion();
        
        String query = "SELECT id_galleta, tipo, existencia FROM galletas";
        List<Galleta> stock = new ArrayList<>();

        try (PreparedStatement stmt = conn.prepareStatement(query);  ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                Galleta galleta = new Galleta();
                galleta.setId_galleta(rs.getInt("id_galleta"));
                galleta.setTipo(rs.getString("tipo"));
                galleta.setExistencia(rs.getInt("existencia"));
                stock.add(galleta);
            }
        }
        return stock;
    }

    public void sumarStock(int idGalleta, int cantidad) throws Exception {
        ConexionMySQL connMySQL = new ConexionMySQL();  
        Connection conn = connMySQL.abrirConexion();
        
        String query = "UPDATE galletas SET existencia = existencia + ? WHERE id_galleta = ?";

        try (PreparedStatement stmt = conn.prepareStatement(query)) {

            stmt.setInt(1, cantidad);
            stmt.setInt(2, idGalleta);
            stmt.executeUpdate();
        }
    }

    public static String registrarMermaGalletas(int idGalleta, int cantidad, String descripcion) throws ClassNotFoundException, SQLException {
    String query = "{call registrarMermaGalletas(?, ?, ?)}";
    ConexionMySQL conMysql = new ConexionMySQL();
    Connection conn = null;
    CallableStatement cstm = null;

    try {
        conn = conMysql.abrirConexion();
        conn.setAutoCommit(false);

        cstm = conn.prepareCall(query);
        cstm.setInt(1, idGalleta);
        cstm.setInt(2, cantidad);

        if (descripcion == null || descripcion.trim().isEmpty()) {
            cstm.setNull(3, java.sql.Types.VARCHAR);
        } else {
            cstm.setString(3, descripcion);
        }

        boolean hasResult = cstm.execute();

        conn.commit();

        if (hasResult) {
            try (ResultSet rs = cstm.getResultSet()) {
                if (rs.next()) {
                    return rs.getString("mensaje");
                }
            }
        }

        return "Merma registrada correctamente."; // Fallback por si no devuelve nada
    } catch (SQLException e) {
        if (conn != null) {
            try { conn.rollback(); } catch (SQLException rollbackEx) { rollbackEx.printStackTrace(); }
        }
        throw new SQLException("Error al registrar la merma: " + e.getMessage(), e);
    } finally {
        if (cstm != null) try { cstm.close(); } catch (SQLException ex) { ex.printStackTrace(); }
        if (conn != null) try { conn.close(); } catch (SQLException ex) { ex.printStackTrace(); }
    }
}


    public void registrarMermaInsumos(int idInsumo, int cantidad, String descripcion) throws SQLException, ClassNotFoundException {
        ConexionMySQL connMySQL = new ConexionMySQL();  
        Connection conn = connMySQL.abrirConexion();
        
        String sqlInsertMerma = "INSERT INTO mermas_insumos (id_insumo, cantidad, descripcion, fecha) VALUES (?, ?, ?, CURDATE())";
        String sqlUpdateStock = "UPDATE insumos SET cantidad = cantidad - ? WHERE id_insumo = ?";

        try (PreparedStatement pstmtMerma = conn.prepareStatement(sqlInsertMerma);  PreparedStatement pstmtStock = conn.prepareStatement(sqlUpdateStock)) {

            conn.setAutoCommit(false);

            pstmtMerma.setInt(1, idInsumo);
            pstmtMerma.setInt(2, cantidad);
            pstmtMerma.setString(3, descripcion);
            pstmtMerma.executeUpdate();

            pstmtStock.setInt(1, cantidad);
            pstmtStock.setInt(2, idInsumo);
            pstmtStock.executeUpdate();

            conn.commit();
        } catch (SQLException e) {
            throw new SQLException("Error al registrar la merma de insumos: " + e.getMessage(), e);
        }
    }
}
