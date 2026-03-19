const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  // Córdoba - habilitada
  await prisma.gastoJurisdiccion.upsert({
    where: { jurisdiccion: 'CORDOBA' },
    update: {
      nombre: 'Córdoba (IPJ)',
      habilitada: true,
      orden: 1,
      totalEstimado: '~$166.850',
      gastos: [
        { concepto: 'Tasa de constitución', valor: '$150.680' },
        { concepto: 'Reserva de nombre', valor: '$16.170' },
        { concepto: 'Depósito capital social', valor: 'Desde $158.900' },
        { concepto: 'Publicación de edicto', valor: 'Bonificado' },
        { concepto: 'Certificación de firmas', valor: 'Posibilidad de hacerlo online' }
      ]
    },
    create: {
      jurisdiccion: 'CORDOBA',
      nombre: 'Córdoba (IPJ)',
      habilitada: true,
      orden: 1,
      totalEstimado: '~$166.850',
      gastos: [
        { concepto: 'Tasa de constitución', valor: '$150.680' },
        { concepto: 'Reserva de nombre', valor: '$16.170' },
        { concepto: 'Depósito capital social', valor: 'Desde $158.900' },
        { concepto: 'Publicación de edicto', valor: 'Bonificado' },
        { concepto: 'Certificación de firmas', valor: 'Posibilidad de hacerlo online' }
      ]
    }
  });
  console.log('Córdoba OK');

  // CABA - deshabilitada (según pedido del usuario)
  await prisma.gastoJurisdiccion.upsert({
    where: { jurisdiccion: 'CABA' },
    update: {
      nombre: 'CABA (IGJ)',
      habilitada: false,
      orden: 2,
      totalEstimado: '~$258.900',
      gastos: [
        { concepto: 'Tasa de constitución', valor: 'Desde $158.900' },
        { concepto: 'Reserva de nombre', valor: 'No aplica' },
        { concepto: 'Depósito capital social', valor: 'No aplica' },
        { concepto: 'Publicación de edicto', valor: '~$60.000' },
        { concepto: 'Certificación de firmas', valor: '~$40.000' }
      ]
    },
    create: {
      jurisdiccion: 'CABA',
      nombre: 'CABA (IGJ)',
      habilitada: false,
      orden: 2,
      totalEstimado: '~$258.900',
      gastos: [
        { concepto: 'Tasa de constitución', valor: 'Desde $158.900' },
        { concepto: 'Reserva de nombre', valor: 'No aplica' },
        { concepto: 'Depósito capital social', valor: 'No aplica' },
        { concepto: 'Publicación de edicto', valor: '~$60.000' },
        { concepto: 'Certificación de firmas', valor: '~$40.000' }
      ]
    }
  });
  console.log('CABA OK');

  await prisma.$disconnect();
  console.log('Done!');
}

seed().catch(e => { console.error(e); process.exit(1); });
