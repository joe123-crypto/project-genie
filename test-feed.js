const BASE_URL = 'http://localhost:3000/api';

async function testFeed() {
    console.log('Testing feed API...');
    try {
        const res = await fetch(`${BASE_URL}/feed`);
        console.log(`Status: ${res.status}`);

        if (!res.ok) {
            const text = await res.text();
            console.error('Error text:', text);
            return;
        }

        const data = await res.json();
        console.log(`Feed items retrieved: ${data.length}`);
        if (data.length > 0) {
            console.log('First item:', data[0]);
        }
    } catch (error) {
        console.error('Feed test failed:', error);
    }
}

testFeed();
