// Datos de prueba para estudios FP - Ciclo DAM (Desarrollo de Aplicaciones Multiplataforma)
// Basado en el currículo oficial de Aragón

export const ciclosFormativos = [
  {
    codigo: 'IFCD0210',
    nombre: 'Desarrollo de Aplicaciones Multiplataforma',
    nivel: 'GRADO_SUPERIOR',
    familia: 'INFORMATICA_COMUNICACIONES',
    horasTotales: 2000,
    duracion: '2000 horas (2 cursos)',
    cursoAcademico: '2024-2025',
    activo: true
  }
]

export const modulosDAM = [
  // Primer curso
  {
    codigo: '0485',
    nombre: 'Sistemas informáticos',
    siglas: 'SI',
    horasTotales: 120,
    horasAnuales: 120,
    curso: 1,
    orden: 1,
    activo: true
  },
  {
    codigo: '0486',
    nombre: 'Bases de Datos',
    siglas: 'BD',
    horasTotales: 180,
    horasAnuales: 180,
    curso: 1,
    orden: 2,
    activo: true
  },
  {
    codigo: '0487',
    nombre: 'Programación',
    siglas: 'PROG',
    horasTotales: 240,
    horasAnuales: 240,
    curso: 1,
    orden: 3,
    activo: true
  },
  {
    codigo: '0488',
    nombre: 'Lenguajes de marcas y sistemas de gestión de información',
    siglas: 'LMSGI',
    horasTotales: 120,
    horasAnuales: 120,
    curso: 1,
    orden: 4,
    activo: true
  },
  {
    codigo: '0489',
    nombre: 'Entornos de desarrollo',
    siglas: 'ED',
    horasTotales: 90,
    horasAnuales: 90,
    curso: 1,
    orden: 5,
    activo: true
  },
  {
    codigo: '0490',
    nombre: 'Formación y Orientación Laboral',
    siglas: 'FOL',
    horasTotales: 90,
    horasAnuales: 90,
    curso: 1,
    orden: 6,
    activo: true
  },
  // Segundo curso
  {
    codigo: '0491',
    nombre: 'Acceso a datos',
    siglas: 'AD',
    horasTotales: 120,
    horasAnuales: 120,
    curso: 2,
    orden: 7,
    activo: true
  },
  {
    codigo: '0492',
    nombre: 'Desarrollo de interfaces',
    siglas: 'DI',
    horasTotales: 120,
    horasAnuales: 120,
    curso: 2,
    orden: 8,
    activo: true
  },
  {
    codigo: '0493',
    nombre: 'Programación multimedia y dispositivos móviles',
    siglas: 'PMDM',
    horasTotales: 100,
    horasAnuales: 100,
    curso: 2,
    orden: 9,
    activo: true
  },
  {
    codigo: '0494',
    nombre: 'Programación de servicios y procesos',
    siglas: 'PSP',
    horasTotales: 80,
    horasAnuales: 80,
    curso: 2,
    orden: 10,
    activo: true
  },
  {
    codigo: '0495',
    nombre: 'Sistemas de gestión empresarial',
    siglas: 'SGE',
    horasTotales: 100,
    horasAnuales: 100,
    curso: 2,
    orden: 11,
    activo: true
  },
  {
    codigo: '0616',
    nombre: 'Empresa e iniciativa emprendedora',
    siglas: 'EIE',
    horasTotales: 60,
    horasAnuales: 60,
    curso: 2,
    orden: 12,
    activo: true
  },
  {
    codigo: '0617',
    nombre: 'Proyecto de desarrollo de aplicaciones multiplataforma',
    siglas: 'PROY',
    horasTotales: 50,
    horasAnuales: 50,
    curso: 2,
    orden: 13,
    activo: true
  },
  {
    codigo: '0618',
    nombre: 'Formación en centros de trabajo',
    siglas: 'FCT',
    horasTotales: 360,
    horasAnuales: 360,
    curso: 2,
    orden: 14,
    activo: true
  }
]

