const BASE_URL = 'http://localhost:3000/api';

async function testCreateOutfit() {
    console.log('Testing create-outfit...');
    try {
        const res = await fetch(`${BASE_URL}/create-outfit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Outfit',
                description: 'A test outfit',
                previewImageUrl: 'https://example.com/outfit.png',
                items: ['shirt', 'pants'],
                creatorId: 'test-user',
                createdAt: new Date().toISOString(),
                accessCount: 0
            })
        });
        const data = await res.json();
        console.log('create-outfit response:', res.status, data);
    } catch (e) {
        console.error('create-outfit failed:', e);
    }
}

testCreateOutfit();
