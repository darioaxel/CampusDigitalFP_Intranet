<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <div class="border-b bg-card">
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <NuxtLink to="/" class="hover:text-foreground transition-colors">Inicio</NuxtLink>
          <Icon name="lucide:chevron-right" class="h-4 w-4" />
          <span>Documentación</span>
          <Icon name="lucide:chevron-right" class="h-4 w-4" />
          <span class="text-foreground">Workflows y Procesos</span>
        </div>
        <h1 class="text-3xl font-bold tracking-tight">Workflows y Procesos</h1>
        <p class="text-muted-foreground mt-2">
          Documentación del sistema de flujos de trabajo y procesos de la intranet
        </p>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar de navegación -->
        <div class="lg:col-span-1">
          <Card class="sticky top-24">
            <CardHeader>
              <CardTitle class="text-sm font-medium">Contenido</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2">
              <a href="#introduccion" class="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
                Introducción
              </a>
              <a href="#workflows-configurados" class="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
                Workflows Configurados
              </a>
              <div class="ml-4 space-y-1">
                <a href="#alta-usuario" class="block text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                  Alta de Nuevo Usuario
                </a>
                <a href="#dia-libre" class="block text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                  Día Libre Disposición
                </a>
                <a href="#bajas" class="block text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                  Comunicación de Bajas
                </a>
              </div>
              <a href="#mantenimiento" class="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
                Mantenimiento
              </a>
              <a href="#estructuras" class="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
                Estructuras
              </a>
              <a href="#acciones" class="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
                Acciones Automáticas
              </a>
            </CardContent>
          </Card>
        </div>

        <!-- Contenido principal -->
        <div class="lg:col-span-3 space-y-8">
          <!-- Introducción -->
          <section id="introduccion">
            <Card>
              <CardHeader>
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-tyto-primary/10 rounded-lg">
                    <Icon name="lucide:git-branch" class="h-6 w-6 text-tyto-primary" />
                  </div>
                  <div>
                    <CardTitle>Sistema de Workflows</CardTitle>
                    <CardDescription>Motor de flujos de trabajo configurable</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent class="space-y-4">
                <p class="text-muted-foreground">
                  El sistema utiliza un <strong>motor de workflows configurable</strong> data-driven que permite 
                  definir flujos de aprobación sin modificar código. Esto significa que los procesos de 
                  validación, aprobación y gestión de solicitudes pueden adaptarse a las necesidades del 
                  centro sin necesidad de cambios técnicos.
                </p>
                
                <Alert>
                  <Icon name="lucide:lightbulb" class="h-4 w-4" />
                  <AlertTitle>Ventaja principal</AlertTitle>
                  <AlertDescription>
                    Los estados, transiciones y validaciones se definen en la base de datos, 
                    permitiendo ajustar los procesos sin desplegar nuevas versiones.
                  </AlertDescription>
                </Alert>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card class="border-dashed">
                    <CardContent class="pt-6 text-center">
                      <Icon name="lucide:users" class="h-8 w-8 text-tyto-primary mx-auto mb-2" />
                      <p class="font-medium">Gestión de Usuarios</p>
                      <p class="text-sm text-muted-foreground">Alta y validación de usuarios</p>
                    </CardContent>
                  </Card>
                  <Card class="border-dashed">
                    <CardContent class="pt-6 text-center">
                      <Icon name="lucide:calendar" class="h-8 w-8 text-tyto-primary mx-auto mb-2" />
                      <p class="font-medium">Calendarios</p>
                      <p class="text-sm text-muted-foreground">Días libres y permisos</p>
                    </CardContent>
                  </Card>
                  <Card class="border-dashed">
                    <CardContent class="pt-6 text-center">
                      <Icon name="lucide:file-check" class="h-8 w-8 text-tyto-primary mx-auto mb-2" />
                      <p class="font-medium">Validaciones</p>
                      <p class="text-sm text-muted-foreground">Horarios y documentación</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </section>

          <!-- Workflows Configurados -->
          <section id="workflows-configurados">
            <div class="flex items-center gap-3 mb-6">
              <Separator class="flex-1" />
              <span class="text-sm font-medium text-muted-foreground">Workflows Configurados</span>
              <Separator class="flex-1" />
            </div>

            <!-- Workflow 1: Alta de Nuevo Usuario -->
            <Card id="alta-usuario" class="mb-6">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <Badge variant="default" class="bg-blue-500">REQUEST</Badge>
                    <div>
                      <CardTitle>Alta de Nuevo Usuario</CardTitle>
                      <CardDescription class="font-mono text-xs">request_new_user</CardDescription>
                    </div>
                  </div>
                  <Icon name="lucide:user-plus" class="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent class="space-y-6">
                <!-- Diagrama de flujo -->
                <div class="bg-muted/50 rounded-lg p-6">
                  <p class="text-sm font-medium mb-4">Flujo de estados:</p>
                  <div class="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" class="border-amber-500 text-amber-600">Pendiente de Validación</Badge>
                    <Icon name="lucide:arrow-right" class="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" class="border-green-500 text-green-600">Aprobada - Usuario Creado</Badge>
                  </div>
                  <div class="flex items-center gap-2 mt-2 ml-0 md:ml-32">
                    <Icon name="lucide:arrow-down" class="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div class="flex items-center gap-2 mt-2 ml-0 md:ml-24">
                    <Badge variant="outline" class="border-red-500 text-red-600">Rechazada</Badge>
                  </div>
                </div>

                <Collapsible>
                  <CollapsibleTrigger class="flex items-center justify-between w-full py-2 text-sm font-medium hover:underline">
                    Estados
                    <Icon name="lucide:chevron-down" class="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell class="font-mono text-xs">pending</TableCell>
                            <TableCell>Pendiente de validación</TableCell>
                            <TableCell><Badge variant="outline" class="border-amber-500">Inicial</Badge></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell class="font-mono text-xs">approved</TableCell>
                            <TableCell>Aprobada - Usuario creado</TableCell>
                            <TableCell><Badge variant="outline" class="border-green-500">Final</Badge></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell class="font-mono text-xs">rejected</TableCell>
                            <TableCell>Rechazada</TableCell>
                            <TableCell><Badge variant="outline" class="border-red-500">Terminal</Badge></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                </Collapsible>
                
                <Collapsible>
                  <CollapsibleTrigger class="flex items-center justify-between w-full py-2 text-sm font-medium hover:underline">
                    Transiciones
                    <Icon name="lucide:chevron-down" class="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Desde</TableHead>
                            <TableHead>Hacia</TableHead>
                            <TableHead>Roles permitidos</TableHead>
                            <TableHead>Requisitos</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Pendiente</TableCell>
                            <TableCell>Aprobada</TableCell>
                            <TableCell>
                              <Badge variant="secondary">ADMIN</Badge>
                              <Badge variant="secondary" class="ml-1">ROOT</Badge>
                            </TableCell>
                            <TableCell>Requiere comentario</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Pendiente</TableCell>
                            <TableCell>Rechazada</TableCell>
                            <TableCell>
                              <Badge variant="secondary">ADMIN</Badge>
                              <Badge variant="secondary" class="ml-1">ROOT</Badge>
                            </TableCell>
                            <TableCell>Requiere comentario</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                </Collapsible>

                <Alert class="bg-blue-50 border-blue-200">
                  <Icon name="lucide:sparkles" class="h-4 w-4 text-blue-500" />
                  <AlertTitle>Acción automática</AlertTitle>
                  <AlertDescription>
                    Al aprobarse, se crea automáticamente el usuario en el sistema y se envía notificación al solicitante.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <!-- Workflow 2: Día Libre Disposición -->
            <Card id="dia-libre" class="mb-6">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <Badge variant="default" class="bg-green-500">REQUEST</Badge>
                    <div>
                      <CardTitle>Día Libre Disposición</CardTitle>
                      <CardDescription class="font-mono text-xs">request_free_day</CardDescription>
                    </div>
                  </div>
                  <Icon name="lucide:calendar-check" class="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent class="space-y-6">
                <!-- Diagrama de flujo -->
                <div class="bg-muted/50 rounded-lg p-6">
                  <p class="text-sm font-medium mb-4">Flujo de estados:</p>
                  <div class="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" class="border-amber-500 text-amber-600">Pendiente</Badge>
                    <Icon name="lucide:arrow-right" class="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" class="border-green-500 text-green-600">Aprobada</Badge>
                  </div>
                  <div class="flex items-center gap-2 mt-2">
                    <Icon name="lucide:arrow-down" class="h-4 w-4 text-muted-foreground" />
                    <span class="text-muted-foreground text-sm">o</span>
                    <Icon name="lucide:arrow-right" class="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" class="border-red-500 text-red-600">Rechazada</Badge>
                  </div>
                  <div class="flex items-center gap-2 mt-2 ml-24">
                    <Icon name="lucide:arrow-down" class="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div class="flex items-center gap-2 mt-2 ml-20">
                    <Badge variant="outline" class="border-gray-500 text-gray-600">Cancelada por usuario</Badge>
                  </div>
                </div>

                <Collapsible>
                  <CollapsibleTrigger class="flex items-center justify-between w-full py-2 text-sm font-medium hover:underline">
                    Estados
                    <Icon name="lucide:chevron-down" class="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell class="font-mono text-xs">pending</TableCell>
                            <TableCell>Pendiente</TableCell>
                            <TableCell><Badge variant="outline" class="border-amber-500">Inicial</Badge></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell class="font-mono text-xs">approved</TableCell>
                            <TableCell>Aprobada</TableCell>
                            <TableCell><Badge variant="outline" class="border-green-500">Final</Badge></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell class="font-mono text-xs">rejected</TableCell>
                            <TableCell>Rechazada</TableCell>
                            <TableCell><Badge variant="outline" class="border-red-500">Terminal</Badge></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell class="font-mono text-xs">cancelled_by_user</TableCell>
                            <TableCell>Cancelada por el usuario</TableCell>
                            <TableCell><Badge variant="outline" class="border-gray-500">Terminal</Badge></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                </Collapsible>
                
                <Collapsible>
                  <CollapsibleTrigger class="flex items-center justify-between w-full py-2 text-sm font-medium hover:underline">
                    Transiciones
                    <Icon name="lucide:chevron-down" class="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Desde</TableHead>
                            <TableHead>Hacia</TableHead>
                            <TableHead>Roles permitidos</TableHead>
                            <TableHead>Notas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Pendiente</TableCell>
                            <TableCell>Aprobada</TableCell>
                            <TableCell>
                              <Badge variant="secondary">ADMIN</Badge>
                              <Badge variant="secondary" class="ml-1">ROOT</Badge>
                            </TableCell>
                            <TableCell>-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Pendiente</TableCell>
                            <TableCell>Rechazada</TableCell>
                            <TableCell>
                              <Badge variant="secondary">ADMIN</Badge>
                              <Badge variant="secondary" class="ml-1">ROOT</Badge>
                            </TableCell>
                            <TableCell>-</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Pendiente</TableCell>
                            <TableCell>Cancelada</TableCell>
                            <TableCell>
                              <Badge variant="secondary">Usuario propietario</Badge>
                            </TableCell>
                            <TableCell>El usuario puede cancelar</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Aprobada</TableCell>
                            <TableCell>Cancelada</TableCell>
                            <TableCell>
                              <Badge variant="secondary">Usuario propietario</Badge>
                            </TableCell>
                            <TableCell>Elimina evento de calendario</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                </Collapsible>

                <Alert class="bg-green-50 border-green-200">
                  <Icon name="lucide:info" class="h-4 w-4 text-green-500" />
                  <AlertTitle>Reglas especiales</AlertTitle>
                  <AlertDescription>
                    Máximo 3 profesores por día. Límite de 4 días por profesor (configurable).
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <!-- Workflow 3: Comunicación de Bajas -->
            <Card id="bajas" class="mb-6">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <Badge variant="default" class="bg-red-500">REQUEST</Badge>
                    <div>
                      <CardTitle>Comunicación de Bajas</CardTitle>
                      <CardDescription class="font-mono text-xs">request_sick_leave</CardDescription>
                    </div>
                  </div>
                  <Icon name="lucide:heart-pulse" class="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent class="space-y-6">
                <!-- Diagrama de flujo -->
                <div class="bg-muted/50 rounded-lg p-6 overflow-x-auto">
                  <p class="text-sm font-medium mb-4">Flujo de estados:</p>
                  <div class="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline" class="border-amber-500 text-amber-600 whitespace-nowrap">Pendiente de Notificación</Badge>
                    <Icon name="lucide:arrow-right" class="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Badge variant="outline" class="border-blue-500 text-blue-600 whitespace-nowrap">Notificado</Badge>
                    <Icon name="lucide:arrow-right" class="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Badge variant="outline" class="border-purple-500 text-purple-600 whitespace-nowrap">Esperando Documentación</Badge>
                  </div>
                  <div class="flex items-center gap-2 mt-4 ml-0 md:ml-48">
                    <Icon name="lucide:arrow-down" class="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                  <div class="flex items-center gap-2 mt-2">
                    <span class="w-24"></span>
                    <Badge variant="outline" class="border-orange-500 text-orange-600 whitespace-nowrap">Enviado a Validación</Badge>
                    <Icon name="lucide:arrow-right" class="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Badge variant="outline" class="border-green-500 text-green-600 whitespace-nowrap">Validado</Badge>
                  </div>
                  <div class="flex items-center gap-2 mt-2 ml-0 md:ml-32">
                    <Icon name="lucide:arrow-down" class="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                  <div class="flex items-center gap-2 mt-2 ml-0 md:ml-24">
                    <Badge variant="outline" class="border-red-500 text-red-600 whitespace-nowrap">Rechazado</Badge>
                  </div>
                </div>

                <Collapsible>
                  <CollapsibleTrigger class="flex items-center justify-between w-full py-2 text-sm font-medium hover:underline">
                    Estados
                    <Icon name="lucide:chevron-down" class="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell class="font-mono text-xs">pending_notification</TableCell>
                            <TableCell>Pendiente de notificación</TableCell>
                            <TableCell><Badge variant="outline" class="border-amber-500">Inicial</Badge></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell class="font-mono text-xs">notified</TableCell>
                            <TableCell>Notificado</TableCell>
                            <TableCell><Badge variant="outline">Intermedio</Badge></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell class="font-mono text-xs">pending_docs</TableCell>
                            <TableCell>Esperando documentación</TableCell>
                            <TableCell><Badge variant="outline">Intermedio</Badge></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell class="font-mono text-xs">pending_validation</TableCell>
                            <TableCell>Esperando validación</TableCell>
                            <TableCell><Badge variant="outline">Intermedio</Badge></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell class="font-mono text-xs">validated</TableCell>
                            <TableCell>Validado</TableCell>
                            <TableCell><Badge variant="outline" class="border-green-500">Final</Badge></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell class="font-mono text-xs">rejected</TableCell>
                            <TableCell>Rechazado</TableCell>
                            <TableCell><Badge variant="outline" class="border-red-500">Terminal</Badge></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                </Collapsible>
                
                <Collapsible>
                  <CollapsibleTrigger class="flex items-center justify-between w-full py-2 text-sm font-medium hover:underline">
                    Transiciones
                    <Icon name="lucide:chevron-down" class="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Desde</TableHead>
                            <TableHead>Hacia</TableHead>
                            <TableHead>Roles permitidos</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Pendiente de Notificación</TableCell>
                            <TableCell>Notificado</TableCell>
                            <TableCell>
                              <Badge variant="secondary">ADMIN</Badge>
                              <Badge variant="secondary" class="ml-1">ROOT</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Notificado</TableCell>
                            <TableCell>Esperando Docs</TableCell>
                            <TableCell>
                              <Badge variant="secondary">ADMIN</Badge>
                              <Badge variant="secondary" class="ml-1">ROOT</Badge>
                              <Badge variant="secondary" class="ml-1">PROFESOR</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Esperando Docs</TableCell>
                            <TableCell>Enviado a Validación</TableCell>
                            <TableCell>
                              <Badge variant="secondary">PROFESOR</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Enviado a Validación</TableCell>
                            <TableCell>Validado</TableCell>
                            <TableCell>
                              <Badge variant="secondary">ADMIN</Badge>
                              <Badge variant="secondary" class="ml-1">ROOT</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Enviado a Validación</TableCell>
                            <TableCell>Esperando Docs</TableCell>
                            <TableCell>
                              <Badge variant="secondary">ADMIN</Badge>
                              <Badge variant="secondary" class="ml-1">ROOT</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Enviado a Validación</TableCell>
                            <TableCell>Rechazado</TableCell>
                            <TableCell>
                              <Badge variant="secondary">ADMIN</Badge>
                              <Badge variant="secondary" class="ml-1">ROOT</Badge>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                </Collapsible>

                <Alert class="bg-red-50 border-red-200">
                  <Icon name="lucide:file-text" class="h-4 w-4 text-red-500" />
                  <AlertTitle>Documentación requerida</AlertTitle>
                  <AlertDescription>
                    Este workflow requiere documentación médica que debe ser validada por administración.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </section>

          <!-- Mantenimiento -->
          <section id="mantenimiento">
            <Card>
              <CardHeader>
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-tyto-primary/10 rounded-lg">
                    <Icon name="lucide:settings" class="h-6 w-6 text-tyto-primary" />
                  </div>
                  <div>
                    <CardTitle>Mantenimiento de Workflows</CardTitle>
                    <CardDescription>Cómo crear y modificar workflows</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent class="space-y-6">
                <Tabs defaultValue="nuevo" class="w-full">
                  <TabsList class="grid w-full grid-cols-2">
                    <TabsTrigger value="nuevo">Añadir Nuevo</TabsTrigger>
                    <TabsTrigger value="modificar">Modificar Existente</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="nuevo" class="space-y-4">
                    <p class="text-muted-foreground">Pasos para crear un nuevo workflow:</p>
                    
                    <div class="space-y-4">
                      <div class="flex gap-4">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-tyto-primary text-tyto-primary-foreground font-bold text-sm flex-shrink-0">1</div>
                        <div>
                          <p class="font-medium">Editar el archivo de configuración</p>
                          <code class="text-xs bg-muted px-2 py-1 rounded">prisma/seed/data/workflows.ts</code>
                        </div>
                      </div>
                      
                      <div class="flex gap-4">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-tyto-primary text-tyto-primary-foreground font-bold text-sm flex-shrink-0">2</div>
                        <div>
                          <p class="font-medium">Añadir la definición del workflow</p>
                          <pre class="text-xs bg-muted p-3 rounded mt-2 overflow-x-auto"><code>export const myNewWorkflow = {
  code: 'my_workflow_code',
  name: 'Nombre del Workflow',
  description: 'Descripción',
  entityType: 'REQUEST',
  version: 1,
  isActive: true,
  states: [
    { code: 'pending', name: 'Pendiente', color: 'amber', order: 1, isInitial: true },
    { code: 'approved', name: 'Aprobado', color: 'green', order: 2, isFinal: true }
  ],
  transitions: [
    { fromCode: 'pending', toCode: 'approved', allowedRoles: ['ADMIN'], requiresComment: true }
  ]
}</code></pre>
                        </div>
                      </div>
                      
                      <div class="flex gap-4">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-tyto-primary text-tyto-primary-foreground font-bold text-sm flex-shrink-0">3</div>
                        <div>
                          <p class="font-medium">Actualizar la exportación</p>
                          <p class="text-sm text-muted-foreground">Añadir el nuevo workflow al array <code class="text-xs bg-muted px-1 rounded">allWorkflows</code></p>
                        </div>
                      </div>
                      
                      <div class="flex gap-4">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-tyto-primary text-tyto-primary-foreground font-bold text-sm flex-shrink-0">4</div>
                        <div>
                          <p class="font-medium">Aplicar cambios en BD</p>
                          <code class="text-xs bg-muted px-2 py-1 rounded">npx prisma db seed</code>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="modificar" class="space-y-4">
                    <Alert variant="destructive">
                      <Icon name="lucide:alert-triangle" class="h-4 w-4" />
                      <AlertTitle>Precaución</AlertTitle>
                      <AlertDescription>
                        Los cambios en workflows activos pueden afectar solicitudes en curso.
                      </AlertDescription>
                    </Alert>
                    
                    <div class="space-y-4">
                      <div class="flex gap-4">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-tyto-primary text-tyto-primary-foreground font-bold text-sm flex-shrink-0">1</div>
                        <div>
                          <p class="font-medium">Editar la configuración</p>
                          <p class="text-sm text-muted-foreground">Modificar <code class="text-xs bg-muted px-1 rounded">prisma/seed/data/workflows.ts</code></p>
                        </div>
                      </div>
                      
                      <div class="flex gap-4">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-tyto-primary text-tyto-primary-foreground font-bold text-sm flex-shrink-0">2</div>
                        <div>
                          <p class="font-medium">Aumentar la versión</p>
                          <pre class="text-xs bg-muted p-2 rounded mt-2"><code>version: 2, // Incrementar versión</code></pre>
                        </div>
                      </div>
                      
                      <div class="flex gap-4">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-tyto-primary text-tyto-primary-foreground font-bold text-sm flex-shrink-0">3</div>
                        <div>
                          <p class="font-medium">Crear migración si es necesario</p>
                          <code class="text-xs bg-muted px-2 py-1 rounded">pnpm prisma:migrate</code>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>

          <!-- Estructuras -->
          <section id="estructuras">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle class="flex items-center gap-2">
                    <Icon name="lucide:circle-dot" class="h-5 w-5 text-tyto-primary" />
                    Estructura de Estados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Propiedad</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell class="font-mono text-xs">code</TableCell>
                        <TableCell>string</TableCell>
                        <TableCell class="text-sm">Identificador único</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell class="font-mono text-xs">name</TableCell>
                        <TableCell>string</TableCell>
                        <TableCell class="text-sm">Nombre visible</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell class="font-mono text-xs">color</TableCell>
                        <TableCell>string</TableCell>
                        <TableCell class="text-sm">Color UI (amber, green, red...)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell class="font-mono text-xs">order</TableCell>
                        <TableCell>number</TableCell>
                        <TableCell class="text-sm">Orden de aparición</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell class="font-mono text-xs">isInitial</TableCell>
                        <TableCell>boolean</TableCell>
                        <TableCell class="text-sm">Estado inicial</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell class="font-mono text-xs">isFinal</TableCell>
                        <TableCell>boolean</TableCell>
                        <TableCell class="text-sm">Estado terminal</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell class="font-mono text-xs">isTerminal</TableCell>
                        <TableCell>boolean</TableCell>
                        <TableCell class="text-sm">Final sin salida</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle class="flex items-center gap-2">
                    <Icon name="lucide:arrow-right-left" class="h-5 w-5 text-tyto-primary" />
                    Estructura de Transiciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Propiedad</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell class="font-mono text-xs">fromCode</TableCell>
                        <TableCell>string</TableCell>
                        <TableCell class="text-sm">Estado origen</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell class="font-mono text-xs">toCode</TableCell>
                        <TableCell>string</TableCell>
                        <TableCell class="text-sm">Estado destino</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell class="font-mono text-xs">allowedRoles</TableCell>
                        <TableCell>string[]</TableCell>
                        <TableCell class="text-sm">Roles permitidos</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell class="font-mono text-xs">requiresComment</TableCell>
                        <TableCell>boolean</TableCell>
                        <TableCell class="text-sm">¿Requiere comentario?</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell class="font-mono text-xs">validatorCode</TableCell>
                        <TableCell>string</TableCell>
                        <TableCell class="text-sm">Validación personalizada</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell class="font-mono text-xs">autoActions</TableCell>
                        <TableCell>string[]</TableCell>
                        <TableCell class="text-sm">Acciones automáticas</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </section>

          <!-- Acciones Automáticas -->
          <section id="acciones">
            <Card>
              <CardHeader>
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-tyto-primary/10 rounded-lg">
                    <Icon name="lucide:zap" class="h-6 w-6 text-tyto-primary" />
                  </div>
                  <div>
                    <CardTitle>Acciones Automáticas Disponibles</CardTitle>
                    <CardDescription>Acciones que se ejecutan automáticamente en las transiciones</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="flex items-start gap-3 p-4 border rounded-lg">
                    <div class="p-2 bg-blue-100 rounded">
                      <Icon name="lucide:bell" class="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p class="font-medium font-mono text-sm">create_notification</p>
                      <p class="text-sm text-muted-foreground">Crea notificación al usuario cuando cambia el estado de su solicitud</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start gap-3 p-4 border rounded-lg">
                    <div class="p-2 bg-red-100 rounded">
                      <Icon name="lucide:calendar-x" class="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p class="font-medium font-mono text-sm">remove_calendar_event</p>
                      <p class="text-sm text-muted-foreground">Elimina evento de calendario al cancelar una solicitud aprobada</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <!-- Volver -->
          <div class="flex justify-center pt-8">
            <NuxtLink to="/">
              <Button variant="outline">
                <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '#components'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
</script>
