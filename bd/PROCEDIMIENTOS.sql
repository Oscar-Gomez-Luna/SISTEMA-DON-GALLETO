USE DonGalleto;

-- -----------------------------------------------PROCEDIMIENTOS--------------------------------------------------------------------

-- VENTAS ----------------------------------------------

-- INSERTAR VENTAS
DELIMITER $$

CREATE PROCEDURE insertarVenta(
    IN p_descripcion LONGTEXT,
    IN p_total FLOAT,
    IN p_ticket LONGTEXT,
    IN p_tipoVenta VARCHAR(50),
    IN p_detalles JSON,
    OUT p_id_venta INT
)
BEGIN
    DECLARE v_detalle JSON;
    DECLARE v_galleta_id INT;
    DECLARE v_cantidad INT;
    DECLARE v_subtotal FLOAT;
    DECLARE i INT DEFAULT 0;
    DECLARE detalles_count INT;
    DECLARE current_existencia INT;

    INSERT INTO ventas (descripcion, total, fecha, hora, ticket, tipoVenta)
    VALUES (p_descripcion, p_total, CURDATE(), CURTIME(), p_ticket, p_tipoVenta);

    SET p_id_venta = LAST_INSERT_ID();

    -- Cantidad de elementos en el JSON
    SET detalles_count = JSON_LENGTH(p_detalles);

    -- Iterar sobre el arreglo de detalles de venta (JSON)
    WHILE i < detalles_count DO
        -- Obtener el detalle actual
        SET v_detalle = JSON_UNQUOTE(JSON_EXTRACT(p_detalles, CONCAT('$[', i, ']')));

        SET v_galleta_id = JSON_UNQUOTE(JSON_EXTRACT(v_detalle, '$.id_galleta'));
        SET v_cantidad = JSON_UNQUOTE(JSON_EXTRACT(v_detalle, '$.cantidad'));
        SET v_subtotal = JSON_UNQUOTE(JSON_EXTRACT(v_detalle, '$.subtotal'));

        INSERT INTO detalleVentaGalletas (venta_id, galleta_id, cantidad, subtotal)
        VALUES (p_id_venta, v_galleta_id, v_cantidad, v_subtotal);

        SELECT existencia INTO current_existencia FROM galletas WHERE id_galleta = v_galleta_id;

        IF current_existencia >= v_cantidad THEN

            UPDATE galletas
            SET existencia = existencia - v_cantidad
            WHERE id_galleta = v_galleta_id;
        END IF;

        -- Incrementar el índice del detalle
        SET i = i + 1;
    END WHILE;

    SELECT p_id_venta AS id_venta;

END$$

DELIMITER ;

-- DISMINUIR GALLETAS

DELIMITER $$

CREATE PROCEDURE disminuirCantidadPorGalleta(
    IN p_nombre_galleta VARCHAR(100),
    IN p_cantidad INT
)
BEGIN
    DECLARE current_existencia INT;
    DECLARE galleta_id INT;

    SELECT id_galleta, existencia
    INTO galleta_id, current_existencia
    FROM galletas 
    WHERE galleta = p_nombre_galleta AND tipo = 'Unidad';

    IF galleta_id IS NOT NULL THEN

        IF current_existencia >= p_cantidad THEN

            UPDATE galletas
            SET existencia = existencia - p_cantidad
            WHERE id_galleta = galleta_id;
        ELSE
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No hay suficiente existencia para realizar la operación';
        END IF;
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La galleta especificada no existe';
    END IF;

END$$

DELIMITER ;

-- PRODUCCION ------------------------------------------------

-- Merma de galletas
DELIMITER $$

