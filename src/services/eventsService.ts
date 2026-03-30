import { getPrismaClient } from '../utils/dbConnection';
import { AppError } from '../utils/errorUtils';
import { CreateEvent, UpdateEvent } from '../validators/peopleValidator';

const prisma = getPrismaClient();

export class EventsService {
  async createEvent(data: CreateEvent) {
    // Verify host person exists
    const hostPerson = await prisma.person.findUnique({
      where: { id: data.hostPersonId },
    });

    if (!hostPerson || hostPerson.deletedAt) {
      throw new AppError(404, 'Host person not found');
    }

    return await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        eventDate: new Date(data.eventDate),
        location: data.location,
        hostPersonId: data.hostPersonId,
      },
      include: {
        hostPerson: true,
        contributions: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async getEvents(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { eventDate: 'desc' },
        include: {
          hostPerson: true,
          contributions: {
            where: { deletedAt: null },
          },
        },
      }),
      prisma.event.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        hostPerson: true,
        contributions: {
          where: { deletedAt: null },
          include: {
            fromPerson: true,
            toPerson: true,
          },
        },
      },
    });

    if (!event || event.deletedAt) {
      throw new AppError(404, 'Event not found');
    }

    return event;
  }

  async updateEvent(id: string, data: UpdateEvent) {
    const event = await prisma.event.findUnique({ where: { id } });
    
    if (!event || event.deletedAt) {
      throw new AppError(404, 'Event not found');
    }

    if (data.hostPersonId) {
      const hostPerson = await prisma.person.findUnique({
        where: { id: data.hostPersonId },
      });
      if (!hostPerson || hostPerson.deletedAt) {
        throw new AppError(404, 'Host person not found');
      }
    }

    return await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
        location: data.location,
        hostPersonId: data.hostPersonId,
      },
      include: {
        hostPerson: true,
        contributions: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async deleteEvent(id: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    
    if (!event || event.deletedAt) {
      throw new AppError(404, 'Event not found');
    }

    return await prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const eventsService = new EventsService();
