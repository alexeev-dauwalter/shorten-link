export default function (object) {
    for (const param in object) {
        if (object[param] instanceof Date) {
            object[param] = new Date(object[param]).getTime();
        }
    }

    return object;
}