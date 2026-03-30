import { getPrismaClient } from '../utils/dbConnection';
import { AppError } from '../utils/errorUtils';
import { CreatePerson, UpdatePerson } from '../validators/peopleValidator';

const prisma = getPrismaClient();

export class PeopleService {
  async createPerson(data: CreatePerson) {
    try {
      return await prisma.person.create({
        data: {
          name: data.name,
          displayName: data.displayName,
          fatherName: data.fatherName,
          phone: data.phone,
          homeTown: data.homeTown,
          notes: data.notes,
        },
      });
    } catch (error: any) {
      throw new AppError(400, 'Failed to create person');
    }
  }

  async getPeople(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [people, total] = await Promise.all([
      prisma.person.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.person.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      data: people,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPersonById(id: string) {
    const person = await prisma.person.findUnique({
      where: { id },
      include: {
        hostedEvents: {
          where: { deletedAt: null },
        },
        contributionsFrom: {
          where: { deletedAt: null },
        },
        contributionsTo: {
          where: { deletedAt: null },
        },
      },
    });

    if (!person || person.deletedAt) {
      throw new AppError(404, 'Person not found');
    }

    return person;
  }

  async updatePerson(id: string, data: UpdatePerson) {
    const person = await prisma.person.findUnique({ where: { id } });
    
    if (!person || person.deletedAt) {
      throw new AppError(404, 'Person not found');
    }

    return await prisma.person.update({
      where: { id },
      data,
    });
  }

  async deletePerson(id: string) {
    const person = await prisma.person.findUnique({ where: { id } });
    
    if (!person || person.deletedAt) {
      throw new AppError(404, 'Person not found');
    }

    return await prisma.person.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const peopleService = new PeopleService();