CREATE PROCEDURE registrarMermaGalletas(
    IN p_galleta_id INT,
    IN p_cantidad INT,
    IN p_descripcion TEXT
)
BEGIN
    DECLARE v_existencia INT;
    DECLARE v_lote_id INT;
    DECLARE v_restante INT;

    SELECT existencia INTO v_existencia 
    FROM galletas 
    WHERE id_galleta = p_galleta_id;

    IF v_existencia < p_cantidad THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cantidad insuficiente para registrar merma.';
    ELSE
        -- Obtener el último lote creado
        SELECT id_lote, restante INTO v_lote_id, v_restante
        FROM inventario_galletas
        WHERE galleta_id = p_galleta_id
        ORDER BY id_lote DESC
        LIMIT 1;

        -- Validar que el lote tenga suficiente
        IF v_restante < p_cantidad THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cantidad insuficiente en el último lote.';
        ELSE
            START TRANSACTION;

            -- Registrar la merma
            INSERT INTO mermas_galletas (id_galleta, cantidad, descripcion)
            VALUES (p_galleta_id, p_cantidad, p_descripcion);

            UPDATE galletas
            SET existencia = existencia - p_cantidad
            WHERE id_galleta = p_galleta_id;

            UPDATE inventario_galletas
            SET vendido = vendido + p_cantidad
            WHERE id_lote = v_lote_id;

            COMMIT;

            SELECT 'Merma registrada correctamente.' AS mensaje;
        END IF;
    END IF;
END$$

DELIMITER ;

-- registrar la producción de galletas y al mismo tiempo, descontar los insumos necesarios de tu inventario.

 DELIMITER $$

CREATE PROCEDURE agregarGalletasYDescontarInsumos(
    IN p_galleta_id INT,
    IN p_cantidad_total INT,
    IN p_fecha_ingreso DATE,
    IN p_fecha_vencimiento DATE,
    IN p_insumos JSON,
    IN p_vendido INT
)
BEGIN
    DECLARE v_total_insumo DOUBLE;
    DECLARE v_vendido INT;
    DECLARE v_galletas_existentes INT;
    DECLARE v_index INT DEFAULT 0;
    DECLARE v_insumo JSON;
    DECLARE v_insumo_id INT;
    DECLARE v_cantidad_descontar DOUBLE;
    DECLARE v_error_msg VARCHAR(255);

    SET v_vendido = IFNULL(p_vendido, 0);

    -- Iterar sobre los insumos recibidos en el parámetro JSON
    WHILE v_index < JSON_LENGTH(p_insumos) DO

        SET v_insumo = JSON_EXTRACT(p_insumos, CONCAT('$[', v_index, ']'));
        SET v_insumo_id = JSON_UNQUOTE(JSON_EXTRACT(v_insumo, '$.id_insumo'));
        SET v_cantidad_descontar = JSON_UNQUOTE(JSON_EXTRACT(v_insumo, '$.cantidad_descontar'));

        SELECT total INTO v_total_insumo
        FROM insumos
        WHERE id_insumo = v_insumo_id;

        IF v_total_insumo >= v_cantidad_descontar THEN

            UPDATE insumos
            SET total = total - v_cantidad_descontar
            WHERE id_insumo = v_insumo_id;
        ELSE

            SET v_error_msg = CONCAT('No hay suficiente insumo para el id_insumo ', v_insumo_id);

            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error_msg;
        END IF;

        -- Incrementar el índice para la siguiente iteración
        SET v_index = v_index + 1;
    END WHILE;

    INSERT INTO inventario_galletas (galleta_id, cantidad, fecha_ingreso, fecha_vencimiento, vendido)
    VALUES (p_galleta_id, p_cantidad_total, p_fecha_ingreso, p_fecha_vencimiento, v_vendido);

    SELECT COUNT(*) INTO v_galletas_existentes
    FROM galletas
    WHERE id_galleta = p_galleta_id;

    IF v_galletas_existentes > 0 THEN

        UPDATE galletas
        SET existencia = existencia + p_cantidad_total
        WHERE id_galleta = p_galleta_id;
    ELSE
        SET v_error_msg = CONCAT('La galleta con ID ', p_galleta_id, ' no existe.');

        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_error_msg;
    END IF;

    SELECT 'Registro y descuento realizados correctamente.' AS mensaje;

END$$

DELIMITER ;

-- Aumentar la cantidad de galletas en el inventario

DELIMITER $$

CREATE PROCEDURE agregarGalletasStock(
    IN p_galleta_id INT,
    IN p_cantidad INT
)
BEGIN
    UPDATE galletas
    SET existencia = existencia + p_cantidad
    WHERE id_galleta = p_galleta_id;

    SELECT 'Stock actualizado correctamente.' AS mensaje;
END$$
DELIMITER ;

-- INSUMOS ----------------------------------------------
-- merma insumos
DELIMITER $$

