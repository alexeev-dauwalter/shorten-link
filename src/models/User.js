import { Role } from './Role.js';
import randomString from '../utils/randomString.js';
import reformatDate from '../utils/reformatDate.js'
import bcrypt from 'bcrypt';


export class User {
    roles = new Set();

    constructor({
        id,
        username,
        login,
        password,
        token = randomString({}),
        created_at = new Date(),
        updated_at = new Date(),
        roles
    }) {
        if (!(roles instanceof Array)) throw new Error('`roles` must be `Array`');

        this.id = id;
        this.username = username;
        this.login = login;
        this.token = token;
        this.createdAt = created_at;
        this.updatedAt = updated_at;
        
        if (password) this.password = bcrypt.hashSync(password, 7);

        roles.map(role => {
            this.roles.add({ id: role });
        });
    }

    toJSON() {
        return reformatDate({
            id: this.id,
            username: this.username,
            login: this.login,
            token: this.token,
            roles: Array.from(this.roles),
            created_at: this.createdAt,
            updated_at: this.updatedAt
        });
    }
}