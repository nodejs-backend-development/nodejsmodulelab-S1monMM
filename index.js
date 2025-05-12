const http = require('http');
const fs = require('fs');
const path = require('path');
const split2 = require('split2');
const through2 = require('through2');
const { Transform } = require('stream');

const host = 'localhost';
const port = 8000;
const expectedToken = "Bearer ekV5Rk4wMlgvYVpCbmp5WUh5bHVPMktwMzktY05QeDRjT3FlWlNiUTJhbVpraHc5d3Y5a3YtU2pM";
const csvFilePath = path.join(__dirname, 'data.csv');

// Завдання 2: Парсинг CSV у формат JSON
const parseCsv = () => {
    return new Promise((resolve, reject) => {
        const results = [];
        let headers = [];

        fs.access(csvFilePath, fs.constants.F_OK, (err) => {
            if (err) {
                reject(new Error('CSV file not found'));
                return;
            }

            fs.createReadStream(csvFilePath)
                .pipe(split2())
                .pipe(
                    through2(function (line, _, callback) {
                        const row = line.toString().split(',');
                        if (!headers.length) {
                            headers = row;
                        } else {
                            const obj = {};
                            headers.forEach((header, index) => {
                                obj[header] = row[index];
                            });
                            results.push(obj);
                        }
                        callback();
                    })
                )
                .on('finish', () => resolve(results))
                .on('error', (err) => reject(err));
        });
    });
};

// Завдання 3: Перетворення введеного тексту в uppercase
const CustomStream = new Transform({
    transform(chunk, encoding, callback) {
        const transformed = chunk
            .toString()
            .split('')
            .map(char => (/[a-z]/i.test(char) ? char.toUpperCase() : char))
            .join('');
        console.log(transformed);
        callback(null, transformed);
    }
});

process.stdin.pipe(CustomStream);

// Завдання 1: Обробка HTTP запитів
const server = http.createServer(async (req, res) => {
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader === expectedToken) {
        if (req.method === 'GET') {
            try {
                const data = await parseCsv(); // Для завдання 2
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            } catch (err) {
                if (err.message === 'CSV file not found') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('CSV file not found');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal Server Error');
                }
            }
        } else {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
        }
    } else {
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Unauthorized');
    }
});

server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