CREATE PROCEDURE actualizarTotalInsumoMerma (
    IN p_idInsumo INT,
    IN p_totalDescuento DOUBLE,
    IN p_descripcion VARCHAR(255)
)
BEGIN
    DECLARE v_total_actual DOUBLE;
    DECLARE v_cantidad_actual INT;
    DECLARE v_unidad DOUBLE;
    DECLARE v_cantidad_a_descontar INT DEFAULT 0;
    DECLARE v_residuo DOUBLE;
    DECLARE v_mensaje_error VARCHAR(255);

    -- cantidad y total actual
    SELECT total, cantidad
    INTO v_total_actual, v_cantidad_actual
    FROM insumos
    WHERE id_insumo = p_idInsumo;

    IF v_cantidad_actual <= 0 THEN
        SET v_mensaje_error = 'No hay stock disponible para descontar.';
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = v_mensaje_error;
    END IF;

    -- valor unitario
    SET v_unidad = CASE 
                      WHEN v_cantidad_actual > 0 THEN v_total_actual / v_cantidad_actual
                      ELSE 0
                   END;

    -- unidades a descontar
    IF v_unidad > 0 THEN
        SET v_cantidad_a_descontar = FLOOR(p_totalDescuento / v_unidad);
        SET v_residuo = p_totalDescuento - (v_cantidad_a_descontar * v_unidad);

        -- Si el residuo es mayor o igual al 75% de la unidad, descontar 1
        IF v_residuo >= (v_unidad * 0.75) THEN
            SET v_cantidad_a_descontar = v_cantidad_a_descontar + 1;
        END IF;
    END IF;

    -- Validar si hay suficiente
    IF v_cantidad_a_descontar > v_cantidad_actual THEN
        SET v_mensaje_error = CONCAT('Stock insuficiente. Disponible: ', v_cantidad_actual, ', Intentaste descontar: ', v_cantidad_a_descontar);
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = v_mensaje_error;
    END IF;

    -- Actualizar insumo solo si es que hay 
    UPDATE insumos
    SET cantidad = cantidad - v_cantidad_a_descontar,
        total = total - p_totalDescuento
    WHERE id_insumo = p_idInsumo;

    -- Registrar la merma
    INSERT INTO mermas_insumos (id_insumo, cantidad, descripcion)
    VALUES (p_idInsumo, p_totalDescuento, p_descripcion);
END$$

DELIMITER ;


-- COMPRAS --------------------------------------------------

-- Registrar compras
DELIMITER $$

CREATE PROCEDURE RegistrarCompras(
    IN p_proveedor_id INT,
    IN p_fecha DATE,
    IN p_insumos TEXT
)
BEGIN
    DECLARE v_compra_id INT;
    DECLARE v_total_cantidad INT;
    DECLARE v_total_peso FLOAT DEFAULT 0;
    DECLARE v_total_precio FLOAT DEFAULT 0;
    DECLARE v_numeroOrden VARCHAR(50);
    DECLARE v_ultimoNumero INT;
    DECLARE v_descripcion JSON;
    
    IF p_insumos IS NULL OR p_insumos = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El JSON proporcionado está vacío o es nulo';
    END IF;

    IF JSON_VALID(p_insumos) = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'El JSON proporcionado no es válido';
    END IF;

    -- Sumar las cantidades de los insumos
    SELECT SUM(jt.cantidad) INTO v_total_cantidad
    FROM JSON_TABLE(p_insumos, '$[*]' COLUMNS (
        insumo VARCHAR(100) PATH '$.insumo',
        cantidad INT PATH '$.cantidad',
        precio FLOAT PATH '$.precio',
        peso FLOAT PATH '$.peso'
    )) AS jt;

    -- Calcular el peso total de la compra (cantidad * peso)
    SELECT SUM(jt.cantidad * jt.peso) INTO v_total_peso
    FROM JSON_TABLE(p_insumos, '$[*]' COLUMNS (
        insumo VARCHAR(100) PATH '$.insumo',
        cantidad INT PATH '$.cantidad',
        precio FLOAT PATH '$.precio',
        peso FLOAT PATH '$.peso' 
    )) AS jt;

    -- Calcular el precio total de la compra (cantidad * precio)
    SELECT SUM(jt.cantidad * jt.precio) INTO v_total_precio
    FROM JSON_TABLE(p_insumos, '$[*]' COLUMNS (
        insumo VARCHAR(100) PATH '$.insumo',
        cantidad INT PATH '$.cantidad',
        precio FLOAT PATH '$.precio',
        peso FLOAT PATH '$.peso'
    )) AS jt;

    SELECT MAX(CAST(SUBSTRING(numeroOrden, 4) AS UNSIGNED)) INTO v_ultimoNumero
    FROM comprasRealizadas;

    IF v_ultimoNumero IS NULL THEN
        SET v_ultimoNumero = 0;
    END IF;

    SET v_numeroOrden = CONCAT('ORD', LPAD(v_ultimoNumero + 1, 5, '0'));

    INSERT INTO comprasRealizadas (proveedor_id, cantidad, precio, fecha, numeroOrden, estatus, peso)
    VALUES (p_proveedor_id, v_total_cantidad, v_total_precio, p_fecha, v_numeroOrden, 0, v_total_peso);

    SET v_compra_id = LAST_INSERT_ID();

    SET v_descripcion = (
        SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'insumo', jt.insumo, 
                        'cantidad', jt.cantidad, 
                        'precio', jt.precio, 
                        'peso', jt.peso, 
                        'total_precio', jt.cantidad * jt.precio
                    )
                    )
        FROM JSON_TABLE(p_insumos, '$[*]' COLUMNS (
            insumo VARCHAR(100) PATH '$.insumo',
            cantidad INT PATH '$.cantidad',
            precio FLOAT PATH '$.precio',
            peso FLOAT PATH '$.peso'
        )) AS jt
    );

    INSERT INTO detalleCompra (descripcion, compra_id)
    VALUES (v_descripcion, v_compra_id);

