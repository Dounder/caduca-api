### Paso 1: Crear un Nuevo Archivo de Esquema

1. **Define el nuevo archivo `.zmodel`**:
   Crea un nuevo archivo en la carpeta donde tienes tus esquemas (por ejemplo, `product.zmodel`, `customer.zmodel`, etc.). Asegúrate de seguir la misma estructura que ya estás utilizando.

   Ejemplo: `product.zmodel`

   ```prisma
   import 'base'
   import 'user'

   model Product extends Base {
     @@map("product")
     name        String   @db.VarChar(100)
     description String?  @db.VarChar(255)
     price       Float

     // Relaciones
     createdBy   User?    @relation("ProductCreator", fields: [createdById], references: [id])
     createdById String?

     updatedBy   User?    @relation("ProductUpdater", fields: [updatedById], references: [id])
     updatedById String?

     deletedBy   User?    @relation("ProductDeleter", fields: [deletedById], references: [id])
     deletedById String?
   }
   ```

   - **Nota**: Asegúrate de importar los esquemas necesarios (por ejemplo, `base` y `user`) para mantener las relaciones y la coherencia.

---

### Paso 2: Actualizar el Archivo Principal `schema.zmodel`

1. **Asegúrate de que el archivo principal (`schema.zmodel`) incluya los nuevos archivos**:
   Si estás utilizando un archivo principal para consolidar todos los esquemas, asegúrate de importar el nuevo archivo que acabas de crear.

   Ejemplo en `schema.zmodel`:

   ```prisma
   import 'user'
   import 'role'
   import 'product' // Nuevo esquema importado
   import 'customer'
   import 'voucher'
   ```

   Esto garantiza que ZenStack y Prisma reconozcan el nuevo esquema al generar el cliente.

---

### Paso 3: Definir Relaciones con Otros Modelos

1. **Agrega relaciones en los modelos existentes**:
   Si el nuevo esquema tiene relaciones con modelos existentes (por ejemplo, `User`), asegúrate de actualizar esos modelos para reflejar las nuevas relaciones.

   Ejemplo en `user.zmodel`:

   ```prisma
   model User extends Base {
     // ... otros campos

     // Relaciones con Product
     productCreated     Product[]     @relation("ProductCreator")
     productUpdated     Product[]     @relation("ProductUpdater")
     productDeleted     Product[]     @relation("ProductDeleter")
   }
   ```

   Esto asegura que las relaciones bidireccionales estén correctamente definidas.

---

### Paso 4: Generar el Esquema y el Cliente Prisma

1. **Ejecuta ZenStack para generar el esquema**:
   Una vez que hayas agregado el nuevo archivo y actualizado las relaciones, ejecuta el siguiente comando para generar el esquema y el cliente Prisma:

   ```bash
   npx zenstack generate
   ```

   Esto procesará todos los archivos `.zmodel` y generará el esquema Prisma final (`schema.prisma`) y el cliente.

2. **Verifica el archivo `schema.prisma` generado**:
   Revisa el archivo `schema.prisma` en la carpeta `prisma` para asegurarte de que el nuevo modelo y sus relaciones se hayan incluido correctamente.

---

### Paso 5: Aplicar Migraciones a la Base de Datos

1. **Crea una nueva migración**:
   Si has realizado cambios en el esquema (como agregar un nuevo modelo), necesitas crear y aplicar una migración para actualizar la base de datos.

   Ejecuta el siguiente comando:

   ```bash
   npx prisma migrate dev --name add_product_model
   ```

   Esto creará una nueva migración y la aplicará a tu base de datos.

---

### Paso 6: Usar el Nuevo Modelo en tu Aplicación

1. **Importa y usa el nuevo modelo**:
   En tu aplicación, puedes comenzar a usar el nuevo modelo importando el cliente Prisma.

   Ejemplo en JavaScript/TypeScript:

   ```javascript
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();

   // Crear un nuevo producto
   const newProduct = await prisma.product.create({
     data: {
       name: 'Nuevo Producto',
       price: 99.99,
       createdById: 'userId', // ID del usuario que crea el producto
     },
   });

   console.log(newProduct);
   ```

### Resumen

1. Crea un nuevo archivo `.zmodel` para el esquema.
2. Importa el nuevo archivo en `schema.zmodel`.
3. Define relaciones con otros modelos si es necesario.
4. Ejecuta `npx zenstack generate` para generar el esquema.
5. Aplica migraciones con `npx prisma migrate dev`.
6. Usa el nuevo modelo en tu aplicación.
