const BASE_URL = 'http://localhost:3000/api';

async function testCreateFilter() {
    console.log('Testing create-filter...');
    try {
        const res = await fetch(`${BASE_URL}/create-filter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Filter',
                prompt: 'Make it look like a cartoon',
                previewImageUrl: 'https://example.com/image.png',
                description: 'A test filter',
                category: 'Artistic',
                creatorId: 'test-user',
                settings: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                accessCount: 0
            })
        });
        const data = await res.json();
        console.log('create-filter response:', res.status, data);
    } catch (e) {
        console.error('create-filter failed:', e);
    }
}

async function testSearch() {
    console.log('Testing search...');
    try {
        const res = await fetch(`${BASE_URL}/search?q=Test`);
        const data = await res.json();
        console.log('search response:', res.status, data);
    } catch (e) {
        console.error('search failed:', e);
    }
}

async function runTests() {
    await testCreateFilter();
    await testSearch();
}

runTests();
