FROM node:22-alpine

# corepack se activa como root porque escribe en /usr/local/bin, y su caché
# queda en una ruta compartida y legible: todo el resto del build corre como
# el usuario `node`, que necesita leer el pnpm ya descargado.
ENV COREPACK_HOME=/opt/corepack
RUN corepack enable \
  && corepack prepare pnpm@11.25.0 --activate \
  && chmod -R a+rX "$COREPACK_HOME"

# La imagen oficial de node corre como root. Si alguien consigue ejecutar
# código dentro del contenedor, con root tiene el contenedor entero: escribe
# cualquier archivo, instala paquetes y, si el socket de Docker estuviera
# montado, puede salir hacia el host. El usuario `node` ya viene en la imagen
# oficial y no tiene privilegios, así que no hay que crearlo.
#
# /app le pertenece desde el principio y las dependencias se instalan como
# él. Hacerlo así y no con un `chown -R /app` al final es deliberado: ese
# chown tiene que reescribir node_modules entero sobre overlayfs y agrega
# más de diez minutos al build (medido). Vite además necesita escribir su
# caché en `node_modules/.vite` al arrancar, y sin esto no podría.
RUN mkdir -p /app && chown node:node /app
WORKDIR /app
USER node

COPY --chown=node:node package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .

EXPOSE 5173

CMD ["./node_modules/.bin/vite", "--host", "0.0.0.0"]