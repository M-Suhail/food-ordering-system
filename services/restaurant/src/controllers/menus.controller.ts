
import { Request, Response } from 'express';
import { prisma } from '../lib/db';

export async function createMenu(req: Request, res: Response) {
  const menu = await prisma.menu.create({
    data: {
      id: req.body.id,
      name: req.body.name,
      restaurantId: req.params.restaurantId
    }
  });
  res.status(201).json(menu);
}

export async function listMenus(req: Request, res: Response) {
  const menus = await prisma.menu.findMany({
    where: { restaurantId: req.params.restaurantId }
  });
  res.json(menus);
}
