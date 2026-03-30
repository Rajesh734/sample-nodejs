import { getPrismaClient } from '../utils/dbConnection';

const prisma = getPrismaClient();

export class ItemsService {
  async getItemSuggestions() {
    const items = await prisma.contribution.findMany({
      where: {
        mode: { in: ['ITEM', 'GOLD', 'SILVER'] },
        deletedAt: null,
      },
      select: {
        itemType: true,
        mode: true,
      },
      distinct: ['itemType'],
    });

    const suggestions = items
      .filter(item => item.itemType)
      .map(item => ({
        itemType: item.itemType,
        type: item.mode,
      }))
      .sort((a, b) => a.itemType!.localeCompare(b.itemType!));

    return suggestions;
  }
}

export const itemsService = new ItemsService();
