USE DonGalleto;

-- -----------------------------------------------VISTAS--------------------------------------------------------------------

-- VENTAS ----------------------------------------------

-- vista de detalles de ventas
CREATE VIEW vista_detalle_venta AS
SELECT 
    g.id_galleta,
    g.tipo AS tipo_galleta,
    g.galleta,
    g.costo,
    g.existencia,
    g.fecha AS fecha_galleta,
    g.hora AS hora_galleta,
    
    v.id_venta,
    v.descripcion,
    v.total,
    v.fecha AS fecha_venta,
    v.hora AS hora_venta,
    v.ticket,
    v.tipoVenta,
    
    d.id_detalleVentaGalletas,
    d.venta_id,
    d.galleta_id,
    d.cantidad,
    d.subtotal
    
FROM 
    galletas g
JOIN 
    detalleVentaGalletas d ON g.id_galleta = d.galleta_id
JOIN 
    ventas v ON v.id_venta = d.venta_id;

-- INSUMOS ----------------------------------------------

-- Ver insumos completos
CREATE VIEW vista_insumos AS
SELECT 
    i.id_insumo,
    i.nombreInsumo,
    i.unidad,
    i.cantidad,
    i.total,
    i.fecha,
    p.id_proveedor,
    p.nombreProveedor
FROM 
    insumos i
JOIN 
    proveedores p
ON 
    i.id_proveedor = p.id_proveedor;

-- COMPRAS -------------------------------------------------------

-- Vista de las compras realizadas para el historial para el apartado de de compras
CREATE OR REPLACE VIEW VistaComprasHistorial AS
SELECT 
	cr.id_comprasRealizadas,
    cr.fecha, 
    cr.precio, 
    cr.numeroOrden, 
    cr.estatus,
    cr.cantidad,
    cr.peso,
    p.id_proveedor,
    p.nombreProveedor
FROM 
    comprasRealizadas cr
JOIN 
    proveedores p ON cr.proveedor_id = p.id_proveedor;

-- vista de detalles compras
CREATE OR REPLACE VIEW VistaDetalleCompras AS
SELECT 
	cr.id_comprasRealizadas,
    cr.fecha, 
    cr.precio, 
    cr.numeroOrden, 
    cr.estatus, 
    cr.cantidad, 
    cr.peso, 
    p.id_proveedor,
    p.nombreProveedor,
    dc.id_detalleCompra,
    dc.descripcion
FROM 
    detalleCompra dc
JOIN 
    comprasRealizadas cr ON dc.compra_id = cr.id_comprasRealizadas
JOIN 
    proveedores p ON cr.proveedor_id = p.id_proveedor;
    
-- Vista de las compras realizadas para el historial para el apartado de de compras
CREATE VIEW VistaProveedor AS
SELECT 
    id_proveedor,
    nombreProveedor
FROM 
    proveedores;