import { Decimal } from '@prisma/client/runtime/library';
import { getPrismaClient } from '../utils/dbConnection';
import { AppError } from '../utils/errorUtils';
import { CreateContribution, UpdateContribution } from '../validators/peopleValidator';

const prisma = getPrismaClient();

export class ContributionsService {
  async createContribution(data: CreateContribution) {
    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
    });
    if (!event || event.deletedAt) {
      throw new AppError(404, 'Event not found');
    }

    // Verify people exist
    const [fromPerson, toPerson] = await Promise.all([
      prisma.person.findUnique({ where: { id: data.fromPersonId } }),
      prisma.person.findUnique({ where: { id: data.toPersonId } }),
    ]);

    if (!fromPerson || fromPerson.deletedAt) {
      throw new AppError(404, 'From person not found');
    }
    if (!toPerson || toPerson.deletedAt) {
      throw new AppError(404, 'To person not found');
    }

    // Validate contribution data based on mode
    this.validateContributionMode(data);

    return await prisma.contribution.create({
      data: {
        eventId: data.eventId,
        fromPersonId: data.fromPersonId,
        toPersonId: data.toPersonId,
        type: data.type,
        mode: data.mode,
        amount: data.amount ? new Decimal(data.amount) : null,
        currencyCode: data.currencyCode,
        itemType: data.itemType,
        itemQuantity: data.itemQuantity,
        notes: data.notes,
        contributionDate: data.contributionDate ? new Date(data.contributionDate) : new Date(),
      },
      include: {
        event: true,
        fromPerson: true,
        toPerson: true,
      },
    });
  }

  async getContributions(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { contributionDate: 'desc' },
        include: {
          event: true,
          fromPerson: true,
          toPerson: true,
        },
      }),
      prisma.contribution.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      data: contributions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getContributionById(id: string) {
    const contribution = await prisma.contribution.findUnique({
      where: { id },
      include: {
        event: true,
        fromPerson: true,
        toPerson: true,
      },
    });

    if (!contribution || contribution.deletedAt) {
      throw new AppError(404, 'Contribution not found');
    }

    return contribution;
  }

  async getPersonContributions(personId: string, page: number = 1, limit: number = 10) {
    // Verify person exists
    const person = await prisma.person.findUnique({ where: { id: personId } });
    if (!person || person.deletedAt) {
      throw new AppError(404, 'Person not found');
    }

    const skip = (page - 1) * limit;
    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({
        where: {
          OR: [
            { fromPersonId: personId },
            { toPersonId: personId },
          ],
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: { contributionDate: 'desc' },
        include: {
          event: true,
          fromPerson: true,
          toPerson: true,
        },
      }),
      prisma.contribution.count({
        where: {
          OR: [
            { fromPersonId: personId },
            { toPersonId: personId },
          ],
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: contributions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateContribution(id: string, data: UpdateContribution) {
    const contribution = await prisma.contribution.findUnique({ where: { id } });
    
    if (!contribution || contribution.deletedAt) {
      throw new AppError(404, 'Contribution not found');
    }

    // Validate if mode changed
    if (data.mode) {
      this.validateContributionMode(data);
    }

    return await prisma.contribution.update({
      where: { id },
      data: {
        type: data.type,
        mode: data.mode,
        amount: data.amount ? new Decimal(data.amount) : undefined,
        currencyCode: data.currencyCode,
        itemType: data.itemType,
        itemQuantity: data.itemQuantity,
        notes: data.notes,
        contributionDate: data.contributionDate ? new Date(data.contributionDate) : undefined,
      },
      include: {
        event: true,
        fromPerson: true,
        toPerson: true,
      },
    });
  }

  async deleteContribution(id: string) {
    const contribution = await prisma.contribution.findUnique({ where: { id } });
    
    if (!contribution || contribution.deletedAt) {
      throw new AppError(404, 'Contribution not found');
    }

    return await prisma.contribution.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private validateContributionMode(data: any) {
    const { mode, amount, currencyCode, itemType, itemQuantity } = data;

    if (mode === 'CASH') {
      if (amount === null || amount === undefined || !currencyCode) {
        throw new AppError(400, 'CASH mode requires amount and currencyCode');
      }
    } else if (mode === 'GOLD' || mode === 'SILVER') {
      if (itemQuantity === null || itemQuantity === undefined) {
        throw new AppError(400, `${mode} mode requires itemQuantity`);
      }
      if (amount !== null && amount !== undefined) {
        throw new AppError(400, `${mode} mode should not have amount`);
      }
    } else if (mode === 'ITEM') {
      if (!itemType || itemQuantity === null || itemQuantity === undefined) {
        throw new AppError(400, 'ITEM mode requires itemType and itemQuantity');
      }
      if (amount !== null && amount !== undefined) {
        throw new AppError(400, 'ITEM mode should not have amount');
      }
    }
  }
}

export const contributionsService = new ContributionsService();
