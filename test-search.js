const BASE_URL = 'http://localhost:3000/api';

async function testSearch() {
    console.log('Testing search API...');
    try {
        // Test 1: Search for everything (no query)
        console.log('\n1. Searching for all items...');
        const resAll = await fetch(`${BASE_URL}/search`);

        console.log(`Status: ${resAll.status}`);
        if (!resAll.ok) {
            const text = await resAll.text();
            console.error('Error text:', text);
            return;
        }

        const dataAll = await resAll.json();
        console.log(`Found ${dataAll.length} items`);

        // Test 2: Search for a specific term (e.g., "filter")
        const query = 'filter';
        console.log(`\n2. Searching for "${query}"...`);
        const resQuery = await fetch(`${BASE_URL}/search?q=${query}`);
        const dataQuery = await resQuery.json();
        console.log(`Status: ${resQuery.status}`);
        console.log(`Found ${dataQuery.length} items matching "${query}"`);
        if (dataQuery.length > 0) {
            console.log('First match:', dataQuery[0].name);
        }

        // Test 3: Search by type (e.g., 'outfit')
        const type = 'outfit';
        console.log(`\n3. Searching for type "${type}"...`);
        const resType = await fetch(`${BASE_URL}/search?type=${type}`);
        const dataType = await resType.json();
        console.log(`Status: ${resType.status}`);
        console.log(`Found ${dataType.length} items of type "${type}"`);

    } catch (error) {
        console.error('Search test failed:', error);
    }
}

testSearch();
