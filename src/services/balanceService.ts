import { getPrismaClient } from '../utils/dbConnection';
import { AppError } from '../utils/errorUtils';

const prisma = getPrismaClient();

export class BalanceService {
  async getPersonBalance(personId: string) {
    // Verify person exists
    const person = await prisma.person.findUnique({ where: { id: personId } });
    if (!person || person.deletedAt) {
      throw new AppError(404, 'Person not found');
    }

    // Get all CASH contributions for this person
    const contributions = await prisma.contribution.findMany({
      where: {
        OR: [
          { fromPersonId: personId },
          { toPersonId: personId },
        ],
        mode: 'CASH',
        deletedAt: null,
      },
    });

    // Calculate balance: RECEIVED + , GAVE -
    let balance = 0;
    contributions.forEach(c => {
      if (c.toPersonId === personId && c.type === 'RECEIVED') {
        balance += Number(c.amount || 0);
      } else if (c.fromPersonId === personId && c.type === 'GAVE') {
        balance -= Number(c.amount || 0);
      }
    });

    return {
      personId,
      personName: person.name,
      balance,
      currency: 'mixed', // Could be enhanced to track per-currency
      transactionCount: contributions.length,
    };
  }

  async getAllPersonBalances() {
    const people = await prisma.person.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    });

    const balances = await Promise.all(
      people.map(p => this.getPersonBalance(p.id))
    );

    return balances;
  }
}

export const balanceService = new BalanceService();
