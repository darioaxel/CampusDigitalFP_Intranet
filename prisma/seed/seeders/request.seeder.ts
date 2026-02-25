// prisma/seed/seeders/request.seeder.ts
// Seeder para solicitudes de ejemplo usando workflows configurables

import type { PrismaClient, User } from '@prisma/client'

export async function seedRequests(prisma: PrismaClient, users: User[]): Promise<void> {
  console.log('📋 Seedando solicitudes de ejemplo...')

  // Filtrar usuarios por rol
  const profesores = users.filter(u => u.role === 'PROFESOR')
  const admins = users.filter(u => u.role === 'ADMIN' || u.role === 'ROOT')
  
  if (profesores.length === 0) {
    console.log('  ⚠️ No hay profesores para crear solicitudes')
    return
  }

  // Obtener workflows
  const freeDayWorkflow = await prisma.workflowDefinition.findUnique({
    where: { code: 'request_free_day' },
    include: { states: true }
  })
  
  const medicalWorkflow = await prisma.workflowDefinition.findUnique({
    where: { code: 'request_medical' },
    include: { states: true }
  })
  
  const standardWorkflow = await prisma.workflowDefinition.findUnique({
    where: { code: 'request_standard' },
    include: { states: true }
  })

  if (!freeDayWorkflow || !medicalWorkflow || !standardWorkflow) {
    console.log('  ⚠️ Workflows no encontrados, saltando solicitudes')
    return
  }

  const freeDayPending = freeDayWorkflow.states.find(s => s.code === 'pending')!
  const freeDayApproved = freeDayWorkflow.states.find(s => s.code === 'approved')!
  const freeDayRejected = freeDayWorkflow.states.find(s => s.code === 'rejected')!
  const medicalCommunicated = medicalWorkflow.states.find(s => s.code === 'communicated')!
  const medicalValidated = medicalWorkflow.states.find(s => s.code === 'validated')!
  const standardPending = standardWorkflow.states.find(s => s.code === 'pending')!
  const standardApproved = standardWorkflow.states.find(s => s.code === 'approved')!

  // ========================================
  // SOLICITUDES DE DÍA LIBRE
  // ========================================

  // Solicitud 1: Aprobada
  const request1 = await prisma.request.create({
    data: {
      title: 'Solicitud de día de libre disposición',
      description: 'Solicito día de libre disposición para asuntos personales',
      workflowId: freeDayWorkflow.id,
      currentStateId: freeDayApproved.id,
      requesterId: profesores[0].id,
      adminId: admins[0]?.id || profesores[0].id,
      requestedDate: new Date('2025-04-15'),
      adminNotes: 'Aprobado. Disfruta tu día.',
      context: JSON.stringify({ 
        type: 'FREE_DAY', 
        requestedDate: '2025-04-15',
        motivo: 'asuntos_personales'
      })
    }
  })
  console.log(`  ✓ Solicitud creada: ${request1.title}`)

  // Solicitud 2: Pendiente
  const request2 = await prisma.request.create({
    data: {
      title: 'Solicitud de día de libre disposición - Mayo',
      description: 'Solicito día de libre disposición para el mes de mayo',
      workflowId: freeDayWorkflow.id,
      currentStateId: freeDayPending.id,
      requesterId: profesores[1]?.id || profesores[0].id,
      requestedDate: new Date('2025-05-20'),
      context: JSON.stringify({ 
        type: 'FREE_DAY', 
        requestedDate: '2025-05-20',
        motivo: 'descanso'
      })
    }
  })
  console.log(`  ✓ Solicitud creada: ${request2.title}`)

  // Solicitud 3: Rechazada
  const request3 = await prisma.request.create({
    data: {
      title: 'Solicitud de día de libre disposición - Junio',
      description: 'Solicito día de libre disposición',
      workflowId: freeDayWorkflow.id,
      currentStateId: freeDayRejected.id,
      requesterId: profesores[2]?.id || profesores[0].id,
      adminId: admins[0]?.id || profesores[0].id,
      requestedDate: new Date('2025-06-10'),
      adminNotes: 'Rechazado por coincidir con período de exámenes.',
      context: JSON.stringify({ 
        type: 'FREE_DAY', 
        requestedDate: '2025-06-10',
        motivo: 'personal'
      })
    }
  })
  console.log(`  ✓ Solicitud creada: ${request3.title}`)

  // ========================================
  // SOLICITUDES MÉDICAS
  // ========================================

  // Solicitud 4: Validada (con documentos)
  const request4 = await prisma.request.create({
    data: {
      title: 'Aviso de visita médica',
      description: 'Comunico que tengo visita médica el día indicado. Adjunto justificante.',
      workflowId: medicalWorkflow.id,
      currentStateId: medicalValidated.id,
      requesterId: profesores[0].id,
      adminId: admins[0]?.id || profesores[0].id,
      requestedDate: new Date('2025-03-10'),
      adminNotes: 'Justificante recibido y validado.',
      context: JSON.stringify({ 
        type: 'MEDICAL_APPOINTMENT', 
        requestedDate: '2025-03-10',
        hora: '10:00',
        centro: 'Centro de Salud Principal'
      })
    }
  })
  console.log(`  ✓ Solicitud creada: ${request4.title}`)

  // Solicitud 5: Comunicada (pendiente de docs)
  const request5 = await prisma.request.create({
    data: {
      title: 'Aviso de visita médica especialista',
      description: 'Tengo cita con especialista. Adjuntaré justificante posteriormente.',
      workflowId: medicalWorkflow.id,
      currentStateId: medicalCommunicated.id,
      requesterId: profesores[1]?.id || profesores[0].id,
      requestedDate: new Date('2025-04-05'),
      context: JSON.stringify({ 
        type: 'MEDICAL_APPOINTMENT', 
        requestedDate: '2025-04-05',
        hora: '16:30',
        especialidad: 'Traumatología'
      })
    }
  })
  console.log(`  ✓ Solicitud creada: ${request5.title}`)

  // ========================================
  // SOLICITUDES ESTÁNDAR (Permisos, Formación)
  // ========================================

  // Solicitud 6: Permiso aprobado
  const request6 = await prisma.request.create({
    data: {
      title: 'Solicitud de permiso por matrimonio',
      description: 'Solicito permiso por matrimonio de acuerdo al convenio colectivo.',
      workflowId: standardWorkflow.id,
      currentStateId: standardApproved.id,
      requesterId: profesores[0].id,
      adminId: admins[0]?.id || profesores[0].id,
      startDate: new Date('2025-07-15'),
      endDate: new Date('2025-07-19'),
      adminNotes: 'Aprobado. Enhorabuena!',
      context: JSON.stringify({ 
        type: 'LEAVE', 
        subtipo: 'matrimonio',
        dias: 5
      })
    }
  })
  console.log(`  ✓ Solicitud creada: ${request6.title}`)

  // Solicitud 7: Formación pendiente
  const request7 = await prisma.request.create({
    data: {
      title: 'Solicitud de formación - Curso de Especialización',
      description: 'Solicito asistir al curso de especialización en nuevas tecnologías',
      workflowId: standardWorkflow.id,
      currentStateId: standardPending.id,
      requesterId: profesores[3]?.id || profesores[0].id,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-09-05'),
      context: JSON.stringify({ 
        type: 'TRAINING', 
        titulo: 'Especialización en Inteligencia Artificial',
        centro: 'Universidad Politécnica',
        horas: 40,
        url: 'https://ejemplo.com/curso'
      })
    }
  })
  console.log(`  ✓ Solicitud creada: ${request7.title}`)

  // Solicitud 8: Otra solicitud pendiente
  const request8 = await prisma.request.create({
    data: {
      title: 'Solicitud de cambio de horario',
      description: 'Solicito cambio de horario por motivos de conciliación familiar.',
      workflowId: standardWorkflow.id,
      currentStateId: standardPending.id,
      requesterId: profesores[4]?.id || profesores[0].id,
      context: JSON.stringify({ 
        type: 'OTHER', 
        motivo: 'conciliacion_familiar',
        detalles: 'Necesito salir antes los viernes'
      })
    }
  })
  console.log(`  ✓ Solicitud creada: ${request8.title}`)

  // ========================================
  // SOLICITUD DE ALTA DE USUARIO (Formulario público - Para testing del admin)
  // ========================================
  
  const newUserWorkflow = await prisma.workflowDefinition.findUnique({
    where: { code: 'request_new_user' },
    include: { states: true }
  })

  if (newUserWorkflow) {
    const newUserPending = newUserWorkflow.states.find(s => s.code === 'pending')!
    
    // Solicitud 9: Alta de nuevo usuario desde formulario público (sin requester autenticado)
    const request9 = await prisma.request.create({
      data: {
        title: 'Solicitud de alta - Nuevo Profesor',
        description: 'Solicitud para dar de alta a un nuevo profesor del departamento de Informática. El candidato tiene experiencia previa en desarrollo web y bases de datos.',
        workflowId: newUserWorkflow.id,
        currentStateId: newUserPending.id,
        requesterId: admins[0]?.id || profesores[0].id, // Se asigna al admin por defecto
        adminId: admins[0]?.id,
        context: JSON.stringify({ 
          type: 'NEW_USER',
          requester: {
            name: 'Ana Martínez',
            email: 'ana.martinez.referral@email.com',
            phone: '612345678'
          },
          userData: {
            firstName: 'Carlos',
            lastName: 'García López',
            email: 'c.garcia@centro.edu',
            role: 'PROFESOR',
            dni: '12345678A',
            phone: '623456789',
            password: 'TempPass123', // Contraseña temporal definida por el solicitante
            birthDate: '1985-03-15',
            emailPersonal: 'carlos.garcia.personal@email.com'
          },
          department: 'Informática',
          specialty: 'Desarrollo Web',
          experience: '5 años en desarrollo de aplicaciones web, dominio de React, Node.js y bases de datos SQL/NoSQL'
        })
      }
    })
    console.log(`  ✓ Solicitud creada: ${request9.title} (tipo: NEW_USER)`)
    console.log(`    → Solicitante: Ana Martínez (referente)`)
    console.log(`    → Candidato: Carlos García López (c.garcia@centro.edu)`)
    console.log(`    → Para probar: Inicia sesión como ADMIN y revisa la solicitud #${request9.id}`)
    console.log(`    → Endpoint: GET /api/requests/${request9.id}/transitions`)
    console.log(`    → Aprobar: POST /api/requests/${request9.id}/transition { "toState": "approved", "comment": "Aprobado" }`)
    console.log(`    → Crear usuario: POST /api/users { datos del candidato }`)
  }

  // ========================================
  // HISTORIAL DE ESTADOS
  // ========================================

  // Crear algunos historiales para mostrar el flujo
  
  // Historial para request1 (día libre aprobado) - Workflow simplificado
  await prisma.stateHistory.createMany({
    data: [
      {
        requestId: request1.id,
        fromStateId: freeDayPending.id,
        toStateId: freeDayApproved.id,
        actorId: admins[0]?.id || profesores[0].id,
        comment: 'Aprobado por administración',
        metadata: JSON.stringify({ action: 'approved' })
      }
    ]
  })
  console.log(`  ✓ Historial creado para solicitud: ${request1.title}`)

  console.log('✅ Solicitudes seedeadas correctamente')
}
