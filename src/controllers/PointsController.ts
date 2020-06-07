import { Request, Response } from 'express';
import Knex from '../database/connection';

class PointsController{

    async index(request: Request, response: Response) {
        const { city, uf, items } = request.query;

        const parsedItems = String(items)
            .split(',')
            .map(item => Number(item.trim()));

        const points = await Knex('points')
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .whereIn('point_items.items_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('points.*');

        return response.json({ points });
    }

    async show(request: Request, response: Response) {
        const {id} = request.params;

        const point = await Knex('points').where('id', id).first();

        if(!point){
            return response.status(400).json({ message: 'Point not found' });
        }

        const items = await Knex('items')
        .join('point_items', 'items.id', '=', 'point_items.items_id')
        .where('point_items.point_id', id)
        .select('items.title');

        return response.json({ point, items });
    }

    async create(request: Request, response: Response) {
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = request.body;
    
        const trx = await Knex.transaction();
        const point = {
            image:'image-fake',
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        };
    
        const insertedIds = await trx('points').insert(point);
    
        const point_id = insertedIds[0];
    
        const pointItems = items.map((items_id: number) => {
            return {
                items_id,
                point_id,
            };
        })
    
        await trx('point_items').insert(pointItems);
        await trx.commit();
    
        return response.json({
            id: point_id, 
            ...point,
         });
    }
}

export default PointsController;