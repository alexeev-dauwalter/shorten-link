export default function ({
    length = 32,
    alph = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    prefix
}) {
    let result = prefix || '';

    while (result.length < (prefix ? prefix.length + length : length)) {
        result += alph[Math.floor(Math.random() * alph.length)];
    }

    return result;
}