// Resultados de Aprendizaje del módulo de Programación (0487)
export const rasProgramacion = [
  {
    numero: '1',
    descripcion: 'Reconoce la estructura de un programa informático, identificando y relacionando los elementos propios del lenguaje de programación utilizado.',
    duracion: '25 horas',
    orden: 1
  },
  {
    numero: '2',
    descripcion: 'Escribe y depura código, analizando y utilizando las estructuras de control del lenguaje.',
    duracion: '30 horas',
    orden: 2
  },
  {
    numero: '3',
    descripcion: 'Desarrolla programas organizados en clases analizando y aplicando los principios de la programación orientada a objetos.',
    duracion: '40 horas',
    orden: 3
  },
  {
    numero: '4',
    descripcion: 'Desarrolla programas analizando y utilizando estructuras estáticas de almacenamiento en memoria.',
    duracion: '25 horas',
    orden: 4
  },
  {
    numero: '5',
    descripcion: 'Desarrolla programas analizando y aplicando estructuras dinámicas de almacenamiento en memoria.',
    duracion: '30 horas',
    orden: 5
  },
  {
    numero: '6',
    descripcion: 'Desarrolla programas aplicando características avanzadas de los lenguajes orientados a objetos y del entorno de programación.',
    duracion: '35 horas',
    orden: 6
  },
  {
    numero: '7',
    descripcion: 'Desarrolla programas de gestión de información en bases de datos relacionales, utilizando asistentes, herramientas gráficas y el lenguaje de manipulación de datos.',
    duracion: '35 horas',
    orden: 7
  },
  {
    numero: '8',
    descripcion: 'Utiliza bases de datos orientadas a objetos, analizando sus características y aplicando técnicas para mantener la persistencia de la información.',
    duracion: '20 horas',
    orden: 8
  }
]

// Criterios de Evaluación del RA1 de Programación
export const cesRA1Programacion = [
  {
    numero: 'a',
    descripcion: 'Se ha identificado la estructura de un programa informático, reconociendo y relacionando los bloques que la componen.',
    nivel: 'Básico',
    instrumentos: ['Prueba escrita', 'Ejercicio práctico'],
    orden: 1
  },
  {
    numero: 'b',
    descripcion: 'Se han identificado las características del lenguaje de programación utilizado, reconociendo la utilidad de cada una de ellas.',
    nivel: 'Básico',
    instrumentos: ['Prueba escrita'],
    orden: 2
  },
  {
    numero: 'c',
    descripcion: 'Se han reconocido los elementos léxicos del lenguaje y sus normas de construcción, identificándolos en fragmentos de código.',
    nivel: 'Básico',
    instrumentos: ['Ejercicio práctico', 'Proyecto'],
    orden: 3
  },
  {
    numero: 'd',
    descripcion: 'Se ha identificado la sintaxis y semántica de los tipos de datos primitivos del lenguaje, utilizándolos adecuadamente.',
    nivel: 'Básico',
    instrumentos: ['Ejercicio práctico'],
    orden: 4
  },
  {
    numero: 'e',
    descripcion: 'Se han identificado los operadores del lenguaje y se han utilizado para construir expresiones correctamente.',
    nivel: 'Básico',
    instrumentos: ['Ejercicio práctico'],
    orden: 5
  },
  {
    numero: 'f',
    descripcion: 'Se ha reconocido la sintaxis y semántica de las sentencias simples y compuestas del lenguaje, utilizándolas adecuadamente.',
    nivel: 'Avanzado',
    instrumentos: ['Ejercicio práctico', 'Proyecto'],
    orden: 6
  },
  {
    numero: 'g',
    descripcion: 'Se han utilizado entornos integrados de desarrollo para editar código fuente, compilando y ejecutando programas.',
    nivel: 'Específico',
    instrumentos: ['Observación', 'Proyecto'],
    orden: 7
  },
  {
    numero: 'h',
    descripcion: 'Se han identificado las características del código fuente, del código objeto y del código ejecutable, describiendo las fases del proceso de compilación.',
    nivel: 'Básico',
    instrumentos: ['Prueba escrita'],
    orden: 8
  }
]

