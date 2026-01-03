import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 10 }, // ramp up to 20 users
        { duration: '1m', target: 10 },  // stay at 20 users
        { duration: '20s', target: 0 },  // ramp down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
        http_req_failed: ['rate<0.01'],    // less than 1% errors
    },
};

const BASE_URL = 'http://localhost:4000/api/v1';

export default function () {
    const res = http.get(`${BASE_URL}/products`);

    check(res, {
        'status is 200': (r) => r.status === 200,
    });

    sleep(1);
}
