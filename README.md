<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

# Caduca

Esta es la aplicación backend para el sistema de vales de producto vencido, construida con NestJS. Proporciona una API RESTful para la aplicación frontend y maneja toda la lógica de negocio, gestión de datos y características de seguridad.

## Instalación

1. Clona el repositorio
2. Copia el archivo `.env.template` a `.env` y completa las variables de entorno requeridas
3. Ejecuta `pnpm install` para instalar las dependencias
4. Ejecuta `docker compose up -d` para iniciar la base de datos
5. Ejecuta `pnpm prisma generate` para generar el cliente de Prisma
6. Ejecuta `pnpm prisma migrate dev` para aplicar las migraciones
7. Ejecuta `pnpm start:dev` para iniciar el servidor de desarrollo
