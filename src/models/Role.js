export class Role {
    constructor({ 
        id, 
        name, 
        access_level = 0, 
        is_default = false
    }) {
        this.id = id;
        this.name = name;
        this.isDefault = is_default;
        this.accessLevel = access_level;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            is_default: this.isDefault,
            access_level: this.accessLevel
        };
    }
}
