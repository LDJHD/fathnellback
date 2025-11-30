// Script de test pour vérifier que la route auth fonctionne
const app = require('./index');

// Attendre que le serveur démarre
setTimeout(() => {
    console.log('\n🧪 Test de la route /api/v1/auth/register...\n');
    
    const http = require('http');
    const data = JSON.stringify({
        nom: 'Test',
        prenom: 'User',
        email: 'test@test.com',
        password: '123456',
        confirmpassword: '123456'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/auth/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);

        let body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });

        res.on('end', () => {
            console.log('Response:', body);
            try {
                const json = JSON.parse(body);
                console.log('\n✅ Réponse JSON:', JSON.stringify(json, null, 2));
            } catch (e) {
                console.log('\n⚠️  Réponse non-JSON:', body);
            }
            process.exit(0);
        });
    });

    req.on('error', (e) => {
        console.error(`❌ Erreur: ${e.message}`);
        process.exit(1);
    });

    req.write(data);
    req.end();
}, 2000);

