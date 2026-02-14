-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 14-02-2026 a las 00:20:18
-- Versión del servidor: 10.4.28-MariaDB
-- Versión de PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `encurso_v2`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos`
--

CREATE TABLE `eventos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `organizador_id` bigint(20) UNSIGNED NOT NULL,
  `titulo` varchar(180) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `ubicacion` varchar(180) DEFAULT NULL,
  `estado_publicado` tinyint(1) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `modulos`
--

CREATE TABLE `modulos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(80) NOT NULL,
  `slug` varchar(80) NOT NULL,
  `ruta` varchar(160) NOT NULL,
  `icono` varchar(80) DEFAULT NULL,
  `grupo` varchar(80) DEFAULT NULL,
  `orden` int(11) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `eliminado` tinyint(1) NOT NULL DEFAULT 0,
  `modulo_padre_id` bigint(20) UNSIGNED DEFAULT NULL,
  `permiso_requerido_id` bigint(20) UNSIGNED DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `modulos`
--

INSERT INTO `modulos` (`id`, `nombre`, `slug`, `ruta`, `icono`, `grupo`, `orden`, `activo`, `eliminado`, `modulo_padre_id`, `permiso_requerido_id`, `creado_en`) VALUES
(1, 'Dashboard', 'dashboard', '/app', 'fa-gauge', 'Funciones', 1, 1, 0, NULL, NULL, '2026-02-13 20:25:44'),
(2, 'Módulos', 'modulos', '/app/modulos', 'fa-layer-group', 'Funciones', 2, 1, 0, NULL, NULL, '2026-02-13 20:25:44'),
(3, 'Usuarios', 'usuarios', '/app/usuarios', 'fa-users', 'Funciones', 3, 1, 0, NULL, NULL, '2026-02-13 20:25:44'),
(4, 'Configuración', 'configuracion', '#', 'fa-gear', 'Funciones', 10, 1, 0, NULL, NULL, '2026-02-13 20:25:44'),
(5, 'Permisos', 'permisos', '/app/permisos', 'fa-key', 'Funciones', 11, 1, 0, 4, NULL, '2026-02-13 20:26:02'),
(6, 'Prueba', 'prueba', '/app/prueba', 'fa-ticket', 'Funciones', 5, 1, 0, NULL, NULL, '2026-02-13 20:47:24'),
(7, 'Prueba 2', 'prueba2', '/app/preuab2', 'fa-key', 'Funciones', 15, 1, 1, NULL, NULL, '2026-02-13 23:19:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permisos`
--

CREATE TABLE `permisos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `key` varchar(120) NOT NULL,
  `grupo` varchar(80) NOT NULL DEFAULT 'General',
  `descripcion` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `permisos`
--

INSERT INTO `permisos` (`id`, `key`, `grupo`, `descripcion`, `activo`, `creado_en`) VALUES
(1, 'admin.users', 'Admin', 'Gestionar usuarios', 1, '2026-02-11 20:53:55'),
(2, 'admin.plans', 'Admin', 'Gestionar planes', 1, '2026-02-11 20:53:55'),
(3, 'admin.permissions', 'Admin', 'Gestionar permisos', 1, '2026-02-11 20:53:55'),
(4, 'admin.modules', 'Admin', 'Gestionar módulos del dashboard', 1, '2026-02-11 20:53:55'),
(5, 'events.read', 'Eventos', 'Ver eventos', 1, '2026-02-11 20:53:55'),
(6, 'events.write', 'Eventos', 'Crear/editar eventos', 1, '2026-02-11 20:53:55'),
(7, 'participants.read', 'Participantes', 'Ver registros', 1, '2026-02-11 20:53:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `planes`
--

CREATE TABLE `planes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(80) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `planes`
--

