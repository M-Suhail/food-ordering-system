import { Request, Response } from 'express';
import { prisma } from '../lib/db';

export async function createMenuItem(req: Request, res: Response) {
  const item = await prisma.menuItem.create({
    data: {
      id: req.body.id,
      name: req.body.name,
      price: req.body.price,
      menuId: req.params.menuId
    }
  });
  res.status(201).json(item);
}

export async function listMenuItems(req: Request, res: Response) {
  const items = await prisma.menuItem.findMany({
    where: { menuId: req.params.menuId }
  });
  res.json(items);
}
