import { Request, Response } from 'express';
import { prisma } from '../lib/db';

export async function createRestaurant(req: Request, res: Response) {
  const restaurant = await prisma.restaurant.create({
    data: req.body
  });
  res.status(201).json(restaurant);
}

export async function listRestaurants(_req: Request, res: Response) {
  const restaurants = await prisma.restaurant.findMany();
  res.json(restaurants);
}

export async function getRestaurant(req: Request, res: Response) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: req.params.id },
    include: { menus: true }
  });
  res.json(restaurant);
}
