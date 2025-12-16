import { Router } from 'express';
import {
  createRestaurant,
  listRestaurants,
  getRestaurant
} from '../controllers/restaurants.controller';
import { createMenu, listMenus } from '../controllers/menus.controller';
import {
  createMenuItem,
  listMenuItems
} from '../controllers/menuItems.controller';

const router = Router();

/**
 * @openapi
 * /restaurants:
 *   post:
 *     summary: Create a new restaurant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Restaurant created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 */
router.post('/restaurants', createRestaurant);
/**
 * @openapi
 * /restaurants:
 *   get:
 *     summary: List all restaurants
 *     responses:
 *       200:
 *         description: A list of restaurants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Restaurant'
 */
router.get('/restaurants', listRestaurants);
/**
 * @openapi
 * /restaurants/{id}:
 *   get:
 *     summary: Get a restaurant by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurant details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 */
router.get('/restaurants/:id', getRestaurant);

/**
 * @openapi
 * /restaurants/{restaurantId}/menus:
 *   post:
 *     summary: Create a menu for a restaurant
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Menu created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 */
router.post('/restaurants/:restaurantId/menus', createMenu);
/**
 * @openapi
 * /restaurants/{restaurantId}/menus:
 *   get:
 *     summary: List menus for a restaurant
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of menus
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Menu'
 */
router.get('/restaurants/:restaurantId/menus', listMenus);

/**
 * @openapi
 * /menus/{menuId}/items:
 *   post:
 *     summary: Create a menu item
 *     parameters:
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Menu item created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuItem'
 */
router.post('/menus/:menuId/items', createMenuItem);
/**
 * @openapi
 * /menus/{menuId}/items:
 *   get:
 *     summary: List items for a menu
 *     parameters:
 *       - in: path
 *         name: menuId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MenuItem'
 */
router.get('/menus/:menuId/items', listMenuItems);

export default router;
