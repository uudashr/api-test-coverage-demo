let test = require('tape');
let axios = require('axios').create({
    baseURL: 'http://localhost:3000'
});
const SwaggerParser = require('@apidevtools/swagger-parser');

let coverage = new Map();

let requestLogs = [];
function oklizeAxios(instance) {
    // request
    {
        const fn = instance.request;
        instance.request = (config) => {
            const p = fn(config);
            return p.then((res) => {
                requestLogs.push({
                    method: config.method,
                    url: config.url,
                    status: res.status.toString(),
                    timestamp: new Date(),
                });
                return res;
            }).catch((err) => {
                if (err.response) {
                    const res = err.response;
                    requestLogs.push({
                        method: config.method,
                        url: url,
                        status: res.status.toString(),
                        timestamp: new Date(),
                    });
                }
                return Promise.reject(err);
            });
        };
    }

    ['get', 'delete', 'head', 'options'].forEach((method) => {
        const fn = instance[method];
        instance[method] = (url, config) => {
            const p = fn(url, config);
            return p.then((res) => {
                requestLogs.push({
                    method: method,
                    url: url,
                    status: res.status.toString(),
                    timestamp: new Date(),
                });
                return res;
            }).catch((err) => {
                if (err.response) {
                    const res = err.response;
                    requestLogs.push({
                        method: method,
                        url: url,
                        status: res.status.toString(),
                        timestamp: new Date(),
                    });
                }
                return Promise.reject(err);
            });
        };
    });

    ['post', 'put', 'patch'].forEach((method) => {
        const fn = instance[method];
        instance[method] = (url, data, config) => {
            const p = fn(url, data, config);
            return p.then((res) => {
                requestLogs.push({
                    method: method,
                    url: url,
                    status: res.status.toString(),
                    timestamp: new Date(),
                });
                return res;
            }).catch((err) => {
                if (err.response) {
                    const res = err.response;
                    requestLogs.push({
                        method: method,
                        url: url,
                        status: res.status.toString(),
                        timestamp: new Date(),
                    });
                }
                return Promise.reject(err);
            });
        };
    });

    return instance;
}

axios = oklizeAxios(axios);


test('Before', async (t) => {
    const api = await SwaggerParser.validate('kicau-apidoc.yml')
    for (const [path, operations] of Object.entries(api.paths)) {
        // console.log(`Path ${path}`);
        for (const [method, operation] of Object.entries(operations)) {
            // console.log(`- Method "${method}", operationId: ${operation.operationId}`)
            // console.log(`-- ${Object.keys(operation.responses)}`);
            for (status of Object.keys(operation.responses)) {
                const key = `${path}:${method}:${status}`;
                coverage.set(key, 0);
            }
        }
    }
})

test('Retrieve all cuits', async (t) => {
    // Cover path: "get /cuits"
    const res = await axios.get('/cuits', {
        headers: {
            'Authorization': 'ScreenName nuruddin.ashr'
        }
    });

    // Cover the response "200"
    t.equal(res.status, 200, 'Status code OK');
    t.match(res.headers['content-type'], /json/, 'Content-Type is application/json');
    
});

test('After', async (t) => {
    console.log("-- Request Logs --")
    console.log(requestLogs);
    requestLogs.forEach((val) => {
        const key = `${val.url}:${val.method}:${val.status}`;
        const count = coverage.get(key) |+ 1;
        coverage.set(key, count);
    });

    console.log("-- Coverage --")
    console.log(coverage.entries());
    let covered = 0;
    for (const count of coverage.values()) {
        if (count > 0) {
            covered++;
        }
    }
    console.log(`Coverage %: ${covered / coverage.size * 100}%`);
});
