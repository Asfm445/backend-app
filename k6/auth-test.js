import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    vus: 10,
    duration: '30s',
    thresholds: {
        http_req_duration: ['p(95)<1000'],
        http_req_failed: ['rate<0.05'],
    },
};

const BASE_URL = 'http://localhost:4000/auth';

export default function () {
    const email = `testuser_${__VU}_${__ITER}@example.com`;
    const password = 'password123';

    // 1. Register
    const registerPayload = JSON.stringify({
        name: 'Test User',
        email: email,
        password: password,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const regRes = http.post(`${BASE_URL}/register`, registerPayload, params);
    check(regRes, {
        'registration status is 201 or 400 (if exists)': (r) => r.status === 201 || r.status === 400,
    });

    // 2. Login
    const loginPayload = JSON.stringify({
        email: email,
        password: password,
    });

    const loginRes = http.post(`${BASE_URL}/login`, loginPayload, params);
    check(loginRes, {
        'login status is 200': (r) => r.status === 200,
        'has access token': (r) => r.json().accessToken !== undefined,
    });

    sleep(1);
}
