import { PrismaClient } from '@prisma/client'
import qrcode from 'qrcode'

const prisma = new PrismaClient();

export class linkController {
    static async getAll(req, res) {
        try {
            const links = await prisma.link.findMany({ where: { owner: req.user.id } });
            return res.send(links.map(x => x = linkController.reformatDates(x)));
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async create(req, res) {
        try {
            const { link, duration } = req.body;

            if (!link || !duration) return res.code(400).send();

            let short_link = linkController.generateShort(),
                query;

            while (query = await prisma.link.findMany({ where: { short_link } })) {
                if (!query.length) break;
                short_link = linkController.generateShort(short_link);
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
                data = await prisma.link.findMany({ where: { short_link: hash } });

            if (!data.length) return res.code(404).send();

            return res.redirect(302, data[0].link);
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async information(req, res) {
        try {
            const { hash } = req.params;
            let data = await prisma.link.findMany({ where: { owner: req.user.id, short_link: hash } });

            if (!data.length) return res.code(404).send();

            return res.send(Object.assign(
                linkController.reformatDates(data[0]),
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

            let data = await prisma.link.findMany({ where: { owner: req.user.id, short_link: hash } });

            // Если ссылки не существует - отправляем 404
            if (!data.length) return res.code(404).send();

            // Если ничего не изменилось - возвращаем 304 (Not Modified) и данные ссылки
            if (!link && !duration) return res.code(304).send(linkController.reformatDates(data[0]));

            // Преобразуем входящие данные
            const query = await prisma.link.update({
                where: { owner: req.user.id, short_link: hash },
                data: {
                    link: link || data[0].link,
                    update_at: new Date(),
                    end_at: duration ? new Date(duration * 1000) : new Date(data[0].end_at)
                }
            });

            if (!query) return res.code(400).send();

            data = await prisma.link.findMany({ where: { owner: req.user.id, short_link: hash } });

            return res.send(linkController.reformatDates(data[0]));
        } catch (error) {
            console.error(error.toString());
            return res.code(500).send();
        }
    }

    static async delete(req, res) {
        try {
            const { hash } = req.params;
            let data = await prisma.link.findMany({ where: { owner: req.user.id, short_link: hash } });

            if (!data.length) return res.code(404).send();

            const query = await prisma.link.delete({ where: { short_link: hash } });

            if (!query) return res.code(500).send();

            data[0] = linkController.reformatDates(data[0]);

            return res.send(data[0]);
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

    static generateShort(prefix = null) {
        let result = prefix || '';

        while (result.length < (prefix ? prefix.length + 1 : process.env.SHORTLINK_LENGTH)) {
            result += process.env.SHORTLINK_SYMBOLS[Math.floor(Math.random() * process.env.SHORTLINK_SYMBOLS.length)];
        }

        return result;
    }

    static reformatDates(link) {
        if (link.create_at) link.create_at = new Date(link.create_at).getTime();
        if (link.update_at) link.update_at = new Date(link.update_at).getTime();
        if (link.end_at) link.end_at = new Date(link.end_at).getTime();

        return link;
    }
}