// Criterios de Evaluación del RA2 de Programación
export const cesRA2Programacion = [
  {
    numero: 'a',
    descripcion: 'Se han escrito sentencias de selección, aplicándolas correctamente según la sintaxis y semántica del lenguaje.',
    nivel: 'Básico',
    instrumentos: ['Ejercicio práctico'],
    orden: 1
  },
  {
    numero: 'b',
    descripcion: 'Se han escrito sentencias iterativas, aplicándolas correctamente según la sintaxis y semántica del lenguaje.',
    nivel: 'Básico',
    instrumentos: ['Ejercicio práctico'],
    orden: 2
  },
  {
    numero: 'c',
    descripcion: 'Se han utilizado saltos condicionales e incondicionales, describiendo su ámbito de aplicación.',
    nivel: 'Avanzado',
    instrumentos: ['Ejercicio práctico'],
    orden: 3
  },
  {
    numero: 'd',
    descripcion: 'Se han utilizado estructuras de control anidadas, reconociendo su ámbito de aplicación.',
    nivel: 'Avanzado',
    instrumentos: ['Ejercicio práctico', 'Proyecto'],
    orden: 4
  },
  {
    numero: 'e',
    descripcion: 'Se han utilizado las sentencias de salto y de excepciones, reconociendo su ámbito de aplicación.',
    nivel: 'Avanzado',
    instrumentos: ['Ejercicio práctico'],
    orden: 5
  },
  {
    numero: 'f',
    descripcion: 'Se han utilizado entornos integrados de desarrollo para depurar y verificar el funcionamiento de programas.',
    nivel: 'Específico',
    instrumentos: ['Observación', 'Proyecto'],
    orden: 6
  }
]

// Temas del módulo de Programación
export const temasProgramacion = [
  {
    numero: 1,
    titulo: 'Introducción a la programación',
    descripcion: 'Estructura de un programa. Elementos léxicos. Tipos de datos primitivos. Operadores.',
    duracion: '20 horas',
    orden: 1,
    rasAsociados: ['1'] // RA1
  },
  {
    numero: 2,
    titulo: 'Estructuras de control',
    descripcion: 'Sentencias de selección (if, switch). Sentencias iterativas (while, for, do-while). Saltos.',
    duracion: '25 horas',
    orden: 2,
    rasAsociados: ['2'] // RA2
  },
  {
    numero: 3,
    titulo: 'Programación orientada a objetos - Fundamentos',
    descripcion: 'Clases y objetos. Atributos y métodos. Constructores. Encapsulamiento.',
    duracion: '30 horas',
    orden: 3,
    rasAsociados: ['3'] // RA3
  },
  {
    numero: 4,
    titulo: 'Programación orientada a objetos - Avanzado',
    descripcion: 'Herencia. Polimorfismo. Interfaces. Clases abstractas.',
    duracion: '35 horas',
    orden: 4,
    rasAsociados: ['3', '6'] // RA3 y RA6
  },
  {
    numero: 5,
    titulo: 'Estructuras de datos estáticas',
    descripcion: 'Arrays unidimensionales y multidimensionales. Cadenas de caracteres.',
    duracion: '20 horas',
    orden: 5,
    rasAsociados: ['4'] // RA4
  },
  {
    numero: 6,
    titulo: 'Estructuras de datos dinámicas',
    descripcion: 'Colecciones. Listas, conjuntos, mapas. Genéricos.',
    duracion: '30 horas',
    orden: 6,
    rasAsociados: ['5'] // RA5
  },
  {
    numero: 7,
    titulo: 'Acceso a bases de datos relacionales',
    descripcion: 'Conectores JDBC. CRUD. Mapeo objeto-relacional.',
    duracion: '35 horas',
    orden: 7,
    rasAsociados: ['7'] // RA7
  },
  {
    numero: 8,
    titulo: 'Persistencia con bases de datos orientadas a objetos',
    descripcion: 'Conceptos de BD OO. Frameworks de persistencia.',
    duracion: '20 horas',
    orden: 8,
    rasAsociados: ['8'] // RA8
  }
]

