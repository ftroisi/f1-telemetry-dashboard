Image postgres:18-alpine3.23 Pulled                                                                                                                                                                 20.5s
[+] Building 12.6s (26/35)                                                                                                                                                                                  
 => [internal] load local bake definitions                                                                                                                                                             0.0s
 => => reading from stdin 1.09kB                                                                                                                                                                       0.0s
 => [frontend internal] load build definition from Dockerfile                                                                                                                                          0.0s
 => => transferring dockerfile: 633B                                                                                                                                                                   0.0s
 => [backend internal] load build definition from Dockerfile                                                                                                                                           0.0s
 => => transferring dockerfile: 563B                                                                                                                                                                   0.0s
 => [frontend internal] load metadata for docker.io/library/node:26-alpine3.23                                                                                                                         1.6s
 => [frontend internal] load metadata for docker.io/library/nginx:alpine3.23                                                                                                                           1.6s
 => [auth] library/nginx:pull token for registry-1.docker.io                                                                                                                                           0.0s
 => [auth] library/node:pull token for registry-1.docker.io                                                                                                                                            0.0s
 => [frontend internal] load .dockerignore                                                                                                                                                             0.0s
 => => transferring context: 138B                                                                                                                                                                      0.0s
 => [frontend internal] load build context                                                                                                                                                             0.0s
 => => transferring context: 106.48kB                                                                                                                                                                  0.0s
 => [frontend production 1/3] FROM docker.io/library/nginx:alpine3.23@sha256:54f2a904c251d5a34adf545a72d32515a15e08418dae0266e23be2e18c66fefa                                                          3.4s
 => => resolve docker.io/library/nginx:alpine3.23@sha256:54f2a904c251d5a34adf545a72d32515a15e08418dae0266e23be2e18c66fefa                                                                              0.0s
 => => sha256:92271ec46f10340bf0f90bc6d6287d901cc2e9240050eeff1ec6fe0d23a8d07b 12.34kB / 12.34kB                                                                                                       0.0s
 => => sha256:4c83039edf06847e1489ab59399b976e430eb00b966685cd50149e7eafab868a 1.90MB / 1.90MB                                                                                                         0.8s
 => => sha256:4d898d123a22b0ed0712af5103011c27269eb0605a5f207214e992725e141c23 629B / 629B                                                                                                             0.2s
 => => sha256:54f2a904c251d5a34adf545a72d32515a15e08418dae0266e23be2e18c66fefa 10.33kB / 10.33kB                                                                                                       0.0s
 => => sha256:1ff5c7ff41c619b521f7a3bcfb52ff93354bb65a0141d7cdc0bf9702b12f8f82 2.50kB / 2.50kB                                                                                                         0.0s
 => => sha256:80d7950679c8782a5d845d4640dd5ee96f71b56028348daa7b9f56d44a5bf9a9 956B / 956B                                                                                                             0.4s
 => => sha256:c9b4ed3ccb4c8790e1d9e97a77e95ca383a21acd8cfe65d2cb2a51cda5451afe 402B / 402B                                                                                                             0.5s
 => => sha256:0443ca9c1c20268e1642017d1909c8b7e7c3ba594dfd91a87d58ee1f99d3be62 1.21kB / 1.21kB                                                                                                         0.5s
 => => sha256:b82182f5a992f3f27cafbb7d64033a81522ba5abdde63e083a31cd2a91f0f3ec 1.40kB / 1.40kB                                                                                                         1.0s
 => => sha256:b87ab97d91a1e8568d2a75e46460b4fb5859dc40ead09e35d43412797dd18e70 19.77MB / 19.77MB                                                                                                       3.1s
 => => extracting sha256:4c83039edf06847e1489ab59399b976e430eb00b966685cd50149e7eafab868a                                                                                                              0.0s
 => => extracting sha256:4d898d123a22b0ed0712af5103011c27269eb0605a5f207214e992725e141c23                                                                                                              0.0s
 => => extracting sha256:80d7950679c8782a5d845d4640dd5ee96f71b56028348daa7b9f56d44a5bf9a9                                                                                                              0.0s
 => => extracting sha256:c9b4ed3ccb4c8790e1d9e97a77e95ca383a21acd8cfe65d2cb2a51cda5451afe                                                                                                              0.0s
 => => extracting sha256:0443ca9c1c20268e1642017d1909c8b7e7c3ba594dfd91a87d58ee1f99d3be62                                                                                                              0.0s
 => => extracting sha256:b82182f5a992f3f27cafbb7d64033a81522ba5abdde63e083a31cd2a91f0f3ec                                                                                                              0.0s
 => => extracting sha256:b87ab97d91a1e8568d2a75e46460b4fb5859dc40ead09e35d43412797dd18e70                                                                                                              0.2s
 => [frontend builder  1/12] FROM docker.io/library/node:26-alpine3.23@sha256:aa0d6534a72362ba0ab3c98b662ed680c32484e0aff8e0ce0888451085796a61                                                        10.2s
 => => resolve docker.io/library/node:26-alpine3.23@sha256:aa0d6534a72362ba0ab3c98b662ed680c32484e0aff8e0ce0888451085796a61                                                                            0.0s
 => => sha256:fb94454e23045d19bd1c70740c4c565d05ae695a5353f27b555da1a6b610b9c8 1.53kB / 1.53kB                                                                                                         0.0s
 => => sha256:79b89b691d2bc0432d785900177d3737e20e872426fc665671882a50ad476bf9 4.93kB / 4.93kB                                                                                                         0.0s
 => => sha256:aa0d6534a72362ba0ab3c98b662ed680c32484e0aff8e0ce0888451085796a61 2.62kB / 2.62kB                                                                                                         0.0s
 => => sha256:7857ea293464c50cc22ef00119a83ff3deb9a0a0a9ac44d94ffac6e6cc193cbf 59.76MB / 59.76MB                                                                                                       9.4s
 => => sha256:d5065c7cd048cfde19d581ef5ef0517001b7492b77cf292a2c9450dd68a025d7 445B / 445B                                                                                                             1.3s
 => => extracting sha256:7857ea293464c50cc22ef00119a83ff3deb9a0a0a9ac44d94ffac6e6cc193cbf                                                                                                              0.8s
 => => extracting sha256:d5065c7cd048cfde19d581ef5ef0517001b7492b77cf292a2c9450dd68a025d7                                                                                                              0.0s
 => [backend internal] load build context                                                                                                                                                              0.0s
 => => transferring context: 81.93kB                                                                                                                                                                   0.0s
 => [backend builder  2/12] WORKDIR /app                                                                                                                                                               0.2s
 => [backend builder 3/9] COPY backend/package.json ./                                                                                                                                                 0.0s
 => [frontend builder  3/12] COPY frontend/package.json ./                                                                                                                                             0.0s
 => [frontend builder  4/12] COPY frontend/pnpm-lock.yaml ./                                                                                                                                           0.0s
 => [backend builder 4/9] COPY backend/pnpm-lock.yaml ./                                                                                                                                               0.0s
 => ERROR [backend production 5/7] RUN pnpm install --prod                                                                                                                                             0.2s
 => [backend builder 5/9] COPY backend/tsconfig.json ./                                                                                                                                                0.0s
 => [frontend builder  5/12] COPY frontend/tsconfig.json ./                                                                                                                                            0.0s
 => [frontend builder  6/12] COPY frontend/vite.config.ts ./                                                                                                                                           0.0s
 => ERROR [backend builder 6/9] RUN pnpm install                                                                                                                                                       0.2s
 => [frontend builder  7/12] COPY frontend/tailwind.config.js ./                                                                                                                                       0.0s
 => [frontend builder  8/12] COPY frontend/postcss.config.js ./                                                                                                                                        0.0s
 => [frontend builder  9/12] COPY frontend/index.html ./                                                                                                                                               0.0s
 => CANCELED [frontend builder 10/12] RUN pnpm install                                                                                                                                                 0.1s
------
 > [backend production 5/7] RUN pnpm install --prod:
0.203 /bin/sh: pnpm: not found
------
------
 > [backend builder 6/9] RUN pnpm install:
[+] up 10/12h: pnpm: not found
 ✔ Image postgres:18-alpine3.23          Pulled                                                                                                                                                        20.5s
 ⠙ Image f1-telemetry-dashboard-frontend Building                                                                                                                                                      12.7s
 ⠙ Image f1-telemetry-dashboard-backend  Building                                                                                                                                                      12.7s
Dockerfile:23

--------------------

  21 |     COPY backend/package.json ./

  22 |     COPY backend/pnpm-lock.yaml ./

  23 | >>> RUN pnpm install --prod

  24 |     

  25 |     COPY --from=builder /app/dist ./dist

--------------------

target backend: failed to solve: process "/bin/sh -c pnpm install --prod" did not complete successfully: exit code: 127


What's next:
    Debug this Compose error with Gordon → docker ai "help me fix this compose error"