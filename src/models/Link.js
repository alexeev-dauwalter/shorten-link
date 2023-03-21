import reformatDate from '../utils/reformatDate.js';
import randomString from '../utils/randomString.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class Link {
    constructor({
        id,
        owner,
        short_link,
        link,
        created_at = new Date(),
        updated_at = new Date(),
        end_at
    }) {
        this.id = id;
        this.owner = owner;
        this.shortLink = short_link;
        this.link = link;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
        this.endAt = end_at;
    }

    static async generateShortLink() {
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

        return short_link;
    }

    toJSON() {
        return reformatDate({
            id: this.id,
            short_link: this.shortLink,
            link: this.link,
            created_at: this.createdAt,
            updated_at: this.updatedAt,
            end_at: this.endAt
        });
    }
}