// Contenidos del Tema 1 de Programación
export const contenidosTema1Prog = [
  {
    numero: '1.1',
    titulo: 'Conceptos básicos de programación',
    descripcion: 'Programa, algoritmo, código fuente, código objeto, código ejecutable. Fases del desarrollo.',
    orden: 1
  },
  {
    numero: '1.2',
    titulo: 'Estructura de un programa',
    descripcion: 'Bloques de código. Comentarios. Identificadores. Palabras reservadas.',
    orden: 2
  },
  {
    numero: '1.3',
    titulo: 'Tipos de datos primitivos',
    descripcion: 'Numéricos enteros y reales. Caracteres. Booleanos. Literales.',
    orden: 3
  },
  {
    numero: '1.4',
    titulo: 'Operadores',
    descripcion: 'Aritméticos. Relacionales. Lógicos. Asignación. Incremento/decremento.',
    orden: 4
  }
]

// Resultados de Aprendizaje del módulo de Bases de Datos (0486)
export const rasBasesDatos = [
  {
    numero: '1',
    descripcion: 'Reconoce los elementos de las bases de datos analizando sus funciones y valoración de los distintos tipos.',
    duracion: '20 horas',
    orden: 1
  },
  {
    numero: '2',
    descripcion: 'Crea bases de datos relacionales definiendo su estructura y las características de sus elementos según el modelo relacional y las reglas de integridad.',
    duracion: '30 horas',
    orden: 2
  },
  {
    numero: '3',
    descripcion: 'Consulta la información almacenada en una base de datos utilizando asistentes, herramientas gráficas y el lenguaje de manipulación de datos.',
    duracion: '40 horas',
    orden: 3
  },
  {
    numero: '4',
    descripcion: 'Modifica la información almacenada en la base de datos utilizando asistentes, herramientas gráficas y el lenguaje de manipulación de datos.',
    duracion: '30 horas',
    orden: 4
  },
  {
    numero: '5',
    descripcion: 'Desarrolla procedimientos almacenados valorando su utilidad y aplicando mecanismos de control de transacciones.',
    duracion: '30 horas',
    orden: 5
  },
  {
    numero: '6',
    descripcion: 'Gestiona la información almacenada en bases de datos objeto-relacionales identificando las características de este modelo.',
    duracion: '20 horas',
    orden: 6
  }
]

// Temas del módulo de Bases de Datos
export const temasBasesDatos = [
  {
    numero: 1,
    titulo: 'Introducción a las bases de datos',
    descripcion: 'Conceptos básicos. Sistemas de almacenamiento. Modelos de datos. SGBD.',
    duracion: '15 horas',
    orden: 1,
    rasAsociados: ['1']
  },
  {
    numero: 2,
    titulo: 'Diseño de bases de datos relacionales',
    descripcion: 'Modelo entidad-relación. Normalización. Reglas de integridad.',
    duracion: '30 horas',
    orden: 2,
    rasAsociados: ['2']
  },
  {
    numero: 3,
    titulo: 'Consultas SQL',
    descripcion: 'SELECT. Filtros. Ordenación. Funciones de grupo. Joins. Subconsultas.',
    duracion: '45 horas',
    orden: 3,
    rasAsociados: ['3']
  },
  {
    numero: 4,
    titulo: 'Modificación de datos',
    descripcion: 'INSERT, UPDATE, DELETE. Transacciones. Control de concurrencia.',
    duracion: '30 horas',
    orden: 4,
    rasAsociados: ['4']
  },
  {
    numero: 5,
    titulo: 'Programación en bases de datos',
    descripcion: 'Procedimientos almacenados. Funciones. Triggers. Eventos.',
    duracion: '35 horas',
    orden: 5,
    rasAsociados: ['5']
  },
  {
    numero: 6,
    titulo: 'Bases de datos objeto-relacionales',
    descripcion: 'Tipos de datos complejos. Herencia. Objetos en PostgreSQL.',
    duracion: '25 horas',
    orden: 6,
    rasAsociados: ['6']
  }
]