END$$

DELIMITER ;

-- Agregar a un nuevo proveedor (temporales)
DELIMITER $$

CREATE PROCEDURE InsertarProveedor(
    IN p_nombreProveedor VARCHAR(100)
)
BEGIN
    INSERT INTO proveedores (nombreProveedor)
    VALUES (p_nombreProveedor);
END$$

DELIMITER ;

-- Confirmar compra, cambiar el estatus  y  agregar stock de insumos

DELIMITER $$

CREATE PROCEDURE ConfirmarCompraYActualizarStock (
    IN p_idCompra INT
)
BEGIN
    DECLARE v_descripcion JSON;
    DECLARE v_insumo VARCHAR(100);
    DECLARE v_cantidad INT;
    DECLARE v_peso FLOAT;
    DECLARE v_total FLOAT;
    DECLARE v_proveedor_id INT;
    DECLARE v_estatus INT;
    DECLARE v_iter INT DEFAULT 0;
    DECLARE v_insumo_count INT;

    SELECT proveedor_id, estatus
    INTO v_proveedor_id, v_estatus
    FROM comprasRealizadas
    WHERE id_comprasRealizadas = p_idCompra;
	-- Confirmar el proveedor primero
    IF v_proveedor_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se encontró ninguna compra con el ID proporcionado.';
    END IF;
	-- Confirmar el estatus primero
    IF v_estatus = 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La compra ya está registrada.';
    END IF;

    SELECT descripcion
    INTO v_descripcion
    FROM detalleCompra
    WHERE compra_id = p_idCompra;

    SET v_insumo_count = JSON_LENGTH(v_descripcion);

    WHILE v_iter < v_insumo_count DO
        SET v_insumo = JSON_UNQUOTE(JSON_EXTRACT(v_descripcion, CONCAT('$[', v_iter, '].insumo')));
        SET v_cantidad = JSON_UNQUOTE(JSON_EXTRACT(v_descripcion, CONCAT('$[', v_iter, '].cantidad')));
        SET v_peso = JSON_UNQUOTE(JSON_EXTRACT(v_descripcion, CONCAT('$[', v_iter, '].peso')));

        SET v_total = v_cantidad * v_peso;

        -- Actualizamos por nombre del insumo
        UPDATE insumos
        SET cantidad = cantidad + v_cantidad,
            total = total + v_total
        WHERE nombreInsumo = v_insumo;

        SET v_iter = v_iter + 1;
    END WHILE;

    UPDATE comprasRealizadas
    SET estatus = 1
    WHERE id_comprasRealizadas = p_idCompra;

END $$

DELIMITER ;