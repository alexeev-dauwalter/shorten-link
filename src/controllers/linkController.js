import { PrismaClient } from '@prisma/client';
import qrcode from 'qrcode';
import { Link } from '../models/Link.js';

const prisma = new PrismaClient();

export class LinkController {
    static async getAll(req, res) {
        try {
            const links = await prisma.link.findMany({ where: { owner: req.user.id } });
            return res.send(links.map(link => {
                return Object.assign(
                    { qrcode: `https://${process.env.SERVER_HOSTNAME}/${link.short_link}/qr` },
                    new Link(link).toJSON()
                );
            }));
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async create(req, res) {
        try {
            const { link, duration } = req.body;

            if (!link || !duration) return res.code(400).send();

            const short_link = await Link.generateShort(),
                query = await prisma.link.create({
                    data: {
                        owner: req.user.id,
                        short_link,
                        link,
                        end_at: new Date(parseInt(duration, 10) * 1000)
                    }
                });

            if (!query) return res.code(500).send();

            return res.send({ short_link });
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async redirect(req, res) {
        try {
            const { hash } = req.params,
                data = await prisma.link.findFirst({ where: { short_link: hash } });

            if (!data) return res.code(404).send();

            return res.redirect(308, data.link);
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async information(req, res) {
        try {
            const { hash } = req.params;
            let data = await prisma.link.findFirst({ where: { owner: req.user.id, short_link: hash } });

            if (!data) return res.code(404).send();

            return res.send(Object.assign(
                new Link(data).toJSON(),
                { qrcode: `https://${process.env.SERVER_HOSTNAME}/${hash}/qr` },
            ));
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async update(req, res) {
        try {
            const { hash } = req.params,
                { link, duration } = req.body;

            let data = await prisma.link.findFirst({ where: { owner: req.user.id, short_link: hash } });

            if (!data) return res.code(404).send();

            if (!link && !duration) return res.code(400).send();

            const query = await prisma.link.update({
                where: { short_link: hash },
                data: new Link(Object.assign({
                    link: link || data.link,
                    updated_at: new Date(),
                    end_at: duration ? new Date(duration * 1000) : new Date(data.end_at)
                }, data)).toJSON()
            });

            if (!query) return res.code(500).send();

            data = await prisma.link.findFirst({ where: { owner: req.user.id, short_link: hash } });

            return res.send(new Link(data).toJSON());
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async delete(req, res) {
        try {
            const { hash } = req.params;
            let data = await prisma.link.findFirst({ where: { owner: req.user.id, short_link: hash } });

            if (!data) return res.code(404).send();

            const query = await prisma.link.delete({ where: { short_link: hash } });

            if (!query) return res.code(500).send();

            return res.send(new Link(data).toJSON());
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async generateQR(req, res) {
        try {
            const { hash } = req.params,
                data = await prisma.link.findMany({ where: { short_link: hash } });

            if (!data.length) return res.code(404).send();

            const qrImage = (await qrcode.toDataURL(
                `https://${process.env.SERVER_HOSTNAME}/${hash}`,
                { errorCorrectionLevel: 'H' }
            )).replace('data:image/png;base64,', '');

            return res.type('image/png').send(Buffer.from(qrImage, 'base64'));
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }
}