INSERT INTO `planes` (`id`, `nombre`, `descripcion`, `activo`, `creado_en`) VALUES
(1, 'Basico', 'Funciones esenciales', 1, '2026-02-11 20:53:55'),
(2, 'Premium', 'Funciones avanzadas', 1, '2026-02-11 20:53:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `plan_permisos`
--

CREATE TABLE `plan_permisos` (
  `plan_id` bigint(20) UNSIGNED NOT NULL,
  `permiso_id` bigint(20) UNSIGNED NOT NULL,
  `permitido` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registros`
--

CREATE TABLE `registros` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `evento_id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(160) NOT NULL,
  `email` varchar(160) NOT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `estado` enum('registrado','pagado','cancelado') NOT NULL DEFAULT 'registrado',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `nombre`, `activo`, `creado_en`) VALUES
(1, 'ADMIN', 1, '2026-02-11 20:53:55'),
(2, 'ORGANIZADOR', 1, '2026-02-11 20:53:55'),
(3, 'PARTICIPANTE', 1, '2026-02-11 20:53:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `suscripciones`
--

CREATE TABLE `suscripciones` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `organizador_id` bigint(20) UNSIGNED NOT NULL,
  `plan_id` bigint(20) UNSIGNED NOT NULL,
  `estado` enum('activa','vencida','cancelada','trial') NOT NULL DEFAULT 'activa',
  `inicio` date DEFAULT NULL,
  `fin` date DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `suscripciones`
--

INSERT INTO `suscripciones` (`id`, `organizador_id`, `plan_id`, `estado`, `inicio`, `fin`, `creado_en`) VALUES
(1, 1, 2, 'activa', NULL, NULL, '2026-02-11 22:33:47');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `email` varchar(160) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `nickname` varchar(80) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password_hash`, `foto`, `nickname`, `telefono`, `activo`, `creado_en`, `actualizado_en`) VALUES
(1, 'Administrador', 'admin@encurso.mx', '$2b$10$WP1mbz1tdIkCuWyjAmiW5e0aDx1DbwhpcUT3FUbspI/62mg/fkXiG', NULL, NULL, NULL, 1, '2026-02-11 22:33:47', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_permisos_override`
--

CREATE TABLE `usuario_permisos_override` (
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `permiso_id` bigint(20) UNSIGNED NOT NULL,
  `tipo` enum('allow','deny') NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_roles`
--

CREATE TABLE `usuario_roles` (
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `rol_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuario_roles`
--

INSERT INTO `usuario_roles` (`usuario_id`, `rol_id`) VALUES
(1, 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `fk_evento_org` (`organizador_id`);

--
-- Indices de la tabla `modulos`
--
ALTER TABLE `modulos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `fk_mod_padre` (`modulo_padre_id`),
  ADD KEY `fk_mod_perm` (`permiso_requerido_id`);

--
-- Indices de la tabla `permisos`
--
ALTER TABLE `permisos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key` (`key`);

--
-- Indices de la tabla `planes`
--
ALTER TABLE `planes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `plan_permisos`
--
ALTER TABLE `plan_permisos`
  ADD PRIMARY KEY (`plan_id`,`permiso_id`),
  ADD KEY `fk_pp_perm` (`permiso_id`);

--
-- Indices de la tabla `registros`
--
ALTER TABLE `registros`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reg_evento` (`evento_id`),
  ADD KEY `idx_reg_email` (`email`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `suscripciones`
--
ALTER TABLE `suscripciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sub_org` (`organizador_id`),
  ADD KEY `fk_sub_plan` (`plan_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `usuario_permisos_override`
--
ALTER TABLE `usuario_permisos_override`
  ADD PRIMARY KEY (`usuario_id`,`permiso_id`),
  ADD KEY `fk_upo_perm` (`permiso_id`);

--
-- Indices de la tabla `usuario_roles`
--
ALTER TABLE `usuario_roles`
  ADD PRIMARY KEY (`usuario_id`,`rol_id`),
  ADD KEY `fk_ur_rol` (`rol_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `modulos`
--
ALTER TABLE `modulos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `permisos`
--
ALTER TABLE `permisos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `planes`
--
ALTER TABLE `planes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `registros`
--
ALTER TABLE `registros`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `suscripciones`
--
ALTER TABLE `suscripciones`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD CONSTRAINT `fk_evento_org` FOREIGN KEY (`organizador_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `modulos`
--
ALTER TABLE `modulos`
  ADD CONSTRAINT `fk_mod_padre` FOREIGN KEY (`modulo_padre_id`) REFERENCES `modulos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_mod_perm` FOREIGN KEY (`permiso_requerido_id`) REFERENCES `permisos` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `plan_permisos`
--
ALTER TABLE `plan_permisos`
  ADD CONSTRAINT `fk_pp_perm` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pp_plan` FOREIGN KEY (`plan_id`) REFERENCES `planes` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `registros`
--
ALTER TABLE `registros`
  ADD CONSTRAINT `fk_reg_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `suscripciones`
--
ALTER TABLE `suscripciones`
  ADD CONSTRAINT `fk_sub_org` FOREIGN KEY (`organizador_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sub_plan` FOREIGN KEY (`plan_id`) REFERENCES `planes` (`id`);

--
-- Filtros para la tabla `usuario_permisos_override`
--
ALTER TABLE `usuario_permisos_override`
  ADD CONSTRAINT `fk_upo_perm` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_upo_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuario_roles`
--
ALTER TABLE `usuario_roles`
  ADD CONSTRAINT `fk_ur_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `fk_ur_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
