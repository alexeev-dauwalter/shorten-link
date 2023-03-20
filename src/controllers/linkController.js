import { PrismaClient } from '@prisma/client';
import qrcode from 'qrcode';
import randomString from '../utils/randomString.js';

const prisma = new PrismaClient();

export class LinkController {
    static async getAll(req, res) {
        try {
            const links = await prisma.link.findMany({ where: { owner: req.user.id } });
            return res.send(links.map(x => {
                delete x.owner;
                return LinkController.reformatDates(x);
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

            let short_link = randomString({ length: process.env.SHORTLINK_LENGTH, alph: process.env.SHORTLINK_SYMBOLS }),
                query = null;

            while (query = await prisma.link.findFirst({ where: { short_link } })) {
                if (!query) break;
                short_link = randomString({ 
                    length: 1, 
                    alph: process.env.SHORTLINK_SYMBOLS,
                    prefix: short_link 
                });
            }

            query = await prisma.link.create({
                data: {
                    owner: req.user.id,
                    short_link,
                    link,
                    end_at: new Date(duration * 1000)
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

            delete data.owner;

            return res.send(Object.assign(
                LinkController.reformatDates(data),
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
                data: {
                    link: link || data.link,
                    updated_at: new Date(),
                    end_at: duration ? new Date(duration * 1000) : new Date(data.end_at)
                }
            });

            if (!query) return res.code(500).send();

            data = await prisma.link.findFirst({ where: { owner: req.user.id, short_link: hash } });

            return res.send(LinkController.reformatDates(data));
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

            data = LinkController.reformatDates(data);

            return res.send(data);
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

    static reformatDates(data) {
        if (data.created_at) data.created_at = new Date(data.created_at).getTime();
        if (data.updated_at) data.updated_at = new Date(data.updated_at).getTime();
        if (data.end_at) data.end_at = new Date(data.end_at).getTime();

        return data;
    }
}