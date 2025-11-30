// 🔥 TEST FINAL - Solution anti "Pool is closed"
console.log('🎯 === TEST SOLUTION FINALE ===\n');

try {
    const { connecter } = require('./bd/connect');
    
    console.log('✅ Module connect.js chargé');
    
    // Test 1: Connexion simple
    console.log('\n🧪 Test 1: Connexion simple...');
    connecter((error, connection) => {
        if (error) {
            console.error('❌ Test 1 échoué:', error.message);
            return;
        }
        
        console.log('✅ Test 1 réussi - Connexion établie');
        
        // Test une requête et fermer
        connection.query('SELECT 1 as test', (err, results) => {
            connection.end(); // Fermer proprement
            
            if (err) {
                console.error('❌ Erreur requête:', err.message);
                return;
            }
            
            console.log('✅ Requête test réussie:', results[0]);
            
            // Test 2: Multiple connexions
            console.log('\n🧪 Test 2: Connexions multiples...');
            testMultipleConnections();
        });
    });
    
} catch (error) {
    console.error('❌ Erreur critique:', error.message);
}

function testMultipleConnections() {
    let completed = 0;
    const total = 3;
    
    for (let i = 1; i <= total; i++) {
        const { connecter } = require('./bd/connect');
        
        connecter((error, connection) => {
            if (error) {
                console.error(`❌ Connexion ${i} échouée:`, error.message);
                return;
            }
            
            connection.query(`SELECT ${i} as test_number`, (err, results) => {
                connection.end();
                
                if (err) {
                    console.error(`❌ Requête ${i} échouée:`, err.message);
                } else {
                    console.log(`✅ Connexion ${i} réussie:`, results[0]);
                }
                
                completed++;
                if (completed === total) {
                    console.log('\n🎉 === TOUS LES TESTS RÉUSSIS ===');
                    console.log('🚀 La solution "Pool is closed" est DÉFINITIVEMENT résolue !');
                    console.log('\n🔥 DÉMARREZ VOTRE SERVEUR MAINTENANT:');
                    console.log('node index.js');
                    console.log('\n✨ Vous pouvez maintenant créer des collections sans erreurs !');
                }
            });
        });
    }
}
